# Prompting 実装タスク

## 概要

LLM へのプロンプト生成実装。デフォルト整形プロンプトのテンプレート設計、オプション設定のマージ、カスタム指示の統合。

## デフォルト整形プロンプト

### 基本プロンプトテンプレート

```
あなたは文字起こし文の整形専門家です。以下のテキストを整形してください。

【整形ルール】
1. 誤字脱字を補正する
2. 自然な句読点を追加する
3. 重複する語句を適切に削減する
4. 意味を変えない範囲で自然な文章にする
5. 固有名詞は文脈から推定する

【入力テキスト】
{originalText}

【出力形式】
整形後のテキストのみを出力してください。理由や説明は不要です。
```

## タスク: デフォルトプロンプトテンプレートを実装する

### 説明
基本的な整形プロンプトのテンプレートを実装する。

### DoD
- [ ] デフォルトプロンプトテンプレートが実装されている
- [ ] テンプレート変数の置換が実装されている
- [ ] プロンプトのバリデーションが実装されている
- [ ] プロンプトの長さ制限が実装されている（最大5000文字）

### API/IPC契約
```typescript
interface PromptTemplate {
  system: string;
  user: string;
}

function generateDefaultPrompt(originalText: string): PromptTemplate {
  return {
    system: 'あなたは文字起こし文の整形専門家です。',
    user: `以下のテキストを整形してください。\n\n【整形ルール】\n1. 誤字脱字を補正する\n2. 自然な句読点を追加する\n3. 重複する語句を適切に削減する\n4. 意味を変えない範囲で自然な文章にする\n5. 固有名詞は文脈から推定する\n\n【入力テキスト】\n${originalText}\n\n【出力形式】\n整形後のテキストのみを出力してください。理由や説明は不要です。`,
  };
}
```

### リスク/対策
- **リスク**: プロンプトの長さ超過
- **対策**: プロンプトの長さ制限とバリデーション

### 見積/依存
- **見積**: 2時間
- **依存**: なし

### テスト観点
- プロンプト生成の動作確認
- プロンプトの長さ制限の確認

## タスク: オプション設定のマージを実装する

### 説明
フィラー除去、段落推定、箇条書き化などのオプション設定をプロンプトに反映する。

### DoD
- [ ] オプション設定のマージが実装されている
- [ ] 各オプションに対応するプロンプト追加が実装されている
- [ ] オプションの組み合わせが適切に処理されている
- [ ] プロンプトのバリデーションが実装されている

### API/IPC契約
```typescript
interface FormatOptions {
  removeFillers?: boolean;
  inferParagraphs?: boolean;
  makeBulletPoints?: boolean;
  customInstruction?: string;
}

function mergeOptions(
  basePrompt: PromptTemplate,
  options: FormatOptions
): PromptTemplate {
  const additionalRules: string[] = [];
  
  if (options.removeFillers) {
    additionalRules.push('6. 「えー」「あの」などのフィラーを除去する');
  }
  
  if (options.inferParagraphs) {
    additionalRules.push('7. 文脈から段落を推定し、適切に改行を挿入する');
  }
  
  if (options.makeBulletPoints) {
    additionalRules.push('8. 箇条書きが適切な場合は箇条書き形式に変換する');
  }
  
  if (options.customInstruction) {
    additionalRules.push(`9. ${options.customInstruction}`);
  }
  
  // プロンプトに追加ルールをマージ
  const mergedUserPrompt = basePrompt.user.replace(
    '【整形ルール】',
    `【整形ルール】\n${additionalRules.join('\n')}`
  );
  
  return {
    system: basePrompt.system,
    user: mergedUserPrompt,
  };
}
```

### リスク/対策
- **リスク**: オプションの競合
- **対策**: オプションの優先順位とバリデーション

### 見積/依存
- **見積**: 3時間
- **依存**: prompting.md（デフォルトプロンプト）

### テスト観点
- 各オプションの動作確認
- オプションの組み合わせの動作確認

## タスク: カスタム指示の統合を実装する

### 説明
ユーザーが入力したカスタム指示をプロンプトに統合する。

### DoD
- [ ] カスタム指示の入力が実装されている
- [ ] カスタム指示のバリデーションが実装されている（最大500文字）
- [ ] カスタム指示のプロンプトへの統合が実装されている
- [ ] カスタム指示のサニタイズが実装されている

### API/IPC契約
- `FormatOptions.customInstruction` を使用

### リスク/対策
- **リスク**: カスタム指示によるプロンプトインジェクション
- **対策**: サニタイズとバリデーション

### 見積/依存
- **見積**: 2時間
- **依存**: prompting.md（オプション設定のマージ）

### テスト観点
- カスタム指示の動作確認
- サニタイズの動作確認

## タスク: プロンプトのバリデーションを実装する

### 説明
プロンプトの長さ、内容、形式をバリデーションする。

### DoD
- [ ] プロンプトの長さバリデーションが実装されている（最大5000文字）
- [ ] プロンプトの内容バリデーションが実装されている
- [ ] プロンプトの形式バリデーションが実装されている
- [ ] バリデーションエラーのメッセージが実装されている

### API/IPC契約
```typescript
interface PromptValidationResult {
  valid: boolean;
  errors: string[];
}

function validatePrompt(prompt: PromptTemplate): PromptValidationResult {
  const errors: string[] = [];
  
  if (prompt.user.length > 5000) {
    errors.push('プロンプトが長すぎます（最大5000文字）');
  }
  
  if (!prompt.user.includes('{originalText}')) {
    errors.push('プロンプトに {originalText} が含まれていません');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### リスク/対策
- **リスク**: 不正なプロンプトによるエラー
- **対策**: 厳格なバリデーション

### 見積/依存
- **見積**: 2時間
- **依存**: prompting.md（デフォルトプロンプト）

### テスト観点
- バリデーションの動作確認
- エラーメッセージの確認

## タスク: プロンプトテンプレートのカスタマイズ機能を実装する（オプション）

### 説明
ユーザーがプロンプトテンプレートをカスタマイズできる機能を実装する。

### DoD
- [ ] プロンプトテンプレートの編集UIが実装されている
- [ ] プロンプトテンプレートの保存が実装されている
- [ ] プロンプトテンプレートの読み込みが実装されている
- [ ] プロンプトテンプレートのバリデーションが実装されている

### API/IPC契約
- `store:set` を使用してプロンプトテンプレートを保存

### リスク/対策
- **リスク**: カスタムプロンプトによる予期しない動作
- **対策**: バリデーションと警告表示

### 見積/依存
- **見積**: 3時間
- **依存**: prompting.md（プロンプトバリデーション）, persistence.md

### テスト観点
- プロンプトテンプレートの編集/保存/読み込みの動作確認

