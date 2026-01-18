'use server'

import { signIn, signOut, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AuthError } from 'next-auth'

export async function signInWithCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Invalid email or password' }
        default:
          return { success: false, error: 'An error occurred during sign in' }
      }
    }
    throw error
  }
}

export async function signInWithProvider(provider: 'github' | 'google') {
  await signIn(provider, { redirectTo: '/dashboard' })
}

export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'An error occurred during registration' }
  }
}
