import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { encrypt, decrypt, maskValue } from '@/lib/encryption'

const updateApiKeysSchema = z.object({
  claudeApiKey: z.string().optional().nullable(),
  githubToken: z.string().optional().nullable(),
})

/**
 * GET /api/settings/api-keys
 * Retrieve API keys status (returns masked values, not actual keys)
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
        claudeApiKey: true,
        githubToken: true,
      },
    })

    if (!settings) {
      return NextResponse.json({
        claudeApiKey: null,
        githubToken: null,
        hasClaudeApiKey: false,
        hasGithubToken: false,
      })
    }

    // Decrypt and mask the keys for display
    let claudeApiKeyMasked = null
    let githubTokenMasked = null

    try {
      if (settings.claudeApiKey) {
        const decrypted = decrypt(settings.claudeApiKey)
        claudeApiKeyMasked = maskValue(decrypted)
      }
    } catch (error) {
      console.error('Error decrypting Claude API key:', error)
    }

    try {
      if (settings.githubToken) {
        const decrypted = decrypt(settings.githubToken)
        githubTokenMasked = maskValue(decrypted)
      }
    } catch (error) {
      console.error('Error decrypting GitHub token:', error)
    }

    return NextResponse.json({
      claudeApiKey: claudeApiKeyMasked,
      githubToken: githubTokenMasked,
      hasClaudeApiKey: !!settings.claudeApiKey,
      hasGithubToken: !!settings.githubToken,
    })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/api-keys
 * Update API keys (with encryption)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateApiKeysSchema.parse(body)

    // Encrypt the API keys before storing
    const encryptedData: {
      claudeApiKey?: string | null
      githubToken?: string | null
    } = {}

    if (data.claudeApiKey !== undefined) {
      encryptedData.claudeApiKey = data.claudeApiKey
        ? encrypt(data.claudeApiKey)
        : null
    }

    if (data.githubToken !== undefined) {
      encryptedData.githubToken = data.githubToken
        ? encrypt(data.githubToken)
        : null
    }

    // Ensure user settings exist
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    })

    if (existingSettings) {
      await prisma.userSettings.update({
        where: { userId: session.user.id },
        data: encryptedData,
      })
    } else {
      await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          ...encryptedData,
        },
      })
    }

    // Return masked values
    const response: {
      claudeApiKey?: string | null
      githubToken?: string | null
      hasClaudeApiKey?: boolean
      hasGithubToken?: boolean
    } = {}

    if (data.claudeApiKey !== undefined) {
      response.claudeApiKey = data.claudeApiKey
        ? maskValue(data.claudeApiKey)
        : null
      response.hasClaudeApiKey = !!data.claudeApiKey
    }

    if (data.githubToken !== undefined) {
      response.githubToken = data.githubToken ? maskValue(data.githubToken) : null
      response.hasGithubToken = !!data.githubToken
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating API keys:', error)
    return NextResponse.json(
      { error: 'Failed to update API keys' },
      { status: 500 }
    )
  }
}
