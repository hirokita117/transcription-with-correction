# Code Generation Plan - dictation-correction-app

## Unit Context

- **Project Type**: Greenfield single unit
- **Workspace Root**: ~/Developer/transcription-with-correction
- **Code Location**: Workspace root (`src/`, `tests/` etc.)
- **Technology Stack**: Electron + React + TypeScript + Vite + Tailwind CSS
- **Stories**: US-1 ~ US-6

## Story Traceability

| Step | Stories Covered |
|------|----------------|
| Step 1 | - (プロジェクト基盤) |
| Step 2 | US-1 (設定管理) |
| Step 3 | US-1, US-3 (LLM プロバイダー) |
| Step 4 | US-3 (IPC 通信) |
| Step 5 | US-2, US-3, US-4, US-5 (UI コンポーネント) |
| Step 6 | US-1 (設定画面) |
| Step 7 | US-6 (エラーハンドリング統合) |
| Step 8 | - (Electron エントリ) |
| Step 9 | US-1 ~ US-6 (テスト) |
| Step 10 | - (ドキュメント) |

---

## Generation Steps

### Step 1: Project Structure Setup & Configuration
- [ ] `package.json` - プロジェクト定義、依存関係、スクリプト
- [ ] `tsconfig.json` - TypeScript 設定（Main/Renderer 共通）
- [ ] `tsconfig.node.json` - Main Process 用 TypeScript 設定
- [ ] `vite.config.ts` - Vite ビルド設定（Electron + React）
- [ ] `tailwind.config.js` - Tailwind CSS 設定
- [ ] `postcss.config.js` - PostCSS 設定
- [ ] `.gitignore` - Git 除外設定（node_modules, dist, .env 等）
- [ ] `.env.example` - 環境変数テンプレート
- [ ] `electron-builder.json` - Electron ビルド設定（macOS）

**生成ファイル**: 9 files (workspace root)

### Step 2: Main Process - ConfigManager
- [ ] `src/main/services/config-manager.ts` - 設定管理サービス
  - .env 読み込み（dotenv）
  - electron-store による永続化
  - 設定の優先順位マージ（store > .env > defaults）
  - バリデーション（URL形式、必須項目、{text}プレースホルダー）

**Story**: US-1 (初回セットアップ)
**生成ファイル**: 1 file

### Step 3: Main Process - LLM Providers & Service
- [ ] `src/main/services/llm/types.ts` - LLMProvider インターフェース、型定義
- [ ] `src/main/services/llm/lm-studio-provider.ts` - LM Studio プロバイダー（OpenAI 互換 API）
- [ ] `src/main/services/llm/gemini-provider.ts` - Gemini プロバイダー（Google Generative AI）
- [ ] `src/main/services/llm/llm-service.ts` - LLMService（Strategy Pattern、プロバイダー管理）

**Story**: US-1 (プロバイダー設定), US-3 (LLM 校正)
**生成ファイル**: 4 files

### Step 4: Main Process - IPC Handler & Preload Script
- [ ] `src/main/ipc-handler.ts` - IPC チャネルハンドラー（correct-text, get-settings, save-settings）
- [ ] `src/preload/index.ts` - Preload Script（contextBridge 経由 API 公開）
- [ ] `src/shared/types.ts` - 共有型定義（Settings, CorrectionRequest, CorrectionResponse 等）

**Story**: US-3 (校正リクエスト/レスポンス)
**生成ファイル**: 3 files

### Step 5: Renderer Process - Core UI Components
- [ ] `src/renderer/index.html` - HTML エントリポイント
- [ ] `src/renderer/main.tsx` - React エントリポイント
- [ ] `src/renderer/index.css` - Tailwind CSS ベース + グローバルスタイル
- [ ] `src/renderer/App.tsx` - ルートコンポーネント（状態管理、レイアウト）
- [ ] `src/renderer/components/Header.tsx` - ヘッダー（プロバイダー表示、設定ボタン）
- [ ] `src/renderer/components/EditorPanel.tsx` - 左パネル（テキスト入力、校正ボタン、コピーボタン）
- [ ] `src/renderer/components/ResultPanel.tsx` - 右パネル（校正結果、コピーボタン）

**Story**: US-2 (テキスト入力), US-3 (校正実行), US-4 (結果確認), US-5 (コピー)
**生成ファイル**: 7 files

### Step 6: Renderer Process - Settings Modal
- [ ] `src/renderer/components/SettingsModal.tsx` - 設定モーダル（プロバイダー選択、接続設定、プロンプトテンプレート編集）

**Story**: US-1 (初回セットアップ、プロバイダー切り替え)
**生成ファイル**: 1 file

### Step 7: Error Handling Integration
- [ ] エラーバナー UI を App.tsx に統合
- [ ] LLMService のエラーハンドリング確認（CONNECTION_ERROR, AUTH_ERROR, API_ERROR 等）
- [ ] PROVIDER_NOT_CONFIGURED 時の設定画面誘導

**Story**: US-6 (エラー対応)
**生成ファイル**: 0 files (既存ファイルへの統合)

### Step 8: Electron Main Entry
- [ ] `src/main/index.ts` - Electron メインエントリ（BrowserWindow 生成、IPCHandler 登録、アプリライフサイクル）

**生成ファイル**: 1 file

### Step 9: Unit Tests
- [ ] `tests/main/services/config-manager.test.ts` - ConfigManager テスト
- [ ] `tests/main/services/llm/llm-service.test.ts` - LLMService テスト
- [ ] `tests/main/services/llm/lm-studio-provider.test.ts` - LMStudioProvider テスト
- [ ] `tests/main/services/llm/gemini-provider.test.ts` - GeminiProvider テスト
- [ ] `tests/main/ipc-handler.test.ts` - IPCHandler テスト
- [ ] `tests/renderer/App.test.tsx` - App コンポーネントテスト
- [ ] `tests/renderer/components/SettingsModal.test.tsx` - SettingsModal テスト

**テストフレームワーク**: Vitest + React Testing Library
**生成ファイル**: 7 files

### Step 10: Documentation & Summary
- [ ] `aidlc-docs/construction/dictation-correction-app/code/code-summary.md` - コード生成サマリー
- [ ] `README.md` 更新 - セットアップ手順、使用方法

**生成ファイル**: 2 files

---

## File Summary

| Category | Count | Location |
|----------|-------|----------|
| Config / Setup | 9 | workspace root |
| Main Process | 7 | src/main/ |
| Preload | 1 | src/preload/ |
| Shared Types | 1 | src/shared/ |
| Renderer Process | 8 | src/renderer/ |
| Tests | 7 | tests/ |
| Documentation | 2 | workspace root + aidlc-docs/ |
| **Total** | **35** | |

## Dependencies

```json
{
  "dependencies": {
    "electron-store": "^8.x",
    "dotenv": "^16.x",
    "@google/generative-ai": "^0.x",
    "react": "^19.x",
    "react-dom": "^19.x"
  },
  "devDependencies": {
    "electron": "^33.x",
    "electron-builder": "^25.x",
    "typescript": "^5.x",
    "vite": "^6.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^4.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x",
    "vitest": "^2.x",
    "@testing-library/react": "^16.x",
    "@testing-library/jest-dom": "^6.x",
    "jsdom": "^25.x"
  }
}
```

**Note**: LM Studio は OpenAI 互換 API のため、`fetch` で直接通信（openai パッケージ不使用、依存を最小化）。
