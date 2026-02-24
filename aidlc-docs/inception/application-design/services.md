# Services

## Service Architecture

Main Process 内のサービス層は、LLM プロバイダーの抽象化とアプリケーション設定の管理を担当する。

```
+-----------------------------------------------+
| LLMService                                    |
|                                               |
|  activeProvider ---+                          |
|                    |                          |
|  +--------------------------------------+     |
|  | providers: Map<ProviderType, Provider>|     |
|  |                                      |     |
|  |  'lm-studio' -> LMStudioProvider     |     |
|  |  'gemini'    -> GeminiProvider        |     |
|  |  (future)    -> NewProvider           |     |
|  +--------------------------------------+     |
+-----------------------------------------------+
           |
           v
+-----------------------------------------------+
| ConfigManager                                 |
|                                               |
|  .env file (initial defaults)                 |
|  electron-store (runtime settings)            |
+-----------------------------------------------+
```

---

## SVC-1: LLMService (Orchestration Service)

### Responsibility
- LLM プロバイダーの登録・管理
- アクティブプロバイダーの選択とリクエストルーティング
- プロバイダー切り替え時の設定反映

### Orchestration Pattern: Strategy Pattern
- `LLMProvider` インターフェースを共通契約として定義
- 各プロバイダー（LMStudioProvider, GeminiProvider）がインターフェースを実装
- LLMService が Map でプロバイダーを保持し、activeProvider で切り替え
- 新規プロバイダー追加時は、インターフェース実装 + Map への登録のみ

### Service Flow: 校正リクエスト
```
1. Renderer: correctText(text) via IPC
2. IPCHandler: handleCorrectText(text)
3. LLMService: correct(text)
4. LLMService: getActiveProvider() -> provider
5. Provider: correct(text) -> API call
6. Provider: return corrected text
7. IPCHandler: return result via IPC
8. Renderer: display corrected text
```

### Error Handling Strategy
- プロバイダーからのエラーは LLMService でキャッチ
- ユーザー向けエラーメッセージに変換して Renderer に返却
- エラー種別: 接続エラー、認証エラー、設定不備、空テキスト

---

## SVC-2: ConfigManager (Configuration Service)

### Responsibility
- .env ファイルからの初期設定読み込み
- ランタイム設定の永続化（electron-store 使用）
- 設定値のバリデーション

### Configuration Priority
```
1. electron-store (ユーザーが設定画面で保存した値) - 最優先
2. .env file (開発者が設定した初期値) - フォールバック
3. Default values (ハードコード) - 最終フォールバック
```

### Persistence
- `electron-store` を使用してユーザー設定を永続化
- .env はデフォルト値/開発時の設定として利用
- API キーは electron-store に保存（OS のアプリデータディレクトリ）
