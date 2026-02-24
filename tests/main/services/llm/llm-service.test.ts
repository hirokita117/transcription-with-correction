import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMService } from '../../../../src/main/services/llm/llm-service';
import type { Settings, CorrectionRequest } from '../../../../src/shared/types';

const createSettings = (overrides?: Partial<Settings>): Settings => ({
  activeProvider: 'lm-studio',
  lmStudio: { endpointUrl: 'http://localhost:1234/v1', modelName: 'test-model' },
  gemini: { apiKey: 'test-key', modelName: 'gemini-2.0-flash' },
  promptTemplate: 'Fix: {text}',
  ...overrides,
});

const createRequest = (text: string): CorrectionRequest => ({
  text,
  promptTemplate: 'Fix: {text}',
});

describe('LLMService', () => {
  it('returns EMPTY_TEXT error for empty input', async () => {
    const service = new LLMService(createSettings());
    const result = await service.correct(createRequest(''));
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('EMPTY_TEXT');
  });

  it('returns EMPTY_TEXT error for whitespace-only input', async () => {
    const service = new LLMService(createSettings());
    const result = await service.correct(createRequest('   '));
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('EMPTY_TEXT');
  });

  it('returns PROVIDER_NOT_CONFIGURED for unconfigured lm-studio', async () => {
    const service = new LLMService(createSettings({
      lmStudio: { endpointUrl: '', modelName: '' },
    }));
    const result = await service.correct(createRequest('test text'));
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('PROVIDER_NOT_CONFIGURED');
  });

  it('returns PROVIDER_NOT_CONFIGURED for unconfigured gemini', async () => {
    const service = new LLMService(createSettings({
      activeProvider: 'gemini',
      gemini: { apiKey: '', modelName: 'gemini-2.0-flash' },
    }));
    const result = await service.correct(createRequest('test text'));
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('PROVIDER_NOT_CONFIGURED');
  });

  it('returns CONNECTION_ERROR for fetch failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    const service = new LLMService(createSettings());
    const result = await service.correct(createRequest('test text'));
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('CONNECTION_ERROR');

    vi.unstubAllGlobals();
  });

  it('returns AUTH_ERROR for 401 responses', async () => {
    const error = new Error('Unauthorized') as Error & { status: number };
    error.status = 401;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    const service = new LLMService(createSettings());
    const result = await service.correct(createRequest('test text'));
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('AUTH_ERROR');

    vi.unstubAllGlobals();
  });

  it('returns success with corrected text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: '校正されたテキスト' } }],
      }),
    }));

    const service = new LLMService(createSettings());
    const result = await service.correct(createRequest('テスト'));
    expect(result.success).toBe(true);
    expect(result.correctedText).toBe('校正されたテキスト');

    vi.unstubAllGlobals();
  });

  it('updates settings correctly', async () => {
    const service = new LLMService(createSettings());
    const newSettings = createSettings({
      activeProvider: 'gemini',
      gemini: { apiKey: '', modelName: 'gemini-2.0-flash' },
    });
    service.updateSettings(newSettings);

    const result = await service.correct(createRequest('test'));
    expect(result.error?.type).toBe('PROVIDER_NOT_CONFIGURED');
  });
});
