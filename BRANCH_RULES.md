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

#### 1 branch = 1 feature（重要ルール）

- 1つの `feature/*` ブランチには「1機能」だけを含める
- 複数機能をまとめない（レビュー・ロールバック・リリースの安全性向上）
- 別機能が発生したら新しい `feature/*` を切る

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

1. Feature ブランチ（1 branch = 1 feature） → Develop ブランチ
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

### バージョニング/タグ付け 重要ルール（忘れ防止）

- リリース/ホットフィックスを`main`へマージする前に、必ず`package.json`の`version`を対象バージョン（例: 1.2.3）へ更新してコミットする
  - タグは`main`の`package.json`を参照して自動生成されるため、バージョン未更新だとタグが付与されない
- タグは`main`へのpushをトリガーに自動作成される（`vX.Y.Z`）。手動でタグ作成は不要
- ワークフロー定義（`.github/workflows/auto-tag-on-main.yml`）は`main`上の内容が実行される。ブランチ側で修正した場合は、先に`main`へ取り込むこと

### ホットフィックス チェックリスト

1. `hotfix/x.y.z-内容` ブランチを作成
2. 変更をコミット（必要に応じてセキュリティ/設定のハードコーディング排除）
3. `package.json` の `version` を `x.y.z` に更新してコミット
4. PR: `hotfix/x.y.z -> main`（`--no-ff`）
5. マージ後に自動で `vX.Y.Z` タグ付与、ブランチはcleanupで自動削除

## CI/CD トリガー

- CI: PR（`develop`, `main`）および push（`feature/**`, `release/**`, `hotfix/**`）で実行
- Pages デプロイ: `release/**` と `hotfix/**` への push で実行（`site/` を公開）
- タグ付け: `main` への push 時に `package.json` の `version` をもとに `vX.Y.Z` を作成
