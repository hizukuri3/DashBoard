## 1.1.1

- GitHub Pages 自動デプロイの検証リリース（Actions: release/* ブランチ→Pages）
- その他小調整

## 1.1.0

- データソース拡張（Tableau全量取得、地域/配送/利益/数量を追加）
- `enhanced_latest.json` を優先読み込みに変更、キャッシュバスター追加
- データ拡張スクリプト `scripts/enhance_latest_data.mjs` 追加
- 取得・拡張一括実行スクリプト `npm run data:update` 追加
- Git LFS を導入し `site/data/*.json` をLFS管理に変更

## 1.0.0

- 初期リリース。フィルタ・ソート・ページネーション、各分析ページの基盤実装

