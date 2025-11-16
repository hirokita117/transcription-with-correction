/**
 * IPC ハンドラーの設定
 */

import { ipcMain } from 'electron';
import { clipboard } from 'electron';
import { app } from 'electron';
import {
  IPCResponse,
  IPCSuccess,
  IPCFailure,
  ErrorCode,
  ModelInfo,
} from '../../shared/types/ipc';
import { AppError, handleError } from '../../shared/errors/app-error';
import {
  setSetting,
  getSetting,
  getHistory,
  addHistoryItem,
  clearHistory,
} from '../store/store';
import {
  ModelsListRequestSchema,
  ModelsAddRequestSchema,
  ModelsRemoveRequestSchema,
  LLMFormatRequestSchema,
  ClipboardCopyRequestSchema,
  StoreGetRequestSchema,
  StoreSetRequestSchema,
  StoreSaveHistoryRequestSchema,
} from '../../shared/types/ipc-schemas';

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

  ipcMain.handle('models:list', async (_, request?: unknown) => {
    try {
      // リクエストのバリデーション（オプショナル）
      if (request !== undefined) {
        ModelsListRequestSchema.parse(request);
      }

      // TODO: LLM クライアントからモデル一覧を取得
      // 現在はストアからカスタムモデルのみを返す
      const customModels = getSetting('customModels');
      const defaultModel = getSetting('defaultModel');

      return success({
        models: customModels,
        defaultModel,
      }) as IPCResponse<{ models: ModelInfo[]; defaultModel?: string }>;
    } catch (error) {
      return failure(handleError(error));
    }
  });

  ipcMain.handle('models:add', async (_, request: unknown) => {
    try {
      // リクエストのバリデーション
      const validatedRequest = ModelsAddRequestSchema.parse(request);

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

  ipcMain.handle('models:remove', async (_, request: unknown) => {
    try {
      // リクエストのバリデーション
      const validatedRequest = ModelsRemoveRequestSchema.parse(request);

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

  ipcMain.handle('llm:format', async (_, request: unknown) => {
    try {
      // リクエストのバリデーション
      const validatedRequest = LLMFormatRequestSchema.parse(request);

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

  ipcMain.handle('clipboard:copy', async (_, request: unknown) => {
    try {
      // リクエストのバリデーション
      const validatedRequest = ClipboardCopyRequestSchema.parse(request);

      clipboard.writeText(validatedRequest.text);
      return success({ copied: true });
    } catch (error) {
      return failure(handleError(error));
    }
  });

  // ========================================================================
  // 永続化
  // ========================================================================

  ipcMain.handle('store:get', async (_, request: unknown) => {
    try {
      // リクエストのバリデーション
      const validatedRequest = StoreGetRequestSchema.parse(request);

      const value = getSetting(validatedRequest.key);
      return success(value);
    } catch (error) {
      return failure(handleError(error));
    }
  });

  ipcMain.handle('store:set', async (_, request: unknown) => {
    try {
      // リクエストのバリデーション
      const validatedRequest = StoreSetRequestSchema.parse(request);

      setSetting(validatedRequest.key, validatedRequest.value);
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

  ipcMain.handle('store:saveHistory', async (_, request: unknown) => {
    try {
      // リクエストのバリデーション
      const validatedRequest = StoreSaveHistoryRequestSchema.parse(request);

      addHistoryItem(validatedRequest.item);
      const history = getHistory();
      return success({
        saved: true,
        totalItems: history.length,
      });
    } catch (error) {
      return failure(handleError(error));
    }
  });

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

