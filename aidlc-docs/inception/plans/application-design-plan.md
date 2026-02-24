# Application Design Plan

## Design Scope
音声ディクテーション校正 Electron アプリケーションのコンポーネント設計・サービス層設計・依存関係定義

## Plan Steps

### Phase 1: コンポーネント識別
- [x] Main Process コンポーネントの定義（IPC Handler, LLM Client, Config Manager）
- [x] Renderer Process コンポーネントの定義（UI コンポーネント階層）
- [x] Preload Script の責務定義

### Phase 2: コンポーネントメソッド定義
- [x] LLM Client のメソッドシグネチャ定義（プロバイダー共通インターフェース）
- [x] IPC Handler のチャネル・メソッド定義
- [x] Config Manager のメソッド定義
- [x] React コンポーネントの props / state インターフェース定義

### Phase 3: サービス層設計
- [x] LLM サービスのオーケストレーション設計（プロバイダー切り替え）
- [x] 校正リクエスト/レスポンスのデータフロー設計

### Phase 4: コンポーネント依存関係
- [x] コンポーネント間の依存関係マッピング
- [x] IPC 通信パターンの定義
- [x] データフロー図の作成

### Phase 5: 成果物生成
- [x] components.md の生成
- [x] component-methods.md の生成
- [x] services.md の生成
- [x] component-dependency.md の生成
- [x] 設計の整合性・完全性の検証

---

## Design Questions

以下の質問に回答をお願いします。ファイル内の `[Answer]:` タグに直接回答を記入してください。

### Q1: React の状態管理アプローチ
この規模のアプリケーション（2カラムUI + 設定画面）での状態管理はどのアプローチが望ましいですか？

- A) React useState/useReducer のみ（ライブラリ追加なし、シンプル）
- B) Zustand（軽量な状態管理ライブラリ）
- C) Jotai（アトミックな状態管理）
- D) お任せ（アプリの規模に最適なものを選択）

[Answer]: D

### Q2: 設定画面の UI パターン
LLM プロバイダーの設定画面はどのような形式が望ましいですか？

- A) モーダルダイアログ（メイン画面上にオーバーレイ表示）
- B) サイドパネル（メイン画面の横にスライドイン）
- C) ヘッダー/ツールバー内のドロップダウン
- D) お任せ（UX として最適なものを選択）

[Answer]: A

### Q3: LLM プロバイダーの拡張性
現在は LM Studio と Gemini の2つですが、将来的な拡張性をどの程度考慮しますか？

- A) 2プロバイダー固定で設計（シンプル優先）
- B) プロバイダーを追加しやすいインターフェース設計にする（適度な抽象化）
- C) プラグイン的に追加できる拡張ポイントを用意する（高い拡張性）

[Answer]: B

### Q4: CSS スタイリング手法
UI のスタイリングにはどのアプローチが望ましいですか？

- A) CSS Modules（スコープ付き CSS、追加ライブラリ不要）
- B) Tailwind CSS（ユーティリティファースト）
- C) styled-components / Emotion（CSS-in-JS）
- D) お任せ（プロジェクトに最適なものを選択）

[Answer]: B
