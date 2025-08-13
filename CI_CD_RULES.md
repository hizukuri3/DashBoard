# CI/CD 運用ルール

## ブランチ戦略（Gitflow）

- main: リリース済みコードのみ
- develop: 次リリースの統合ブランチ
- feature/\*: 機能単位の作業ブランチ
- release/\*: リリース準備ブランチ（Pagesへ自動デプロイ）
- hotfix/\*: 緊急修正

## CI（品質ゲート）

- 対象: PR to develop/main、feature/\* push
- チェック内容:
  - Prettier フォーマットチェック
  - `site/` の存在検証と基本ファイルのチェック
  - データセットサイズの上限（enhanced_latest.json <= 60MB）
- 失敗時はマージ不可

## CD（Pages デプロイ）

- トリガー: `release/*` および `hotfix/*` ブランチへの push
- 内容: `site/` ディレクトリをそのまま GitHub Pages に公開
- 環境: `github-pages` （Deployment branches: `release/*`, `hotfix/*`）
- 必要設定: Repository Settings → Pages → Source: GitHub Actions、Actions → Workflow permissions: Read and write

## リリース手順（通常）

1. `develop` から `release/x.y.z` 作成
2. バージョン更新・CHANGELOG更新
3. push → Pages 自動デプロイ確認
4. `release/x.y.z` を `main` に `--no-ff` でマージ
5. タグ `vX.Y.Z` 作成・push（auto-tag workflow が main push を検知して自動作成）
6. `release/x.y.z` を `develop` にマージバック、ブランチ削除

## 修正リリース手順（Hotfix）

1. 発覚: 本番の `main` に対する緊急修正が必要
2. `main` から `hotfix/x.y.z` を作成（z はパッチ番号を +1）
3. 変更を `hotfix/x.y.z` にコミット（必要なら `main` 直コミットを revert してから cherry-pick）
4. `package.json` の `version` を `x.y.z` に更新
5. push（CI実行）。デプロイは `release/**` のみ自動化のため、hotfixはPRで早期に `main` へ反映
6. `hotfix/x.y.z -> main` のPRを `--no-ff` でマージ
7. `main` への push を auto-tag が検知し `vX.Y.Z` を作成
8. `main -> develop` をPRでマージバック（差分取り込み）
9. `hotfix/x.y.z` ブランチを削除（cleanup workflow 対象）

注意:

- Pages 自動デプロイは `release/**` に限定（安定運用のため）。hotfix は main 反映後に必要に応じて `release/x.y.z` を切って同内容を同期し、Pages での確認が必要な場合に対応。

## ブランチクリーンアップ

- PRが「merged」でクローズされたら、自動で`feature/*` `release/*` `hotfix/*` のリモートブランチを削除（`cleanup-branches.yml`）
- ローカルは各自 `git fetch --prune` を定期実行

## データ運用

- 大容量データは Git LFS 管理（`site/data/*.json`）
- 自動取得・拡張: `npm run data:update`
- Pages へは `site/` アーティファクトで配布

## 承認と保護

- `main` は保護ブランチ（必須レビュー1、CI成功必須）
- `develop` はPR推奨、CI成功必須
- `release/*` は直接push可（緊急時以外はPR推奨）

## ロールバック

- 直前タグへのデプロイが必要な場合: `git checkout vX.Y.Z` で `site/` を artifact 生成 → 手動再デプロイ
