# AI Title Generation

This feature allows users to automatically generate concise task titles from descriptions using Claude AI.

## Architecture

### Client-side Utility
**File:** `/src/lib/ai/generate-title.ts`

```typescript
import { generateTaskTitle } from '@/lib/ai/generate-title';

const result = await generateTaskTitle(description, optionalApiKey);
// Returns: { title: string; error?: string }
```

### API Route
**Endpoint:** `POST /api/ai/generate-title`

**Request:**
```json
{
  "description": "Add user authentication with OAuth support",
  "apiKey": "optional-claude-api-key"
}
```

**Response (Success):**
```json
{
  "title": "Implement OAuth user authentication"
}
```

**Response (Error):**
```json
{
  "error": "Error message here"
}
```

## How It Works

1. **User provides description**: User enters a task description in the Create Task Modal
2. **Client calls utility**: `generateTaskTitle()` is called with the description
3. **API key resolution**:
   - If API key is provided in the call, use it
   - Otherwise, fetch the user's Claude API key from their settings (encrypted in DB)
4. **Claude API call**: Make request to Claude Haiku for fast, cost-effective title generation
5. **Response handling**: Return generated title or error message to client

## API Key Management

### User Settings
Users can add their Claude API key in Settings:
1. Navigate to Settings > API Keys
2. Enter Claude API key
3. Key is encrypted using AES-256-GCM before storage
4. Stored in `UserSettings.claudeApiKey` field

### Security
- API keys are encrypted at rest using `/src/lib/encryption.ts`
- Keys are decrypted only server-side when needed
- Never exposed in client-side code
- Masked when displayed in UI (shows first 4 and last 4 chars)

## Error Handling

| Error Code | Message | Cause |
|------------|---------|-------|
| 400 | Invalid request data | Validation failed (empty description, too long, etc.) |
| 401 | Unauthorized | User not logged in |
| 403 | No Claude API key found | User hasn't added API key in settings |
| 429 | Rate limit exceeded | Claude API rate limit hit |
| 500 | Failed to generate title | Claude API error or other server error |

## Integration Example

```typescript
// In CreateTaskModal.tsx
import { generateTaskTitle } from '@/lib/ai/generate-title';

const handleGenerateTitle = async () => {
  setIsGenerating(true);

  const result = await generateTaskTitle(description);

  if (result.error) {
    toast.error(result.error);
  } else {
    setTitle(result.title);
    toast.success('Title generated!');
  }

  setIsGenerating(false);
};
```

## Claude API Configuration

- **Model**: `claude-3-haiku-20240307`
  - Fast response time (optimal for real-time UX)
  - Cost-effective ($0.25 per million input tokens)
  - Sufficient quality for title generation

- **Parameters**:
  - `max_tokens`: 50 (titles are short)
  - `temperature`: 0.3 (consistent, focused results)

- **Prompt**:
  ```
  Generate a concise, clear task title (5-10 words max) for the following task description.
  Return ONLY the title, without quotes or extra explanation.

  Task description:
  [user's description]
  ```

## Cost Estimation

Assuming average description length of 200 tokens:
- Input: ~250 tokens per request (including prompt)
- Output: ~15 tokens per request
- Cost per request: ~$0.00007
- 1000 requests: ~$0.07

Very cost-effective for this use case.

## Future Enhancements

1. **Caching**: Cache generated titles for identical descriptions
2. **Batch generation**: Generate multiple title suggestions
3. **Context awareness**: Include project context for better titles
4. **Fallback models**: Use GPT-4 if Claude API fails
5. **Usage analytics**: Track API usage per user
6. **Custom prompts**: Allow users to customize title generation style
