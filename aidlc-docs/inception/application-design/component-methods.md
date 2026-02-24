# Component Methods

## LLMProvider Interface (共通インターフェース)

```typescript
interface LLMProvider {
  correct(text: string, language?: string): Promise<string>;
  validateConfig(): Promise<boolean>;
  getProviderName(): string;
}
```

---

## MP-1: IPCHandler

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `registerHandlers()` | void | void | 全 IPC チャネルハンドラーを登録 |
| `handleCorrectText(text: string)` | string | Promise\<string\> | 校正リクエストを LLMService に委譲 |
| `handleGetSettings()` | void | Promise\<Settings\> | 現在の設定を返却 |
| `handleSaveSettings(settings: Settings)` | Settings | Promise\<void\> | 設定を保存 |

## MP-2: LLMService

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `correct(text: string)` | string | Promise\<string\> | アクティブなプロバイダーで校正を実行 |
| `setProvider(providerType: ProviderType)` | ProviderType | void | 使用するプロバイダーを切り替え |
| `getActiveProvider()` | void | LLMProvider | 現在のアクティブプロバイダーを返却 |
| `updateProviderConfig(config: ProviderConfig)` | ProviderConfig | void | プロバイダーの接続設定を更新 |

## MP-3: LMStudioProvider

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `correct(text: string)` | string | Promise\<string\> | OpenAI 互換 API で校正を実行 |
| `validateConfig()` | void | Promise\<boolean\> | エンドポイント URL の疎通確認 |
| `getProviderName()` | void | string | "LM Studio" を返却 |

## MP-4: GeminiProvider

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `correct(text: string)` | string | Promise\<string\> | Gemini API で校正を実行 |
| `validateConfig()` | void | Promise\<boolean\> | API キーの有効性確認 |
| `getProviderName()` | void | string | "Gemini" を返却 |

## MP-5: ConfigManager

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `load()` | void | Settings | .env + 保存済み設定を読み込み |
| `save(settings: Settings)` | Settings | void | 設定を永続化 |
| `get(key: string)` | string | any | 個別の設定値を取得 |
| `validate()` | void | ValidationResult | 設定の妥当性を検証 |

---

## Renderer Process Methods

## RP-1: App

| Method / Hook | Purpose |
|---------------|---------|
| `handleCorrect()` | 入力テキストを IPC 経由で校正リクエスト |
| `handleCopy()` | 校正結果をクリップボードにコピー |
| `handleSaveSettings(settings)` | 設定を IPC 経由で保存 |
| `useEffect (init)` | 起動時に設定を読み込み |

## BR-1: Preload Script (Exposed API)

```typescript
interface ElectronAPI {
  correctText(text: string): Promise<string>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}
```

---

## Key Types

```typescript
type ProviderType = 'lm-studio' | 'gemini';

interface Settings {
  activeProvider: ProviderType;
  lmStudio: {
    endpointUrl: string;
    modelName: string;
  };
  gemini: {
    apiKey: string;
    modelName: string;
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

**Note**: 各メソッドの詳細なビジネスロジック（校正プロンプト設計、エラーハンドリング戦略等）は Functional Design で定義します。
