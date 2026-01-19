import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

/**
 * Encryption utility for sensitive data like API keys
 * Uses AES-256-GCM encryption
 */

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

/**
 * Get the encryption key from environment variable
 * In production, this should be a strong secret key stored securely
 */
function getEncryptionKey(): string {
  const secret = process.env.ENCRYPTION_SECRET || 'default-encryption-secret-change-in-production'

  if (process.env.NODE_ENV === 'production' && secret === 'default-encryption-secret-change-in-production') {
    console.warn('WARNING: Using default encryption secret in production! Set ENCRYPTION_SECRET environment variable.')
  }

  return secret
}

/**
 * Derive a key from the secret using scrypt
 */
function deriveKey(salt: Buffer): Buffer {
  const secret = getEncryptionKey()
  return scryptSync(secret, salt, KEY_LENGTH)
}

/**
 * Encrypt a string value
 * Returns a base64-encoded string containing: salt:iv:authTag:encryptedData
 */
export function encrypt(text: string): string {
  if (!text) return ''

  try {
    const salt = randomBytes(SALT_LENGTH)
    const key = deriveKey(salt)
    const iv = randomBytes(IV_LENGTH)

    const cipher = createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    const authTag = cipher.getAuthTag()

    // Combine salt, iv, authTag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'base64')
    ])

    return combined.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt an encrypted string
 * Expects a base64-encoded string containing: salt:iv:authTag:encryptedData
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''

  try {
    const combined = Buffer.from(encryptedText, 'base64')

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    )
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)

    const key = deriveKey(salt)

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Mask a sensitive value for display
 * Shows only the first 4 and last 4 characters
 */
export function maskValue(value: string, showChars: number = 4): string {
  if (!value || value.length <= showChars * 2) {
    return '••••••••'
  }

  const start = value.substring(0, showChars)
  const end = value.substring(value.length - showChars)
  const middle = '•'.repeat(Math.min(value.length - showChars * 2, 20))

  return `${start}${middle}${end}`
}
