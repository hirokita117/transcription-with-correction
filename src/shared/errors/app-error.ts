/**
 * アプリケーションエラーの統一インターフェース
 */

import { ErrorCode } from '../types/ipc';

/**
 * アプリケーションエラークラス
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(
    code: string,
    message: string,
    details?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.context = context;
    this.timestamp = Date.now();
  }

  /**
   * IPCError形式に変換
   */
  toIPCError(): { code: string; message: string; details?: unknown } {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * エラーハンドラー
 * 未知のエラーをAppErrorに変換
 */
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(ErrorCode.UNKNOWN_ERROR, error.message, error, {
      stack: error.stack,
    });
  }

  return new AppError(
    ErrorCode.UNKNOWN_ERROR,
    'Unknown error occurred',
    error
  );
}

/**
 * リトライオプション
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

/**
 * ネットワークエラーをリトライ付きで実行する高階関数
 * エラーハンドリングとリトライロジックをカプセル化
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = handleError(error);

      // ネットワークエラーでない場合、またはリトライ上限に達した場合はエラーを投げる
      if (
        appError.code !== ErrorCode.NETWORK_ERROR &&
        appError.code !== ErrorCode.NETWORK_TIMEOUT
      ) {
        throw appError;
      }

      if (attempt >= maxRetries) {
        // リトライ上限に達した場合のエラー処理
        throw new AppError(
          ErrorCode.NETWORK_ERROR,
          'ネットワークエラーが発生しました。接続を確認してください。',
          appError.details,
          { retryCount: attempt, maxRetries }
        );
      }

      // 指数バックオフでリトライ前に待機
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // この行には到達しないはずだが、TypeScript の型チェックのために必要
  throw handleError(lastError);
}

/**
 * ネットワークエラーのハンドリング（後方互換性のため残す）
 * @deprecated 代わりに `retry` 関数を使用してください
 */
export async function handleNetworkError(
  error: unknown,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<AppError> {
  const appError = handleError(error);

  if (
    appError.code === ErrorCode.NETWORK_ERROR ||
    appError.code === ErrorCode.NETWORK_TIMEOUT
  ) {
    if (retryCount < maxRetries) {
      // 指数バックオフでリトライ
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      // リトライ処理は呼び出し元で実装
    } else {
      // リトライ上限に達した場合のエラー処理
      return new AppError(
        ErrorCode.NETWORK_ERROR,
        'ネットワークエラーが発生しました。接続を確認してください。',
        appError.details,
        { retryCount, maxRetries }
      );
    }
  }

  return appError;
}

/**
 * LLMエラーのハンドリング
 */
export function handleLLMError(error: unknown): AppError {
  const appError = handleError(error);

  switch (appError.code) {
    case ErrorCode.LLM_MODEL_NOT_FOUND:
      return new AppError(
        ErrorCode.LLM_MODEL_NOT_FOUND,
        '選択されたモデルが見つかりません。モデル一覧を確認してください。',
        appError.details
      );

    case ErrorCode.LLM_RATE_LIMIT:
      return new AppError(
        ErrorCode.LLM_RATE_LIMIT,
        'レート制限に達しました。しばらく待ってから再試行してください。',
        appError.details
      );

    case ErrorCode.LLM_INVALID_RESPONSE:
      return new AppError(
        ErrorCode.LLM_INVALID_RESPONSE,
        'LLMからの無効なレスポンスが返されました。',
        appError.details
      );

    default:
      return appError;
  }
}

/**
 * バリデーションエラーのハンドリング
 */
export function handleValidationError(error: unknown): AppError {
  const appError = handleError(error);

  switch (appError.code) {
    case ErrorCode.TEXT_TOO_LONG:
      return new AppError(
        ErrorCode.TEXT_TOO_LONG,
        `テキストが長すぎます（最大${(appError.details as { maxLength?: number })?.maxLength || 20000}文字）`,
        appError.details
      );

    case ErrorCode.VALIDATION_ERROR:
      return new AppError(
        ErrorCode.VALIDATION_ERROR,
        appError.message || 'バリデーションエラーが発生しました。',
        appError.details
      );

    case ErrorCode.INVALID_MODEL_ID:
      return new AppError(
        ErrorCode.INVALID_MODEL_ID,
        '無効なモデルIDです。',
        appError.details
      );

    default:
      return appError;
  }
}

