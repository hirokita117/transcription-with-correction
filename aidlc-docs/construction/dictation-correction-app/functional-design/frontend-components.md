# Frontend Components - Functional Design

## FC-1: App (Root Component)

### 状態管理
```typescript
// useState で管理する状態
const [inputText, setInputText] = useState('');
const [correctedText, setCorrectedText] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [settings, setSettings] = useState<Settings | null>(null);
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
```

### 状態遷移図
```
[初期状態] ---(useEffect)---> [設定読み込み中]
  |                               |
  v                               v
[設定読み込み完了] <------------- [settings に値セット]
  |
  v
[テキスト入力可能] ---(校正ボタン)---> [校正処理中]
  |                                       |
  |                          +------------+------------+
  |                          |                         |
  |                          v                         v
  |                    [校正成功]                 [校正失敗]
  |                    correctedText更新          error更新
  |                          |                         |
  v                          v                         v
[テキスト入力可能] <-------- [結果表示中] <-------- [エラー表示中]
```

### メソッド詳細

**handleCorrect()**:
1. inputText が空の場合 → エラー表示して return
2. setIsLoading(true), setError(null)
3. settings から promptTemplate を取得
4. window.electronAPI.correctText({ text: inputText, promptTemplate })
5. 成功: setCorrectedText(response.correctedText)
6. 失敗: setError(response.error.message)
7. setIsLoading(false)

**handleSaveSettings(newSettings)**:
1. window.electronAPI.saveSettings(newSettings)
2. setSettings(newSettings)
3. setIsSettingsOpen(false)

**handleCopy(text, setCopied)**:
1. navigator.clipboard.writeText(text)
2. setCopied(true)
3. setTimeout(() => setCopied(false), 2000)

---

## FC-2: Header

### Props
```typescript
interface HeaderProps {
  currentProvider: ProviderType | null;
  onOpenSettings: () => void;
  isLoading: boolean;
}
```

### 表示ロジック
- プロバイダー表示: `currentProvider` に応じて "LM Studio" or "Gemini" を表示
- settings === null の場合: "未設定" と表示
- 設定ボタン: isLoading === true の場合は disabled（校正中の設定変更防止）

---

## FC-3: EditorPanel (Left Panel)

### Props
```typescript
interface EditorPanelProps {
  value: string;
  onChange: (text: string) => void;
  onCorrect: () => void;
  onCopy: () => void;
  isLoading: boolean;
  canCopy: boolean;
}
```

### ユーザーインタラクション
| Action | Handler | UI Feedback |
|--------|---------|-------------|
| テキスト入力/編集 | onChange | テキストエリア内容更新 |
| 校正ボタン押下 | onCorrect | ボタン disabled + ローディング表示 |
| コピーボタン押下 | onCopy | 「コピー完了」フィードバック |

### UI 要素
- **TextArea**: 自由入力エリア。macOS ディクテーション入力対応（標準 textarea で自動対応）
- **校正ボタン**: `isLoading ? 'Loading spinner + 校正中...' : '校正'`。isLoading 中は disabled
- **コピーボタン**: canCopy === false の場合は disabled

---

## FC-4: ResultPanel (Right Panel)

### Props
```typescript
interface ResultPanelProps {
  value: string;
  onChange: (text: string) => void;
  onCopy: () => void;
  canCopy: boolean;
}
```

### ユーザーインタラクション
| Action | Handler | UI Feedback |
|--------|---------|-------------|
| テキスト編集 | onChange | テキストエリア内容更新 |
| コピーボタン押下 | onCopy | 「コピー完了」フィードバック |

### UI 要素
- **TextArea**: 校正結果表示＆編集エリア。初期状態はプレースホルダー表示
- **コピーボタン**: canCopy === false の場合は disabled

---

## FC-5: SettingsModal

### Props
```typescript
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}
```

### ローカル状態
```typescript
// モーダル内で編集中の設定値（保存まで親に反映しない）
const [localSettings, setLocalSettings] = useState<Settings>(settings);
const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
```

### フォーム構成

**プロバイダー選択セクション**:
- ラジオボタン: LM Studio / Gemini
- 選択に応じて対応する設定フォームを表示

**LM Studio 設定フォーム** (activeProvider === 'lm-studio' で表示):
| Field | Input Type | Validation |
|-------|-----------|------------|
| Endpoint URL | text input | URL 形式チェック |
| Model Name | text input | 任意（空文字許容） |

**Gemini 設定フォーム** (activeProvider === 'gemini' で表示):
| Field | Input Type | Validation |
|-------|-----------|------------|
| API Key | password input | 空文字チェック |
| Model Name | text input | 空文字チェック |

**プロンプトテンプレートセクション** (常に表示):
| Field | Input Type | Validation |
|-------|-----------|------------|
| Prompt Template | textarea (5行程度) | {text} プレースホルダー存在チェック |
| Reset Button | button | デフォルトテンプレートに復帰 |

**アクションボタン**:
- **保存**: バリデーション → 成功時 onSave(localSettings) → モーダルクローズ
- **キャンセル**: 変更を破棄して onClose()

### バリデーションフロー
```
保存ボタン押下
  |
  v
[1] activeProvider の設定をバリデーション
  - LM Studio: endpointUrl の URL 形式チェック
  - Gemini: apiKey の空文字チェック、modelName の空文字チェック
  |
  v
[2] プロンプトテンプレートの {text} チェック
  |
  v
[3] エラーあり → validationErrors を表示
    エラーなし → onSave(localSettings)
```

### モーダル開閉時の動作
- **開く**: props.settings を localSettings にコピー（編集用のローカルコピー）
- **閉じる（キャンセル）**: localSettings を破棄
- **閉じる（保存）**: バリデーション成功後に onSave を呼び出し

---

## FC-6: エラーバナー

### 表示条件
- error !== null の場合に表示
- App コンポーネント内にインライン表示（別コンポーネントとして分離しない）

### UI 要素
- エラーメッセージテキスト
- 閉じるボタン（setError(null)）
- PROVIDER_NOT_CONFIGURED の場合: 「設定を開く」ボタン（setIsSettingsOpen(true)）

---

## レイアウト構成

```
+-------------------------------------------------------+
| Header                                                |
| [Provider: LM Studio]                    [Settings]   |
+-------------------------------------------------------+
| Error Banner (conditional)                            |
| [エラーメッセージ]                         [x close]   |
+---------------------------+---------------------------+
| EditorPanel (Left)        | ResultPanel (Right)       |
|                           |                           |
| +----------------------+  | +----------------------+  |
| | TextArea             |  | | TextArea             |  |
| |                      |  | |                      |  |
| |                      |  | |                      |  |
| +----------------------+  | +----------------------+  |
|                           |                           |
| [Copy] [Correct]         | [Copy]                    |
+---------------------------+---------------------------+
+-------------------------------------------------------+
| SettingsModal (overlay, conditional)                  |
| +---------------------------------------------------+ |
| | Provider: ( ) LM Studio  ( ) Gemini               | |
| | [Provider-specific settings]                       | |
| | Prompt Template: [textarea]        [Reset Default] | |
| | [Cancel]                                    [Save] | |
| +---------------------------------------------------+ |
+-------------------------------------------------------+
```
