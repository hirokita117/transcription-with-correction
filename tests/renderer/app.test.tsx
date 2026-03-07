// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/renderer/App';
import { VoiceCaptureApp } from '../../src/renderer/voice-capture-app';
import type { BootstrapData, ElectronAPI, Settings, VoiceSessionViewModel } from '../../src/shared/types';

const getSettingsWindowDataMock = vi.fn();
const saveSettingsMock = vi.fn();
const getPermissionStatusMock = vi.fn();
const openAccessibilitySettingsMock = vi.fn();
const openSettingsWindowMock = vi.fn();
const closeSettingsWindowMock = vi.fn();
const retryLastCorrectionMock = vi.fn();
const dismissVoiceWindowMock = vi.fn();
const onVoiceSessionStateChangeMock = vi.fn();
const onSettingsRequiredMock = vi.fn();

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
    showDockIcon: false,
  },
  pasteBack: {
    enabled: true,
    fallbackToClipboardOnly: true,
  },
};

const bootstrapData: BootstrapData = {
  settings,
  isFirstRun: false,
  needsSetup: false,
};

Object.assign(window, {
  electronAPI: {
    getSettingsWindowData: getSettingsWindowDataMock,
    saveSettings: saveSettingsMock,
    getPermissionStatus: getPermissionStatusMock,
    openAccessibilitySettings: openAccessibilitySettingsMock,
    openSettingsWindow: openSettingsWindowMock,
    closeSettingsWindow: closeSettingsWindowMock,
    retryLastCorrection: retryLastCorrectionMock,
    dismissVoiceWindow: dismissVoiceWindowMock,
    onVoiceSessionStateChange: onVoiceSessionStateChangeMock,
    onSettingsRequired: onSettingsRequiredMock,
  } satisfies ElectronAPI,
});

describe('App', () => {
  beforeEach(() => {
    getSettingsWindowDataMock.mockResolvedValue(bootstrapData);
    saveSettingsMock.mockResolvedValue(undefined);
    getPermissionStatusMock.mockResolvedValue({ accessibilityTrusted: true });
    openAccessibilitySettingsMock.mockResolvedValue(undefined);
    openSettingsWindowMock.mockResolvedValue(undefined);
    closeSettingsWindowMock.mockResolvedValue(undefined);
    retryLastCorrectionMock.mockResolvedValue(undefined);
    dismissVoiceWindowMock.mockResolvedValue(undefined);
    onVoiceSessionStateChangeMock.mockImplementation(() => vi.fn());
    onSettingsRequiredMock.mockImplementation(() => vi.fn());
  });

  it('loads settings window data and saves updates', async () => {
    render(<App />);

    expect(await screen.findByText('文字起こし校正の設定')).toBeTruthy();

    const dockToggle = await screen.findByLabelText('Dock アイコンを表示する');
    fireEvent.click(dockToggle);
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(saveSettingsMock).toHaveBeenCalledWith({
        ...settings,
        residentMode: {
          ...settings.residentMode,
          showDockIcon: true,
        },
      });
    });
  });
});

describe('VoiceCaptureApp', () => {
  beforeEach(() => {
    onVoiceSessionStateChangeMock.mockReset();
    retryLastCorrectionMock.mockReset();
    openSettingsWindowMock.mockReset();
    dismissVoiceWindowMock.mockReset();
  });

  it('shows live transcript while recording', async () => {
    onVoiceSessionStateChangeMock.mockImplementation((callback: (state: VoiceSessionViewModel) => void) => {
      callback({
        visible: true,
        phase: 'recording',
        liveTranscript: 'こんにちは',
        finalTranscript: '',
        message: '話している内容をリアルタイムで表示します',
        canRetryCorrection: false,
      });
      return vi.fn();
    });

    render(<VoiceCaptureApp />);

    expect(await screen.findByText('音声入力中')).toBeTruthy();
    expect(screen.getByText('こんにちは')).toBeTruthy();
  });

  it('retries failed correction on button click', async () => {
    onVoiceSessionStateChangeMock.mockImplementation((callback: (state: VoiceSessionViewModel) => void) => {
      callback({
        visible: true,
        phase: 'correction_failed',
        liveTranscript: '',
        finalTranscript: '失敗したテキスト',
        message: '校正処理に失敗しました',
        canRetryCorrection: true,
        errorCode: 'api_error',
      });
      return vi.fn();
    });

    render(<VoiceCaptureApp />);

    fireEvent.click(await screen.findByRole('button', { name: '再校正' }));

    await waitFor(() => {
      expect(retryLastCorrectionMock).toHaveBeenCalled();
    });
  });
});
