# Persistence 実装タスク

## 概要

electron-store を使用したローカルデータ永続化実装。設定値、整形履歴、モデル情報の保存・読み込み。

## ストアスキーマ

```typescript
interface StoreSchema {
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
```

## タスク: electron-store の初期化を実装する

### 説明
electron-store のインスタンスを作成し、デフォルト値を設定する。

### DoD
- [ ] electron-store のインスタンスが作成されている
- [ ] デフォルト値が設定されている
- [ ] ストアファイルのパスが適切に設定されている
- [ ] エラーハンドリングが実装されている

### API/IPC契約
```typescript
import Store from 'electron-store';

const store = new Store<StoreSchema>({
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
    schemaVersion: 1,
  },
  name: 'transcription-formatter',
});
```

### リスク/対策
- **リスク**: ストアファイルの破損
- **対策**: バリデーションとフォールバック

### 見積/依存
- **見積**: 2時間
- **依存**: なし

### テスト観点
- ストアの初期化動作確認
- デフォルト値の確認

## タスク: 設定値の保存・読み込みを実装する

### 説明
選択モデル、デフォルトモデル、LLM設定などの設定値を保存・読み込む。

### DoD
- [ ] 設定値の保存が実装されている
- [ ] 設定値の読み込みが実装されている
- [ ] 設定値のバリデーションが実装されている
- [ ] 設定値のデフォルト値が適切に設定されている

### API/IPC契約
```typescript
// 設定値の保存
function setSetting<K extends keyof StoreSchema>(
  key: K,
  value: StoreSchema[K]
): void {
  store.set(key, value);
}

// 設定値の読み込み
function getSetting<K extends keyof StoreSchema>(
  key: K
): StoreSchema[K] {
  return store.get(key);
}
```

### リスク/対策
- **リスク**: 設定値の型不整合
- **対策**: TypeScript の型チェックと実行時バリデーション

### 見積/依存
- **見積**: 2時間
- **依存**: persistence.md（electron-store初期化）

### テスト観点
- 設定値の保存/読み込みの動作確認
- 型の整合性確認

## タスク: 整形履歴の保存・読み込みを実装する

### 説明
整形履歴を保存・読み込み、最大件数のローテーションを実装する。

### DoD
- [ ] 整形履歴の保存が実装されている
- [ ] 整形履歴の読み込みが実装されている
- [ ] 最大履歴件数（20件）のローテーションが実装されている
- [ ] 履歴の削除が実装されている
- [ ] 履歴のクリアが実装されている

### API/IPC契約
```typescript
// 履歴の追加
function addHistoryItem(item: HistoryItem): void {
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

// 履歴の読み込み
function getHistory(): HistoryItem[] {
  return store.get('history', []);
}

// 履歴の削除
function removeHistoryItem(id: string): void {
  const history = store.get('history', []);
  const newHistory = history.filter(item => item.id !== id);
  store.set('history', newHistory);
}

// 履歴のクリア
function clearHistory(): void {
  store.set('history', []);
}
```

### リスク/対策
- **リスク**: 履歴の肥大化によるパフォーマンス低下
- **対策**: 最大件数のローテーションとインデックス管理

### 見積/依存
- **見積**: 3時間
- **依存**: persistence.md（electron-store初期化）

### テスト観点
- 履歴の保存/読み込みの動作確認
- ローテーション動作の確認

## タスク: 手動追加モデルの保存・読み込みを実装する

### 説明
ユーザーが手動で追加したモデル情報を保存・読み込む。

### DoD
- [ ] 手動追加モデルの保存が実装されている
- [ ] 手動追加モデルの読み込みが実装されている
- [ ] 手動追加モデルの削除が実装されている
- [ ] モデル情報のバリデーションが実装されている

