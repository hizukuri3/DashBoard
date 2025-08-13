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

- トリガー: `release/*` ブランチへの push
- 内容: `site/` ディレクトリをそのまま GitHub Pages に公開
- 環境: `github-pages` （Deployment branches: `release/*`）
- 必要設定: Repository Settings → Pages → Source: GitHub Actions、Actions → Workflow permissions: Read and write

## リリース手順

1. `develop` から `release/x.y.z` 作成
2. バージョン更新・CHANGELOG更新
3. push → Pages 自動デプロイ確認
4. `release/x.y.z` を `main` に `--no-ff` でマージ
5. タグ `vX.Y.Z` 作成・push
6. `release/x.y.z` を `develop` にマージバック、ブランチ削除

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
