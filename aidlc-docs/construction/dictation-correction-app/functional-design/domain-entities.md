# Domain Entities

## Entity Diagram

```
+------------------+       +----------------------+
| Settings         |       | CorrectionRequest    |
|------------------|       |----------------------|
| activeProvider   |       | text                 |
| lmStudio         |------>| promptTemplate       |
| gemini           |       +----------------------+
| promptTemplate   |                |
+------------------+                v
        |              +----------------------+
        v              | CorrectionResponse   |
+------------------+   |----------------------|
| ProviderConfig   |   | success              |
|------------------|   | correctedText?       |
| LMStudioConfig   |   | error?               |
| GeminiConfig     |   +----------------------+
+------------------+
```

---

## E-1: Settings

アプリケーション全体の設定を保持するエンティティ。

```typescript
interface Settings {
  activeProvider: ProviderType;
  lmStudio: LMStudioConfig;
  gemini: GeminiConfig;
  promptTemplate: string;
}

type ProviderType = 'lm-studio' | 'gemini';
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| activeProvider | ProviderType | Yes | 'lm-studio' | 現在使用中の LLM プロバイダー |
| lmStudio | LMStudioConfig | Yes | (see below) | LM Studio 接続設定 |
| gemini | GeminiConfig | Yes | (see below) | Gemini API 接続設定 |
| promptTemplate | string | Yes | (default template) | 校正プロンプトテンプレート |

---

## E-2: LMStudioConfig

```typescript
interface LMStudioConfig {
  endpointUrl: string;
  modelName: string;
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| endpointUrl | string | Yes | 'http://localhost:1234/v1' | LM Studio API エンドポイント URL |
| modelName | string | Yes | '' | 使用するモデル名 |

---

## E-3: GeminiConfig

```typescript
interface GeminiConfig {
  apiKey: string;
  modelName: string;
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| apiKey | string | Yes | '' | Gemini API キー |
| modelName | string | Yes | 'gemini-2.0-flash' | 使用する Gemini モデル名 |

---

## E-4: CorrectionRequest

Renderer から Main Process に送信される校正リクエスト。

```typescript
interface CorrectionRequest {
  text: string;
  promptTemplate: string;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| text | string | Yes | 校正対象のテキスト |
| promptTemplate | string | Yes | プロンプトテンプレート（{text} プレースホルダー含む） |

---

## E-5: CorrectionResponse

Main Process から Renderer に返却される校正レスポンス。

```typescript
interface CorrectionResponse {
  success: boolean;
  correctedText?: string;
  error?: CorrectionError;
}

interface CorrectionError {
  type: ErrorType;
  message: string;
}

type ErrorType =
  | 'EMPTY_TEXT'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'CONNECTION_ERROR'
  | 'AUTH_ERROR'
  | 'API_ERROR'
  | 'UNKNOWN_ERROR';
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| success | boolean | Yes | 校正成功/失敗 |
| correctedText | string | On success | 校正後テキスト |
| error | CorrectionError | On failure | エラー情報 |

---

## E-6: ValidationResult

設定バリデーションの結果。

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| valid | boolean | バリデーション成功/失敗 |
| errors | ValidationError[] | エラー一覧（field: 対象フィールド, message: エラー内容） |

---

## E-7: AppState (Renderer Process)

React アプリケーションの状態。

```typescript
interface AppState {
  inputText: string;
  correctedText: string;
  isLoading: boolean;
  error: string | null;
  settings: Settings | null;
  isSettingsOpen: boolean;
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| inputText | string | '' | 左パネルの入力テキスト |
| correctedText | string | '' | 右パネルの校正結果テキスト |
| isLoading | boolean | false | 校正処理中フラグ |
| error | string \| null | null | エラーメッセージ（null = エラーなし） |
| settings | Settings \| null | null | アプリ設定（初期化前は null） |
| isSettingsOpen | boolean | false | 設定モーダル表示フラグ |

---

## Updated IPC Channel Definitions

Application Design からの変更点: `correct-text` チャネルのペイロードに `promptTemplate` を追加。

| Channel | Request Payload | Response Payload |
|---------|----------------|-----------------|
| `correct-text` | CorrectionRequest | CorrectionResponse |
| `get-settings` | void | Settings |
| `save-settings` | Settings | void |

---

## Updated ElectronAPI (Preload)

```typescript
interface ElectronAPI {
  correctText(request: CorrectionRequest): Promise<CorrectionResponse>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}
```

**変更点**: `correctText` の引数が `string` から `CorrectionRequest` に変更、戻り値が `string` から `CorrectionResponse` に変更。
