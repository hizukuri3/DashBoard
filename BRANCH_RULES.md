# ブランチ命名規則

## ブランチの種類

### 1. メインブランチ

- `main` - 本番環境用の安定版ブランチ
- `develop` - 開発用の統合ブランチ

### 2. 作業ブランチ

- `feature/機能名` - 新機能開発用
- `release/バージョン` - リリース準備用
- `hotfix/修正内容` - 緊急修正用
- `support/サポート内容` - サポート用

## 命名規則

### Feature ブランチ

```
feature/機能名-詳細
例：
- feature/user-authentication
- feature/dashboard-analytics
- feature/api-integration
```

### Release ブランチ

```
release/バージョン番号
例：
- release/v1.0.0
- release/v1.1.0
```

### Hotfix ブランチ

```
hotfix/修正内容
例：
- hotfix/security-patch
- hotfix/critical-bug-fix
```

## ブランチ作成手順

1. 新しい機能開発を開始する場合：

   ```bash
   git checkout -b feature/機能名
   ```

2. リリース準備を開始する場合：

   ```bash
   git checkout -b release/v1.0.0
   ```

3. 緊急修正を開始する場合：
   ```bash
   git checkout -b hotfix/修正内容
   ```

## ブランチマージ手順

1. Feature ブランチ → Develop ブランチ
2. Develop ブランチ → Release ブランチ（または Main ブランチから Hotfix ブランチ）
3. Release ブランチ → Main ブランチ（PR、--no-ff）
4. Hotfix ブランチ → Main ブランチ（PR、--no-ff）

## 注意事項

- ブランチ名は小文字とハイフンを使用
- 日本語は使用しない
- ブランチ名は具体的で分かりやすくする
- 作業完了後は必ずブランチを削除する

## リリースフロー標準

1. `develop` から `release/x.y.z` を作成
2. `release/**` 上ではリリースブロッカーのみ修正（CIは push 対象）
3. `release/x.y.z -> main` のPRを作成し、`--no-ff` でマージ（履歴を残す）
4. `main` へ push されたら自動で `vX.Y.Z` タグを作成（Actions: auto-tag-on-main）
5. `main -> develop` のPRを作成しバックマージ（hotfixも同様に main の変更を取り込む）
6. マージ後は `release/*` ブランチを削除（Actionsのcleanupで自動削除）

## CI/CD トリガー

- CI: PR（`develop`, `main`）および push（`feature/**`, `release/**`, `hotfix/**`）で実行
- Pages デプロイ: `release/**` と `hotfix/**` への push で実行（`site/` を公開）
- タグ付け: `main` への push 時に `package.json` の `version` をもとに `vX.Y.Z` を作成
