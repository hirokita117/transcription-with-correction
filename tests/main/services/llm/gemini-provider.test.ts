import { describe, it, expect, vi } from 'vitest';
import { GeminiProvider } from '../../../../src/main/services/llm/gemini-provider';

// Mock @google/generative-ai
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => 'corrected text',
          },
        }),
      }),
    })),
  };
});

describe('GeminiProvider', () => {
  it('validates config with apiKey and modelName', () => {
    const provider = new GeminiProvider({ apiKey: 'test-key', modelName: 'gemini-2.0-flash' });
    expect(provider.validateConfig()).toBe(true);
  });

  it('fails validation without apiKey', () => {
    const provider = new GeminiProvider({ apiKey: '', modelName: 'gemini-2.0-flash' });
    expect(provider.validateConfig()).toBe(false);
  });

  it('fails validation without modelName', () => {
    const provider = new GeminiProvider({ apiKey: 'test-key', modelName: '' });
    expect(provider.validateConfig()).toBe(false);
  });

  it('returns provider name', () => {
    const provider = new GeminiProvider({ apiKey: '', modelName: '' });
    expect(provider.getProviderName()).toBe('Gemini');
  });

  it('calls generateContent and returns result', async () => {
    const provider = new GeminiProvider({ apiKey: 'test-key', modelName: 'gemini-2.0-flash' });
    const result = await provider.correct('test prompt');
    expect(result).toBe('corrected text');
  });
});
