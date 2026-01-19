# Phase 10.4 - Settings Implementation

## Overview

Complete implementation of the Settings page for the MCP Task Manager, including user profile management, encrypted API key storage, and user preferences.

**Status:** ✅ Complete

## Components Implemented

### 1. Database Schema

**Model: UserSettings**
```prisma
model UserSettings {
  id                   String   @id @default(cuid())
  userId               String   @unique
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  claudeApiKey         String?  @db.Text  // Encrypted
  githubToken          String?  @db.Text  // Encrypted
  defaultTerminalCount Int      @default(2)
  theme                Theme    @default(SYSTEM)
  keyboardShortcuts    Json?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([userId])
}

enum Theme {
  LIGHT
  DARK
  SYSTEM
}
```

**Migration:** `20260118234619_add_user_settings`

### 2. Encryption Utility

**File:** `/src/lib/encryption.ts`

**Features:**
- AES-256-GCM encryption for API keys
- Scrypt key derivation from environment secret
- Secure salt and IV generation
- Authentication tags for data integrity
- Base64 encoding for storage
- Value masking for UI display

**Functions:**
- `encrypt(text: string): string` - Encrypts sensitive data
- `decrypt(encryptedText: string): string` - Decrypts data
- `maskValue(value: string, showChars?: number): string` - Masks values for display

**Environment Variable:**
- `ENCRYPTION_SECRET` - Encryption key (required in production)

### 3. API Routes

#### `/api/settings` (GET, PUT)
- **GET:** Retrieve user preferences (excludes API keys)
- **PUT:** Update preferences (terminal count, theme, shortcuts)
- Auto-creates settings with defaults if not exists

#### `/api/settings/profile` (PUT)
- Update user profile (name, avatar)
- Email changes not allowed for security

#### `/api/settings/api-keys` (GET, PUT)
- **GET:** Returns masked API keys and status flags
- **PUT:** Updates encrypted API keys
- Handles encryption/decryption automatically
- Returns masked values after update

### 4. UI Components

#### ProfileSection (`/src/components/settings/ProfileSection.tsx`)
- Avatar display with fallback initials
- Name input field
- Email display (read-only)
- Avatar URL input
- Real-time preview of avatar changes
- Form validation and error handling

#### ApiKeysSection (`/src/components/settings/ApiKeysSection.tsx`)
- Masked display of existing keys
- Secure input with show/hide toggle
- Separate forms for Claude API key and GitHub token
- Status badges showing configuration state
- Remove key functionality
- Client-side validation

#### PreferencesSection (`/src/components/settings/PreferencesSection.tsx`)
- Terminal count selector (1-10)
- Theme selector (Light/Dark/System)
- Keyboard shortcuts display
- Auto-saves preferences

### 5. Settings Page

**File:** `/src/app/dashboard/settings/page.tsx`

**Features:**
- Tab-based navigation (Profile, API Keys, Preferences)
- Session integration for current user data
- Loading states with skeletons
- Auto-refresh session after profile updates
- Responsive layout

## Security Features

### Encryption
- **Algorithm:** AES-256-GCM (Galois/Counter Mode)
- **Key Derivation:** Scrypt with random salt
- **IV:** Random 16-byte initialization vector
- **Authentication:** 16-byte auth tag for integrity
- **Storage Format:** `base64(salt + iv + authTag + encryptedData)`

### API Key Protection
- Never returned in plaintext from API
- Encrypted before database storage
- Decrypted only when needed
- Masked for UI display (shows first/last 4 chars)
- Separate endpoint for key management

### Access Control
- All routes require authentication (Auth.js session)
- User can only access/modify their own settings
- Email changes disabled to prevent account takeover

## Usage Examples

### Setting Up API Keys

1. Navigate to Settings > API Keys
2. Enter Claude API key (format: `sk-ant-...`)
3. Click "Save Key" - key is encrypted before storage
4. Key appears masked: `sk-a••••••••••••••abc`
5. To update: enter new key and click "Update Key"
6. To remove: click X button next to masked key

### Updating Profile

1. Navigate to Settings > Profile
2. Update name and/or avatar URL
3. Changes preview in real-time
4. Click "Save Changes"
5. Session updates automatically

### Setting Preferences

