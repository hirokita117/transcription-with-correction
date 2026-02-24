# Requirements Document

## Intent Analysis

- **User Request**: 音声入力をして、それを文字起こしし、LLMで誤字脱字を修正できるElectronアプリケーション
- **Request Type**: New Project (Greenfield)
- **Scope**: System-wide（Electronアプリ全体の新規構築）
- **Complexity**: Moderate（外部API連携あり、UI設計あり、ただしアプリ自体の音声処理は不要）

---

## Functional Requirements

### FR-1: テキスト入力（macOS ディクテーション連携）
- アプリ内に編集可能なテキストエリア（左パネル）を配置する
- ユーザーは macOS のディクテーション機能（キーボードショートカット起動）でテキストを入力する
- アプリ自体は音声のキャプチャや文字起こし処理を行わない
- 手動でのテキスト入力・編集も可能とする
- 対象言語: 日本語・英語

### FR-2: LLM による誤字脱字校正
- 左パネルのテキストを LLM に送信し、誤字脱字を校正する
- 校正実行はユーザーのアクション（ボタン押下等）で開始する
- 校正結果は右パネルに表示する

### FR-3: LLM プロバイダー切り替え
- 以下の2つの LLM プロバイダーをサポートする:
  - **LM Studio API**: ローカル LLM（OpenAI 互換 API）
  - **Gemini API**: Google の Gemini モデル
- 設定で切り替え可能にする（どちらか一方を選んで使用）
- 各プロバイダーの接続先 URL・API キー・モデル名を設定可能にする

### FR-4: 2カラム UI レイアウト
- **左パネル**: 元のテキスト（ディクテーション入力 / 手動入力）
- **右パネル**: LLM 校正後のテキスト
- 両パネルとも編集可能

### FR-5: 校正結果の操作
- 校正後テキストの手動編集が可能
- クリップボードへのコピー機能（ボタン押下）

### FR-6: API キー管理
- `.env` ファイルで API キー・設定値を管理する
- 設定項目:
  - LLM プロバイダー選択（LM Studio / Gemini）
  - LM Studio: エンドポイント URL, モデル名
  - Gemini: API キー, モデル名

---

## Non-Functional Requirements

### NFR-1: プラットフォーム
- macOS のみ対応
- macOS のディクテーション機能が利用可能な環境を前提とする

### NFR-2: 技術スタック
- **アプリケーションフレームワーク**: Electron
- **フロントエンド**: React + TypeScript（2026年現在のデファクトスタンダード）
- **ビルドツール**: Vite（Electron + React の標準的な構成）
- **パッケージマネージャ**: npm

### NFR-3: ユーザビリティ
- シンプルで直感的な UI
- 校正処理中のローディング表示
- エラー発生時の適切なメッセージ表示

### NFR-4: セキュリティ
- API キーは `.env` ファイルで管理し、リポジトリにコミットしない（.gitignore）
- Electron のセキュリティベストプラクティスに従う（contextIsolation, nodeIntegration: false 等）

---

## Technical Architecture Overview

```
+--------------------------------------------------+
|  Electron App (macOS)                            |
|                                                  |
|  +--------------------------------------------+ |
|  |  Renderer Process (React + TypeScript)      | |
|  |                                             | |
|  |  +------------------+ +------------------+ | |
|  |  | Left Panel       | | Right Panel      | | |
|  |  | (Input Text)     | | (Corrected Text) | | |
|  |  | - macOS Dictation| | - LLM Output     | | |
|  |  | - Manual Edit    | | - Manual Edit    | | |
|  |  +------------------+ +------------------+ | |
|  |                                             | |
|  |  [Correct] button    [Copy] button          | |
|  +--------------------------------------------+ |
|                      |                           |
|  +--------------------------------------------+ |
|  |  Main Process                               | |
|  |  - IPC Handler                              | |
|  |  - LLM API Client                           | |
|  |    - LM Studio (OpenAI Compatible)          | |
|  |    - Gemini API                             | |
|  |  - Config (.env loader)                     | |
|  +--------------------------------------------+ |
+--------------------------------------------------+
```

---

## Out of Scope (v1)
- 音声のキャプチャ・録音機能（macOS ディクテーションに委任）
- 音声ファイルのアップロード
- 校正履歴の保存
- ファイルへのエクスポート（クリップボードコピーで代替）
- Windows / Linux 対応
