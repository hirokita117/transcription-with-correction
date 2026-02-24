# transcription-with-correction

音声入力（ディクテーション）の文字起こしを LLM で校正してくれる Electron デスクトップアプリです。

macOS のディクテーション機能などで入力したテキストの誤字脱字・文法エラーを、LM Studio や Google Gemini を使って自動校正します。

## 主な機能

- テキスト入力エリアと校正結果エリアの2ペイン構成
- LLM プロバイダーの選択（LM Studio / Gemini）
- 校正プロンプトテンプレートのカスタマイズ
- 校正結果のクリップボードコピー
- 設定の永続化（electron-store）

## 必要環境

- Node.js 18 以上
- npm
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

`out/` ディレクトリに macOS 用のアプリケーションバンドルが生成されます。

## 使い方

1. **LLM プロバイダーの設定**: 右上の「設定」ボタンから、使用する LLM プロバイダーを選択し接続情報を入力します
   - **LM Studio**: LM Studio を起動してローカルサーバーを開始した上で、エンドポイント URL を指定
   - **Gemini**: Google AI Studio で取得した API キーを入力
2. **テキスト入力**: 左パネルに校正したいテキストを入力（macOS ディクテーション入力も可）
3. **校正実行**: 「校正」ボタンをクリック
4. **結果確認**: 右パネルに校正結果が表示されます。必要に応じて手動で編集も可能
5. **コピー**: 各パネルの「コピー」ボタンでテキストをクリップボードにコピー

## npm スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発モードで起動（ホットリロード対応） |
| `npm run build` | プロダクションビルド |
| `npm test` | ユニットテスト実行 |
| `npm run test:watch` | テストをウォッチモードで実行 |
| `npm run lint` | TypeScript 型チェック |

## 技術スタック

- **フレームワーク**: Electron + React
- **言語**: TypeScript
- **ビルドツール**: Vite + vite-plugin-electron
- **スタイリング**: Tailwind CSS v4
- **テスト**: Vitest
- **状態管理**: React useState
- **設定永続化**: electron-store

## プロジェクト構成

```
src/
├── main/                    # Electron Main Process
│   ├── index.ts             # エントリポイント
│   ├── ipc-handler.ts       # IPC チャネルハンドラー
│   └── services/
│       ├── config-manager.ts    # 設定管理
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
│   └── components/
│       ├── Header.tsx           # ヘッダー
│       ├── EditorPanel.tsx      # 入力パネル（左）
│       ├── ResultPanel.tsx      # 結果パネル（右）
│       └── SettingsModal.tsx    # 設定モーダル
└── shared/
    └── types.ts             # 共有型定義
tests/                       # ユニットテスト
```

## ライセンス

MIT
