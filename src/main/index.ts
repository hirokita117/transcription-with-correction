/**
 * Main Process エントリーポイント
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as crypto from 'crypto';
import { setupGlobalErrorHandlers } from './utils/error-logger';
import { migrateSchema } from './store/store';
import { setupIPCHandlers } from './ipc/handlers';
import { getWindowBounds, saveWindowBounds } from './store/store';

// グローバルエラーハンドラーの設定
setupGlobalErrorHandlers();

// スキーママイグレーション
migrateSchema();

let mainWindow: BrowserWindow | null = null;

/**
 * CSP nonce を生成
 */
function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * デバウンス関数
 * 指定された時間内に複数回呼び出された場合、最後の呼び出しのみを実行
 */
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * ウィンドウを作成
 */
function createWindow(): void {
  // ウィンドウ状態の復元
  const bounds = getWindowBounds();

  // CSP nonce を生成（本番環境用）
  const nonce = process.env.NODE_ENV === 'production' ? generateNonce() : '';

  mainWindow = new BrowserWindow({
    width: bounds?.width || 1200,
    height: bounds?.height || 800,
    x: bounds?.x,
    y: bounds?.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // CSP ヘッダーを設定
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      let csp: string;
      if (process.env.NODE_ENV === 'production' && nonce) {
        // 本番環境: nonce を使用した CSP（unsafe-inline を削除）
        csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}';`;
      } else {
        // 開発環境: HMR のために unsafe-inline を許可
        csp = `default-src 'self' http://localhost:*; script-src 'self' 'unsafe-inline' http://localhost:*; style-src 'self' 'unsafe-inline' http://localhost:*;`;
      }

      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [csp],
        },
      });
    }
  );

  // 開発環境では開発者ツールを開く
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // 本番環境では index.html を読み込む
  // 開発環境では Vite の開発サーバーに接続
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // 本番環境: nonce を HTML に注入するために、HTML を読み込んでから nonce を設定
    const htmlPath = path.join(__dirname, '../renderer/index.html');
    mainWindow.loadFile(htmlPath).then(() => {
      // HTML に nonce を設定するために、webContents でスクリプトを実行
      if (nonce && mainWindow) {
        mainWindow.webContents.executeJavaScript(`
          const scripts = document.querySelectorAll('script');
          scripts.forEach(script => {
            script.setAttribute('nonce', '${nonce}');
          });
          const styles = document.querySelectorAll('style');
          styles.forEach(style => {
            style.setAttribute('nonce', '${nonce}');
          });
        `);
      }
    });
  }

  // ウィンドウ状態の保存（デバウンス付き）
  // 300ms 以内に複数回イベントが発火した場合、最後の1回のみを実行
  const debouncedSaveWindowBounds = debounce(() => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      saveWindowBounds(bounds);
    }
  }, 300);

  mainWindow.on('resized', debouncedSaveWindowBounds);
  mainWindow.on('moved', debouncedSaveWindowBounds);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * アプリケーションの準備完了
 */
app.whenReady().then(() => {
  createWindow();

  // IPCハンドラーの設定
  setupIPCHandlers();

  // macOS では、アプリがアクティブになったときにウィンドウを再作成
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * すべてのウィンドウが閉じられたとき
 */
app.on('window-all-closed', () => {
  // macOS では、アプリを終了せずに非表示にする
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * アプリケーション終了前
 */
app.on('before-quit', () => {
  // クリーンアップ処理があればここに記述
});

