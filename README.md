# transcription-with-correction

音声入力の文字起こしを校正してくれる Electron アプリ

## 概要

このアプリケーションは、Electron + React + TypeScript で構築された文字起こし整形ツールです。ローカルLLMサービス（Ollama / LM Studio / llama.cpp）を使用して、音声入力の文字起こしテキストを自動的に整形・校正します。

## アーキテクチャ

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

## プロジェクト構造

```
transcription-with-correction/
├── src/
│   ├── main/              # Main Process
│   │   ├── index.ts       # エントリーポイント
│   │   ├── preload.ts     # Preload Script
│   │   ├── ipc/           # IPC ハンドラー
│   │   ├── store/         # 永続化
│   │   └── utils/         # ユーティリティ
│   ├── renderer/          # Renderer Process
│   │   ├── main.tsx       # React エントリーポイント
│   │   ├── App.tsx        # メインコンポーネント
│   │   └── styles.css     # スタイル
│   └── shared/            # 共有コード
│       ├── types/         # 型定義
│       └── errors/        # エラーハンドリング
├── tasks/                 # 実装タスクドキュメント
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## セットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール

```bash
npm install
```

### 開発

```bash
# 開発モード（Main Process、Preload、Renderer を並行実行）
npm run dev

# 別ターミナルで Electron を起動
npm start
```

### ビルド

```bash
npm run build
```

## セキュリティ設定

このアプリケーションは Electron のセキュリティベストプラクティスに準拠しています：

- `contextIsolation: true` - Context Isolation を有効化
- `nodeIntegration: false` - Node.js統合を無効化
- `sandbox: false` - Preload Script が必要なため false（contextIsolation により安全）
- CSP (Content Security Policy) - HTML で設定

## IPC チャネル

### モデル管理
- `models:list` - 利用可能なモデル一覧を取得
- `models:add` - 手動でモデルを追加
- `models:remove` - モデルを削除

### LLM操作
- `llm:format` - テキスト整形リクエスト

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

詳細は `tasks/ipc_contracts.md` を参照してください。

## ライセンス

MIT