### API/IPC契約
```typescript
// 手動追加モデルの追加
function addCustomModel(model: ModelInfo): void {
  const customModels = store.get('customModels', []);
  const newModels = [...customModels, model];
  store.set('customModels', newModels);
}

// 手動追加モデルの読み込み
function getCustomModels(): ModelInfo[] {
  return store.get('customModels', []);
}

// 手動追加モデルの削除
function removeCustomModel(id: string): void {
  const customModels = store.get('customModels', []);
  const newModels = customModels.filter(model => model.id !== id);
  store.set('customModels', newModels);
}
```

### リスク/対策
- **リスク**: モデル情報の重複
- **対策**: バリデーションと重複チェック

### 見積/依存
- **見積**: 2時間
- **依存**: persistence.md（electron-store初期化）

### テスト観点
- 手動追加モデルの保存/読み込みの動作確認
- 重複チェックの動作確認

## タスク: ウィンドウ状態の保存・復元を実装する

### 説明
ウィンドウの位置・サイズを保存・復元する。

### DoD
- [ ] ウィンドウ状態の保存が実装されている
- [ ] ウィンドウ状態の復元が実装されている
- [ ] ウィンドウ状態のバリデーションが実装されている
- [ ] デフォルト値が適切に設定されている

### API/IPC契約
```typescript
// ウィンドウ状態の保存
function saveWindowBounds(bounds: { x: number; y: number; width: number; height: number }): void {
  store.set('windowBounds', bounds);
}

// ウィンドウ状態の読み込み
function getWindowBounds(): { x: number; y: number; width: number; height: number } | undefined {
  return store.get('windowBounds');
}
```

### リスク/対策
- **リスク**: 無効なウィンドウ状態の復元
- **対策**: バリデーションとデフォルト値

### 見積/依存
- **見積**: 2時間
- **依存**: persistence.md（electron-store初期化）, main_process.md

### テスト観点
- ウィンドウ状態の保存/復元の動作確認
- バリデーションの動作確認

## タスク: スキーママイグレーションを実装する

### 説明
ストアスキーマのバージョン管理とマイグレーション処理を実装する。

### DoD
- [ ] スキーマバージョンの管理が実装されている
- [ ] マイグレーション処理が実装されている
- [ ] マイグレーションのロールバックが実装されている（オプション）
- [ ] マイグレーションのテストが実装されている

### API/IPC契約
```typescript
// スキーマバージョンの確認とマイグレーション
function migrateSchema(): void {
  const currentVersion = store.get('schemaVersion', 1);
  const targetVersion = 1; // 現在のスキーマバージョン
  
  if (currentVersion < targetVersion) {
    // マイグレーション処理
    // 例: バージョン1へのマイグレーション
    if (currentVersion === 0) {
      // バージョン0から1へのマイグレーション
      store.set('schemaVersion', 1);
    }
  }
}
```

### リスク/対策
- **リスク**: マイグレーション失敗によるデータ損失
- **対策**: バックアップとロールバック機能

### 見積/依存
- **見積**: 3時間
- **依存**: persistence.md（electron-store初期化）

### テスト観点
- マイグレーションの動作確認
- データの整合性確認

## タスク: ストアのバックアップ・復元を実装する（オプション）

### 説明
ストアデータのバックアップ・復元機能を実装する。

### DoD
- [ ] ストアデータのバックアップが実装されている
- [ ] ストアデータの復元が実装されている
- [ ] バックアップファイルのバリデーションが実装されている
- [ ] バックアップファイルのエクスポート/インポートが実装されている

### API/IPC契約
```typescript
// ストアデータのバックアップ
function backupStore(): string {
  const data = store.store;
  return JSON.stringify(data, null, 2);
}

// ストアデータの復元
function restoreStore(backupData: string): void {
  const data = JSON.parse(backupData);
  store.store = data;
}
```

### リスク/対策
- **リスク**: バックアップファイルの破損
- **対策**: バリデーションとエラーハンドリング

### 見積/依存
- **見積**: 2時間
- **依存**: persistence.md（electron-store初期化）

### テスト観点
- バックアップ/復元の動作確認
- バリデーションの動作確認

