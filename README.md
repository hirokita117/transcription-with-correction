# transcription-with-correction

音声入力（ディクテーション）の文字起こしを LLM で校正してくれる Electron デスクトップアプリです。

macOS のディクテーション機能などで入力したテキストの誤字脱字・文法エラーを、LM Studio や Google Gemini を使って自動校正します。

## 主な機能

- テキスト入力エリアと校正結果エリアの2ペイン構成
- **音声入力**: マイクから直接テキストを入力（macOS ネイティブ音声認識を使用）
  - 逐次テキスト表示（認識中のテキストをリアルタイム表示）
  - 音声入力完了後の自動校正（設定で ON/OFF 可能）
  - グローバルショートカットキーでトグル（デフォルト: `Cmd+Shift+L`）
- LLM プロバイダーの選択（LM Studio / Gemini）
- 校正プロンプトテンプレートのカスタマイズ
- 校正結果のクリップボードコピー（校正完了時に自動コピー + 手動コピー）
- 設定の永続化（electron-store）

## 必要環境

- **macOS 15.0 (Sequoia) 以上**（音声入力機能に必要）
- Node.js 18 以上
- npm
- Swift 6.0 以上（音声入力ヘルパーのビルドに必要、Xcode に同梱）
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

# Swift 音声入力ヘルパーをビルド
npm run build:swift

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

`out/` ディレクトリに macOS 用のアプリケーションバンドルが生成されます。

## 使い方

1. **LLM プロバイダーの設定**: 右上の「設定」ボタンから、使用する LLM プロバイダーを選択し接続情報を入力します
   - **LM Studio**: LM Studio を起動してローカルサーバーを開始した上で、エンドポイント URL を指定
   - **Gemini**: Google AI Studio で取得した API キーを入力
2. **テキスト入力**: 左パネルに校正したいテキストを入力、または「音声入力」ボタンで音声から入力
3. **音声入力**: 「音声入力」ボタンをクリック（または `Cmd+Shift+L`）でマイクから音声認識を開始
   - 認識中のテキストがリアルタイムで表示されます
   - もう一度クリック（または同じショートカット）で停止
   - 自動校正が有効なら、停止後に自動で校正が実行されます
4. **校正実行**: 「校正」ボタンをクリック、または `Cmd+Enter`（このアプリがアクティブなら入力欄フォーカス不要）
5. **結果確認**: 右パネルに校正結果が表示されます。必要に応じて手動で編集も可能
6. **コピー**: 校正成功時に結果テキストは自動でクリップボードにコピーされます。必要に応じて各パネルの「コピー」ボタンも使えます

## npm スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発モードで起動（ホットリロード対応） |
| `npm run build` | プロダクションビルド |
| `npm test` | ユニットテスト実行 |
| `npm run test:watch` | テストをウォッチモードで実行 |
| `npm run lint` | TypeScript 型チェック |
| `npm run build:swift` | Swift 音声入力ヘルパーをビルド |

## 技術スタック

- **フレームワーク**: Electron + React
- **言語**: TypeScript, Swift
- **ビルドツール**: Vite + vite-plugin-electron
- **スタイリング**: Tailwind CSS v4
- **テスト**: Vitest
- **状態管理**: React useState
- **設定永続化**: electron-store
- **音声認識**: macOS Speech Framework (SFSpeechRecognizer)

## プロジェクト構成

```
src/
├── main/                    # Electron Main Process
│   ├── index.ts             # エントリポイント
│   ├── ipc-handler.ts       # IPC チャネルハンドラー
│   └── services/
│       ├── config-manager.ts    # 設定管理
│       ├── speech-service.ts    # 音声認識サービス（Swift ヘルパー管理）
│       └── llm/
│           ├── types.ts             # LLMProvider インターフェース
│           ├── llm-service.ts       # LLM サービス（Strategy Pattern）
│           ├── lm-studio-provider.ts  # LM Studio プロバイダー
│           └── gemini-provider.ts     # Gemini プロバイダー
├── preload/
│   └── index.ts             # Preload Script（contextBridge）
├── renderer/                # Electron Renderer Process (React)
│   ├── main.tsx             # React エントリポイント
│   ├── index.css            # グローバルスタイル
│   ├── App.tsx              # ルートコンポーネント
│   ├── hooks/
│   │   └── useVoiceInput.ts     # 音声入力カスタムフック
│   └── components/
│       ├── Header.tsx           # ヘッダー
│       ├── EditorPanel.tsx      # 入力パネル（左）
│       ├── ResultPanel.tsx      # 結果パネル（右）
│       ├── VoiceButton.tsx      # 音声入力ボタン
│       └── SettingsModal.tsx    # 設定モーダル
└── shared/
    └── types.ts             # 共有型定義
swift-helper/SpeechHelper/   # macOS 音声認識ヘルパー (Swift)
├── Package.swift
└── Sources/SpeechHelper/
    ├── main.swift               # stdin/stdout JSON Lines 処理
    ├── SpeechRecognizer.swift   # SFSpeechRecognizer ラッパー
    └── Models.swift             # Codable モデル
tests/                       # ユニットテスト
```

## ライセンス

MIT
