# Components

## Overview

Electron アプリケーションは Main Process と Renderer Process の2プロセス構成。
Preload Script を介した IPC 通信でプロセス間を接続する。

```
+-------------------------------------------------------+
|  Electron App                                         |
|                                                       |
|  +--------------------------------------------------+ |
|  |  Renderer Process (React + TypeScript)            | |
|  |                                                   | |
|  |  App                                              | |
|  |  +---------------------------------------------+ | |
|  |  | Header                                       | | |
|  |  | - Provider indicator                         | | |
|  |  | - Settings button                            | | |
|  |  +---------------------------------------------+ | |
|  |  | EditorPanel (Left)  | ResultPanel (Right)    | | |
|  |  | - TextArea          | - TextArea             | | |
|  |  | - Correct button    | - Copy button          | | |
|  |  +---------------------------------------------+ | |
|  |  | SettingsModal (overlay)                      | | |
|  |  | - Provider selector                          | | |
|  |  | - LM Studio config                           | | |
|  |  | - Gemini config                              | | |
|  |  +---------------------------------------------+ | |
|  +--------------------------------------------------+ |
|                       | IPC (via Preload)              |
|  +--------------------------------------------------+ |
|  |  Main Process                                     | |
|  |  +----------------+  +-------------------------+  | |
|  |  | ConfigManager  |  | LLMService              |  | |
|  |  | - .env loading |  | - Provider routing      |  | |
|  |  | - Settings R/W |  | - LMStudioProvider      |  | |
|  |  +----------------+  | - GeminiProvider        |  | |
|  |                       +-------------------------+  | |
|  |  +----------------+                               | |
|  |  | IPCHandler     |                               | |
|  |  | - Channel mgmt |                               | |
|  |  +----------------+                               | |
|  +--------------------------------------------------+ |
+-------------------------------------------------------+
```

---

## Main Process Components

### MP-1: IPCHandler

| Item | Detail |
|------|--------|
| **Purpose** | Renderer Process からの IPC リクエストを受信し、適切なサービスにルーティングする |
| **Responsibilities** | IPC チャネルの登録・管理、リクエストのバリデーション、レスポンスの返却 |
| **Interface** | Electron ipcMain.handle によるチャネルハンドラー |

### MP-2: LLMService

| Item | Detail |
|------|--------|
| **Purpose** | LLM プロバイダーへのリクエストを統一インターフェースで管理する |
| **Responsibilities** | アクティブなプロバイダーの選択・切り替え、校正リクエストの実行、エラーハンドリング |
| **Interface** | LLMProvider インターフェースを実装した各プロバイダーをルーティング |

### MP-3: LMStudioProvider

| Item | Detail |
|------|--------|
| **Purpose** | LM Studio API (OpenAI 互換) との通信を行う |
| **Responsibilities** | OpenAI 互換 API へのリクエスト送信、レスポンスのパース |
| **Interface** | LLMProvider インターフェースを実装 |

### MP-4: GeminiProvider

| Item | Detail |
|------|--------|
| **Purpose** | Google Gemini API との通信を行う |
| **Responsibilities** | Gemini API へのリクエスト送信、レスポンスのパース |
| **Interface** | LLMProvider インターフェースを実装 |

### MP-5: ConfigManager

| Item | Detail |
|------|--------|
| **Purpose** | アプリケーション設定（.env + ランタイム設定）を管理する |
| **Responsibilities** | .env ファイルの読み込み、設定値の取得・更新、設定のバリデーション |
| **Interface** | 設定値の get/set メソッド |

---

## Renderer Process Components

### RP-1: App

| Item | Detail |
|------|--------|
| **Purpose** | アプリケーションのルートコンポーネント |
| **Responsibilities** | 全体レイアウト管理、グローバル状態（入力テキスト、校正結果、設定）の保持 |
| **State** | inputText, correctedText, isLoading, error, settings, isSettingsOpen |

### RP-2: Header

| Item | Detail |
|------|--------|
| **Purpose** | アプリケーションヘッダー |
| **Responsibilities** | 現在のプロバイダー表示、設定画面へのアクセス |
| **Props** | currentProvider, onOpenSettings |

### RP-3: EditorPanel

| Item | Detail |
|------|--------|
| **Purpose** | 左パネル - テキスト入力エリア |
| **Responsibilities** | テキスト入力（ディクテーション / 手動）、校正ボタンの提供 |
| **Props** | value, onChange, onCorrect, isLoading |

### RP-4: ResultPanel

| Item | Detail |
|------|--------|
| **Purpose** | 右パネル - 校正結果表示エリア |
| **Responsibilities** | 校正結果の表示・編集、クリップボードコピー |
| **Props** | value, onChange, onCopy |

### RP-5: SettingsModal

| Item | Detail |
|------|--------|
| **Purpose** | LLM プロバイダー設定のモーダルダイアログ |
| **Responsibilities** | プロバイダー選択、接続先 URL / API キー / モデル名の入力・保存 |
| **Props** | isOpen, onClose, settings, onSave |

---

## Shared / Bridge

### BR-1: Preload Script

| Item | Detail |
|------|--------|
| **Purpose** | Main Process と Renderer Process の安全な橋渡し |
| **Responsibilities** | contextBridge による API 公開、許可された IPC チャネルのみ公開 |
| **Interface** | window.electronAPI として Renderer に公開 |
