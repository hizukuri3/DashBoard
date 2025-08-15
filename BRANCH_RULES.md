# 🚀 Vibe Coding ブランチ管理ルール

## 📋 ブランチ戦略の概要

**Gitflow + シンプル化** を採用し、開発効率と品質を両立させます。

### 🎯 基本方針
- **シンプルで分かりやすい** ブランチ構造
- **自動化** による人的ミスの防止
- **一貫性** のある命名規則
- **クリーン** なリポジトリ管理

## 🌳 ブランチ構造

### 1. メインブランチ（常時保持）

```
main          ← 本番環境用（安定版）
develop       ← 開発統合用（最新開発版）
```

### 2. 作業ブランチ（一時的）

```
feature/機能名          ← 新機能開発
release/バージョン      ← リリース準備
hotfix/バージョン-内容  ← 緊急修正
```

## 🏷️ 命名規則（重要！）

### Feature ブランチ
```
feature/機能名-詳細
例：
✅ feature/user-dashboard
✅ feature/api-authentication
✅ feature/real-time-charts
❌ feature/新機能
❌ feature/new-feature
```

### Release ブランチ
```
release/バージョン番号
例：
✅ release/1.3.0
✅ release/2.0.0
❌ release/v1.3.0
❌ release/version-1.3.0
```

### Hotfix ブランチ
```
hotfix/バージョン-修正内容
例：
✅ hotfix/1.3.1-security-patch
✅ hotfix/1.3.2-critical-bug
❌ hotfix/security-fix
❌ hotfix/bug-fix
```

## 🔄 開発フロー

### 1. 新機能開発
```bash
# 1. developから開始
git checkout develop
git pull origin develop

# 2. featureブランチ作成
git checkout -b feature/amazing-feature

# 3. 開発・コミット
git add .
git commit -m "feat: add amazing feature"

# 4. developにマージ
git checkout develop
git merge --no-ff feature/amazing-feature

# 5. ブランチ削除
git branch -d feature/amazing-feature
git push origin develop
```

### 2. リリース準備
```bash
# 1. developからreleaseブランチ作成
git checkout develop
git checkout -b release/1.4.0

# 2. 最終調整・テスト
git add .
git commit -m "chore: prepare release 1.4.0"

# 3. mainにマージ（PR経由）
git push origin release/1.4.0
# GitHubでPR作成: release/1.4.0 → main
```

### 3. 緊急修正
```bash
# 1. mainからhotfixブランチ作成
git checkout main
git checkout -b hotfix/1.3.1-critical-fix

# 2. 修正・コミット
git add .
git commit -m "fix: resolve critical issue"

# 3. mainにマージ（PR経由）
git push origin hotfix/1.3.1-critical-fix
# GitHubでPR作成: hotfix/1.3.1-critical-fix → main
```

## ⚡ 自動化ルール

### CI/CD トリガー
- **CI**: 全ブランチのpush/PRで実行
- **デプロイ**: `release/**` と `hotfix/**` のpushで自動実行
- **タグ付け**: `main` へのpushで自動実行（`package.json`のversionを参照）

### 自動クリーンアップ
- マージ完了後の `feature/**` ブランチは自動削除
- マージ完了後の `release/**` ブランチは自動削除
- マージ完了後の `hotfix/**` ブランチは自動削除

## 🚨 重要ルール（忘れ防止）

### バージョン管理
1. **リリース前**: `package.json` の `version` を更新
2. **タグ**: 自動生成される（手動作成不要）
3. **バージョン形式**: `x.y.z`（例: 1.3.0）

### マージルール
1. **Feature → Develop**: `--no-ff` でマージ
2. **Release → Main**: PR経由で `--no-ff` マージ
3. **Hotfix → Main**: PR経由で `--no-ff` マージ
4. **Main → Develop**: バックマージ（変更を取り込み）

## 🚀 軽微な修正のワークフロー

### 🎯 修正の分類

#### 1. **即座にリリースが必要な修正**
- バグ修正（機能に影響）
- セキュリティ修正
- データ表示の重大な問題
- ユーザー体験の重大な問題

**ワークフロー**: `hotfix/*` ブランチ
```bash
git checkout main
git checkout -b hotfix/1.3.1-fix-chart-legend
# 修正・package.json更新・mainにマージ
# 即座にv1.3.1タグ作成
```

#### 2. **次のリリースで十分な修正**
- UI/UXの軽微な改善
- ドキュメント修正
- パフォーマンスの軽微な改善
- コードの可読性向上

**ワークフロー**: `feature/*` ブランチ
```bash
git checkout develop
git checkout -b feature/improve-chart-legend
# 修正・developにマージ
# 次のリリース（1.4.0）に含める
```

#### 3. **緊急度の判断基準**
- **即座リリース**: ユーザーが困る、データが間違って表示される
- **次回リリース**: 見た目の改善、使いやすさの向上

### 📋 今回の修正の判断

