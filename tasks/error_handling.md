# Error Handling 実装タスク

## 概要

アプリケーション全体のエラーハンドリング実装。ネットワークエラー、LLMエラー、バリデーションエラー、UIエラーの統一的な処理。

## エラー分類

### ネットワークエラー
- `NETWORK_ERROR`: ネットワーク接続エラー
- `NETWORK_TIMEOUT`: ネットワークタイムアウト
- `NETWORK_UNREACHABLE`: ネットワーク到達不可

### LLMエラー
- `LLM_MODEL_NOT_FOUND`: モデルが見つからない
- `LLM_RATE_LIMIT`: レート制限エラー
- `LLM_INVALID_RESPONSE`: 無効なレスポンス
- `LLM_PROVIDER_ERROR`: プロバイダー固有のエラー

### バリデーションエラー
- `VALIDATION_ERROR`: バリデーションエラー
- `INVALID_MODEL_ID`: 無効なモデルID
- `TEXT_TOO_LONG`: テキストが長すぎる
- `TEXT_EMPTY`: テキストが空

### ストレージエラー
- `STORAGE_ERROR`: ストレージエラー
- `STORAGE_QUOTA_EXCEEDED`: ストレージクォータ超過

### その他
- `UNKNOWN_ERROR`: 未知のエラー

## タスク: エラーハンドリングの統一インターフェースを実装する

### 説明
アプリケーション全体で使用する統一的なエラーハンドリングインターフェースを実装する。

### DoD
- [ ] エラー型の定義が実装されている
- [ ] エラーコードの定義が実装されている
- [ ] エラーメッセージの生成が実装されている
- [ ] エラーのログ記録が実装されている

### API/IPC契約
```typescript
// エラー型
interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
  context?: Record<string, unknown>;
}

// エラークラス
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// エラーハンドラー
function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError('UNKNOWN_ERROR', error.message, error);
  }
  
  return new AppError('UNKNOWN_ERROR', 'Unknown error occurred', error);
}
```

### リスク/対策
- **リスク**: エラー情報の欠落
- **対策**: 統一インターフェースとログ記録

### 見積/依存
- **見積**: 2時間
- **依存**: なし

### テスト観点
- エラーハンドリングの動作確認
- エラーログの確認

## タスク: ネットワークエラーのハンドリングを実装する

### 説明
ネットワークエラー（接続エラー、タイムアウト）のハンドリングを実装する。

### DoD
- [ ] ネットワークエラーの検出が実装されている
- [ ] ネットワークエラーのリトライ処理が実装されている
- [ ] ネットワークエラーのユーザー通知が実装されている
- [ ] ネットワークエラーのログ記録が実装されている

### API/IPC契約
```typescript
// ネットワークエラーのハンドリング
async function handleNetworkError(
  error: unknown,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<AppError> {
  const appError = handleError(error);
  
  if (appError.code === 'NETWORK_ERROR' || appError.code === 'NETWORK_TIMEOUT') {
    if (retryCount < maxRetries) {
      // 指数バックオフでリトライ
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      // リトライ処理（呼び出し元で実装）
    } else {
      // リトライ上限に達した場合のエラー処理
      return new AppError(
        'NETWORK_ERROR',
        'ネットワークエラーが発生しました。接続を確認してください。',
        appError.details,
        { retryCount, maxRetries }
      );
    }
  }
  
  return appError;
}
```

### リスク/対策
- **リスク**: ネットワークエラーによる無限リトライ
- **対策**: リトライ回数の制限とタイムアウト設定

### 見積/依存
- **見積**: 3時間
- **依存**: error_handling.md（統一インターフェース）

### テスト観点
- ネットワークエラーの検出確認
- リトライ処理の動作確認

## タスク: LLMエラーのハンドリングを実装する

### 説明
LLMエラー（モデル未找到、レート制限、無効なレスポンス）のハンドリングを実装する。

### DoD
- [ ] LLMエラーの検出が実装されている
- [ ] LLMエラーのユーザー通知が実装されている
- [ ] LLMエラーのログ記録が実装されている
- [ ] LLMエラーのリトライ処理が実装されている（レート制限の場合）

### API/IPC契約
```typescript
// LLMエラーのハンドリング
function handleLLMError(error: unknown): AppError {
  const appError = handleError(error);
  
  switch (appError.code) {
    case 'LLM_MODEL_NOT_FOUND':
      return new AppError(
        'LLM_MODEL_NOT_FOUND',
        '選択されたモデルが見つかりません。モデル一覧を確認してください。',
        appError.details
      );
    
    case 'LLM_RATE_LIMIT':
      return new AppError(
        'LLM_RATE_LIMIT',
        'レート制限に達しました。しばらく待ってから再試行してください。',
        appError.details
      );
    
    case 'LLM_INVALID_RESPONSE':
      return new AppError(
        'LLM_INVALID_RESPONSE',
        'LLMからの無効なレスポンスが返されました。',
        appError.details
      );
    
    default:
      return appError;
  }
}
```

### リスク/対策
- **リスク**: LLMエラーによる予期しない動作
- **対策**: エラーの分類と適切な処理

### 見積/依存
- **見積**: 3時間
- **依存**: error_handling.md（統一インターフェース）

