# NumPuzz - 数独Webアプリケーション

NumPuzzは、数独（ナンプレ）を楽しむためのWebアプリケーションです。画像から数独問題を読み取り、ゲームとして楽しんだり、AIヒント機能を使って解法を学ぶことができます。Google Gemini 2.5 Flash APIを使用した高精度な画像認識とAIアシスタント機能を搭載しています。

## 主な機能

- 📷 **画像から数独読み取り**: スマホで撮影した数独問題を自動で読み取り
- 🎮 **インタラクティブゲーム**: ブラウザ上で数独をプレイ
- 🤖 **AIヒント機能**: 次の手を提案し、解法テクニックを学習
- 📝 **メモ機能**: 候補数字をメモとして記録
- 🏆 **進捗管理**: ゲームの進捗をリアルタイムで表示

## デモ

アプリケーションは以下のURLで体験できます：
[https://your-domain.pages.dev](https://your-domain.pages.dev)

## 技術スタック

- **フロントエンド**: React, TypeScript, Tailwind CSS
- **バックエンド**: Hono, Cloudflare Workers
- **AI**: Google Gemini 2.5 Flash API
- **認証**: OIDC (Google OAuth)
- **デプロイ**: Cloudflare Pages

## セットアップ

### 必要条件

- Node.js (v18以上推奨)
- Google Gemini API キー
- Google OAuth クライアントID

### ローカル開発環境の構築

1. リポジトリをクローンします：

```bash
git clone <repository-url>
cd NumPuzz
```

2. 依存パッケージをインストールします：

```bash
npm install
```

3. 環境変数を設定します：

`.example.dev.vars`をコピーして`.dev.vars`ファイルを作成します：

```bash
cp .example.dev.vars .dev.vars
```

`.dev.vars`ファイルを編集し、以下の環境変数を設定します：

```bash
# Google Gemini APIキー（必須）
# https://aistudio.google.com/app/apikey で取得
GEMINI_API_KEY=your_actual_gemini_api_key_here

# OIDC認証設定（必須）
# セッション暗号化用のランダム文字列を生成
OIDC_AUTH_SECRET=your_random_secret_string_here

# Google OAuth設定（Google Cloud Consoleで取得）
OIDC_ISSUER=https://accounts.google.com
OIDC_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
OIDC_CLIENT_SECRET=your_google_oauth_client_secret

# リダイレクトURI（ローカル開発用）
OIDC_REDIRECT_URI=http://localhost:5173/callback

# アクセス許可ユーザー（カンマ区切り）
ALLOW_USERS=your-email@gmail.com,another-user@example.com
```

### 環境変数の詳細設定

#### 1. Google Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. 「Create API Key」をクリック
3. 生成されたAPIキーを`GEMINI_API_KEY`に設定

#### 2. Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. 「APIs & Services」 > 「Credentials」 に移動
4. 「Create Credentials」 > 「OAuth 2.0 Client IDs」 を選択
5. Application type: 「Web application」
6. Authorized redirect URIsに以下を追加：
   - ローカル開発: `http://localhost:5173/callback`
   - 本番環境: `https://your-domain.pages.dev/callback`
7. 生成されたクライアントIDとシークレットを設定

#### 3. セッションシークレットの生成

以下のコマンドでランダムなシークレットを生成します：

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

4. 開発サーバーを起動します：

```bash
npm run dev
```

5. ブラウザで `http://localhost:5173` を開いてアプリケーションを体験します。

## 使い方

### Webアプリケーション

1. **ログイン**: Googleアカウントでログインします
2. **画像アップロード**: 数独問題の画像をアップロードします
3. **自動読み取り**: AIが画像から数独グリッドを読み取ります
4. **ゲームプレイ**: ブラウザ上で数独を解いていきます
5. **AIヒント**: 困ったときはAIヒントボタンで次の手を提案してもらえます

### CLIツール（テスト用）

開発やテスト目的で、コマンドラインから画像解析機能を単体でテストすることもできます：

```bash
node analyze-sudoku-image.ts <画像ファイルのパス>
```

例：
```bash
node analyze-sudoku-image.ts ./sudoku-sample.jpg
```

出力例：
```json
{
  "success": true,
  "grid": [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ],
  "confidence": 0.95
}
```

## デプロイ

### Cloudflare Pagesへのデプロイ

1. プロダクションビルド：

```bash
npm run build
```

2. Cloudflare Pagesへデプロイ：

```bash
npm run deploy
```

### 本番環境の環境変数設定

Cloudflare Pagesのダッシュボードで以下の環境変数を設定してください：

| 変数名 | 説明 | 例 |
|---------|------|----|
| `GEMINI_API_KEY` | Google Gemini APIキー | `AIzaSyC...` |
| `OIDC_AUTH_SECRET` | セッション暗号化用シークレット | `abc123...` |
| `OIDC_ISSUER` | OIDCプロバイダーURL | `https://accounts.google.com` |
| `OIDC_CLIENT_ID` | Google OAuthクライアントID | `123456789.apps.googleusercontent.com` |
| `OIDC_CLIENT_SECRET` | Google OAuthクライアントシークレット | `GOCSPX-...` |
| `OIDC_REDIRECT_URI` | OAuthリダイレクトURI | `https://your-domain.pages.dev/callback` |
| `ALLOW_USERS` | アクセス許可ユーザーメール | `user1@example.com,user2@example.com` |

**注意**: 本番環境では`OIDC_REDIRECT_URI`を実際のドメインURLに変更してください。

## 注意事項

### 画像読み取りについて

- サポートされている画像形式: JPG, PNG
- 推奨される画像品質:
  - 明るく鮮明な画像
  - 数独グリッド全体が写っているもの
  - 正面から撮影されたもの（斜めからの角度ではない）
  - 数字がはっきりと読み取れるもの

### セキュリティ

- Google OAuthで認証されたユーザーのみアクセス可能
- `ALLOW_USERS`環境変数でアクセスを制限
- アップロードされた画像は一時的な処理のみで保存されません

## トラブルシューティング

### よくある問題

#### 1. 「exports is not defined」エラー

**原因**: Google AIパッケージのSSR互換性問題

**解決方法**: 以下のコマンドでnode_modulesをクリアして再インストール

```bash
rm -rf node_modules package-lock.json
npm install
```

#### 2. 認証エラー

**原因**: OAuth設定の不備または間違い

**確認項目**:
- Google Cloud ConsoleでリダイレクトURIが正しく設定されているか
- `OIDC_CLIENT_ID`と`OIDC_CLIENT_SECRET`が正しいか
- `ALLOW_USERS`にログインしようとしているメールアドレスが含まれているか

#### 3. 画像読み取り精度が低い

**改善方法**:
- 明るい場所で撮影する
- 数独グリッド全体がフレームに入るように撮影
- 正面から撮影し、斜めの角度を避ける
- 手書きの数字がはっきりと読み取れるようにする

#### 4. ローカル開発でポートエラー

**原因**: ポート5173が使用中

**解決方法**:
```bash
# 使用中のプロセスを終了
pkill -f "vite"
# 再度開発サーバーを起動
npm run dev
```

### ログの確認方法

ローカル開発時はコンソールでエラーログを確認できます。本番環境ではCloudflare Workersのログを確認してください。

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。改善提案やバグ報告がありましたら、お気軽にGitHubのIssuesでお知らせください。

### 開発に参加する場合

1. リポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成