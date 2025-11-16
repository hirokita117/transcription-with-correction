/**
 * IPC通信の型定義
 * Main Process と Renderer Process 間の通信仕様
 */

import { z } from 'zod';
import { StoreKeySchema } from './ipc-schemas';

// ============================================================================
// 共通型
// ============================================================================

/**
 * エラー型
 */
export type IPCError = {
  code: string;
  message: string;
  details?: unknown;
};

/**
 * 成功レスポンス
 */
export type IPCSuccess<T> = {
  success: true;
  data: T;
};

/**
 * 失敗レスポンス
 */
export type IPCFailure = {
  success: false;
  error: IPCError;
};

/**
 * 統一レスポンス型
 */
export type IPCResponse<T> = IPCSuccess<T> | IPCFailure;

// ============================================================================
// モデル管理
// ============================================================================

/**
 * モデル情報
 */
export type ModelInfo = {
  id: string;
  name: string;
  provider: 'ollama' | 'lmstudio' | 'llamacpp';
  contextWindow?: number;
};

/**
 * models:list リクエスト
 */
export type ModelsListRequest = {
  refresh?: boolean; // キャッシュを無視して再取得
};

/**
 * models:list レスポンス
 */
export type ModelsListResponse = IPCResponse<{
  models: ModelInfo[];
  defaultModel?: string;
}>;

/**
 * models:add リクエスト
 */
export type ModelsAddRequest = {
  id: string;
  name: string;
  provider: 'ollama' | 'lmstudio' | 'llamacpp';
  baseUrl?: string; // カスタムベースURL
};

/**
 * models:add レスポンス
 */
export type ModelsAddResponse = IPCResponse<ModelInfo>;

/**
 * models:remove リクエスト
 */
export type ModelsRemoveRequest = {
  id: string;
};

/**
 * models:remove レスポンス
 */
export type ModelsRemoveResponse = IPCResponse<{ removed: boolean }>;

// ============================================================================
// LLM操作
// ============================================================================

/**
 * 整形オプション
 */
export type FormatOptions = {
  removeFillers?: boolean; // フィラー除去
  inferParagraphs?: boolean; // 段落推定
  makeBulletPoints?: boolean; // 箇条書き化
  customInstruction?: string; // カスタム指示
};

/**
 * llm:format リクエスト
 */
export type LLMFormatRequest = {
  text: string;
  modelId: string;
  options?: FormatOptions;
};

/**
 * llm:format レスポンス（非ストリーミング）
 */
export type LLMFormatResponse = IPCResponse<{
  formattedText: string;
  modelUsed: string;
  timestamp: number;
}>;

/**
 * llm:format:stream リクエスト
 */
export type LLMFormatStreamRequest = LLMFormatRequest;

/**
 * llm:format:stream チャンク
 */
export type LLMFormatStreamChunk = {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  error?: IPCError;
};

// ============================================================================
// クリップボード
// ============================================================================

/**
 * clipboard:copy リクエスト
 */
export type ClipboardCopyRequest = {
  text: string;
};

/**
 * clipboard:copy レスポンス
 */
export type ClipboardCopyResponse = IPCResponse<{ copied: boolean }>;

// ============================================================================
// 永続化
// ============================================================================

/**
 * 設定キー（Zod スキーマから自動生成）
 */
export type StoreKey = z.infer<typeof StoreKeySchema>;

/**
 * store:get リクエスト
 */
export type StoreGetRequest = {
  key: StoreKey;
};

/**
 * store:get レスポンス
 */
export type StoreGetResponse<T = unknown> = IPCResponse<T>;

/**
 * store:set リクエスト
 */
export type StoreSetRequest = {
  key: StoreKey;
  value: unknown;
};

/**
 * store:set レスポンス
 */
export type StoreSetResponse = IPCResponse<{ saved: boolean }>;

/**
 * 履歴アイテム
 */
export type HistoryItem = {
  id: string;
  originalText: string;
  formattedText: string;
  modelUsed: string;
  timestamp: number;
  options?: FormatOptions;
};

/**
 * store:getHistory レスポンス
 */
export type StoreGetHistoryResponse = IPCResponse<{
  items: HistoryItem[];
  total: number;
}>;

/**
 * store:saveHistory リクエスト
 */
export type StoreSaveHistoryRequest = {
  item: HistoryItem;
};

/**
 * store:saveHistory レスポンス
 */
export type StoreSaveHistoryResponse = IPCResponse<{
  saved: boolean;
  totalItems: number;
}>;

/**
 * store:clearHistory レスポンス
 */
export type StoreClearHistoryResponse = IPCResponse<{ cleared: boolean }>;

// ============================================================================
// アプリケーション
// ============================================================================

/**
 * app:getVersion レスポンス
 */
export type AppGetVersionResponse = IPCResponse<{
  version: string;
  electronVersion: string;
}>;

// ============================================================================
// エラーコード
// ============================================================================

/**
 * エラーコード一覧
 */
export enum ErrorCode {
  // ネットワークエラー
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',

  // LLMエラー
  LLM_MODEL_NOT_FOUND = 'LLM_MODEL_NOT_FOUND',
  LLM_RATE_LIMIT = 'LLM_RATE_LIMIT',
  LLM_INVALID_RESPONSE = 'LLM_INVALID_RESPONSE',

  // バリデーションエラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_MODEL_ID = 'INVALID_MODEL_ID',
  TEXT_TOO_LONG = 'TEXT_TOO_LONG',

  // ストレージエラー
  STORAGE_ERROR = 'STORAGE_ERROR',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',

  // その他
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

