# Main Process 実装タスク

## 概要

Electron の Main Process 実装タスク。BrowserWindow 管理、IPC ハンドラ、アプリケーションメニュー、ショートカット設定。

## タスク: BrowserWindow を作成・設定する

### 説明
アプリケーションのメインウィンドウを作成し、セキュリティ設定を適用する。

### DoD
- [ ] BrowserWindow が作成されている
- [ ] `contextIsolation: true`, `nodeIntegration: false` が設定されている
- [ ] CSP (Content Security Policy) が設定されている
- [ ] preload スクリプトが正しく読み込まれている
- [ ] 開発者ツールの表示/非表示が制御されている

### API/IPC契約
- BrowserWindow の設定オプション:
```typescript
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false, // preload が必要なため false
  },
});
```

### リスク/対策
- **リスク**: セキュリティ設定の不備
- **対策**: Electron セキュリティガイドに準拠

### 見積/依存
- **見積**: 2時間
- **依存**: architecture.md, preload_bridge.md

### テスト観点
- セキュリティ設定の確認
- preload スクリプトの読み込み確認

## タスク: IPC ハンドラを実装する（モデル管理）

### 説明
`models:list`, `models:add`, `models:remove` の IPC ハンドラを実装する。

### DoD
- [ ] `models:list` が LLM プロバイダーからモデル一覧を取得できる
- [ ] 取得失敗時はローカル `models.json` をフォールバックできる
- [ ] `models:add` で手動追加モデルを保存できる
- [ ] `models:remove` でモデルを削除できる
- [ ] エラーハンドリングが実装されている

### API/IPC契約
- `ipc_contracts.md` の `ModelsListRequest`, `ModelsListResponse` を参照

### リスク/対策
- **リスク**: LLM プロバイダーへの接続失敗
- **対策**: フォールバック先の `models.json` を用意

### 見積/依存
- **見積**: 4時間
- **依存**: ipc_contracts.md, llm_client.md

### テスト観点
- モデル一覧取得の成功/失敗ケース
- フォールバック動作の確認

## タスク: IPC ハンドラを実装する（LLM操作）

### 説明
`llm:format`, `llm:format:stream` の IPC ハンドラを実装する。

### DoD
- [ ] `llm:format` が LLM クライアントを呼び出して整形できる
- [ ] リクエストのバリデーションが実装されている
- [ ] タイムアウト処理が実装されている
- [ ] エラーハンドリングが実装されている
- [ ] ストリーミング対応（オプション）

### API/IPC契約
- `ipc_contracts.md` の `LLMFormatRequest`, `LLMFormatResponse` を参照

### リスク/対策
- **リスク**: 長時間リクエストによる UI フリーズ
- **対策**: 非同期処理とタイムアウト設定

### 見積/依存
- **見積**: 4時間
- **依存**: ipc_contracts.md, llm_client.md, prompting.md

### テスト観点
- 正常系/異常系のリクエストテスト
- タイムアウト動作の確認

## タスク: IPC ハンドラを実装する（クリップボード）

### 説明
`clipboard:copy` の IPC ハンドラを実装する。

### DoD
- [ ] テキストがクリップボードにコピーできる
- [ ] エラーハンドリングが実装されている
- [ ] コピー成功/失敗のレスポンスが返る

### API/IPC契約
- `ipc_contracts.md` の `ClipboardCopyRequest`, `ClipboardCopyResponse` を参照

### リスク/対策
- **リスク**: クリップボード操作の権限エラー
- **対策**: エラーハンドリングとユーザー通知

### 見積/依存
- **見積**: 1時間
- **依存**: ipc_contracts.md

### テスト観点
- コピー操作の成功/失敗ケース

## タスク: IPC ハンドラを実装する（永続化）

### 説明
`store:get`, `store:set`, `store:getHistory`, `store:saveHistory`, `store:clearHistory` の IPC ハンドラを実装する。

### DoD
- [ ] electron-store を使用して設定値を保存/取得できる
- [ ] 履歴の保存/取得が実装されている
- [ ] 最大履歴件数（20件）のローテーションが実装されている
- [ ] エラーハンドリングが実装されている

### API/IPC契約
- `ipc_contracts.md` の `StoreGetRequest`, `StoreSetRequest` などを参照

### リスク/対策
- **リスク**: ストレージの破損やクォータ超過
- **対策**: エラーハンドリングとフォールバック

### 見積/依存
- **見積**: 3時間
- **依存**: ipc_contracts.md, persistence.md

### テスト観点
- 設定値の保存/取得テスト
- 履歴のローテーション動作確認

## タスク: アプリケーションメニューを実装する

### 説明
アプリケーションのメニューバーとショートカットを実装する。

### DoD
- [ ] ファイルメニュー（新規、終了）
- [ ] 編集メニュー（コピー、全選択）
- [ ] 表示メニュー（開発者ツールの表示/非表示）
- [ ] ヘルプメニュー（バージョン情報）
- [ ] ショートカットキーが設定されている

### API/IPC契約
- ショートカットキー:
  - `CmdOrCtrl+Enter`: 整形実行
  - `CmdOrCtrl+C`: コピー（フォーカス時）
  - `CmdOrCtrl+Q`: 終了（macOS）
  - `CmdOrCtrl+W`: ウィンドウを閉じる

### リスク/対策
- **リスク**: プラットフォーム間のショートカットキー差異
- **対策**: `process.platform` で分岐

### 見積/依存
- **見積**: 2時間
- **依存**: なし

### テスト観点
- 各ショートカットキーの動作確認
- プラットフォーム間の動作確認

## タスク: アプリケーションライフサイクルを実装する

### 説明
アプリケーションの起動、終了、ウィンドウの状態管理を実装する。

### DoD
- [ ] アプリ起動時にウィンドウが表示される
- [ ] ウィンドウを閉じた時の動作が適切（macOS は非表示、他は終了）
- [ ] 終了時に未保存データの確認（オプション）
- [ ] ウィンドウの位置・サイズが復元される

### API/IPC契約
- ウィンドウ状態の保存/復元は electron-store を使用

### リスク/対策
- **リスク**: ウィンドウ状態の復元失敗
- **対策**: デフォルト値の設定

### 見積/依存
- **見積**: 2時間
- **依存**: persistence.md

### テスト観点
- 起動/終了動作の確認
- ウィンドウ状態の復元確認