1. Navigate to Settings > Preferences
2. Select default terminal count (1-10)
3. Choose theme preference
4. Click "Save Preferences"

## Environment Setup

Add to `.env`:
```env
ENCRYPTION_SECRET="your-secure-random-secret-here"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

**WARNING:** Using the default encryption secret in production will log a warning. Always set a custom secret in production environments.

## API Response Examples

### GET /api/settings
```json
{
  "id": "clx...",
  "defaultTerminalCount": 2,
  "theme": "DARK",
  "keyboardShortcuts": null,
  "createdAt": "2024-01-18T...",
  "updatedAt": "2024-01-18T..."
}
```

### GET /api/settings/api-keys
```json
{
  "claudeApiKey": "sk-a••••••••••••••abc",
  "githubToken": "ghp_••••••••••••••xyz",
  "hasClaudeApiKey": true,
  "hasGithubToken": true
}
```

### PUT /api/settings/profile
```json
{
  "id": "clx...",
  "name": "John Doe",
  "email": "john@example.com",
  "image": "https://example.com/avatar.jpg",
  "updatedAt": "2024-01-18T..."
}
```

## Testing

### Manual Testing Checklist

- [x] User settings created with defaults on first access
- [x] Profile name updates and reflects in session
- [x] Avatar URL updates and displays correctly
- [x] Email field is read-only
- [x] Claude API key encrypts/decrypts correctly
- [x] GitHub token encrypts/decrypts correctly
- [x] API keys display as masked values
- [x] Show/hide password toggle works
- [x] Remove API key functionality works
- [x] Terminal count preference saves
- [x] Theme preference saves
- [x] Loading states display correctly
- [x] Error handling shows toast messages
- [x] Unauthorized access returns 401

### Encryption Testing

```typescript
// Test encryption/decryption
import { encrypt, decrypt, maskValue } from '@/lib/encryption'

const apiKey = 'sk-ant-api03-1234567890abcdef'
const encrypted = encrypt(apiKey)
const decrypted = decrypt(encrypted)
console.log(decrypted === apiKey) // true

const masked = maskValue(apiKey)
console.log(masked) // 'sk-a••••••••••••••cdef'
```

## Integration Points

### With Auth.js
- Uses `auth()` for session management
- Session update triggers on profile changes
- User ID used for settings association

### With Prisma
- UserSettings model linked to User via userId
- Cascade delete when user is deleted
- Auto-generated timestamps

### With UI Components
- shadcn/ui components for consistent styling
- Sonner for toast notifications
- Next.js session hooks for state management

## Future Enhancements

1. **Keyboard Shortcuts Customization**
   - Currently display-only
   - Add customization interface
   - Store as JSON in keyboardShortcuts field

2. **Avatar Upload**
   - Direct file upload instead of URL only
   - Image processing and optimization
   - Storage in cloud service (S3, etc.)

3. **Email Verification**
   - Email change workflow with verification
   - 2FA setup option

4. **API Key Validation**
   - Test connection buttons for API keys
   - Validate format before saving
   - Show last used timestamp

5. **Theme Application**
   - Actually apply theme preference to UI
   - System theme detection
   - Theme toggle in header

## Files Created/Modified

### Created
- `/src/lib/encryption.ts`
- `/src/app/api/settings/route.ts`
- `/src/app/api/settings/profile/route.ts`
- `/src/app/api/settings/api-keys/route.ts`
- `/src/components/settings/ProfileSection.tsx`
- `/src/components/settings/ApiKeysSection.tsx`
- `/src/components/settings/PreferencesSection.tsx`
- `/docs/phase-10.4-settings-implementation.md`

### Modified
- `/prisma/schema.prisma` - Added UserSettings model and Theme enum
- `/src/app/dashboard/settings/page.tsx` - Complete settings page implementation

### Migration
- `/prisma/migrations/20260118234619_add_user_settings/migration.sql`

## Summary

Phase 10.4 is complete with a fully functional settings system that includes:
- Secure encrypted storage for API keys using AES-256-GCM
- User profile management with avatar support
- Preferences for terminal count and theme
- Clean, tab-based UI with shadcn/ui components
- Comprehensive error handling and loading states
- Full TypeScript type safety
- Production-ready encryption system

The implementation follows security best practices and provides a solid foundation for user customization and API key management.
