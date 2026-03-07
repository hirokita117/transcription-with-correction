import { contextBridge, ipcRenderer } from 'electron';
import type {
  AnalyticsEvent,
  BootstrapData,
  CorrectionHistoryItem,
  CorrectionRequest,
  CorrectionResponse,
  ExportCorrectionPayload,
  ExportCorrectionResponse,
  OverlayState,
  PasteBackResult,
  PermissionStatus,
  Settings,
  TranscriptionResult,
  VoiceInputStatus,
} from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  correctText: (request: CorrectionRequest): Promise<CorrectionResponse> => {
    return ipcRenderer.invoke('correct-text', request);
  },
  getBootstrapData: (): Promise<BootstrapData> => {
    return ipcRenderer.invoke('get-bootstrap-data');
  },
  getSettings: (): Promise<Settings> => {
    return ipcRenderer.invoke('get-settings');
  },
  saveSettings: (settings: Settings): Promise<void> => {
    return ipcRenderer.invoke('save-settings', settings);
  },
  getCorrectionHistory: (): Promise<CorrectionHistoryItem[]> => {
    return ipcRenderer.invoke('get-correction-history');
  },
  saveCorrectionHistoryItem: (item: CorrectionHistoryItem): Promise<void> => {
    return ipcRenderer.invoke('save-correction-history-item', item);
  },
  exportCorrectionResult: (payload: ExportCorrectionPayload): Promise<ExportCorrectionResponse> => {
    return ipcRenderer.invoke('export-correction-result', payload);
  },
  trackEvent: (event: AnalyticsEvent): Promise<void> => {
    return ipcRenderer.invoke('track-event', event);
  },
  startVoiceInput: (): Promise<void> => {
    return ipcRenderer.invoke('start-voice-input');
  },
  stopVoiceInput: (): Promise<void> => {
    return ipcRenderer.invoke('stop-voice-input');
  },
  pasteCorrectedText: (text: string): Promise<PasteBackResult> => {
    return ipcRenderer.invoke('paste-corrected-text', text);
  },
  getPermissionStatus: (): Promise<PermissionStatus> => {
    return ipcRenderer.invoke('get-permission-status');
  },
  openAccessibilitySettings: (): Promise<void> => {
    return ipcRenderer.invoke('open-accessibility-settings');
  },
  updateOverlayState: (state: OverlayState): Promise<void> => {
    return ipcRenderer.invoke('update-overlay-state', state);
  },
  dismissOverlay: (): Promise<void> => {
    return ipcRenderer.invoke('dismiss-overlay');
  },
  onTranscriptionResult: (callback: (result: TranscriptionResult) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, result: TranscriptionResult) => {
      callback(result);
    };
    ipcRenderer.on('voice-transcription-result', handler);
    return () => {
      ipcRenderer.removeListener('voice-transcription-result', handler);
    };
  },
  onVoiceInputStatusChange: (callback: (status: VoiceInputStatus) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: VoiceInputStatus) => {
      callback(status);
    };
    ipcRenderer.on('voice-input-status-change', handler);
    return () => {
      ipcRenderer.removeListener('voice-input-status-change', handler);
    };
  },
  onVoiceInputShortcut: (callback: () => void): (() => void) => {
    const handler = () => {
      callback();
    };
    ipcRenderer.on('voice-input-shortcut', handler);
    return () => {
      ipcRenderer.removeListener('voice-input-shortcut', handler);
    };
  },
  onOverlayStateChange: (callback: (state: OverlayState) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: OverlayState) => {
      callback(state);
    };
    ipcRenderer.on('overlay-state-change', handler);
    return () => {
      ipcRenderer.removeListener('overlay-state-change', handler);
    };
  },
});
