# PR #11 レビュー対応コード修正 解説ドキュメント

https://github.com/hirokita117/transcription-with-correction/pull/11

## 目次

1. [O-1: Reactのクロージャ問題 — 古いinputTextを参照するバグ](#o-1-reactのクロージャ問題--古いinputtextを参照するバグ)
2. [O-2: 音声認識が終了しても「録音中」のまま残るバグ](#o-2-音声認識が終了しても録音中のまま残るバグ)
3. [O-3: クリーン環境でビルドが失敗する](#o-3-クリーン環境でビルドが失敗する)
4. [G-1: エラーを握りつぶしているcatchブロック](#g-1-エラーを握りつぶしているcatchブロック)
5. [G-2: 永遠に空文字を返す変数（デッドコード）](#g-2-永遠に空文字を返す変数デッドコード)
6. [G-3: 存在しないmacOSバージョンのチェック](#g-3-存在しないmacosバージョンのチェック)
7. [G-4: Reactのstate更新関数内で副作用を実行するアンチパターン](#g-4-reactのstate更新関数内で副作用を実行するアンチパターン)
8. [G-5: string型ではなくリテラルユニオン型にする](#g-5-string型ではなくリテラルユニオン型にする)

---

## O-1: Reactのクロージャ問題 — 古いinputTextを参照するバグ

**ファイル**: `src/renderer/App.tsx`  
**重要度**: High（実際に誤動作する）

### PHPとの違いを理解する

PHP では変数を使うとき、常に「そのときの最新の値」が取れます：

```php
// PHP: 変数は常に最新値を参照する
$text = "最初のテキスト";
$text = "更新後のテキスト"; // 上書き

$callback = function() use (&$text) {  // &をつければ参照渡し
    echo $text; // "更新後のテキスト"
};
$callback();
```

一方 JavaScript の `useCallback` は、**関数を作った時点の変数の値をコピーして閉じ込めます（クロージャ）**。

### 現在（修正前）のコードで何が起きているか

```typescript
// App.tsx（修正前）

// 1. handleCorrect は useCallback で作られている
//    → 作成時点の inputText を「閉じ込めて」いる
const handleCorrect = useCallback(async () => {
  if (!inputText.trim()) {  // ← この inputText は「作成時点」の値
    ...
  }
  const response = await window.electronAPI.correctText({
    text: inputText,  // ← ここも同様
    ...
  });
}, [inputText, settings]);  // inputText が変わると関数が再作成される

// 2. 音声入力が終わったとき：
//    (a) onFinalResult で setInputText(text) を呼ぶ
//    (b) 直後に onAutoCorrect を呼ぶ
//    (c) onAutoCorrect 内で setTimeout → handleCorrect() を呼ぶ
onFinalResult: useCallback((text: string) => {
  setInputText(text);  // ← React の state 更新をリクエスト
}, []),
onAutoCorrect: useCallback(() => {
  setTimeout(() => {
    handleCorrect();  // ← この時点の handleCorrect は古い inputText を持つ
  }, 100);
}, [handleCorrect]),
```

**問題の流れ**:

```
[音声認識が完了]
    ↓
setInputText("新しいテキスト")   ← Reactにstateの更新をリクエストするだけ
    ↓                             ← 実際の画面反映は「後で」行われる
onAutoCorrect() が呼ばれる
    ↓
setTimeout(100ms) → handleCorrect()
    ↓
handleCorrect の中の inputText は「古い値（空文字）」のまま
    ↓
「校正するテキストを入力してください」エラーが出る（または前回の音声を校正してしまう）
```

`setTimeout` の 100ms は「なんとなく待てば大丈夫だろう」という場当たり的な対応ですが、
React のレンダリングタイミングは保証されていないため、根本的な解決になっていません。

### 修正後のコード

テキストを引数として直接渡すことで、クロージャの問題を回避します：

```typescript
// App.tsx（修正後）

// handleCorrect に text 引数を追加
const handleCorrect = useCallback(async (textToCorrect?: string) => {
  const text = textToCorrect ?? inputText;  // 引数があれば優先、なければstateを使う
  if (!text.trim()) {
    setError({ type: 'EMPTY_TEXT', message: '校正するテキストを入力してください' });
    return;
  }
  ...
  const response = await window.electronAPI.correctText({
    text: text,  // ← state ではなく引数の値を使う
    ...
  });
}, [inputText, settings]);

// onAutoCorrect はテキストを受け取って直接渡す
onAutoCorrect: useCallback((text: string) => {
  handleCorrect(text);  // ← setInputText の完了を待たず、直接テキストを渡す
}, [handleCorrect]),
```

**修正後の流れ**:

```
[音声認識が完了]
    ↓
setInputText("新しいテキスト")   ← 画面表示の更新（非同期でOK）
onAutoCorrect("新しいテキスト")  ← テキストを直接渡す
    ↓
handleCorrect("新しいテキスト")  ← state に依存しないので確実
    ↓
正しいテキストで校正が実行される ✓
```

---

## O-2: 音声認識が終了しても「録音中」のまま残るバグ

**ファイル**: `swift-helper/SpeechHelper/Sources/SpeechHelper/SpeechRecognizer.swift`  
**重要度**: High（次回の音声入力が使えなくなる）

### 現在（修正前）のコードの問題

```swift
// SpeechRecognizer.swift（修正前）

// stop() メソッド — ユーザーが停止ボタンを押したとき
func stop() {
    guard isRunning else { return }
    recognitionRequest?.endAudio()
    audioEngine?.stop()
    audioEngine?.inputNode.removeTap(onBus: 0)
    recognitionRequest = nil
    audioEngine = nil
    isRunning = false                              // ← ① フラグをリセット
    sendOutput(makeStatusMessage(status: "stopped")) // ← ② "stopped"をElectronに通知
}

// cleanup() — 音声認識が「自動的に」完了したとき（isFinal）に呼ばれる
private func cleanup() {
    recognitionTask = nil
    recognitionRequest = nil
    audioEngine = nil
    // ← ① isRunning = false がない！
    // ← ② "stopped" の通知がない！
}

// 音声認識の結果コールバック
recognitionTask = recognizer.recognitionTask(with: request) { result, error in
    if let result = result {
        let isFinal = result.isFinal
        self.sendOutput(makeResultMessage(text: text, isFinal: isFinal))

        if isFinal {
            Task { await self.cleanup() }  // ← cleanup() だけ呼んでいる
        }
    }
}
```

**問題の流れ（自動終了の場合）**:

```
[ユーザーが話し終わり、音声認識が自然完了]
    ↓
isFinal = true → cleanup() が呼ばれる
    ↓
cleanup() は recognitionTask などをクリアするだけ
isRunning は true のまま
"stopped" の通知は送られない
    ↓
次回 start() を呼ぶと → guard !isRunning else { return } で弾かれる
                        → "ALREADY_RUNNING" エラーが出て開始できない
    ↓
UIは "listening" 状態のまま（停止ボタンが表示されたまま）
```

PHP に例えると：

```php
// 修正前の動作イメージ（PHP風）
class SpeechRecognizer {
    private bool $isRunning = false;

    public function stop(): void {
        $this->isRunning = false;   // フラグをリセット
        $this->notifyElectron('stopped');  // UIに通知
    }

    // 自動終了時のクリーンアップ
    private function cleanup(): void {
        // タスクのクリア だけ して、isRunning のリセットを忘れている！
        // notifyElectron を呼ぶのも忘れている！
    }
}
```

### 修正後のコード

```swift
// SpeechRecognizer.swift（修正後）

private func cleanup() {
    isRunning = false                               // ← 追加: フラグをリセット
    sendOutput(makeStatusMessage(status: "stopped")) // ← 追加: UIに通知
    recognitionTask = nil
    recognitionRequest = nil
    audioEngine = nil
}
```

これで `stop()` と `cleanup()` が同じ状態遷移を保証するようになります。

---

## O-3: クリーン環境でビルドが失敗する

**ファイル**: `package.json`  
**重要度**: Medium（CI/CDや他の開発者の環境で問題）

### 現在（修正前）の状態

```json
// package.json（修正前）
{
  "scripts": {
    "build": "tsc && vite build && electron-builder",
    "build:swift": "cd swift-helper/SpeechHelper && swift build -c release"
  }
}
```

`build` スクリプトが Swift ヘルパーのビルドを含んでいません。

**問題の流れ**:

```
新しい開発者がリポジトリをクローンした
    ↓
npm run build を実行
    ↓
TypeScript と Vite のビルドは成功
electron-builder がアプリをパッケージング
    ↓
SpeechHelper バイナリが存在しない（ビルドしていないから）
    ↓
音声入力機能が動かないアプリが出来上がる
（エラーも出ないのでなぜ動かないか分からない）
```

### 修正後のコード

```json
// package.json（修正後）
{
  "scripts": {
    "build": "build:swift && tsc && vite build && electron-builder"
  }
}
```

`&&` でチェーンすることで、Swift のビルドが失敗したら後続の処理も止まります。  
PHP の `composer` + `make` を使うプロジェクトで `make build` に `composer install` と `make compile` を両方入れるのと同じ発想です。

---

## G-1: エラーを握りつぶしているcatchブロック

**ファイル**: `src/main/services/speech-service.ts`  
**重要度**: High（デバッグが著しく困難になる）

### 現在（修正前）のコード

```typescript
// speech-service.ts（修正前）
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const message = JSON.parse(line) as SpeechHelperMessage;
    this.handleMessage(message);
  } catch {
    // Ignore malformed lines  ← エラーを完全に無視
  }
}
```

### なぜ問題か

Swift ヘルパーから送られてくる JSON が壊れていた場合、このコードは**何もしないまま握りつぶします**。  
開発者がログを見ても、何が起きたか一切わかりません。

PHP に例えると：

```php
// こんなコードを書いたら怒られますよね
try {
    $data = json_decode($line, true, 512, JSON_THROW_ON_ERROR);
    $this->handleMessage($data);
} catch (JsonException $e) {
    // 完全に無視。本当に何も書かない。
}
```

### 修正後のコード

```typescript
// speech-service.ts（修正後）
} catch (e) {
  console.error('Failed to parse JSON from SpeechHelper:', line, e);
}
```

エラーの内容と、どの行がパースできなかったかをログに出力するだけです。  
処理自体は続けて良い（次の行の処理に影響しない）ので、throw はしません。

---

## G-2: 永遠に空文字を返す変数（デッドコード）

**ファイル**: `src/renderer/hooks/useVoiceInput.ts`  
**重要度**: Medium（バグではないが混乱を招く）

### 現在（修正前）のコード

```typescript
// useVoiceInput.ts（修正前）
const unsubResult = window.electronAPI.onTranscriptionResult((result: TranscriptionResult) => {
  if (result.isFinal) {
    const separator = accumulatedFinalRef.current ? '' : '';  // ← 問題の行
    accumulatedFinalRef.current = result.text;
    ...
  }
});
```

**問題**: 三項演算子の `真の場合` と `偽の場合` がどちらも `''`（空文字）です。

```
条件が true  → ''（空文字）
条件が false → ''（空文字）
→ separator は常に '' しかならない
→ しかも separator は使われていない（宣言後、どこにも使っていない）
```

恐らく開発中に「複数の音声認識結果を結合するときに区切り文字を入れよう」という意図で書かれたが、
最終的に使わない実装になったにもかかわらず変数だけ残ってしまったコードと思われます。

### 修正後のコード

```typescript
// useVoiceInput.ts（修正後）
if (result.isFinal) {
  // separator の行を削除
  accumulatedFinalRef.current = result.text;
  ...
}
```

1行削除するだけです。コードを読む人が「この separator は何のために存在するのか？」と悩まずに済みます。

---

## G-3: 存在しないmacOSバージョンのチェック

**ファイル**: `swift-helper/SpeechHelper/Sources/SpeechHelper/SpeechRecognizer.swift`  
**重要度**: Medium（機能が使われないまま残る）

### 現在（修正前）のコード

```swift
// SpeechRecognizer.swift（修正前）
let request = SFSpeechAudioBufferRecognitionRequest()
request.shouldReportPartialResults = true

if #available(macOS 26.0, *) {    // ← macOS 26.0 は存在しない！（2026年3月現在）
    request.addsPunctuation = true // ← この行が実行されることは絶対にない
}
```

### なぜ問題か

`addsPunctuation` は macOS 13.0 以上で使える機能です。  
このプロジェクトは macOS 15.0 以上を要件としているため、バージョンチェック自体が不要です。

- `addsPunctuation` が使えるのは macOS **13.0+**
- プロジェクトの最低要件は macOS **15.0**（15.0 ≥ 13.0 なので常に使える）

PHP に例えると：

```php
// こんなコードと同じ
if (PHP_VERSION >= '999.0') {
    // この中は絶対に実行されない
    mb_detect_encoding($text);  // ← 使いたい機能がここに閉じ込められている
}
```

### 修正後のコード

```swift
// SpeechRecognizer.swift（修正後）
let request = SFSpeechAudioBufferRecognitionRequest()
request.shouldReportPartialResults = true
request.addsPunctuation = true  // ← 直接有効化（macOS 15.0以上で使えるので条件不要）
```

---

## G-4: Reactのstate更新関数内で副作用を実行するアンチパターン

**ファイル**: `src/renderer/hooks/useVoiceInput.ts`  
**重要度**: Medium（将来的に予期しない二重実行が起きる）

### 現在（修正前）のコード

```typescript
// useVoiceInput.ts（修正前）
const unsubShortcut = window.electronAPI.onVoiceInputShortcut(() => {
  // キーボードショートカットが押されたとき
  setStatus((prev) => {  // ← React の state 更新関数
    if (prev === 'idle' || prev === 'error') {
      accumulatedFinalRef.current = '';
      pendingAutoCorrectRef.current = false;
      window.electronAPI.startVoiceInput();  // ← ❌ state更新関数の中で副作用！
      return prev;
    } else if (prev === 'listening') {
      window.electronAPI.stopVoiceInput();   // ← ❌ 同上
      return prev;
    }
    return prev;
  });
});
```

### なぜ問題か

React の `setStatus((prev) => ...)` の `prev => ...` 関数は「**次の state を計算するだけの純粋な関数**」であるべきです。

PHP に例えると、`array_map()` のコールバックの中でデータベースを更新するようなものです：

```php
// これは書いたらまずいですよね
$results = array_map(function($item) {
    $db->update('table', ['value' => $item]); // ← 副作用！array_mapの中に書くな
    return $item * 2;
}, $items);
```

**なぜ state 更新関数の中で副作用を呼んではいけないのか**:

React の開発モード（StrictMode）では、バグを検出するために state 更新関数を**意図的に2回呼びます**。
つまり `window.electronAPI.startVoiceInput()` が2回実行される可能性があります。

また、別の問題として：

```typescript
// toggleVoiceInput というほぼ同じ処理がすでに存在する
const toggleVoiceInput = useCallback(() => {
  if (status === 'idle' || status === 'error') {
    accumulatedFinalRef.current = '';
    pendingAutoCorrectRef.current = false;
    window.electronAPI.startVoiceInput();
  } else if (status === 'listening') {
    window.electronAPI.stopVoiceInput();
  }
}, [status]);
```

ショートカットハンドラと `toggleVoiceInput` がほぼ同じロジックを持っており、**コードが重複しています**。

### 修正後のコード

`toggleVoiceInput` を `useRef` で保持して、ショートカットハンドラから呼び出します：

```typescript
// useVoiceInput.ts（修正後）

// toggleVoiceInput の最新版を ref で保持する
const toggleVoiceInputRef = useRef<() => void>(() => {});

// toggleVoiceInput の定義（変わらず）
const toggleVoiceInput = useCallback(() => {
  if (status === 'idle' || status === 'error') {
    accumulatedFinalRef.current = '';
    pendingAutoCorrectRef.current = false;
    window.electronAPI.startVoiceInput();
  } else if (status === 'listening') {
    window.electronAPI.stopVoiceInput();
  }
}, [status]);

// ref を常に最新に保つ
useEffect(() => {
  toggleVoiceInputRef.current = toggleVoiceInput;
}, [toggleVoiceInput]);

// ショートカットハンドラ：ref を通じて呼び出す
const unsubShortcut = window.electronAPI.onVoiceInputShortcut(() => {
  toggleVoiceInputRef.current(); // ← シンプル！副作用なし、重複なし
});
```

**なぜ ref を使うのか**: ショートカットのリスナーは `useEffect` の初回実行時に登録されます。
もしそのまま `toggleVoiceInput` を呼ぼうとすると、登録時点の古い関数を参照し続けます（O-1と同じクロージャ問題）。
ref に入れておくと「ref の中の関数」は常に最新に保てます。

---

## G-5: string型ではなくリテラルユニオン型にする

**ファイル**: `src/shared/types.ts`  
**重要度**: Medium（型安全性の向上）

### 現在（修正前）のコード

```typescript
// types.ts（修正前）
export interface SpeechHelperStatusMessage {
  type: 'status';
  data: { status: string };  // ← string 型: どんな文字列でも通る
}
```

### なぜ問題か

`string` 型では、例えば `status: "runnning"` （typo）でも TypeScript は文句を言いません。

PHP に例えると、`enum` を使わずに `string` でステータスを管理するようなものです：

```php
// 修正前: どんな文字列でも代入できてしまう
function handleStatus(string $status): void {
    if ($status === 'ready') { ... }
    if ($status === 'listening') { ... }
}

handleStatus('runnning'); // typo してもエラーにならない
```

```typescript
// TypeScript での話: string型はなんでも通る
const msg: SpeechHelperStatusMessage = {
  type: 'status',
  data: { status: 'runnning' }  // typo してもエラーにならない
};
```

### 修正後のコード

```typescript
// types.ts（修正後）
export interface SpeechHelperStatusMessage {
  type: 'status';
  data: { status: 'ready' | 'listening' | 'stopped' };  // ← この3つだけ許可
}
```

PHP の `enum` と同じ発想です：

```php
// PHP 8.1以降のenum
enum SpeechStatus: string {
    case Ready = 'ready';
    case Listening = 'listening';
    case Stopped = 'stopped';
}
```

修正後は、`'runnning'` のような存在しない値を渡すと TypeScript がビルド時にエラーを出してくれます。  
また、`handleStatusMessage` メソッドで `switch` 文を書くとき、漏れがあれば IDE が警告してくれるようになります。

---

## まとめ：修正の優先度と性質


| #   | 修正                   | 性質        | 修正しないと                    |
| --- | -------------------- | --------- | ------------------------- |
| O-1 | クロージャ問題の修正           | バグ修正      | 自動校正が空テキスト／古いテキストを校正してしまう |
| O-2 | isFinal時の状態遷移        | バグ修正      | 音声入力が2回目以降使えなくなる          |
| O-3 | ビルドスクリプトの修正          | 設定修正      | CI/CD やクリーン環境でビルドが不完全になる  |
| G-1 | 空catchにログ追加          | デバッグ改善    | JSONパースエラーが無音で握りつぶされる     |
| G-2 | 未使用変数の削除             | コード整理     | 読む人を混乱させる（実害はない）          |
| G-3 | 不正バージョンチェック削除        | バグ修正      | 句読点の自動付与機能が永遠に無効のまま       |
| G-4 | ショートカットハンドラのリファクタリング | アンチパターン解消 | StrictModeで二重実行される可能性     |
| G-5 | string→リテラルユニオン型     | 型安全性向上    | typoを実行時まで検出できない          |


