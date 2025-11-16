# IPC Contracts 実装タスク

## 概要

IPC リクエスト/レスポンスの完全な型契約定義。Main Process と Renderer Process 間の通信仕様。

## 型定義（TypeScript）

### 共通型

```typescript
// エラー型
type IPCError = {
  code: string;
  message: string;
  details?: unknown;
};

// 成功レスポンス
type IPCSuccess<T> = {
  success: true;
  data: T;
};

// 失敗レスポンス
type IPCFailure = {
  success: false;
  error: IPCError;
};

// 統一レスポンス型
type IPCResponse<T> = IPCSuccess<T> | IPCFailure;
```

### モデル管理

```typescript
// モデル情報
type ModelInfo = {
  id: string;
  name: string;
  provider: 'ollama' | 'lmstudio' | 'llamacpp';
  contextWindow?: number;
};

// models:list リクエスト
type ModelsListRequest = {
  refresh?: boolean; // キャッシュを無視して再取得
};

// models:list レスポンス
type ModelsListResponse = IPCResponse<{
  models: ModelInfo[];
  defaultModel?: string;
}>;

// models:add リクエスト
type ModelsAddRequest = {
  id: string;
  name: string;
  provider: 'ollama' | 'lmstudio' | 'llamacpp';
  baseUrl?: string; // カスタムベースURL
};

// models:add レスポンス
type ModelsAddResponse = IPCResponse<ModelInfo>;

// models:remove リクエスト
type ModelsRemoveRequest = {
  id: string;
};

// models:remove レスポンス
type ModelsRemoveResponse = IPCResponse<{ removed: boolean }>;
```

### LLM操作

```typescript
// 整形オプション
type FormatOptions = {
  removeFillers?: boolean; // フィラー除去
  inferParagraphs?: boolean; // 段落推定
  makeBulletPoints?: boolean; // 箇条書き化
  customInstruction?: string; // カスタム指示
};

// llm:format リクエスト
type LLMFormatRequest = {
  text: string;
  modelId: string;
  options?: FormatOptions;
};

// llm:format レスポンス（非ストリーミング）
type LLMFormatResponse = IPCResponse<{
  formattedText: string;
  modelUsed: string;
  timestamp: number;
}>;

// llm:format:stream リクエスト
type LLMFormatStreamRequest = LLMFormatRequest;

// llm:format:stream チャンク
type LLMFormatStreamChunk = {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  error?: IPCError;
};
```

### クリップボード

```typescript
// clipboard:copy リクエスト
type ClipboardCopyRequest = {
  text: string;
};

// clipboard:copy レスポンス
type ClipboardCopyResponse = IPCResponse<{ copied: boolean }>;
```

### 永続化

```typescript
// 設定キー
type StoreKey = 
  | 'selectedModel'
  | 'defaultModel'
  | 'maxHistoryItems'
  | 'formatOptions'
  | 'llmBaseUrl'
  | 'llmApiKey';

// store:get リクエスト
type StoreGetRequest = {
  key: StoreKey;
};

// store:get レスポンス
type StoreGetResponse<T = unknown> = IPCResponse<T>;

// store:set リクエスト
type StoreSetRequest = {
  key: StoreKey;
  value: unknown;
};

// store:set レスポンス
type StoreSetResponse = IPCResponse<{ saved: boolean }>;

// 履歴アイテム
type HistoryItem = {
  id: string;
  originalText: string;
  formattedText: string;
  modelUsed: string;
  timestamp: number;
  options?: FormatOptions;
};

// store:getHistory レスポンス
type StoreGetHistoryResponse = IPCResponse<{
  items: HistoryItem[];
  total: number;
}>;

// store:saveHistory リクエスト
type StoreSaveHistoryRequest = {
  item: HistoryItem;
};

// store:saveHistory レスポンス
type StoreSaveHistoryResponse = IPCResponse<{
  saved: boolean;
  totalItems: number;
}>;
```

### アプリケーション

```typescript
// app:getVersion レスポンス
type AppGetVersionResponse = IPCResponse<{
  version: string;
  electronVersion: string;
}>;
```

## エラーコード一覧

```typescript
enum ErrorCode {
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
```

## タスク: IPC型定義ファイルを作成する

### 説明
上記の型定義を TypeScript ファイルとして実装し、Main Process と Renderer Process で共有する。

### DoD
- [ ] すべてのIPCチャネルの型が定義されている
- [ ] エラーコードが網羅されている
- [ ] 型定義が Main/Renderer で共有できる構造になっている
- [ ] 型ガード関数が実装されている（Zod など）

### API/IPC契約
- 上記の型定義を参照

### リスク/対策
- **リスク**: 型定義の不整合による実行時エラー
- **対策**: Zod スキーマで実行時検証も実装

### 見積/依存
- **見積**: 3時間
- **依存**: architecture.md

### テスト観点
- 型定義のコンパイルエラー確認
- Zod スキーマによるバリデーションテスト

## タスク: IPC型ガードを実装する

### 説明
Zod スキーマを使用して、IPC リクエスト/レスポンスの実行時検証を実装する。

### DoD
- [ ] すべてのIPCリクエスト型にZodスキーマが定義されている
- [ ] すべてのIPCレスポンス型にZodスキーマが定義されている
- [ ] 型ガード関数が実装されている
- [ ] バリデーションエラーが適切にハンドリングされている

### API/IPC契約
```typescript
// 例: llm:format リクエストのZodスキーマ
const LLMFormatRequestSchema = z.object({
  text: z.string().min(1).max(20000),
  modelId: z.string().min(1),
  options: z.object({
    removeFillers: z.boolean().optional(),
    inferParagraphs: z.boolean().optional(),
    makeBulletPoints: z.boolean().optional(),
    customInstruction: z.string().max(500).optional(),
  }).optional(),
});
```

### リスク/対策
- **リスク**: 不正なリクエストによるクラッシュ
- **対策**: すべてのIPCハンドラでバリデーションを実施

### 見積/依存
- **見積**: 2時間
- **依存**: ipc_contracts.md（型定義）

### テスト観点
- 不正なリクエストの送信テスト
- バリデーションエラーのレスポンス確認

## 再試行ポリシー

### LLMリクエスト
- **最大試行回数**: 3回
- **リトライ間隔**: 指数バックオフ（1s, 2s, 4s）
- **リトライ対象**: `NETWORK_ERROR`, `NETWORK_TIMEOUT`, `LLM_RATE_LIMIT`
- **リトライ非対象**: `VALIDATION_ERROR`, `LLM_MODEL_NOT_FOUND`

### タイムアウト
- **LLMリクエスト**: 60秒
- **モデル一覧取得**: 10秒
- **ストレージ操作**: 5秒

