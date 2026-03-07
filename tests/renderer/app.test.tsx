// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/renderer/App';
import type { ElectronAPI, Settings } from '../../src/shared/types';

const getBootstrapDataMock = vi.fn();
const getCorrectionHistoryMock = vi.fn();
const saveCorrectionHistoryItemMock = vi.fn();
const exportCorrectionResultMock = vi.fn();
const trackEventMock = vi.fn();
const getSettingsMock = vi.fn();
const getPermissionStatusMock = vi.fn();
const correctTextMock = vi.fn();
const pasteCorrectedTextMock = vi.fn();
const updateOverlayStateMock = vi.fn();
const dismissOverlayMock = vi.fn();

const settings: Settings = {
  activeProvider: 'lm-studio',
  lmStudio: { endpointUrl: 'http://localhost:1234/v1', modelName: 'model' },
  gemini: { apiKey: '', modelName: 'gemini-2.0-flash' },
  promptTemplate: 'Fix: {text}',
  voiceInput: {
    shortcut: 'CommandOrControl+Shift+L',
    autoCorrect: true,
    language: 'ja-JP',
  },
  residentMode: {
    enabled: true,
    showDockIcon: true,
  },
  pasteBack: {
    enabled: true,
    fallbackToClipboardOnly: true,
  },
};

Object.assign(window, {
  electronAPI: {
    correctText: correctTextMock,
    getBootstrapData: getBootstrapDataMock,
    getSettings: getSettingsMock,
    saveSettings: vi.fn(),
    getCorrectionHistory: getCorrectionHistoryMock,
    saveCorrectionHistoryItem: saveCorrectionHistoryItemMock,
    exportCorrectionResult: exportCorrectionResultMock,
    trackEvent: trackEventMock,
    startVoiceInput: vi.fn(),
    stopVoiceInput: vi.fn(),
    pasteCorrectedText: pasteCorrectedTextMock,
    getPermissionStatus: getPermissionStatusMock,
    openAccessibilitySettings: vi.fn(),
    updateOverlayState: updateOverlayStateMock,
    dismissOverlay: dismissOverlayMock,
    onTranscriptionResult: vi.fn(() => vi.fn()),
    onVoiceInputStatusChange: vi.fn(() => vi.fn()),
    onVoiceInputShortcut: vi.fn(() => vi.fn()),
    onOverlayStateChange: vi.fn(() => vi.fn()),
  } satisfies ElectronAPI,
});

describe('App', () => {
  beforeEach(() => {
    getBootstrapDataMock.mockResolvedValue({
      settings,
      isFirstRun: false,
      needsSetup: false,
    });
    getCorrectionHistoryMock.mockResolvedValue([]);
    saveCorrectionHistoryItemMock.mockResolvedValue(undefined);
    exportCorrectionResultMock.mockResolvedValue({ success: true, path: '/tmp/out.txt' });
    trackEventMock.mockResolvedValue(undefined);
    getSettingsMock.mockResolvedValue(settings);
    getPermissionStatusMock.mockResolvedValue({ accessibilityTrusted: true });
    correctTextMock.mockResolvedValue({ success: true, correctedText: '校正後' });
    pasteCorrectedTextMock.mockResolvedValue({ status: 'pasted', message: '校正して貼り付けました' });
    updateOverlayStateMock.mockResolvedValue(undefined);
    dismissOverlayMock.mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('calls pasteCorrectedText after correction when paste-back is enabled', async () => {
    render(<App />);

    const textarea = await screen.findByPlaceholderText('ここにテキストを入力するか、音声入力を開始してください...');
    fireEvent.change(textarea, { target: { value: 'テスト入力' } });
    fireEvent.click(screen.getByRole('button', { name: '校正' }));

    await waitFor(() => {
      expect(pasteCorrectedTextMock).toHaveBeenCalledWith('校正後');
    });

    expect(updateOverlayStateMock).toHaveBeenCalledWith({
      visible: true,
      phase: 'correcting',
      message: 'テキストを整えています',
    });
  });
});
