/**
 * ストアスキーマ定義
 */

import { FormatOptions, HistoryItem, ModelInfo } from './ipc';

/**
 * ストアスキーマ
 */
export interface StoreSchema {
  // アプリ設定
  selectedModel: string | null;
  defaultModel: string;
  maxHistoryItems: number; // デフォルト: 20
  formatOptions: FormatOptions;

  // LLM設定
  llmBaseUrl: string;
  llmApiKey?: string;
  llmProvider: 'ollama' | 'lmstudio' | 'llamacpp' | 'auto';

  // 整形履歴
  history: HistoryItem[];

  // 手動追加モデル
  customModels: ModelInfo[];

  // UI設定
  windowBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // プロンプトテンプレート（オプション）
  customPromptTemplate?: string;

  // スキーマバージョン
  schemaVersion: number; // デフォルト: 1
}

