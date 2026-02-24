import { contextBridge, ipcRenderer } from 'electron';
import type { CorrectionRequest, CorrectionResponse, Settings } from '../shared/types';

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
});
