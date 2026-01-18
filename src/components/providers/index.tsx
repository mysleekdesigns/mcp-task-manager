'use client'

import { AuthProvider } from './auth-provider'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'

interface ProvidersProps {
  children: React.ReactNode
}

/**
 * Combined providers wrapper for the application
 * Includes: Auth, Theme, Toast
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  )
}
