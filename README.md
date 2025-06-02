# NumPuzz 

写真から数独問題を作成できるスマートフォン向けナンプレアプリ

## 🌟 特徴

### 📷 写真から問題作成
- 雑誌や新聞のナンプレを写真で撮影
- Gemini AIによる自動数字認識
- 認識結果の手動修正機能

### 🎯 快適なゲーム体験
- スマートフォン最適化UI
- セル選択時の関連ハイライト
  - 同じ行・列・ブロック
  - 同じ数字のセル
- メモ機能（候補数字の記録）
- エラー検出とリアルタイム表示

### 💾 自動保存機能
- 進行状況の自動保存
- ブラウザを閉じても続きから再開
- LocalStorage使用（サーバー不要）

### ⚡ 高性能
- Cloudflare Workers & Pages対応
- 高速レスポンス
- オフライン対応

## 🚀 デモ

[Live Demo](https://your-app-url.pages.dev) （デプロイ後のURLに変更）

## 🛠️ 技術スタック

### フロントエンド
- **Framework**: [HonoX](https://github.com/honojs/honox)
- **Runtime**: React 18
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **TypeScript**: 完全型安全

### バックエンド
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **AI**: Google Gemini API
- **Storage**: LocalStorage

### 開発・デプロイ
- **Package Manager**: npm
- **Deployment**: Cloudflare Pages
- **Development**: Wrangler

## 📦 インストール

### 前提条件
- Node.js 18以上
- npm または yarn

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/your-username/numpuzz.git
cd numpuzz

# 依存関係をインストール
npm install

# 環境変数を設定
cp .example.dev.vars .dev.vars
# .dev.vars を編集してGemini APIキーを設定
```

### 環境変数

`.dev.vars` ファイルを作成し、以下を設定：

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 開発サーバー起動

```bash
# Vite開発サーバー
npm run dev

# Wrangler開発サーバー（API機能用）
npm run build
npx wrangler pages dev dist --local --port 8787
```

## 🎮 使用方法

### 1. 写真から問題作成
1. メイン画面の「📷 写真から問題作成」をクリック
2. `/create` ページで写真をアップロード
3. AI解析結果を確認・修正
4. 「この問題で開始」でゲーム開始

### 2. 問題を解く
1. セルをタップして選択
2. 数字ボタンで入力
3. メモモードで候補数字を記録
4. 自動保存で進行状況を保持

### 3. 編集機能
- **UIモード**: クリック&タップで直感的編集
- **テキストモード**: 数独文字列の直接編集

## 🔧 開発

### プロジェクト構成

```
├── app/
│   ├── islands/          # クライアントサイドコンポーネント
│   │   ├── SudokuGame.tsx
│   │   ├── SudokuBoard.tsx
│   │   ├── PhotoUpload.tsx
│   │   └── PuzzleEditor.tsx
│   ├── routes/           # ページルート
│   │   ├── index.tsx     # メインゲーム画面
│   │   ├── create.tsx    # 問題作成画面
│   │   └── api/          # APIエンドポイント
│   │       └── analyze-image.ts
│   ├── utils/            # ユーティリティ
│   │   └── sudoku.ts     # 数独ロジック
│   └── types/            # 型定義
│       └── env.ts
├── public/               # 静的ファイル
├── dist/                 # ビルド出力
└── wrangler.jsonc        # Cloudflare設定
```

### 主要コンポーネント

#### `SudokuGame.tsx`
- メインゲームロジック
- 状態管理（進行状況、メモ、エラー）
- 自動保存機能

#### `SudokuBoard.tsx`
- 9x9グリッドの表示
- セル選択とハイライト
- メモ数字の表示

#### `PhotoUpload.tsx`
- 画像アップロード
- Gemini API連携
- プレビュー機能

#### `PuzzleEditor.tsx`
- UI/テキスト両対応の編集機能
- リアルタイム検証
- 数独ソルバー連携

### APIエンドポイント

#### `POST /api/analyze-image`
写真から数独問題を解析

```typescript
// リクエスト
{
  "image": "base64_encoded_image"
}

// レスポンス
{
  "success": true,
  "grid": number[][],
  "confidence": number,
  "originalResponse": string
}
```

## 🚀 デプロイ

### Cloudflare Pages

```bash
# ビルド
npm run build

# デプロイ
npx wrangler pages deploy dist
```

### 環境変数設定

Cloudflare Dashboardで以下を設定：
- `GEMINI_API_KEY`: Google Gemini APIキー

## 🧪 テスト

```bash
# ビルドテスト
npm run build

# プレビュー
npm run preview
```

## 📱 対応ブラウザ

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+


## 🙏 謝辞

- [HonoX](https://github.com/honojs/honox) - 素晴らしいフルスタックフレームワーク
- [Google Gemini](https://ai.google.dev/) - 画像認識AI
- [Cloudflare](https://www.cloudflare.com/) - ホスティングプラットフォーム
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク

