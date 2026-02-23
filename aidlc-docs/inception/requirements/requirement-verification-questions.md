# Requirements Clarification Questions

音声入力 → 文字起こし → LLM校正 Electronアプリの要件を明確にするために、以下の質問にお答えください。
各質問の `[Answer]:` タグの後に、該当する選択肢のアルファベットを記入してください。

---

## Question 1
音声入力の方式はどれを想定していますか？

A) マイクからのリアルタイム録音（アプリ内で録音ボタンを押して録音）
B) 既存の音声ファイル（.wav, .mp3等）をアップロードして文字起こし
C) 両方（リアルタイム録音 + ファイルアップロード）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
文字起こし（Speech-to-Text）に使用するAPIはどれを想定していますか？

A) OpenAI Whisper API（クラウド）
B) Whisper モデルをローカルで実行（whisper.cpp等）
C) Google Cloud Speech-to-Text
D) 特に決めていない（おすすめを提案してほしい）
E) Other (please describe after [Answer]: tag below)

[Answer]: E
文字起こしには、 mac の純正の文字起こし機能を使いたいです

---

## Question 3
誤字脱字修正に使用するLLMはどれを想定していますか？

A) Claude API（Anthropic）
B) OpenAI GPT API
C) ローカルLLM（Ollama等）
D) 特に決めていない（おすすめを提案してほしい）
E) Other (please describe after [Answer]: tag below)

[Answer]: E
LM Studio の API（ローカル LLM）か、 Gemini の API を利用したいです

---

## Question 4
対象言語（文字起こし・校正する言語）は何ですか？

A) 日本語のみ
B) 英語のみ
C) 日本語と英語の両方
D) 多言語対応（3言語以上）
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 5
校正後のテキストに対して、ユーザーはどのような操作を行いたいですか？

A) 表示のみ（読み取り専用で確認）
B) 手動編集可能（校正結果を手動で修正できる）
C) 手動編集 + クリップボードへコピー
D) 手動編集 + ファイル保存（.txt, .md等へエクスポート）
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 6
UIのデザインイメージはどのようなものですか？

A) シンプル・ミニマル（録音ボタン + テキスト表示のみ）
B) 2カラム表示（左: 元の文字起こし、右: 校正後テキスト）
C) ステップ形式（録音 → 文字起こし確認 → 校正 → 結果の順に進む）
D) 特に決めていない（おすすめを提案してほしい）
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 7
APIキーの管理方法はどうしますか？

A) アプリの設定画面からユーザーが自分のAPIキーを入力する
B) 環境変数（.env ファイル）で管理する
C) 特に決めていない（おすすめを提案してほしい）
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 8
対象プラットフォーム（OS）はどれですか？

A) macOS のみ
B) Windows のみ
C) macOS + Windows
D) macOS + Windows + Linux
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9
使用する技術スタック（フロントエンド）について希望はありますか？

A) React + TypeScript
B) Vue.js + TypeScript
C) Svelte + TypeScript
D) 特に決めていない（おすすめを提案してほしい）
E) Other (please describe after [Answer]: tag below)

[Answer]: E
2026年2月現在で、デファクトスタンダードな構成が良いかなと思います。
ただ、 Vue はやめたいです

---

## Question 10
文字起こしの処理はリアルタイム（話しながら逐次表示）が必要ですか？

A) はい、リアルタイムで逐次表示したい
B) いいえ、録音完了後にまとめて文字起こしすればよい
C) 将来的にはリアルタイム対応したいが、初回はまとめて処理でよい
D) Other (please describe after [Answer]: tag below)

[Answer]: D
クエスチョン2で答えたように、文字起こし自体は mac の純正機能を利用する想定です
