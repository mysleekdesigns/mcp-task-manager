import * as pty from 'node-pty';
import * as fs from 'fs';
import * as os from 'os';

export type ClaudeStatus = 'launching' | 'active' | 'exited' | 'failed' | null;

interface TerminalSession {
  id: string;
  pty: pty.IPty;
  projectId: string;
  worktreeId?: string;
  cwd: string;
  outputBuffer: string[];
  startTime: Date;
  commandCount: number;
  claudeStatus: ClaudeStatus;
  claudeLaunchAttempts: number;
}

export class TerminalManager {
  private sessions = new Map<string, TerminalSession>();
  private readonly MAX_BUFFER_SIZE = 10000; // Max lines to store
  private isShuttingDown = false;

  constructor() {
    // Set up graceful shutdown handlers
    this.setupShutdownHandlers();
  }

  /**
   * Set up handlers for graceful shutdown
   */
  private setupShutdownHandlers(): void {
    const cleanup = () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      console.log('[TerminalManager] Shutting down, cleaning up all terminals...');
      this.killAll();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('beforeExit', cleanup);
  }

  /**
   * Check if a shell path exists and is executable
   */
  private isShellExecutable(shellPath: string): boolean {
    try {
      fs.accessSync(shellPath, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the best available shell for the current platform
   */
  private getShellPath(): string {
    if (process.platform === 'win32') {
      return 'powershell.exe';
    }

    // On Unix-like systems, try shells in order of preference
    const shellCandidates = [
      '/bin/zsh',      // macOS default since Catalina
      '/bin/bash',     // Traditional default
      '/bin/sh',       // POSIX fallback
    ];

    // Check SHELL environment variable first
    const envShell = process.env.SHELL;
    if (envShell && this.isShellExecutable(envShell)) {
      console.log(`[TerminalManager] Using shell from SHELL env: ${envShell}`);
      return envShell;
    }

    // Try candidates in order
    for (const shell of shellCandidates) {
      if (this.isShellExecutable(shell)) {
        console.log(`[TerminalManager] Using shell: ${shell}`);
        return shell;
      }
    }

    // This should never happen on a properly configured system
    throw new Error('No executable shell found. Tried: ' + shellCandidates.join(', '));
  }

  /**
   * Create a sanitized environment for the PTY process
   */
  private createSanitizedEnv(): { [key: string]: string } {
    const env: { [key: string]: string } = {};

    // Essential environment variables
    const essentialVars = ['HOME', 'PATH', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'LC_ALL'];

    for (const key of essentialVars) {
      const value = process.env[key];
      if (value !== undefined) {
        env[key] = value;
      }
    }

    // Explicitly set TERM and SHELL
    env.TERM = 'xterm-256color';
    env.SHELL = this.getShellPath();

    // Set HOME if not already set
    if (!env.HOME) {
      env.HOME = os.homedir();
    }

    // Set PATH if not already set
    if (!env.PATH) {
      env.PATH = '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin';
    }

    // Add any additional environment variables from process.env
    // but only if they don't contain problematic characters
    for (const [key, value] of Object.entries(process.env)) {
      if (value && !env[key] && !key.includes('\0') && !value.includes('\0')) {
        env[key] = value;
      }
    }

    return env;
  }

  spawn(
    id: string,
    cwd: string,
    projectId: string,
    worktreeId?: string
  ): pty.IPty {
    // Validate cwd exists, fall back to safe defaults if not
    let validCwd = cwd;
    if (!fs.existsSync(cwd)) {
      console.warn(`[TerminalManager] cwd does not exist: ${cwd}`);
      // Try process.cwd() first, then fall back to home directory
      validCwd = process.cwd();
      if (!fs.existsSync(validCwd)) {
        validCwd = os.homedir();
      }
      console.log(`[TerminalManager] Using fallback cwd: ${validCwd}`);
    } else {
      console.log(`[TerminalManager] Spawning terminal with cwd: ${validCwd}`);
    }

    // Get the shell path with validation
    const shell = this.getShellPath();
    console.log(`[TerminalManager] Using shell: ${shell}`);

    // Create sanitized environment
    const env = this.createSanitizedEnv();

    try {
      // Spawn the PTY process with better error handling
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: validCwd,
        env,
        // Add handleFlowControl to prevent hanging on large output
        handleFlowControl: true,
      });

      const session: TerminalSession = {
        id,
        pty: ptyProcess,
        projectId,
        worktreeId,
        cwd: validCwd,
        outputBuffer: [],
        startTime: new Date(),
        commandCount: 0,
        claudeStatus: null,
        claudeLaunchAttempts: 0,
      };

      // Store session BEFORE setting up handlers to prevent race conditions
      this.sessions.set(id, session);

      // Capture output for session insights
      ptyProcess.onData((data) => {
        this.captureOutput(id, data);
      });

      // Handle PTY exit
      ptyProcess.onExit(({ exitCode, signal }) => {
        const session = this.sessions.get(id);
        if (session) {
          const duration = Date.now() - session.startTime.getTime();
          console.log(
            `[TerminalManager] Terminal ${id} exited after ${duration}ms with code ${exitCode}, signal ${signal}`
          );
        }
        this.sessions.delete(id);
      });

      // Log successful spawn with timing
      console.log(`[TerminalManager] Successfully spawned terminal ${id} (pid: ${ptyProcess.pid})`);
      return ptyProcess;
    } catch (error) {
      console.error(`[TerminalManager] Failed to spawn terminal ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        shell,
        cwd: validCwd,
        platform: process.platform,
        env: Object.keys(env),
      });
      throw error;
    }
  }

  /**
   * Capture terminal output to buffer for session insights
   */
  private captureOutput(id: string, data: string): void {
    const session = this.sessions.get(id);
    if (!session) return;

    // Add to buffer
    session.outputBuffer.push(data);

    // Detect command execution (lines ending with newline after prompt)
    if (data.includes('\n') && !data.match(/^[\s\r\n]*$/)) {
      session.commandCount++;
    }

    // Prevent buffer from growing too large
    if (session.outputBuffer.length > this.MAX_BUFFER_SIZE) {
      session.outputBuffer = session.outputBuffer.slice(-this.MAX_BUFFER_SIZE);
    }

    // Detect Claude exit
    this.detectClaudeExit(id, data);
  }

  write(id: string, data: string): void {
    this.sessions.get(id)?.pty.write(data);
  }

  resize(id: string, cols: number, rows: number): void {
    this.sessions.get(id)?.pty.resize(cols, rows);
  }

  kill(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      try {
        // Kill the PTY process
        session.pty.kill();
        console.log(`[TerminalManager] Killed terminal ${id}`);
      } catch (error) {
        console.error(`[TerminalManager] Error killing terminal ${id}:`, error);
      } finally {
        // Always remove from sessions map
        this.sessions.delete(id);
      }
    }
  }

  get(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  getAll(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  getAllForProject(projectId: string): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.projectId === projectId
    );
  }

  killAll(): void {
    console.log(`[TerminalManager] Killing all terminals (${this.sessions.size} sessions)`);
    const errors: Error[] = [];

    for (const [id, session] of Array.from(this.sessions.entries())) {
      try {
        session.pty.kill();
      } catch (error) {
        console.error(`[TerminalManager] Error killing terminal ${id}:`, error);
        if (error instanceof Error) {
          errors.push(error);
        }
      }
    }

    this.sessions.clear();

    if (errors.length > 0) {
      console.warn(`[TerminalManager] ${errors.length} errors occurred during cleanup`);
    } else {
      console.log('[TerminalManager] All terminals cleaned up successfully');
    }
  }

  /**
   * Get session metadata for insight capture
   */
  getSessionMetadata(id: string): {
    outputBuffer: string;
    startTime: Date;
    endTime: Date;
    commandCount: number;
    projectId: string;
    worktreeId?: string;
    cwd: string;
  } | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    return {
      outputBuffer: session.outputBuffer.join(''),
      startTime: session.startTime,
      endTime: new Date(),
      commandCount: session.commandCount,
      projectId: session.projectId,
      worktreeId: session.worktreeId,
      cwd: session.cwd,
    };
  }

  /**
   * Launch Claude Code in a terminal
   */
  launchClaude(id: string): boolean {
    const session = this.sessions.get(id);
    if (!session) {
      console.error(`[TerminalManager] Cannot launch Claude: session ${id} not found`);
      return false;
    }

    // Prevent multiple concurrent launches
    if (session.claudeStatus === 'launching') {
      console.log(`[TerminalManager] Claude already launching for terminal ${id}`);
      return false;
    }

    // Increment launch attempts
    session.claudeLaunchAttempts++;

    // Limit launch attempts
    if (session.claudeLaunchAttempts > 3) {
      console.error(`[TerminalManager] Maximum Claude launch attempts (3) reached for terminal ${id}`);
      session.claudeStatus = 'failed';
      return false;
    }

    try {
      // Verify PTY is still alive before writing
      // Check if the PTY process has been killed
      try {
        session.pty.write('');
      } catch (writeError) {
        console.error(`[TerminalManager] Cannot launch Claude: PTY for session ${id} is not writable:`, writeError);
        return false;
      }

      session.claudeStatus = 'launching';
      console.log(`[TerminalManager] Launching Claude Code for terminal ${id} (attempt ${session.claudeLaunchAttempts})`);

      // Send the claude command
      session.pty.write('claude\r');

      // Wait 2 seconds to detect if Claude launched successfully
      setTimeout(() => {
        // Re-check that session still exists before updating status
        const currentSession = this.sessions.get(id);
        if (!currentSession) {
          console.log(`[TerminalManager] Session ${id} no longer exists, skipping Claude status update`);
          return;
        }

        if (currentSession.claudeStatus === 'launching') {
          // If still launching after 2s, assume it's active
          currentSession.claudeStatus = 'active';
          console.log(`[TerminalManager] Claude Code active for terminal ${id}`);
        }
      }, 2000);

      return true;
    } catch (error) {
      console.error(`[TerminalManager] Failed to launch Claude for terminal ${id}:`, error);
      // Re-check session exists before updating status
      const currentSession = this.sessions.get(id);
      if (currentSession) {
        currentSession.claudeStatus = 'failed';
      }
      return false;
    }
  }

  /**
   * Update Claude status for a terminal
   */
  updateClaudeStatus(id: string, status: ClaudeStatus): void {
    const session = this.sessions.get(id);
    if (session) {
      session.claudeStatus = status;
      console.log(`[TerminalManager] Claude status for terminal ${id}: ${status}`);
    }
  }

  /**
   * Get Claude status for a terminal
   */
  getClaudeStatus(id: string): ClaudeStatus {
    const session = this.sessions.get(id);
    return session?.claudeStatus || null;
  }

  /**
   * Detect Claude exit in output
   */
  private detectClaudeExit(id: string, data: string): void {
    const session = this.sessions.get(id);
    if (!session || session.claudeStatus !== 'active') return;

    // Look for Claude exit patterns in output
    // This is a simple heuristic - may need refinement
    const exitPatterns = [
      /Claude Code session ended/i,
      /Goodbye!/i,
      /\[Process completed\]/i,
    ];

    for (const pattern of exitPatterns) {
      if (pattern.test(data)) {
        console.log(`[TerminalManager] Detected Claude exit for terminal ${id}`);
        session.claudeStatus = 'exited';
        break;
      }
    }
  }
}
