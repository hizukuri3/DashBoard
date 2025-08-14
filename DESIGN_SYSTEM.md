# Design System v1

## 目的

- 一貫性/判読性/操作の予測可能性を担保
- データ密度の高いUIでも迷わないレイアウト
- WCAG 2.1 AA 準拠

## 基本原則

- 情報は「概観→要点→詳細」の順で展開
- 1画面1目的（主要CTAは1つ）
- 余白と階層で意味を表す（不要な装飾は避ける）
- 重要指標は視線のZ走査上部に配置

## レイアウト/グリッド

- コンテンツ幅: max 1280px、左右24pxパディング
- グリッド: 12列/8pxベース、セクション間隔24–32px、要素8–16px

### Grid System（実装ガイド）

- 列: md以上は12列、smでは1列
- ガター: 24px（Tailwind: `gap-6`）
- コンテナ:
  - ページシェル: `max-w-7xl`
  - ページ内容: `max-w-5xl mx-auto`
- レイアウト行: `grid grid-cols-12 gap-6`
- 配置: カード/チャートに`col-span-*`を付与

標準スパン:

- 小KPI: `col-span-12 md:col-span-3`
- 中KPI: `col-span-12 md:col-span-4`
- 半幅チャート: `col-span-12 md:col-span-6`
- 全幅テーブル/チャート: `col-span-12`

例:

```html
<div class="grid grid-cols-12 gap-6">
  <div class="col-span-12 md:col-span-3 card">KPI 1</div>
  <div class="col-span-12 md:col-span-3 card">KPI 2</div>
  <div class="col-span-12 md:col-span-3 card">KPI 3</div>
  <div class="col-span-12 md:col-span-3 card">KPI 4</div>
</div>
<div class="grid grid-cols-12 gap-6">
  <div class="col-span-12 md:col-span-6 card">Chart A</div>
  <div class="col-span-12 md:col-span-6 card">Chart B</div>
</div>
```

## タイポグラフィ

- ベース: system-ui/Inter、14px/16px主体
- 見出し: H1 24/32, H2 20/28, H3 16/24
- 数値はタブラー: `font-variant-numeric: tabular-nums`

## カラーパレット

- Primary `#2563EB`, Accent `#4F46E5`
- Success `#10B981`, Warn `#F59E0B`, Error `#EF4444`
- Gray 50–900（コントラスト比≥4.5:1）
- チャート色（8色）: `#3B82F6,#10B981,#F59E0B,#8B5CF6,#EF4444,#14B8A6,#F472B6,#22C55E`

## 角丸/影/ボーダー

- 角丸: カード/入力 8px、ボタン 6px
- 影: sm と none
- ボーダー: 1px `#E5E7EB`

## コンポーネント規約

- ヘッダー: タイトル左/最終更新・検索右、影sm
- フィルタバー: スティッキー/折りたたみ/キーボード（Enter適用・Escクリア）
- KPIカード: 色割当（売上=Blue, 利益=Green, 件数=Purple, 率=Orange）
- テーブル: 行高48、左2列固定、ヘッダソート、数値右寄せ、空/エラー状態あり
- チャート: 凡例トグル、ダブルクリックでシリーズ単独表示、単位明記、負利益は赤
- フィードバック: 成功/情報/警告/エラーのトースト、スケルトンローディング

## アクセシビリティ

- Tab/Enter/Esc対応、フォーカスリング可視（2px青）
- aria属性/Live regionを適切に

## レスポンシブ

- md:≥768, lg:≥1024, xl:≥1280、md未満は1カラム

## ダークモード（v1.1以降）

- 背景`#0B1220`、カード`#111827`、ボーダー`#1F2937`、文字`#E5E7EB`

## CSSトークン（例）

```css
:root {
  --bg: #f9fafb;
  --card: #ffffff;
  --border: #e5e7eb;
  --text: #111827;
  --muted: #6b7280;
  --primary: #2563eb;
  --accent: #4f46e5;
  --success: #10b981;
  --warn: #f59e0b;
  --error: #ef4444;
  --radius-card: 8px;
  --radius-ctrl: 6px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
}
* {
  font-variant-numeric: tabular-nums;
}
```

## ECharts テーマ（要登録）

```json
{
  "color": [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EF4444",
    "#14B8A6",
    "#F472B6",
    "#22C55E"
  ],
  "textStyle": {
    "fontFamily": "Inter, system-ui, -apple-system, Segoe UI, Roboto"
  },
  "axisPointer": { "lineStyle": { "color": "#9CA3AF" } },
  "grid": { "top": 24, "right": 16, "bottom": 32, "left": 40 },
  "tooltip": {
    "backgroundColor": "#111827",
    "borderColor": "#374151",
    "textStyle": { "color": "#F9FAFB" }
  },
  "categoryAxis": {
    "axisLine": { "lineStyle": { "color": "#D1D5DB" } },
    "axisLabel": { "color": "#6B7280" }
  },
  "valueAxis": {
    "splitLine": { "lineStyle": { "color": "#E5E7EB" } },
    "axisLabel": { "color": "#6B7280" }
  }
}
```

## 導入ステップ

1. CSSトークン/フォント数値整形を全体に適用
2. EChartsテーマを登録して全チャートで使用
3. テーブル整形（列固定/右寄せ/空状態）
4. トースト/スケルトンの共通化
