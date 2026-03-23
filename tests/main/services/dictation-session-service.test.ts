import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CorrectionHistoryItem,
  CorrectionResponse,
  Settings,
  VoiceInputStatus,
} from '../../../src/shared/types';

// Stable UUID for assertions
vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-001',
}));

const DEFAULT_SETTINGS: Settings = {
  activeProvider: 'lm-studio',
  lmStudio: { endpointUrl: 'http://localhost:1234/v1', modelName: '' },
  gemini: { apiKey: '', modelName: 'gemini-2.0-flash' },
  promptTemplate: 'Fix: {text}',
  voiceInput: { shortcut: 'CommandOrControl+Shift+L', autoCorrect: true, language: 'ja-JP' },
  residentMode: { enabled: true, showDockIcon: false },
  pasteBack: { enabled: false, fallbackToClipboardOnly: true },
};

function createMockDeps() {
  const speechService = new EventEmitter() as EventEmitter & {
    getStatus: () => VoiceInputStatus;
    start: () => void;
    stop: () => void;
  };
  speechService.getStatus = vi.fn().mockReturnValue('idle');
  speechService.start = vi.fn();
  speechService.stop = vi.fn();

  const savedHistory: CorrectionHistoryItem[] = [];

  return {
    configManager: {
      load: vi.fn().mockReturnValue(DEFAULT_SETTINGS),
      saveCorrectionHistoryItem: vi.fn((item: CorrectionHistoryItem) => {
        savedHistory.push(item);
      }),
      updateCorrectionHistoryItem: vi.fn((id: string, updates: Partial<CorrectionHistoryItem>) => {
        const target = savedHistory.find((h) => h.id === id);
        if (target) Object.assign(target, updates);
      }),
      getCorrectionHistory: vi.fn(() => savedHistory),
      deleteCorrectionHistoryItem: vi.fn(),
    },
    llmService: {
      correct: vi.fn(),
      updateSettings: vi.fn(),
    },
    speechService,
    frontmostAppService: {
      getFrontmostApp: vi.fn().mockResolvedValue(null),
    },
    pasteBackService: {
      setTargetApp: vi.fn(),
      clearTargetApp: vi.fn(),
      pasteText: vi.fn(),
    },
    settingsWindowService: {
      show: vi.fn(),
      hide: vi.fn(),
    },
    voiceCaptureWindowService: {
      update: vi.fn().mockResolvedValue(undefined),
      dismiss: vi.fn(),
      dismissAfterDelay: vi.fn(),
    },
    _savedHistory: savedHistory,
  };
}

describe('DictationSessionService – transcription history', () => {
  let service: InstanceType<typeof import('../../../src/main/services/dictation-session-service').DictationSessionService>;
  let deps: ReturnType<typeof createMockDeps>;

  beforeEach(async () => {
    vi.resetModules();
    deps = createMockDeps();
    const { DictationSessionService } = await import(
      '../../../src/main/services/dictation-session-service'
    );
    service = new DictationSessionService(deps as never);
  });

  /**
   * 音声入力 → 校正成功の正常フロー
   * 履歴には inputText + correctedText の両方が保存される
   */
  it('saves history with correctedText on successful correction', async () => {
    deps.llmService.correct.mockResolvedValue({
      success: true,
      correctedText: '校正済みテキスト',
    } satisfies CorrectionResponse);

    // Simulate: voice capture start → final transcription → speech idle → auto correction
    await service.startVoiceCapture();
    deps.speechService.emit('transcription', { text: '生のテキスト', isFinal: true, timestamp: '' });
    deps.speechService.getStatus = vi.fn().mockReturnValue('idle');
    deps.speechService.emit('status-change', 'idle');

    // Wait for async correction
    await vi.waitFor(() => {
      expect(deps.llmService.correct).toHaveBeenCalled();
    });

    // History should be saved before correction, then updated after success
    expect(deps.configManager.saveCorrectionHistoryItem).toHaveBeenCalledTimes(1);
    expect(deps.configManager.saveCorrectionHistoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-uuid-001',
        inputText: '生のテキスト',
        provider: 'lm-studio',
      }),
    );
    expect(deps.configManager.updateCorrectionHistoryItem).toHaveBeenCalledWith(
      'test-uuid-001',
      { correctedText: '校正済みテキスト' },
    );

    // Verify final saved state has both texts
    expect(deps._savedHistory[0]?.inputText).toBe('生のテキスト');
    expect(deps._savedHistory[0]?.correctedText).toBe('校正済みテキスト');
  });

  /**
   * 核心テスト: LLM校正が失敗しても、生テキストが履歴に残る
   */
  it('preserves input text in history even when LLM correction fails', async () => {
    deps.llmService.correct.mockResolvedValue({
      success: false,
      error: { type: 'CONNECTION_ERROR', message: 'サーバーに接続できません' },
    } satisfies CorrectionResponse);

    await service.startVoiceCapture();
    deps.speechService.emit('transcription', {
      text: '大事な音声テキスト',
      isFinal: true,
      timestamp: '',
    });
    deps.speechService.getStatus = vi.fn().mockReturnValue('idle');
    deps.speechService.emit('status-change', 'idle');

    await vi.waitFor(() => {
      expect(deps.llmService.correct).toHaveBeenCalled();
    });

    // History item should exist with inputText but no correctedText
    expect(deps.configManager.saveCorrectionHistoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        inputText: '大事な音声テキスト',
        correctedText: undefined,
      }),
    );
    // updateCorrectionHistoryItem should NOT have been called (correction failed)
    expect(deps.configManager.updateCorrectionHistoryItem).not.toHaveBeenCalled();

    // The raw text is preserved in history
    expect(deps._savedHistory).toHaveLength(1);
    expect(deps._savedHistory[0]?.inputText).toBe('大事な音声テキスト');
    expect(deps._savedHistory[0]?.correctedText).toBeUndefined();
  });

  /**
   * 履歴から再校正できる
   */
  it('correctFromHistory retrieves text and runs correction', async () => {
    deps._savedHistory.push({
      id: 'existing-item',
      inputText: '過去のテキスト',
      correctedText: undefined,
      provider: 'lm-studio',
      createdAt: '2026-01-01T00:00:00Z',
    });

    deps.llmService.correct.mockResolvedValue({
      success: true,
      correctedText: '校正された過去のテキスト',
    } satisfies CorrectionResponse);

    await service.correctFromHistory('existing-item');

    expect(deps.llmService.correct).toHaveBeenCalledWith(
      expect.objectContaining({ text: '過去のテキスト' }),
    );
  });

  /**
   * retry 時は履歴に二重保存しない
   */
  it('does not save duplicate history on retry', async () => {
    deps.llmService.correct.mockResolvedValue({
      success: false,
      error: { type: 'API_ERROR', message: 'エラー' },
    } satisfies CorrectionResponse);

    // First: auto correction
    await service.startVoiceCapture();
    deps.speechService.emit('transcription', { text: 'テスト', isFinal: true, timestamp: '' });
    deps.speechService.getStatus = vi.fn().mockReturnValue('idle');
    deps.speechService.emit('status-change', 'idle');

    await vi.waitFor(() => {
      expect(deps.llmService.correct).toHaveBeenCalledTimes(1);
    });

    // Retry
    deps.llmService.correct.mockResolvedValue({
      success: true,
      correctedText: '校正済み',
    } satisfies CorrectionResponse);

    await service.retryLastCorrection();

    // saveCorrectionHistoryItem should only be called once (from auto, not from retry)
    expect(deps.configManager.saveCorrectionHistoryItem).toHaveBeenCalledTimes(1);
  });
});
