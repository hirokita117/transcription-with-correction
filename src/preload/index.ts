import { contextBridge, ipcRenderer } from 'electron';
import type {
  CorrectionRequest,
  CorrectionResponse,
  Settings,
  TranscriptionResult,
  VoiceInputStatus,
} from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  correctText: (request: CorrectionRequest): Promise<CorrectionResponse> => {
    return ipcRenderer.invoke('correct-text', request);
  },
  getSettings: (): Promise<Settings> => {
    return ipcRenderer.invoke('get-settings');
  },
  saveSettings: (settings: Settings): Promise<void> => {
    return ipcRenderer.invoke('save-settings', settings);
  },
  startVoiceInput: (): Promise<void> => {
    return ipcRenderer.invoke('start-voice-input');
  },
  stopVoiceInput: (): Promise<void> => {
    return ipcRenderer.invoke('stop-voice-input');
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
});
