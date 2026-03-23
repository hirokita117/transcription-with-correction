import { contextBridge, ipcRenderer } from 'electron';
import type {
  BootstrapData,
  CorrectionHistoryItem,
  PermissionStatus,
  Settings,
  VoiceSessionViewModel,
} from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getSettingsWindowData: (): Promise<BootstrapData> => {
    return ipcRenderer.invoke('get-settings-window-data');
  },
  saveSettings: (settings: Settings): Promise<void> => {
    return ipcRenderer.invoke('save-settings', settings);
  },
  getPermissionStatus: (): Promise<PermissionStatus> => {
    return ipcRenderer.invoke('get-permission-status');
  },
  openAccessibilitySettings: (): Promise<void> => {
    return ipcRenderer.invoke('open-accessibility-settings');
  },
  openSettingsWindow: (): Promise<void> => {
    return ipcRenderer.invoke('open-settings-window');
  },
  closeSettingsWindow: (): Promise<void> => {
    return ipcRenderer.invoke('close-settings-window');
  },
  retryLastCorrection: (): Promise<void> => {
    return ipcRenderer.invoke('retry-last-correction');
  },
  dismissVoiceWindow: (): Promise<void> => {
    return ipcRenderer.invoke('dismiss-voice-window');
  },
  getTranscriptionHistory: (): Promise<CorrectionHistoryItem[]> => {
    return ipcRenderer.invoke('get-transcription-history');
  },
  correctFromHistory: (id: string): Promise<void> => {
    return ipcRenderer.invoke('correct-from-history', id);
  },
  deleteHistoryItem: (id: string): Promise<void> => {
    return ipcRenderer.invoke('delete-history-item', id);
  },
  onVoiceSessionStateChange: (callback: (state: VoiceSessionViewModel) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: VoiceSessionViewModel) => {
      callback(state);
    };
    ipcRenderer.on('voice-session-state-change', handler);
    return () => {
      ipcRenderer.removeListener('voice-session-state-change', handler);
    };
  },
  onSettingsRequired: (callback: () => void): (() => void) => {
    const handler = () => {
      callback();
    };
    ipcRenderer.on('settings-required', handler);
    return () => {
      ipcRenderer.removeListener('settings-required', handler);
    };
  },
});
