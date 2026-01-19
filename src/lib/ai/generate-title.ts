/**
 * AI Title Generation Utility
 * Client-side utility for generating task titles from descriptions
 */

export interface GenerateTitleResult {
  title: string;
  error?: string;
}

/**
 * Generate a concise task title from a description using Claude AI
 *
 * @param description - The task description to generate a title from
 * @param apiKey - Optional Claude API key (if not provided, checks user settings)
 * @returns Promise resolving to { title, error }
 */
export async function generateTaskTitle(
  description: string,
  apiKey?: string
): Promise<GenerateTitleResult> {
  try {
    // Validate description
    if (!description || description.trim().length === 0) {
      return {
        title: '',
        error: 'Description cannot be empty',
      };
    }

    // Make API call to generate title
    const response = await fetch('/api/ai/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: description.trim(),
        apiKey,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        return {
          title: '',
          error: 'Please log in to use AI title generation',
        };
      }

      if (response.status === 403) {
        return {
          title: '',
          error: 'Please add your Claude API key in Settings to use AI title generation, or provide a title manually',
        };
      }

      return {
        title: '',
        error: data.error || 'Failed to generate title',
      };
    }

    return {
      title: data.title || '',
    };
  } catch (error) {
    console.error('Error generating title:', error);
    return {
      title: '',
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}
