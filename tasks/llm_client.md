# LLM Client 実装タスク

## 概要

ローカル LLM サービス（Ollama / LM Studio / llama.cpp）への HTTP クライアント実装。モデル一覧取得、テキスト整形リクエスト、ストリーミング対応。

## プロバイダー別 API 仕様

### Ollama
- **ベースURL**: `http://localhost:11434`
- **モデル一覧**: `GET /api/tags`
- **チャット**: `POST /api/chat`
- **ストリーミング**: `stream: true` パラメータ

### LM Studio
- **ベースURL**: `http://localhost:1234`
- **モデル一覧**: `GET /v1/models`
- **チャット**: `POST /v1/chat/completions` (OpenAI互換)
- **ストリーミング**: `stream: true` パラメータ

### llama.cpp (llama-server)
- **ベースURL**: `http://localhost:8080`
- **モデル一覧**: `GET /v1/models`
- **チャット**: `POST /v1/chat/completions` (OpenAI互換)
- **ストリーミング**: `stream: true` パラメータ

## タスク: HTTP クライアントのベース実装を作成する

### 説明
ベースURL、APIキー、タイムアウト設定を持つ HTTP クライアントのベースクラスを実装する。

### DoD
- [ ] ベースURLの設定が実装されている
- [ ] APIキーの設定が実装されている（オプション）
- [ ] タイムアウト設定が実装されている（60秒）
- [ ] リトライ処理が実装されている（最大3回、指数バックオフ）
- [ ] エラーハンドリングが実装されている

### API/IPC契約
```typescript
interface LLMClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  maxRetries?: number;
}

class LLMClient {
  constructor(config: LLMClientConfig);
  protected request<T>(endpoint: string, options: RequestInit): Promise<T>;
}
```

### リスク/対策
- **リスク**: ネットワークエラーやタイムアウト
- **対策**: リトライ処理とタイムアウト設定

### 見積/依存
- **見積**: 3時間
- **依存**: なし

### テスト観点
- ネットワークエラー時のリトライ動作確認
- タイムアウト動作の確認

## タスク: Ollama プロバイダーを実装する

### 説明
Ollama 用の HTTP クライアント実装。

### DoD
- [ ] モデル一覧取得が実装されている
- [ ] チャットリクエストが実装されている
- [ ] ストリーミング対応が実装されている（オプション）
- [ ] エラーハンドリングが実装されている

### API/IPC契約
```typescript
// Ollama モデル一覧レスポンス
interface OllamaModelsResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
  }>;
}

// Ollama チャットリクエスト
interface OllamaChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean;
}

// Ollama チャットレスポンス
interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
}
```

### リスク/対策
- **リスク**: Ollama API の仕様変更
- **対策**: バージョン管理とフォールバック

### 見積/依存
- **見積**: 3時間
- **依存**: llm_client.md（ベース実装）

### テスト観点
- モデル一覧取得の動作確認
- チャットリクエストの動作確認

## タスク: LM Studio プロバイダーを実装する

### 説明
LM Studio 用の HTTP クライアント実装（OpenAI互換API）。

### DoD
- [ ] モデル一覧取得が実装されている
- [ ] チャットリクエストが実装されている
- [ ] ストリーミング対応が実装されている（オプション）
- [ ] エラーハンドリングが実装されている

### API/IPC契約
```typescript
// LM Studio モデル一覧レスポンス（OpenAI互換）
interface LMStudioModelsResponse {
  data: Array<{
    id: string;
    object: 'model';
    created: number;
    owned_by: string;
  }>;
}

// LM Studio チャットリクエスト（OpenAI互換）
interface LMStudioChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

// LM Studio チャットレスポンス（OpenAI互換）
interface LMStudioChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
}
```

### リスク/対策
- **リスク**: OpenAI互換APIの仕様差異
- **対策**: エラーハンドリングとフォールバック

