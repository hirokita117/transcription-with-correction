# Architecture 実装タスク

## 概要

Electron + React + TypeScript による文字起こし整形アプリの全体アーキテクチャ設計と実装タスク。

## 全体アーキテクチャ

### レイヤー構成

```
┌─────────────────────────────────────────┐
│         Renderer Process                │
│  (React + Vite + TypeScript)           │
│  - UI Components                        │
│  - State Management                     │
│  - User Interactions                   │
└──────────────┬──────────────────────────┘
               │ IPC (contextBridge)
               ▼
┌─────────────────────────────────────────┐
│         Preload Script                  │
│  - IPC Bridge                           │
│  - Type Guards                          │
│  - Security Layer                       │
└──────────────┬──────────────────────────┘
               │ IPC (ipcMain/ipcRenderer)
               ▼
┌─────────────────────────────────────────┐
│         Main Process                     │
│  - BrowserWindow                        │
│  - IPC Handlers                         │
│  - LLM Client                           │
│  - Persistence (electron-store)         │
└──────────────┬──────────────────────────┘
               │ HTTP
               ▼
┌─────────────────────────────────────────┐
│         Local LLM Service               │
│  (Ollama / LM Studio / llama.cpp)       │
└─────────────────────────────────────────┘
```

### データフロー

```
1. ユーザー入力
   ↓
2. モデル選択（プルダウン）
   ↓
3. 整形ボタンクリック
   ↓
4. Renderer → Preload → Main (IPC: llm:format)
   ↓
5. Main → LLM Client → HTTP Request
   ↓
6. LLM Response → Main → Preload → Renderer
   ↓
7. 履歴に追加（下に積む）
   ↓
8. コピーボタン → IPC: clipboard:copy
   ↓
9. 永続化（electron-store）
```

## IPC チャネル一覧

### モデル管理
- `models:list` - 利用可能なモデル一覧を取得
- `models:add` - 手動でモデルを追加
- `models:remove` - モデルを削除

### LLM操作
- `llm:format` - テキスト整形リクエスト
- `llm:format:stream` - ストリーミング整形（オプション）

### クリップボード
- `clipboard:copy` - テキストをクリップボードにコピー

### 永続化
- `store:get` - 設定値を取得
- `store:set` - 設定値を保存
- `store:getHistory` - 整形履歴を取得
- `store:saveHistory` - 整形履歴を保存
- `store:clearHistory` - 整形履歴をクリア

### アプリケーション
- `app:getVersion` - アプリバージョン取得
- `app:quit` - アプリケーション終了

## タスク: アーキテクチャドキュメントを整備する

### 説明
全体アーキテクチャ図、データフロー図、IPCチャネル一覧を Markdown/図表で可視化する。

### DoD
- [ ] レイヤー構成図が完成している
- [ ] データフロー図が完成している
- [ ] IPCチャネル一覧が網羅されている
- [ ] 各チャネルの責務が明確化されている
- [ ] セキュリティ境界が明示されている

### API/IPC契約
- 各IPCチャネルの詳細は `ipc_contracts.md` を参照

### リスク/対策
- **リスク**: IPCチャネルの設計不備による後戻り
- **対策**: 事前に `ipc_contracts.md` で完全な型定義を確定

### 見積/依存
- **見積**: 2時間
- **依存**: なし（最初に実施）

### テスト観点
- アーキテクチャレビューで各レイヤーの責務が明確か確認

## タスク: セキュリティ設定を設計する

### 説明
Electron のセキュリティベストプラクティスに基づき、`contextIsolation: true`, `nodeIntegration: false` の設定を設計する。

### DoD
- [ ] BrowserWindow のセキュリティ設定が確定している
- [ ] CSP (Content Security Policy) が設定されている
- [ ] preload スクリプトの公開APIが最小限になっている
- [ ] IPC チャネルのホワイトリストが定義されている

### API/IPC契約
- セキュリティ設定の詳細は `main_process.md` を参照

### リスク/対策
- **リスク**: セキュリティ設定不備による脆弱性
- **対策**: Electron セキュリティガイドに準拠

### 見積/依存
- **見積**: 1時間
- **依存**: architecture.md

### テスト観点
- セキュリティ監査ツールでの検証
- XSS/インジェクション攻撃のシミュレーション

