import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  defaultTerminalCount: z.number().min(1).max(10).optional(),
  theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
  keyboardShortcuts: z.record(z.string(), z.string()).optional(),
})

/**
 * GET /api/settings
 * Retrieve user settings (API keys are excluded for security)
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        defaultTerminalCount: true,
        theme: true,
        keyboardShortcuts: true,
        createdAt: true,
        updatedAt: true,
        // Exclude encrypted API keys from general settings retrieval
        claudeApiKey: false,
        githubToken: false,
      },
    })

    // Create default settings if they don't exist
    if (!settings) {
      const newSettings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          defaultTerminalCount: 2,
          theme: 'SYSTEM',
        },
        select: {
          id: true,
          defaultTerminalCount: true,
          theme: true,
          keyboardShortcuts: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return NextResponse.json(newSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings
 * Update user settings (preferences only, not API keys)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateSettingsSchema.parse(body)

    // Ensure user settings exist
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    })

    let settings
    if (existingSettings) {
      settings = await prisma.userSettings.update({
        where: { userId: session.user.id },
        data,
        select: {
          id: true,
          defaultTerminalCount: true,
          theme: true,
          keyboardShortcuts: true,
          updatedAt: true,
        },
      })
    } else {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          ...data,
        },
        select: {
          id: true,
          defaultTerminalCount: true,
          theme: true,
          keyboardShortcuts: true,
          updatedAt: true,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
