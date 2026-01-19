/**
 * Simple token-based authentication for WebSocket connections
 * Since Auth.js uses JWT strategy (sessions not in database),
 * we use a temporary token map for WebSocket authentication
 *
 * Uses globalThis to ensure the token store is shared between
 * Next.js API routes and the WebSocket server
 */

// Token data structure
interface TokenData {
  userId: string;
  expires: Date;
}

// Token expiration time (5 minutes)
const TOKEN_EXPIRATION_MS = 5 * 60 * 1000;

// Cleanup interval (1 minute)
const CLEANUP_INTERVAL_MS = 60 * 1000;

// Use globalThis to share the token store between Next.js API routes and WebSocket server
// This is necessary because Next.js bundles API routes separately
const globalForTokens = globalThis as typeof globalThis & {
  wsTokenStore: Map<string, TokenData> | undefined;
  wsTokenCleanupStarted: boolean | undefined;
};

// Initialize or get the shared token store
function getTokenStore(): Map<string, TokenData> {
  if (!globalForTokens.wsTokenStore) {
    globalForTokens.wsTokenStore = new Map<string, TokenData>();
    console.log('[Auth] Initialized WebSocket token store');
  }
  return globalForTokens.wsTokenStore;
}

// Start cleanup interval (only once)
if (!globalForTokens.wsTokenCleanupStarted) {
  globalForTokens.wsTokenCleanupStarted = true;
  setInterval(() => {
    const store = getTokenStore();
    const now = new Date();
    let cleaned = 0;
    for (const [token, data] of store.entries()) {
      if (data.expires < now) {
        store.delete(token);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[Auth] Cleaned up ${cleaned} expired tokens`);
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Generate a random token
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new WebSocket auth token for a user
 * Called from the /api/auth/session-token endpoint
 */
export function createWebSocketToken(userId: string): string {
  const store = getTokenStore();
  const token = generateToken();
  const expires = new Date(Date.now() + TOKEN_EXPIRATION_MS);

  store.set(token, { userId, expires });
  console.log(`[Auth] Created WebSocket token for user ${userId}, store size: ${store.size}`);

  return token;
}

/**
 * Validate a WebSocket auth token
 * Returns the userId if valid, null otherwise
 */
export function validateSessionToken(
  token: string
): { valid: boolean; userId?: string; error?: string } {
  if (!token) {
    return { valid: false, error: 'No token provided' };
  }

  const store = getTokenStore();
  const data = store.get(token);

  console.log(`[Auth] Validating token, store size: ${store.size}, found: ${!!data}`);

  if (!data) {
    return { valid: false, error: 'Invalid session token' };
  }

  // Check if token has expired
  if (data.expires < new Date()) {
    store.delete(token);
    return { valid: false, error: 'Session expired' };
  }

  return {
    valid: true,
    userId: data.userId,
  };
}

/**
 * Revoke a token (e.g., on disconnect)
 */
export function revokeToken(token: string): void {
  const store = getTokenStore();
  store.delete(token);
}
