/**
 * Main Process エントリーポイント
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
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
 * ウィンドウを作成
 */
function createWindow(): void {
  // ウィンドウ状態の復元
  const bounds = getWindowBounds();

  mainWindow = new BrowserWindow({
    width: bounds?.width || 1200,
    height: bounds?.height || 800,
    x: bounds?.x,
    y: bounds?.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // preload が必要なため false
      // Content Security Policy は HTML で設定
    },
  });

  // 開発環境では開発者ツールを開く
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // 本番環境では index.html を読み込む
  // 開発環境では Vite の開発サーバーに接続
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // ウィンドウ状態の保存
  mainWindow.on('resized', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      saveWindowBounds(bounds);
    }
  });

  mainWindow.on('moved', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      saveWindowBounds(bounds);
    }
  });

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

