# Preload Bridge 実装タスク

## 概要

Preload スクリプトによる IPC ブリッジ実装。Renderer Process から Main Process への安全な通信層。

## タスク: contextBridge.exposeInMainWorld を実装する

### 説明
Renderer Process に公開する IPC API を `contextBridge.exposeInMainWorld` で実装する。

### DoD
- [ ] `window.electronAPI` オブジェクトが公開されている
- [ ] すべてのIPCチャネルがメソッドとして公開されている
- [ ] 型定義（TypeScript）が提供されている
- [ ] エラーハンドリングが実装されている

### API/IPC契約
```typescript
// Renderer Process で使用する型定義
interface ElectronAPI {
  // モデル管理
  models: {
    list: (request?: ModelsListRequest) => Promise<ModelsListResponse>;
    add: (request: ModelsAddRequest) => Promise<ModelsAddResponse>;
    remove: (request: ModelsRemoveRequest) => Promise<ModelsRemoveResponse>;
  };
  
  // LLM操作
  llm: {
    format: (request: LLMFormatRequest) => Promise<LLMFormatResponse>;
    formatStream: (request: LLMFormatStreamRequest) => Promise<void>; // ストリーミング
  };
  
  // クリップボード
  clipboard: {
    copy: (request: ClipboardCopyRequest) => Promise<ClipboardCopyResponse>;
  };
  
  // 永続化
  store: {
    get: <T = unknown>(request: StoreGetRequest) => Promise<StoreGetResponse<T>>;
    set: (request: StoreSetRequest) => Promise<StoreSetResponse>;
    getHistory: () => Promise<StoreGetHistoryResponse>;
    saveHistory: (request: StoreSaveHistoryRequest) => Promise<StoreSaveHistoryResponse>;
    clearHistory: () => Promise<IPCResponse<{ cleared: boolean }>>;
  };
  
  // アプリケーション
  app: {
    getVersion: () => Promise<AppGetVersionResponse>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

### リスク/対策
- **リスク**: 不正なIPCチャネルへのアクセス
- **対策**: ホワイトリスト方式で公開APIを限定

### 見積/依存
- **見積**: 3時間
- **依存**: ipc_contracts.md

### テスト観点
- 公開APIの動作確認
- 型定義のコンパイル確認

## タスク: IPC リクエストの型ガードを実装する

### 説明
Renderer Process から送信される IPC リクエストのバリデーションを実装する。

### DoD
- [ ] すべてのIPCリクエストにZodスキーマが適用されている
- [ ] バリデーションエラーが適切にハンドリングされている
- [ ] エラーメッセージがユーザーフレンドリーになっている

### API/IPC契約
- `ipc_contracts.md` の型定義とZodスキーマを参照

### リスク/対策
- **リスク**: 不正なリクエストによるクラッシュ
- **対策**: すべてのリクエストでバリデーションを実施

### 見積/依存
- **見積**: 2時間
- **依存**: ipc_contracts.md

### テスト観点
- 不正なリクエストの送信テスト
- バリデーションエラーのレスポンス確認

## タスク: IPC レスポンスの型変換を実装する

### 説明
Main Process からの IPC レスポンスを Renderer Process 用の型に変換する。

### DoD
- [ ] レスポンスの型変換が実装されている
- [ ] エラーレスポンスの処理が実装されている
- [ ] タイムアウト処理が実装されている

### API/IPC契約
- `ipc_contracts.md` の `IPCResponse<T>` 型を参照

### リスク/対策
- **リスク**: 型変換の不整合
- **対策**: TypeScript の型チェックと実行時検証

### 見積/依存
- **見積**: 2時間
- **依存**: ipc_contracts.md

### テスト観点
- レスポンスの型変換確認
- エラーレスポンスの処理確認

## タスク: ストリーミング対応を実装する（オプション）

### 説明
LLM のストリーミングレスポンスを Renderer Process に転送する。

### DoD
- [ ] `llm:format:stream` のIPCハンドラが実装されている
- [ ] ストリーミングチャンクが Renderer Process に転送される
- [ ] ストリーミングの中断処理が実装されている
- [ ] エラーハンドリングが実装されている

### API/IPC契約
- `ipc_contracts.md` の `LLMFormatStreamChunk` 型を参照

### リスク/対策
- **リスク**: ストリーミングのメモリリーク
- **対策**: 適切なクリーンアップ処理

### 見積/依存
- **見積**: 3時間
- **依存**: ipc_contracts.md, llm_client.md

### テスト観点
- ストリーミングの動作確認
- 中断処理の確認

## タスク: エラーハンドリングを統一する

### 説明
IPC エラーを統一された形式で Renderer Process に伝達する。

### DoD
- [ ] すべてのIPCエラーが統一された形式になっている
- [ ] エラーコードが適切に設定されている
- [ ] エラーメッセージがユーザーフレンドリーになっている

### API/IPC契約
- `ipc_contracts.md` の `IPCError`, `ErrorCode` を参照

### リスク/対策
- **リスク**: エラー情報の欠落
- **対策**: エラーハンドリングの統一インターフェース

### 見積/依存
- **見積**: 2時間
- **依存**: ipc_contracts.md, error_handling.md

### テスト観点
- 各種エラーケースのテスト
- エラーメッセージの確認

