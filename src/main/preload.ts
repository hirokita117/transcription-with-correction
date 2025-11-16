/**
 * Preload Script
 * Renderer Process に公開する IPC API
 */

import { contextBridge, ipcRenderer } from 'electron';
import {
  ModelsListRequest,
  ModelsListResponse,
  ModelsAddRequest,
  ModelsAddResponse,
  ModelsRemoveRequest,
  ModelsRemoveResponse,
  LLMFormatRequest,
  LLMFormatResponse,
  ClipboardCopyRequest,
  ClipboardCopyResponse,
  StoreGetRequest,
  StoreGetResponse,
  StoreSetRequest,
  StoreSetResponse,
  StoreGetHistoryResponse,
  StoreSaveHistoryRequest,
  StoreSaveHistoryResponse,
  AppGetVersionResponse,
} from '../shared/types/ipc';

/**
 * Electron API インターフェース
 */
interface ElectronAPI {
  // モデル管理
  models: {
    list: (request?: ModelsListRequest) => Promise<ModelsListResponse>;
    add: (request: ModelsAddRequest) => Promise<ModelsAddResponse>;
    remove: (request: ModelsRemoveRequest) => Promise<ModelsRemoveResponse>;
  };

  // LLM操作
  llm: {
    format: (request: LLMFormatRequest) => Promise<LLMFormatResponse>;
  };

  // クリップボード
  clipboard: {
    copy: (request: ClipboardCopyRequest) => Promise<ClipboardCopyResponse>;
  };

  // 永続化
  store: {
    get: <T = unknown>(request: StoreGetRequest) => Promise<StoreGetResponse<T>>;
    set: (request: StoreSetRequest) => Promise<StoreSetResponse>;
    getHistory: () => Promise<StoreGetHistoryResponse>;
    saveHistory: (request: StoreSaveHistoryRequest) => Promise<StoreSaveHistoryResponse>;
    clearHistory: () => Promise<{ success: boolean; data?: { cleared: boolean }; error?: any }>;
  };

  // アプリケーション
  app: {
    getVersion: () => Promise<AppGetVersionResponse>;
  };
}

/**
 * contextBridge で API を公開
 */
const electronAPI: ElectronAPI = {
  models: {
    list: (request) => ipcRenderer.invoke('models:list', request),
    add: (request) => ipcRenderer.invoke('models:add', request),
    remove: (request) => ipcRenderer.invoke('models:remove', request),
  },
  llm: {
    format: (request) => ipcRenderer.invoke('llm:format', request),
  },
  clipboard: {
    copy: (request) => ipcRenderer.invoke('clipboard:copy', request),
  },
  store: {
    get: (request) => ipcRenderer.invoke('store:get', request),
    set: (request) => ipcRenderer.invoke('store:set', request),
    getHistory: () => ipcRenderer.invoke('store:getHistory'),
    saveHistory: (request) => ipcRenderer.invoke('store:saveHistory', request),
    clearHistory: () => ipcRenderer.invoke('store:clearHistory'),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript の型定義をグローバルに公開
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

