# transcription-with-correction

音声入力（ディクテーション）の文字起こしを LLM で校正してくれる Electron デスクトップアプリです。

macOS のメニューバーに常駐し、グローバルショートカットで音声入力を開始。認識テキストを LM Studio や Google Gemini で自動校正し、元のアプリへ結果をペーストするところまでを一括で行います。

## 主な機能

- **トレイ常駐モード**: メニューバーに常駐し、Dock を非表示にして動作
- **音声入力**: グローバルショートカット（デフォルト: `Cmd+Shift+L`）で音声入力ウィンドウを表示
  - macOS ネイティブ音声認識（SFSpeechRecognizer）を使用
  - 認識中のテキストをリアルタイム表示（Live Transcript）
  - 音声入力完了後の自動校正
- **自動ペースト**: 校正完了後、元のアプリにフォーカスを戻し結果をペースト（アクセシビリティ権限が必要）
  - ペースト失敗時はクリップボードコピーにフォールバック
- **LLM プロバイダーの選択**: LM Studio（ローカル）/ Google Gemini
- **校正プロンプトのカスタマイズ**: 設定画面からプロンプトテンプレートを編集可能
- **設定の永続化**: electron-store で設定を保存

## 必要環境

- **macOS 15.0 (Sequoia) 以上**（音声入力機能に必要）
- Node.js 18 以上
- npm
- Swift 6.0 以上（音声入力・自動化ヘルパーのビルドに必要、Xcode に同梱）
- **アクセシビリティ権限**（自動ペースト機能に必要、システム設定から許可）
- LLM プロバイダー（いずれか1つ）:
  - [LM Studio](https://lmstudio.ai/) — ローカルで LLM を実行
  - [Google Gemini API](https://ai.google.dev/) — API キーが必要

## セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/hirokita117/transcription-with-correction.git
cd transcription-with-correction

# 依存関係をインストール
npm install

# 環境変数ファイルを作成（任意）
cp .env.example .env
```

### 環境変数（.env）

`.env` ファイルで初期設定値を指定できます。アプリの設定画面からも変更可能です。

```env
# 使用する LLM プロバイダー: 'lm-studio' or 'gemini'
LLM_PROVIDER=lm-studio

# LM Studio の設定
LM_STUDIO_ENDPOINT=http://localhost:1234/v1
LM_STUDIO_MODEL=

# Gemini の設定
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-2.0-flash
```

## 起動方法

### 開発モード

```bash
npm run dev
```

Vite の開発サーバーが起動し、Electron アプリが立ち上がります。ソースコードを変更するとホットリロードされます。

### プロダクションビルド

```bash
npm run build
```

Swift ヘルパーのビルドを含む全工程を実行し、`out/` ディレクトリに macOS 用アプリケーションバンドル（.dmg）が生成されます。

## 使い方

1. **初回起動**: 設定ウィンドウが自動で開きます
2. **LLM プロバイダーの設定**: 使用する LLM プロバイダーを選択し接続情報を入力
   - **LM Studio**: LM Studio を起動してローカルサーバーを開始した上で、エンドポイント URL を指定
   - **Gemini**: Google AI Studio で取得した API キーを入力
3. **アクセシビリティ権限の許可**: 設定画面の案内に従い、システム設定でアクセシビリティ権限を付与（自動ペースト機能に必要）
4. **音声入力の開始**: 校正先のアプリで入力カーソルを合わせた状態で `Cmd+Shift+L`（または設定したショートカット）を押す
   - 画面中央に音声入力ウィンドウが表示されます
   - 認識中のテキストがリアルタイムで表示されます
5. **音声入力の停止**: 同じショートカットをもう一度押すか、録音を止めると自動で停止
6. **自動校正・ペースト**: 停止後、LLM による校正が自動実行され、元のアプリへフォーカスが戻り結果がペーストされます
   - アクセシビリティ権限がない場合や貼り付けに失敗した場合は、クリップボードにコピーされます
   - 校正に失敗した場合は音声入力ウィンドウの「再校正」ボタンまたは `Cmd+Enter` で再試行できます
7. **設定の変更**: メニューバーのアイコンをクリック →「設定を開く」

## npm スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発モードで起動（ホットリロード対応） |
| `npm run build` | プロダクションビルド（Swift ヘルパーのビルドを含む） |
| `npm test` | ユニットテスト実行 |
| `npm run test:watch` | テストをウォッチモードで実行 |
| `npm run lint` | TypeScript 型チェック |
| `npm run build:swift` | Swift ヘルパーのみをビルド |

## 技術スタック

- **フレームワーク**: Electron + React
- **言語**: TypeScript, Swift
- **ビルドツール**: Vite + vite-plugin-electron
- **スタイリング**: Tailwind CSS v4
- **テスト**: Vitest
- **状態管理**: React useState / useReducer
- **設定永続化**: electron-store
- **音声認識**: macOS Speech Framework (SFSpeechRecognizer)
- **自動化**: macOS Accessibility API / Apple Events (AutomationHelper)

## プロジェクト構成

```
src/
├── main/                    # Electron Main Process
│   ├── index.ts             # エントリポイント
│   ├── ipc-handler.ts       # IPC チャネルハンドラー
│   └── services/
│       ├── config-manager.ts            # 設定管理
│       ├── dictation-session-service.ts # 音声入力〜校正〜ペーストのセッション管理
│       ├── resident-mode-service.ts     # トレイ常駐・Dock 表示管理
│       ├── settings-window-service.ts   # 設定ウィンドウ管理
│       ├── voice-capture-window-service.ts  # 音声入力ウィンドウ管理
│       ├── speech-service.ts            # 音声認識サービス（SpeechHelper 管理）
│       ├── paste-back-service.ts        # 元アプリへの自動ペースト
│       ├── frontmost-app-service.ts     # 最前面アプリの取得
│       ├── automation-helper-client.ts  # AutomationHelper プロセス通信
│       ├── permission-service.ts        # アクセシビリティ権限管理
│       └── llm/
│           ├── types.ts                 # LLMProvider インターフェース
│           ├── llm-service.ts           # LLM サービス（Strategy Pattern）
│           ├── lm-studio-provider.ts    # LM Studio プロバイダー
│           └── gemini-provider.ts       # Gemini プロバイダー
├── preload/
│   └── index.ts             # Preload Script（contextBridge）
├── renderer/                # Electron Renderer Process (React)
│   ├── main.tsx             # React エントリポイント（設定 UI / 音声入力 UI を切り替え）
│   ├── index.css            # グローバルスタイル
│   ├── App.tsx              # 設定ウィンドウ ルートコンポーネント
│   ├── voice-capture-app.tsx  # 音声入力ウィンドウ ルートコンポーネント
│   └── components/
│       ├── SettingsModal.tsx         # 設定フォーム
│       └── voice-capture-panel.tsx   # 音声入力 UI パネル
└── shared/
    └── types.ts             # 共有型定義
swift-helper/SpeechHelper/   # macOS 音声認識・自動化ヘルパー (Swift)
├── Package.swift
└── Sources/
    ├── SpeechHelper/            # 音声認識ヘルパー
    │   ├── App.swift            # stdin/stdout JSON Lines 処理
    │   ├── SpeechRecognizer.swift  # SFSpeechRecognizer ラッパー
    │   └── Models.swift         # Codable モデル
    └── AutomationHelper/        # 自動化ヘルパー（アプリ復帰・ペースト）
        ├── main.swift           # stdin/stdout JSON Lines 処理
        ├── AutomationController.swift  # Accessibility API / Apple Events
        └── Models.swift         # Codable モデル
tests/                       # ユニットテスト
```

## ライセンス

MIT
