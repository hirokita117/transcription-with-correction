/**
 * electron-store の初期化と管理
 */

import Store from 'electron-store';
import { StoreSchema } from '../../shared/types/store';
import { HistoryItem } from '../../shared/types/ipc';

/**
 * electron-store インスタンス
 */
export const store = new Store<StoreSchema>({
  defaults: {
    selectedModel: null,
    defaultModel: 'llama3:8b-instruct',
    maxHistoryItems: 20,
    formatOptions: {},
    llmBaseUrl: process.env.LLM_BASE_URL || 'http://localhost:11434',
    llmApiKey: process.env.LLM_API_KEY,
    llmProvider: 'auto',
    history: [],
    customModels: [],
    schemaVersion: 0, // 初回起動時は0、マイグレーション後に1に更新
  },
  name: 'transcription-formatter',
});

/**
 * 設定値の保存
 */
export function setSetting<K extends keyof StoreSchema>(
  key: K,
  value: StoreSchema[K]
): void {
  store.set(key, value);
}

/**
 * 設定値の読み込み
 */
export function getSetting<K extends keyof StoreSchema>(
  key: K
): StoreSchema[K] {
  return store.get(key);
}

/**
 * 履歴の追加
 */
export function addHistoryItem(item: HistoryItem): void {
  const history = store.get('history', []);
  const maxItems = store.get('maxHistoryItems', 20);

  // 新しいアイテムを先頭に追加
  const newHistory = [item, ...history];

  // 最大件数を超えた場合は古いものを削除
  if (newHistory.length > maxItems) {
    newHistory.splice(maxItems);
  }

  store.set('history', newHistory);
}

/**
 * 履歴の読み込み
 */
export function getHistory(): HistoryItem[] {
  return store.get('history', []);
}

/**
 * 履歴の削除
 */
export function removeHistoryItem(id: string): void {
  const history = store.get('history', []);
  const newHistory = history.filter((item) => item.id !== id);
  store.set('history', newHistory);
}

/**
 * 履歴のクリア
 */
export function clearHistory(): void {
  store.set('history', []);
}

/**
 * ウィンドウ状態の保存
 */
export function saveWindowBounds(bounds: {
  x: number;
  y: number;
  width: number;
  height: number;
}): void {
  store.set('windowBounds', bounds);
}

/**
 * ウィンドウ状態の読み込み
 */
export function getWindowBounds():
  | { x: number; y: number; width: number; height: number }
  | undefined {
  return store.get('windowBounds');
}

/**
 * スキーママイグレーション
 */
export function migrateSchema(): void {
  const currentVersion = store.get('schemaVersion', 0); // デフォルト値を0に変更
  const targetVersion = 1; // 現在のスキーマバージョン

  if (currentVersion < targetVersion) {
    // マイグレーション処理
    // 例: バージョン1へのマイグレーション
    if (currentVersion === 0) {
      // バージョン0から1へのマイグレーション
      // 将来的にスキーマ変更が必要になった場合、ここにマイグレーション処理を追加
      store.set('schemaVersion', 1);
    }
    // 将来的にバージョン2へのマイグレーションが必要になった場合:
    // else if (currentVersion === 1) {
    //   // バージョン1から2へのマイグレーション処理
    //   store.set('schemaVersion', 2);
    // }
  }
}

