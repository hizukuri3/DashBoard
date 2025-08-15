# Superstore Dashboard

## 概要

Superstore Dashboardは、Tableauデータソースからデータを取得し、美しいダッシュボードを表示するWebアプリケーションです。リアルタイムデータの可視化と分析機能を提供します。

## 機能

- 📊 インタラクティブなダッシュボード
- 🔄 リアルタイムデータ更新
- 📱 レスポンシブデザイン
- 🎨 モダンなUI/UX
- 📈 データ可視化チャート
- 🔍 データ検索・フィルタリング

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **データソース**: Tableau REST API
- **ビルドツール**: なし（バニラJS）
- **デプロイ**: GitHub Pages

## セットアップ

### 前提条件

- Node.js (v14以上)
- Git
- Tableau Server/Online アカウント

### インストール

1. リポジトリをクローン

```bash
git clone https://github.com/hizukuri3/SuperstoreDashboard.git
cd SuperstoreDashboard
```

2. 依存関係のインストール

```bash
npm install
```

3. 設定ファイルの作成

```bash
cp site/config.example.json site/config.json
```

4. 設定ファイルの編集
   `site/config.json`を開いて、Tableauの設定を入力してください。

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## 使用方法

### 1. データソースの設定

TableauデータソースのLUIDを取得し、設定ファイルに設定します。

### 2. ダッシュボードの表示

設定が完了すると、自動的にデータが読み込まれ、ダッシュボードが表示されます。

### 3. データの更新

データは定期的に自動更新されます。手動更新も可能です。

## プロジェクト構造

```
SuperstoreDashboard/
├── scripts/                 # Tableauデータ取得スクリプト
│   ├── tableau_fetch_by_luid.mjs
│   └── tableau_find_datasource_luid.mjs
├── site/                   # メインアプリケーション
│   ├── assets/            # 静的アセット
│   │   └── app.js        # メインJavaScriptファイル
│   ├── data/             # データファイル
│   │   ├── latest.json   # 最新データ
│   │   └── sample.json   # サンプルデータ
│   ├── config.example.json # 設定ファイル例
│   └── index.html        # メインHTMLファイル
├── tests/                 # テストファイル
├── .gitflow              # Gitフロー設定
├── BRANCH_RULES.md       # ブランチ命名規則
└── README.md             # このファイル
```

## 設定

### Tableau設定

`site/config.json`で以下の設定を行います：

```json
{
  "tableau": {
    "server": "your-tableau-server.com",
    "site": "your-site-name",
    "username": "your-username",
    "password": "your-password"
  }
}
```

### 環境変数

セキュリティのため、機密情報は環境変数として設定することを推奨します：

```bash
export TABLEAU_SERVER="your-tableau-server.com"
export TABLEAU_USERNAME="your-username"
export TABLEAU_PASSWORD="your-password"
```

## 開発

### ブランチ戦略

このプロジェクトはGitフローを使用しています：

- `main` - 本番環境用
- `develop` - 開発用統合ブランチ
- `feature/*` - 新機能開発
- `release/*` - リリース準備
- `hotfix/*` - 緊急修正

詳細は `BRANCH_RULES.md` を参照してください。

### 開発手順

1. `develop`ブランチから新しい機能ブランチを作成

```bash
git checkout develop
git checkout -b feature/新機能名
```

2. 開発・テスト
3. プルリクエストを作成
4. コードレビュー
5. `develop`ブランチにマージ

## テスト

```bash
npm test
```

## デプロイ

### GitHub Pages

```bash
npm run deploy
```

### 手動デプロイ

1. `main`ブランチにマージ
2. GitHub Pagesの設定でソースを`main`ブランチに設定

## トラブルシューティング

### よくある問題

1. **データが表示されない**
   - Tableauの設定を確認
   - ネットワーク接続を確認
   - ブラウザのコンソールでエラーを確認

2. **認証エラー**
   - ユーザー名・パスワードを確認
   - Tableauの権限設定を確認

3. **パフォーマンスの問題**
   - データサイズを確認
   - キャッシュ設定を確認

## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成
3. 変更をコミット
4. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

問題や質問がある場合は、GitHubのIssuesページで報告してください。

## 更新履歴

- **v1.0.0** - 初期リリース
- **v1.1.0** - ダッシュボード機能の追加
- **v1.2.0** - リアルタイム更新機能の追加

---

**注意**: このプロジェクトは開発中です。本番環境での使用前に十分なテストを行ってください。
