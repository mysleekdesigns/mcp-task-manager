import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWebSocketToken,
  validateSessionToken,
  revokeToken,
} from '../../../server/auth-validator';

describe('auth-validator', () => {
  describe('validateSessionToken', () => {
    it('should return invalid if no token provided', () => {
      const result = validateSessionToken('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No token provided');
    });

    it('should return invalid if token does not exist', () => {
      const result = validateSessionToken('non-existent-token');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid session token');
    });

    it('should return valid for a freshly created token', () => {
      const userId = 'user-123';
      const token = createWebSocketToken(userId);

      const result = validateSessionToken(token);
      expect(result.valid).toBe(true);
      expect(result.userId).toBe(userId);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid after token is revoked', () => {
      const userId = 'user-456';
      const token = createWebSocketToken(userId);

      // First validation should pass
      expect(validateSessionToken(token).valid).toBe(true);

      // Revoke the token
      revokeToken(token);

      // Second validation should fail
      const result = validateSessionToken(token);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid session token');
    });
  });

  describe('createWebSocketToken', () => {
    it('should create unique tokens for different calls', () => {
      const token1 = createWebSocketToken('user-1');
      const token2 = createWebSocketToken('user-2');
      const token3 = createWebSocketToken('user-1');

      expect(token1).not.toBe(token2);
      expect(token1).not.toBe(token3);
      expect(token2).not.toBe(token3);
    });

    it('should create tokens of expected length (64 hex chars)', () => {
      const token = createWebSocketToken('user-123');
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('revokeToken', () => {
    it('should not throw when revoking non-existent token', () => {
      expect(() => revokeToken('non-existent')).not.toThrow();
    });

    it('should successfully revoke an existing token', () => {
      const token = createWebSocketToken('user-789');
      expect(validateSessionToken(token).valid).toBe(true);

      revokeToken(token);
      expect(validateSessionToken(token).valid).toBe(false);
    });
  });
});