### テスト観点
- LLMエラーの検出確認
- ユーザー通知の動作確認

## タスク: バリデーションエラーのハンドリングを実装する

### 説明
バリデーションエラー（無効な入力、テキストが長すぎる）のハンドリングを実装する。

### DoD
- [ ] バリデーションエラーの検出が実装されている
- [ ] バリデーションエラーのユーザー通知が実装されている
- [ ] バリデーションエラーのUI表示が実装されている
- [ ] バリデーションエラーのログ記録が実装されている

### API/IPC契約
```typescript
// バリデーションエラーのハンドリング
function handleValidationError(error: unknown): AppError {
  const appError = handleError(error);
  
  switch (appError.code) {
    case 'TEXT_TOO_LONG':
      return new AppError(
        'TEXT_TOO_LONG',
        `テキストが長すぎます（最大${appError.details?.maxLength || 20000}文字）`,
        appError.details
      );
    
    case 'TEXT_EMPTY':
      return new AppError(
        'TEXT_EMPTY',
        'テキストが空です。',
        appError.details
      );
    
    case 'INVALID_MODEL_ID':
      return new AppError(
        'INVALID_MODEL_ID',
        '無効なモデルIDです。',
        appError.details
      );
    
    default:
      return appError;
  }
}
```

### リスク/対策
- **リスク**: バリデーションエラーによるユーザー体験の低下
- **対策**: 明確なエラーメッセージとUI表示

### 見積/依存
- **見積**: 2時間
- **依存**: error_handling.md（統一インターフェース）

### テスト観点
- バリデーションエラーの検出確認
- UI表示の動作確認

## タスク: UIエラーハンドリングを実装する

### 説明
UIエラー（トースト通知、エラーダイアログ）のハンドリングを実装する。

### DoD
- [ ] トースト通知の表示が実装されている
- [ ] エラーダイアログの表示が実装されている
- [ ] エラーメッセージのユーザーフレンドリーな表示が実装されている
- [ ] エラー発生時のUI無効化が実装されている

### API/IPC契約
```typescript
// UIエラーハンドリング
function showErrorToast(error: AppError): void {
  // トースト通知の表示
  // 例: react-hot-toast を使用
  toast.error(error.message, {
    duration: 5000,
    position: 'top-right',
  });
}

function showErrorDialog(error: AppError): void {
  // エラーダイアログの表示
  // 例: Electron の dialog.showMessageBox を使用
  dialog.showMessageBox({
    type: 'error',
    title: 'エラー',
    message: error.message,
    detail: error.details ? String(error.details) : undefined,
  });
}
```

### リスク/対策
- **リスク**: エラーメッセージの不適切な表示
- **対策**: ユーザーフレンドリーなメッセージとUI設計

### 見積/依存
- **見積**: 3時間
- **依存**: error_handling.md（統一インターフェース）, renderer_ui.md

### テスト観点
- トースト通知の動作確認
- エラーダイアログの動作確認

## タスク: エラーログ記録を実装する

### 説明
エラーのログ記録（ファイル出力、コンソール出力）を実装する。

### DoD
- [ ] エラーログの記録が実装されている
- [ ] ログファイルの出力が実装されている
- [ ] ログレベルの管理が実装されている
- [ ] ログのローテーションが実装されている（オプション）

### API/IPC契約
```typescript
// エラーログ記録
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

function logError(error: AppError): void {
  const logDir = path.join(app.getPath('userData'), 'logs');
  const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
  
  // ログディレクトリの作成
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // ログの書き込み
  const logEntry = {
    timestamp: new Date().toISOString(),
    code: error.code,
    message: error.message,
    details: error.details,
    context: error.context,
    stack: error.stack,
  };
  
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  
  // コンソール出力
  console.error('Error:', logEntry);
}
```

### リスク/対策
- **リスク**: ログファイルの肥大化
- **対策**: ログのローテーションとクリーンアップ

### 見積/依存
- **見積**: 2時間
- **依存**: error_handling.md（統一インターフェース）

### テスト観点
- ログ記録の動作確認
- ログファイルの出力確認

## タスク: グローバルエラーハンドラーを実装する

### 説明
アプリケーション全体のグローバルエラーハンドラーを実装する。

### DoD
- [ ] 未処理エラーのキャッチが実装されている
- [ ] プロセスクラッシュのハンドリングが実装されている
- [ ] エラーの統一的な処理が実装されている
- [ ] エラーのログ記録が実装されている

### API/IPC契約
```typescript
// グローバルエラーハンドラー
process.on('uncaughtException', (error: Error) => {
  const appError = handleError(error);
  logError(appError);
  showErrorDialog(appError);
});

process.on('unhandledRejection', (reason: unknown) => {
  const appError = handleError(reason);
  logError(appError);
  showErrorToast(appError);
});
```

### リスク/対策
- **リスク**: 未処理エラーによるクラッシュ
- **対策**: グローバルエラーハンドラーとログ記録

### 見積/依存
- **見積**: 2時間
- **依存**: error_handling.md（統一インターフェース）, error_handling.md（エラーログ記録）

### テスト観点
- 未処理エラーのキャッチ確認
- エラーログの確認

