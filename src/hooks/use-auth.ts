'use client'

import { useSession } from 'next-auth/react'

/**
 * Hook to get the current session with loading and authentication state
 * Wrapper around next-auth's useSession hook
 */
export function useAuth() {
  const { data: session, status, update } = useSession()

  return {
    session,
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
    update,
  }
}

/**
 * Hook to get the current user from the session
 * Returns null if not authenticated or still loading
 */
export function useCurrentUser() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return { user: null, isLoading: true }
  }

  if (status === 'unauthenticated') {
    return { user: null, isLoading: false }
  }

  return {
    user: session?.user ?? null,
    isLoading: false,
  }
}

/**
 * Hook to require authentication
 * Returns user data or null with authentication state
 */
export function useRequireAuth() {
  const { data: session, status } = useSession({ required: true })

  return {
    user: session?.user ?? null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}
