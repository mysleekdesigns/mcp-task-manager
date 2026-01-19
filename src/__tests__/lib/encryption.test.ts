import { describe, it, expect, beforeAll } from 'vitest'
import { encrypt, decrypt, maskValue } from '@/lib/encryption'

describe('Encryption Utility', () => {
  beforeAll(() => {
    // Set encryption secret for testing
    process.env.ENCRYPTION_SECRET = 'test-encryption-secret-for-vitest'
  })

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'sk-ant-api03-test-key-1234567890'
      const encrypted = encrypt(originalText)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(originalText)
    })

    it('should produce different encrypted values for same input', () => {
      const text = 'test-api-key'
      const encrypted1 = encrypt(text)
      const encrypted2 = encrypt(text)

      // Different because of random IV and salt
      expect(encrypted1).not.toBe(encrypted2)

      // But both decrypt to same value
      expect(decrypt(encrypted1)).toBe(text)
      expect(decrypt(encrypted2)).toBe(text)
    })

    it('should handle empty strings', () => {
      const encrypted = encrypt('')
      expect(encrypted).toBe('')

      const decrypted = decrypt('')
      expect(decrypted).toBe('')
    })

    it('should encrypt long text', () => {
      const longText = 'a'.repeat(1000)
      const encrypted = encrypt(longText)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(longText)
    })

    it('should handle special characters', () => {
      const specialText = 'key-with-🔐-emoji-and-special-chars-!@#$%^&*()'
      const encrypted = encrypt(specialText)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(specialText)
    })
  })

  describe('maskValue', () => {
    it('should mask value showing first and last 4 chars by default', () => {
      const value = 'sk-ant-api03-1234567890abcdef'
      const masked = maskValue(value)

      expect(masked).toMatch(/^sk-a.*cdef$/)
      expect(masked.length).toBeGreaterThan(8)
    })

    it('should mask short values completely', () => {
      const value = 'short'
      const masked = maskValue(value)

      expect(masked).toBe('••••••••')
    })

    it('should handle custom show chars count', () => {
      const value = 'abcdefghijklmnop'
      const masked = maskValue(value, 2)

      expect(masked).toMatch(/^ab.*op$/)
    })

    it('should handle empty values', () => {
      const masked = maskValue('')
      expect(masked).toBe('••••••••')
    })

    it('should limit middle dots to 20', () => {
      const value = 'a'.repeat(100) + 'b'.repeat(100)
      const masked = maskValue(value, 4)
      const middleDots = masked.slice(4, -4)

      expect(middleDots).toBe('•'.repeat(20))
    })
  })

  describe('encryption security', () => {
    it('should not include plaintext in encrypted output', () => {
      const apiKey = 'secret-api-key-value'
      const encrypted = encrypt(apiKey)

      expect(encrypted).not.toContain(apiKey)
      expect(encrypted).not.toContain('secret')
    })

    it('should produce base64 encoded output', () => {
      const text = 'test-key'
      const encrypted = encrypt(text)

      // Base64 regex
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
      expect(base64Regex.test(encrypted)).toBe(true)
    })

    it('should throw error on invalid encrypted data', () => {
      const invalidEncrypted = 'not-valid-encrypted-data'

      expect(() => decrypt(invalidEncrypted)).toThrow()
    })

    it('should throw error on tampered data', () => {
      const text = 'original-key'
      const encrypted = encrypt(text)

      // Tamper with the encrypted data
      const tampered = encrypted.slice(0, -10) + 'XXXXXXXXXX'

      expect(() => decrypt(tampered)).toThrow()
    })
  })
})