**Geographyページの凡例修正**:
- **内容**: チャートに凡例がない（見た目の問題）
- **影響**: ユーザーが困る（データの理解が困難）
- **判断**: **即座にリリースが必要** ✅

**ワークフロー**: `hotfix/1.3.1-fix-chart-legend`

## 📚 ドキュメント・設定修正のルール

### 🎯 対象項目
- **README.md** 更新
- **ドキュメント** 修正・追加
- **設定ファイル** 修正
- **CI/CD設定** 修正
- **ライセンス・貢献ガイド** 更新
- **プロジェクト設定** 変更

### 🌳 ブランチ選択基準

#### 1. **新機能関連のドキュメント**
```
feature/機能名 ブランチで開発と一緒に
例：
- feature/user-auth で認証機能 + README更新
- feature/dashboard でダッシュボード + ドキュメント追加
```

#### 2. **バグ修正関連のドキュメント**
```
hotfix/バージョン-内容 ブランチで修正と一緒に
例：
- hotfix/1.3.1-security-patch でセキュリティ修正 + 更新履歴
- hotfix/1.3.2-critical-bug でバグ修正 + トラブルシューティング
```

#### 3. **独立したドキュメント更新**
```
develop ブランチから docs/内容 ブランチを作成
例：
- docs/update-branch-rules
- docs/add-contribution-guide
- docs/update-api-documentation
```

#### 4. **リリース関連のドキュメント**
```
release/バージョン ブランチで最終調整
例：
- release/1.4.0 でCHANGELOG更新
- release/1.4.0 でREADMEのバージョン情報更新
```

### 📝 実用的なワークフロー例

#### **独立したドキュメント更新**
```bash
# 1. developから開始
git checkout develop
git pull origin develop

# 2. docsブランチ作成
git checkout -b docs/update-branch-rules

# 3. 修正・コミット
git add BRANCH_RULES.md
git commit -m "docs: add documentation update rules"

# 4. developにマージ
git checkout develop
git merge --no-ff docs/update-branch-rules

# 5. ブランチ削除
git branch -d docs/update-branch-rules
git push origin develop
```

#### **機能開発と一緒のドキュメント更新**
```bash
# 1. featureブランチで開発
git checkout feature/amazing-feature

# 2. 機能開発 + ドキュメント更新
git add .
git commit -m "feat: add amazing feature with documentation"

# 3. developにマージ（機能とドキュメント両方）
git checkout develop
git merge --no-ff feature/amazing-feature
```

#### **緊急修正と一緒のドキュメント更新**
```bash
# 1. mainからhotfixブランチ作成
git checkout main
git checkout -b hotfix/1.3.1-documentation-fix

# 2. 修正 + ドキュメント更新
git add .
git commit -m "fix: resolve issue and update documentation"

# 3. mainにマージ（PR経由）
git push origin hotfix/1.3.1-documentation-fix
```

### 🚨 重要なルール

1. **ドキュメント更新は必ず関連する変更と一緒に**
   - 機能開発 → 機能 + ドキュメント
   - バグ修正 → 修正 + ドキュメント
   - 独立更新 → 専用ブランチ

2. **リリースブランチでは最小限の更新のみ**
   - バージョン情報更新
   - CHANGELOG更新
   - リリースノート更新

3. **常に適切なブランチで作業**
   - 機能開発中 → `feature/*`
   - 緊急修正中 → `hotfix/*`
   - 独立更新 → `docs/*`
   - リリース準備 → `release/*`

4. **ドキュメント更新もコミットメッセージを明確に**
   ```
   docs: add documentation update rules
   docs: update README with new features
   docs: fix typo in contribution guide
   docs: update API documentation
   ```

## 🧹 ブランチ管理のベストプラクティス

### 作成時
- 適切な命名規則に従う
- 最新の `develop` または `main` から開始
- 目的を明確にする

### 開発中
- 小さなコミットを心がける
- 意味のあるコミットメッセージ
- 定期的に `develop` から最新化

### 完了後
- 必ずブランチを削除
- ローカルとリモート両方を削除
- マージ履歴を確認

## 📝 コミットメッセージ例

```
feat: add user authentication system
fix: resolve chart rendering issue
chore: update dependencies
docs: update README
style: fix code formatting
refactor: simplify chart logic
test: add unit tests for auth
```

## 🔍 トラブルシューティング

### よくある問題
1. **ブランチが削除できない**: マージされていない変更がある
2. **コンフリクト**: `develop` から最新化してから作業
3. **タグが付かない**: `package.json` のversionを確認

### 解決方法
```bash
# ブランチの状態確認
git status
git branch -a

# 最新化
git checkout develop
git pull origin develop

# 不要ブランチ削除
git branch -d ブランチ名
git push origin --delete ブランチ名
```

## 🎉 成功のポイント

1. **一貫性**: 命名規則を守る
2. **自動化**: CI/CDを活用する
3. **クリーン**: 完了したブランチは削除
4. **コミュニケーション**: チーム内でルールを共有

---

*このルールに従えば、vibeコーディングでも綺麗なブランチ管理が実現できます！* 🚀
