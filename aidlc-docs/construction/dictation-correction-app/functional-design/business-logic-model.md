# Business Logic Model

## BL-1: 校正リクエストフロー

### フロー概要
```
User Action (校正ボタン押下)
  |
  v
[1] 入力バリデーション
  - 空テキストチェック
  - プロバイダー設定有無チェック
  |
  v
[2] 校正リクエスト構築
  - プロンプトテンプレート取得
  - テンプレートにテキストを埋め込み
  |
  v
[3] IPC 送信 (Renderer -> Main)
  - channel: 'correct-text'
  - payload: { text, promptTemplate }
  |
  v
[4] LLMService ルーティング
  - activeProvider を取得
  - プロバイダーの correct() を呼び出し
  |
  v
[5] Provider API 呼び出し
  - LMStudioProvider: OpenAI 互換 API (POST /chat/completions)
  - GeminiProvider: Gemini API (generateContent)
  |
  v
[6] レスポンス処理
  - API レスポンスから校正テキストを抽出
  - エラー時はエラーオブジェクトを返却
  |
  v
[7] IPC 返却 (Main -> Renderer)
  - 成功: { success: true, correctedText: string }
  - 失敗: { success: false, error: { type, message } }
  |
  v
[8] UI 更新
  - 成功: 右パネルに校正結果を表示
  - 失敗: エラーメッセージを表示
```

---

## BL-2: プロバイダー切り替えロジック

### 切り替えフロー
```
User Action (設定画面でプロバイダー変更)
  |
  v
[1] 設定バリデーション
  - 切り替え先プロバイダーの必須項目チェック
  - LM Studio: endpointUrl 必須
  - Gemini: apiKey 必須
  |
  v
[2] 設定保存 (IPC: save-settings)
  - electron-store に永続化
  |
  v
[3] LLMService 更新
  - setProvider() で activeProvider を切り替え
  - updateProviderConfig() で接続設定を更新
  |
  v
[4] UI 反映
  - Header のプロバイダー表示を更新
  - 設定モーダルを閉じる
```

### 切り替え時の制約
- 校正処理中はプロバイダー切り替え不可（isLoading 中は設定ボタン無効化）
- 切り替え後、次回の校正リクエストから新プロバイダーが使用される

---

## BL-3: 校正プロンプト設計

### デフォルトプロンプトテンプレート
```
あなたはプロフェッショナルな校正者です。
以下のテキストの誤字脱字・文法エラーを修正してください。

ルール:
- 原文の意味や文体を変えないこと
- 誤字脱字・文法エラーのみを修正すること
- 修正後のテキストのみを出力すること（説明や注釈は不要）

テキスト:
{text}
```

### プロンプトテンプレートのカスタマイズ
- ユーザーが設定画面でプロンプトテンプレートを編集可能
- `{text}` プレースホルダーは必須（バリデーションで検証）
- デフォルトテンプレートへのリセット機能を提供
- テンプレートは Settings の一部として electron-store に保存

### API リクエスト構築

**LM Studio (OpenAI 互換)**:
```
POST {endpointUrl}/chat/completions
{
  "model": "{modelName}",
  "messages": [
    { "role": "user", "content": "{rendered prompt}" }
  ],
  "temperature": 0.3
}
```

**Gemini**:
```
generateContent({
  model: "{modelName}",
  contents: [{ role: "user", parts: [{ text: "{rendered prompt}" }] }],
  generationConfig: { temperature: 0.3 }
})
```

### temperature の選択理由
- 0.3: 校正タスクは創造性より正確性を重視するため低い温度を採用
- 原文の意味を保持しつつ、最小限の修正に留めるための設定

---

## BL-4: 設定管理ライフサイクル

### 初期化フロー
```
App 起動
  |
  v
[1] ConfigManager.load()
  - .env ファイル読み込み（デフォルト値）
  - electron-store 読み込み（ユーザー保存値）
  - マージ: electron-store > .env > ハードコードデフォルト
  |
  v
[2] LLMService 初期化
  - providers Map にプロバイダーを登録
  - activeProvider を設定値から設定
  |
  v
[3] IPCHandler 登録
  - ipcMain.handle で全チャネルを登録
  |
  v
[4] Renderer 初期化
  - getSettings() で設定を取得
  - UI に反映
```

### 設定の優先順位（詳細）
| 設定項目 | .env キー | electron-store キー | デフォルト値 |
|----------|----------|-------------------|------------|
| activeProvider | LLM_PROVIDER | settings.activeProvider | 'lm-studio' |
| LM Studio URL | LM_STUDIO_ENDPOINT | settings.lmStudio.endpointUrl | 'http://localhost:1234/v1' |
| LM Studio Model | LM_STUDIO_MODEL | settings.lmStudio.modelName | '' |
| Gemini API Key | GEMINI_API_KEY | settings.gemini.apiKey | '' |
| Gemini Model | GEMINI_MODEL | settings.gemini.modelName | 'gemini-2.0-flash' |
| Prompt Template | - | settings.promptTemplate | (デフォルトテンプレート) |

---

## BL-5: クリップボードコピーロジック

### コピーフロー
```
User Action (コピーボタン押下)
  |
  v
[1] 対象テキスト取得
  - 左パネルコピー: inputText
  - 右パネルコピー: correctedText
  |
  v
[2] Clipboard API 実行
  - navigator.clipboard.writeText(text)
  |
  v
[3] フィードバック表示
  - ボタンテキストを一時的に「コピー完了」に変更
  - 2秒後に元のテキストに復帰
```

### 制約
- テキストが空の場合はコピーボタンを無効化（disabled）
