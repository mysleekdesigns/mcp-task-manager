import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

// Validation schema
const generateTitleSchema = z.object({
  description: z.string().min(1).max(2000),
  apiKey: z.string().optional(),
});

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-haiku-20240307'; // Fast and cost-effective for title generation
const CLAUDE_API_VERSION = '2023-06-01';

/**
 * POST /api/ai/generate-title
 * Generate a concise task title from a description using Claude AI
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const data = generateTitleSchema.parse(body);

    // Get Claude API key (from request or user settings)
    let claudeApiKey = data.apiKey;

    if (!claudeApiKey) {
      // Fetch from user settings
      const settings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id },
        select: { claudeApiKey: true },
      });

      if (!settings?.claudeApiKey) {
        return NextResponse.json(
          { error: 'No Claude API key found. Please add your API key in Settings.' },
          { status: 403 }
        );
      }

      // Decrypt the stored API key
      try {
        claudeApiKey = decrypt(settings.claudeApiKey);
      } catch (error) {
        console.error('Error decrypting API key:', error);
        return NextResponse.json(
          { error: 'Failed to decrypt API key. Please update your API key in Settings.' },
          { status: 500 }
        );
      }
    }

    // Call Claude API to generate title
    const claudeResponse = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': CLAUDE_API_VERSION,
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 50,
        temperature: 0.3, // Lower temperature for more consistent results
        messages: [
          {
            role: 'user',
            content: `Generate a concise, clear task title (5-10 words max) for the following task description. Return ONLY the title, without quotes or extra explanation.

Task description:
${data.description}`,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const error = await claudeResponse.json().catch(() => null);
      console.error('Claude API error:', error);

      // Handle specific Claude API errors
      if (claudeResponse.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Claude API key. Please check your API key in Settings.' },
          { status: 403 }
        );
      }

      if (claudeResponse.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate title. Please try again or enter a title manually.' },
        { status: 500 }
      );
    }

    const claudeData = await claudeResponse.json();

    // Extract title from Claude's response
    const title = claudeData.content?.[0]?.text?.trim() || '';

    if (!title) {
      return NextResponse.json(
        { error: 'Generated title was empty. Please enter a title manually.' },
        { status: 500 }
      );
    }

    // Clean up the title (remove quotes if present, limit length)
    let cleanTitle = title.replace(/^["']|["']$/g, '').trim();

    // Ensure title is not too long (max 100 chars for UI display)
    if (cleanTitle.length > 100) {
      cleanTitle = cleanTitle.substring(0, 97) + '...';
    }

    return NextResponse.json({ title: cleanTitle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error generating title:', error);
    return NextResponse.json(
      { error: 'Failed to generate title', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
