# Terminal Spawn Error Fixes

## Problem
The terminal was failing with "posix_spawnp failed" errors when trying to create new terminal sessions.

## Root Causes

1. **Bare shell command**: Using `'bash'` instead of full path like `/bin/bash` or `/bin/zsh`
2. **Unsanitized environment**: Passing raw `process.env` which may contain problematic variables
3. **Missing spawn-helper permissions**: The node-pty spawn-helper binary needed execute permissions
4. **No shell validation**: Not checking if the shell exists before attempting to spawn
5. **Poor error handling**: No detailed error logging to diagnose spawn failures

## Solutions Implemented

### 1. Shell Path Resolution (`getShellPath()`)
- Check `SHELL` environment variable first
- Fall back to platform-appropriate shells:
  - macOS/Linux: `/bin/zsh` → `/bin/bash` → `/bin/sh`
  - Windows: `powershell.exe`
- Validate each shell exists and is executable using `fs.accessSync()` with `fs.constants.X_OK`

### 2. Environment Sanitization (`createSanitizedEnv()`)
- Copy only essential environment variables: `HOME`, `PATH`, `USER`, `LOGNAME`, `TMPDIR`, `LANG`, `LC_ALL`
- Explicitly set `TERM=xterm-256color` and `SHELL` to the validated shell path
- Filter out any variables with null characters to prevent injection
- Provide fallbacks for critical variables like `HOME` and `PATH`

### 3. Spawn Helper Permissions
Added postinstall script to ensure spawn-helper has execute permissions:
```json
"postinstall": "prisma generate && find node_modules/node-pty -name spawn-helper -type f -exec chmod +x {} \\; 2>/dev/null || true"
```

### 4. Enhanced Error Logging
- Log shell path, cwd, platform, and environment keys on spawn failure
- Log successful spawn events for debugging
- Detailed error context including error message and spawn parameters

### 5. Graceful Shutdown Handlers
- Added `SIGINT`, `SIGTERM`, and `beforeExit` handlers
- Prevents leaving orphaned PTY processes
- Ensures all terminals are properly cleaned up on server shutdown

### 6. PTY Exit Handling
- Added `onExit` listener to clean up sessions when terminal processes exit
- Logs exit code and signal for debugging
- Automatically removes session from map

## File Changes

### `/server/terminal-manager.ts`
- Added `isShellExecutable()` helper method
- Added `getShellPath()` with validation and fallback chain
- Added `createSanitizedEnv()` for safe environment variable handling
- Added `setupShutdownHandlers()` for graceful cleanup
- Enhanced `spawn()` with try-catch and detailed error logging
- Added `onExit` handler to PTY processes
- Improved `kill()` and `killAll()` with error handling

### `/package.json`
- Updated `postinstall` script to fix spawn-helper permissions

## Testing

To verify the fixes:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Terminals page in the dashboard

3. Create a new terminal - it should spawn successfully

4. Check server logs for confirmation:
   ```
   [TerminalManager] Using shell: /bin/zsh
   [TerminalManager] Spawning terminal with cwd: /path/to/project
   [TerminalManager] Successfully spawned terminal <id>
   ```

## Shell Detection Logic

The shell selection follows this priority:

1. **SHELL environment variable** (if executable)
2. **/bin/zsh** (macOS default since Catalina)
3. **/bin/bash** (traditional Unix default)
4. **/bin/sh** (POSIX-compliant fallback)

On Windows, always uses `powershell.exe`.

## Environment Variables Included

Essential variables preserved in sanitized environment:
- `HOME` - User home directory
- `PATH` - Executable search path
- `USER` / `LOGNAME` - Username
- `TMPDIR` - Temporary directory
- `LANG` / `LC_ALL` - Locale settings
- `TERM` - Terminal type (explicitly set to `xterm-256color`)
- `SHELL` - Shell path (explicitly set to validated shell)

All other variables from `process.env` are copied if they don't contain null characters.

## Common Issues

### Issue: spawn-helper not found
**Solution**: Run `npm install` to trigger the postinstall script, or manually run:
```bash
find node_modules/node-pty -name spawn-helper -type f -exec chmod +x {} \;
```

### Issue: "No executable shell found"
**Solution**: Ensure at least one of the shell candidates exists:
```bash
ls -la /bin/zsh /bin/bash /bin/sh
```

### Issue: Permission denied on cwd
**Solution**: The TerminalManager automatically falls back to `process.cwd()` or home directory if the requested cwd doesn't exist.

## Future Improvements

1. Add configurable shell preference in user settings
2. Support custom shell paths per project
3. Add shell capability detection (check for features like job control)
4. Implement shell initialization scripts (e.g., `.zshrc`, `.bashrc`)
5. Add terminal session recovery after server restart
