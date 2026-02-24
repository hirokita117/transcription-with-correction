# Requirements Clarification Questions

回答を分析した結果、いくつかの曖昧な点が見つかりました。以下の確認質問にお答えください。

---

## Ambiguity 1: Macの文字起こし機能の具体的な利用方法
Q1で「マイクからのリアルタイム録音」を選択されましたが、Q2・Q10で「Macの純正の文字起こし機能を使いたい」と回答されています。
Macの文字起こし機能には複数の方式があるため、どのような使い方を想定しているか確認が必要です。

### Clarification Question 1
アプリ内での「Macの純正文字起こし機能」の利用イメージはどれに近いですか？

A) macOS のディクテーション機能（キーボードショートカットで起動し、テキストフィールドに直接入力される機能）をアプリ内のテキストエリアで使う。アプリ自体は音声処理をせず、テキスト入力を受け取るだけ。
B) Apple の Speech Recognition フレームワーク（SFSpeechRecognizer）をアプリ内で利用し、プログラムからマイク音声をキャプチャして文字起こしする。
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Ambiguity 2: LLMプロバイダーの切り替え
Q3で「LM Studio の API（ローカルLLM）か、Gemini の API」と回答されています。
両方をサポートする場合の使い方について確認が必要です。

### Clarification Question 2
LM Studio と Gemini API の利用方法はどちらを想定していますか？

A) 設定で切り替え可能にする（どちらか一方を選んで使う）
B) LM Studio をメインとし、Gemini API はフォールバック（ローカルLLMが使えない時の代替）
C) まずは Gemini API のみ対応し、LM Studio 対応は後から追加
D) まずは LM Studio のみ対応し、Gemini API 対応は後から追加
E) Other (please describe after [Answer]: tag below)

[Answer]: A
