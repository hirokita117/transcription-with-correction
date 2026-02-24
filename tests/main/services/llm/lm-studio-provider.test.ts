import { describe, it, expect, vi } from 'vitest';
import { LMStudioProvider } from '../../../../src/main/services/llm/lm-studio-provider';

describe('LMStudioProvider', () => {
  it('validates config with valid URL', () => {
    const provider = new LMStudioProvider({
      endpointUrl: 'http://localhost:1234/v1',
      modelName: 'test',
    });
    expect(provider.validateConfig()).toBe(true);
  });

  it('fails validation with empty URL', () => {
    const provider = new LMStudioProvider({ endpointUrl: '', modelName: '' });
    expect(provider.validateConfig()).toBe(false);
  });

  it('fails validation with invalid URL', () => {
    const provider = new LMStudioProvider({ endpointUrl: 'not-a-url', modelName: '' });
    expect(provider.validateConfig()).toBe(false);
  });

  it('returns provider name', () => {
    const provider = new LMStudioProvider({ endpointUrl: '', modelName: '' });
    expect(provider.getProviderName()).toBe('LM Studio');
  });

  it('calls correct endpoint with proper body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'corrected' } }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const provider = new LMStudioProvider({
      endpointUrl: 'http://localhost:1234/v1',
      modelName: 'test-model',
    });
    const result = await provider.correct('test prompt');

    expect(result).toBe('corrected');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:1234/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe('test-model');
    expect(body.messages[0].content).toBe('test prompt');
    expect(body.temperature).toBe(0.3);

    vi.unstubAllGlobals();
  });

  it('throws error on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    const provider = new LMStudioProvider({
      endpointUrl: 'http://localhost:1234/v1',
      modelName: '',
    });

    await expect(provider.correct('test')).rejects.toThrow('LM Studio API error: 500');

    vi.unstubAllGlobals();
  });
});
