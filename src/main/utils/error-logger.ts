/**
 * エラーログ記録
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { AppError } from '../../shared/errors/app-error';

/**
 * エラーログを記録
 */
export function logError(error: AppError): void {
  const logDir = path.join(app.getPath('userData'), 'logs');

  // ログディレクトリの作成
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 日付ベースのログファイル名
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(logDir, `error-${today}.log`);

  // ログエントリの作成
  const logEntry = {
    timestamp: new Date().toISOString(),
    code: error.code,
    message: error.message,
    details: error.details,
    context: error.context,
    stack: error.stack,
  };

  // ログの書き込み
  try {
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (writeError) {
    console.error('Failed to write error log:', writeError);
  }

  // コンソール出力
  console.error('Error:', logEntry);
}

/**
 * グローバルエラーハンドラーを設定
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    const appError = new AppError(
      'UNCAUGHT_EXCEPTION',
      error.message,
      error,
      { stack: error.stack }
    );
    logError(appError);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const appError = new AppError(
      'UNHANDLED_REJECTION',
      reason instanceof Error ? reason.message : String(reason),
      reason
    );
    logError(appError);
  });
}

