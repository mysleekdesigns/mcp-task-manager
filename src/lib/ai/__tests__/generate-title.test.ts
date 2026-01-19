import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTaskTitle } from '../generate-title';

// Mock fetch
global.fetch = vi.fn();

describe('generateTaskTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error for empty description', async () => {
    const result = await generateTaskTitle('');

    expect(result).toEqual({
      title: '',
      error: 'Description cannot be empty',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should return error for whitespace-only description', async () => {
    const result = await generateTaskTitle('   ');

    expect(result).toEqual({
      title: '',
      error: 'Description cannot be empty',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should call API with description and return title', async () => {
    const mockTitle = 'Implement user authentication';
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: mockTitle }),
    });

    const result = await generateTaskTitle('Add login and signup functionality');

    expect(fetch).toHaveBeenCalledWith('/api/ai/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Add login and signup functionality',
        apiKey: undefined,
      }),
    });

    expect(result).toEqual({
      title: mockTitle,
    });
  });

  it('should pass API key if provided', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Test Title' }),
    });

    await generateTaskTitle('Test description', 'test-api-key');

    expect(fetch).toHaveBeenCalledWith('/api/ai/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Test description',
        apiKey: 'test-api-key',
      }),
    });
  });

  it('should handle 401 unauthorized error', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    const result = await generateTaskTitle('Test description');

    expect(result).toEqual({
      title: '',
      error: 'Please log in to use AI title generation',
    });
  });

  it('should handle 403 forbidden error (no API key)', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'No API key' }),
    });

    const result = await generateTaskTitle('Test description');

    expect(result).toEqual({
      title: '',
      error: 'Please add your Claude API key in Settings to use AI title generation, or provide a title manually',
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    const result = await generateTaskTitle('Test description');

    expect(result).toEqual({
      title: '',
      error: 'Internal server error',
    });
  });

  it('should handle network errors', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await generateTaskTitle('Test description');

    expect(result).toEqual({
      title: '',
      error: 'Network error',
    });
  });

  it('should trim description before sending', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Test Title' }),
    });

    await generateTaskTitle('  Test description  ');

    expect(fetch).toHaveBeenCalledWith('/api/ai/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Test description',
        apiKey: undefined,
      }),
    });
  });
});
