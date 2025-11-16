/**
 * IPC ハンドラーの設定
 */

import { ipcMain } from 'electron';
import { clipboard } from 'electron';
import { app } from 'electron';
import {
  ModelsListRequest,
  ModelsAddRequest,
  ModelsRemoveRequest,
  LLMFormatRequest,
  ClipboardCopyRequest,
  StoreGetRequest,
  StoreSetRequest,
  StoreSaveHistoryRequest,
  IPCResponse,
  IPCSuccess,
  IPCFailure,
  ErrorCode,
} from '../../shared/types/ipc';
import { AppError, handleError } from '../../shared/errors/app-error';
import {
  setSetting,
  getSetting,
  getHistory,
  addHistoryItem,
  clearHistory,
} from '../store/store';
import { StoreKey } from '../../shared/types/ipc';

/**
 * 成功レスポンスを作成
 */
function success<T>(data: T): IPCSuccess<T> {
  return { success: true, data };
}

/**
 * 失敗レスポンスを作成
 */
function failure(error: AppError): IPCFailure {
  return {
    success: false,
    error: error.toIPCError(),
  };
}

/**
 * IPCハンドラーを設定
 */
export function setupIPCHandlers(): void {
  // ========================================================================
  // モデル管理
  // ========================================================================

  ipcMain.handle('models:list', async (_, request?: ModelsListRequest) => {
    try {
      // TODO: LLM クライアントからモデル一覧を取得
      // 現在はストアからカスタムモデルのみを返す
      const customModels = getSetting('customModels');
      const defaultModel = getSetting('defaultModel');

      return success({
        models: customModels,
        defaultModel,
      }) as IPCResponse<{ models: any[]; defaultModel?: string }>;
    } catch (error) {
      return failure(handleError(error));
    }
  });

  ipcMain.handle('models:add', async (_, request: ModelsAddRequest) => {
    try {
      // TODO: モデルの追加処理を実装
      return failure(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'モデル追加機能は未実装です'
        )
      );
    } catch (error) {
      return failure(handleError(error));
    }
  });

  ipcMain.handle('models:remove', async (_, request: ModelsRemoveRequest) => {
    try {
      // TODO: モデルの削除処理を実装
      return failure(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'モデル削除機能は未実装です'
        )
      );
    } catch (error) {
      return failure(handleError(error));
    }
  });

  // ========================================================================
  // LLM操作
  // ========================================================================

  ipcMain.handle('llm:format', async (_, request: LLMFormatRequest) => {
    try {
      // TODO: LLM クライアントを呼び出して整形処理を実装
      return failure(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'LLM整形機能は未実装です'
        )
      );
    } catch (error) {
      return failure(handleError(error));
    }
  });

  // ========================================================================
  // クリップボード
  // ========================================================================

  ipcMain.handle(
    'clipboard:copy',
    async (_, request: ClipboardCopyRequest) => {
      try {
        clipboard.writeText(request.text);
        return success({ copied: true });
      } catch (error) {
        return failure(handleError(error));
      }
    }
  );

  // ========================================================================
  // 永続化
  // ========================================================================

  ipcMain.handle('store:get', async (_, request: StoreGetRequest) => {
    try {
      const value = getSetting(request.key as StoreKey);
      return success(value);
    } catch (error) {
      return failure(handleError(error));
    }
  });

  ipcMain.handle('store:set', async (_, request: StoreSetRequest) => {
    try {
      setSetting(request.key as StoreKey, request.value);
      return success({ saved: true });
    } catch (error) {
      return failure(handleError(error));
    }
  });

  ipcMain.handle('store:getHistory', async () => {
    try {
      const history = getHistory();
      return success({
        items: history,
        total: history.length,
      });
    } catch (error) {
      return failure(handleError(error));
    }
  });

  ipcMain.handle(
    'store:saveHistory',
    async (_, request: StoreSaveHistoryRequest) => {
      try {
        addHistoryItem(request.item);
        const history = getHistory();
        return success({
          saved: true,
          totalItems: history.length,
        });
      } catch (error) {
        return failure(handleError(error));
      }
    }
  );

  ipcMain.handle('store:clearHistory', async () => {
    try {
      clearHistory();
      return success({ cleared: true });
    } catch (error) {
      return failure(handleError(error));
    }
  });

  // ========================================================================
  // アプリケーション
  // ========================================================================

  ipcMain.handle('app:getVersion', async () => {
    try {
      return success({
        version: app.getVersion(),
        electronVersion: process.versions.electron,
      });
    } catch (error) {
      return failure(handleError(error));
    }
  });
}

