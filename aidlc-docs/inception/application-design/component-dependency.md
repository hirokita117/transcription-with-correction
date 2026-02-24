# Component Dependencies

## Dependency Matrix

| Component | Depends On | Depended By |
|-----------|-----------|-------------|
| **App** | Header, EditorPanel, ResultPanel, SettingsModal, ElectronAPI | - |
| **Header** | - | App |
| **EditorPanel** | - | App |
| **ResultPanel** | - | App |
| **SettingsModal** | - | App |
| **Preload Script** | ipcRenderer | App (via ElectronAPI) |
| **IPCHandler** | LLMService, ConfigManager | Preload Script (via ipcMain) |
| **LLMService** | LMStudioProvider, GeminiProvider, ConfigManager | IPCHandler |
| **LMStudioProvider** | LLMProvider interface | LLMService |
| **GeminiProvider** | LLMProvider interface | LLMService |
| **ConfigManager** | electron-store, dotenv | LLMService, IPCHandler |

---

## Communication Patterns

### IPC Channels

| Channel | Direction | Data | Purpose |
|---------|-----------|------|---------|
| `correct-text` | Renderer -> Main -> Renderer | Request: string, Response: string | テキスト校正 |
| `get-settings` | Renderer -> Main -> Renderer | Response: Settings | 設定取得 |
| `save-settings` | Renderer -> Main -> Renderer | Request: Settings, Response: void | 設定保存 |

### Communication Method
- すべて `ipcMain.handle` / `ipcRenderer.invoke` パターン（Promise ベース）
- contextBridge 経由で安全に公開

---

## Data Flow

### 校正フロー
```
EditorPanel -> App -> ElectronAPI -> Preload -> IPC -> IPCHandler -> LLMService -> Provider -> External API
                                                                                                    |
ResultPanel <- App <- ElectronAPI <- Preload <- IPC <- IPCHandler <- LLMService <- Provider <-------+
```

### 設定フロー
```
SettingsModal -> App -> ElectronAPI -> Preload -> IPC -> IPCHandler -> ConfigManager -> electron-store
                                                                              |
                                                                              v
                                                                        LLMService (provider update)
```

---

## External Dependencies

| Package | Purpose | Used By |
|---------|---------|---------|
| `electron` | アプリケーションフレームワーク | Main Process, Preload |
| `react`, `react-dom` | UI フレームワーク | Renderer Process |
| `typescript` | 型安全性 | 全体 |
| `vite` | ビルドツール | ビルドパイプライン |
| `tailwindcss` | CSS スタイリング | Renderer Process |
| `electron-store` | 設定永続化 | ConfigManager |
| `dotenv` | .env 読み込み | ConfigManager |
| `openai` (or fetch) | LM Studio API 通信 | LMStudioProvider |
| `@google/generative-ai` | Gemini API 通信 | GeminiProvider |