### 見積/依存
- **見積**: 3時間
- **依存**: llm_client.md（ベース実装）

### テスト観点
- モデル一覧取得の動作確認
- チャットリクエストの動作確認

## タスク: llama.cpp プロバイダーを実装する

### 説明
llama.cpp (llama-server) 用の HTTP クライアント実装（OpenAI互換API）。

### DoD
- [ ] モデル一覧取得が実装されている
- [ ] チャットリクエストが実装されている
- [ ] ストリーミング対応が実装されている（オプション）
- [ ] エラーハンドリングが実装されている

### API/IPC契約
- LM Studio と同様の OpenAI互換APIを使用

### リスク/対策
- **リスク**: llama-server の仕様変更
- **対策**: バージョン管理とフォールバック

### 見積/依存
- **見積**: 3時間
- **依存**: llm_client.md（ベース実装）

### テスト観点
- モデル一覧取得の動作確認
- チャットリクエストの動作確認

## タスク: プロバイダー適合層を実装する

### 説明
各プロバイダーの差異を吸収し、統一インターフェースを提供する適合層を実装する。

### DoD
- [ ] プロバイダー自動検出が実装されている
- [ ] 統一インターフェースが実装されている
- [ ] プロバイダー切り替えが実装されている
- [ ] エラーハンドリングが実装されている

### API/IPC契約
```typescript
interface LLMProvider {
  detect(baseUrl: string): Promise<boolean>;
  listModels(): Promise<ModelInfo[]>;
  formatText(request: FormatRequest): Promise<string>;
  formatTextStream(request: FormatRequest): AsyncGenerator<string>;
}

class LLMProviderAdapter {
  constructor(config: LLMClientConfig);
  detectProvider(): Promise<'ollama' | 'lmstudio' | 'llamacpp' | null>;
  getProvider(): LLMProvider;
}
```

### リスク/対策
- **リスク**: プロバイダー検出の失敗
- **対策**: フォールバックと手動選択

### 見積/依存
- **見積**: 4時間
- **依存**: llm_client.md（各プロバイダー実装）

### テスト観点
- プロバイダー自動検出の動作確認
- プロバイダー切り替えの動作確認

## タスク: ストリーミング対応を実装する（オプション）

### 説明
LLM のストリーミングレスポンスを処理する機能を実装する。

### DoD
- [ ] ストリーミングリクエストが実装されている
- [ ] ストリーミングチャンクの処理が実装されている
- [ ] ストリーミングの中断処理が実装されている
- [ ] エラーハンドリングが実装されている

### API/IPC契約
```typescript
interface StreamChunk {
  content: string;
  done: boolean;
}

async function* formatTextStream(
  request: FormatRequest
): AsyncGenerator<StreamChunk> {
  // ストリーミング処理
}
```

### リスク/対策
- **リスク**: ストリーミングのメモリリーク
- **対策**: 適切なクリーンアップ処理

### 見積/依存
- **見積**: 3時間
- **依存**: llm_client.md（各プロバイダー実装）

### テスト観点
- ストリーミングの動作確認
- 中断処理の動作確認

## タスク: モデル一覧のキャッシュを実装する

### 説明
モデル一覧取得結果をキャッシュし、パフォーマンスを向上させる。

### DoD
- [ ] モデル一覧のキャッシュが実装されている
- [ ] キャッシュの有効期限が設定されている（5分）
- [ ] キャッシュの無効化機能が実装されている
- [ ] エラーハンドリングが実装されている

### API/IPC契約
- キャッシュキー: `models:${provider}:${baseUrl}`
- キャッシュ有効期限: 5分

### リスク/対策
- **リスク**: キャッシュの不整合
- **対策**: キャッシュの無効化機能

### 見積/依存
- **見積**: 2時間
- **依存**: llm_client.md（プロバイダー適合層）

### テスト観点
- キャッシュの動作確認
- キャッシュ無効化の動作確認

