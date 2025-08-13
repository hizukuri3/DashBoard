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
2. Develop ブランチ → Release ブランチ
3. Release ブランチ → Main ブランチ
4. Hotfix ブランチ → Main ブランチ（直接）

## 注意事項

- ブランチ名は小文字とハイフンを使用
- 日本語は使用しない
- ブランチ名は具体的で分かりやすくする
- 作業完了後は必ずブランチを削除する
