'use client'

import { SessionProvider } from 'next-auth/react'

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * Auth provider wrapper for next-auth session
 * Must wrap the application to enable useSession hooks
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>
}
