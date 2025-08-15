# データ構造仕様書

## 概要

Superstore Dashboardで使用するデータの構造とフィールド定義

## 基本データ構造

### 現在の構造（既存）

```json
{
  "date": "2025-06-12",
  "category": "Furniture",
  "segment": "Consumer",
  "value": 884.184
}
```

### 拡張後の構造（新規）

```json
{
  "date": "2025-06-12",
  "category": "Furniture",
  "segment": "Consumer",
  "value": 884.184,
  "profit": 110.52,
  "quantity": 2,
  "region": "West",
  "state": "California",
  "city": "Los Angeles",
  "postal_code": "90210",
  "shipping_mode": "Standard Class",
  "shipping_days": 5,
  "shipping_cost": 12.99,
  "customer_name": "John Doe",
  "product_name": "Office Chair"
}
```

## フィールド詳細

### 基本情報

| フィールド名 | 型     | 必須 | 説明                   | 例                                           |
| ------------ | ------ | ---- | ---------------------- | -------------------------------------------- |
| `date`       | string | ✅   | 取引日（ISO 8601形式） | "2025-06-12"                                 |
| `category`   | string | ✅   | 製品カテゴリ           | "Furniture", "Office Supplies", "Technology" |
| `segment`    | string | ✅   | 顧客セグメント         | "Consumer", "Corporate", "Home Office"       |
| `value`      | number | ✅   | 売上金額（USD）        | 884.184                                      |

### 財務情報

| フィールド名    | 型     | 必須 | 説明            | 例     |
| --------------- | ------ | ---- | --------------- | ------ |
| `profit`        | number | ❌   | 利益金額（USD） | 110.52 |
| `profit_margin` | number | ❌   | 利益率（%）     | 12.5   |

### 数量・製品情報

| フィールド名   | 型     | 必須 | 説明   | 例             |
| -------------- | ------ | ---- | ------ | -------------- |
| `quantity`     | number | ❌   | 数量   | 2              |
| `product_name` | string | ❌   | 製品名 | "Office Chair" |
| `product_id`   | string | ❌   | 製品ID | "PROD-001"     |

### 地域情報

| フィールド名  | 型     | 必須 | 説明     | 例                                   |
| ------------- | ------ | ---- | -------- | ------------------------------------ |
| `region`      | string | ❌   | 地域     | "West", "East", "Central", "South"   |
| `state`       | string | ❌   | 州       | "California", "New York", "Texas"    |
| `city`        | string | ❌   | 都市     | "Los Angeles", "New York", "Houston" |
| `postal_code` | string | ❌   | 郵便番号 | "90210"                              |
| `country`     | string | ❌   | 国       | "United States"                      |

### 配送情報

| フィールド名    | 型     | 必須 | 説明              | 例                                                          |
| --------------- | ------ | ---- | ----------------- | ----------------------------------------------------------- |
| `shipping_mode` | string | ❌   | 配送モード        | "Standard Class", "Second Class", "First Class", "Same Day" |
| `shipping_days` | number | ❌   | 配送日数          | 5                                                           |
| `shipping_cost` | number | ❌   | 配送コスト（USD） | 12.99                                                       |
| `delivery_date` | string | ❌   | 配送予定日        | "2025-06-17"                                                |

### 顧客情報

| フィールド名     | 型     | 必須 | 説明       | 例                   |
| ---------------- | ------ | ---- | ---------- | -------------------- |
| `customer_name`  | string | ❌   | 顧客名     | "John Doe"           |
| `customer_id`    | string | ❌   | 顧客ID     | "CUST-001"           |
| `customer_email` | string | ❌   | 顧客メール | "john.doe@email.com" |

### 注文情報

| フィールド名   | 型     | 必須 | 説明           | 例                                   |
| -------------- | ------ | ---- | -------------- | ------------------------------------ |
| `order_id`     | string | ❌   | 注文ID         | "ORD-001"                            |
| `order_date`   | string | ❌   | 注文日         | "2025-06-10"                         |
| `order_status` | string | ❌   | 注文ステータス | "Completed", "Processing", "Shipped" |

## データ品質要件

### 必須フィールド

- `date`, `category`, `segment`, `value` は常に必須

### オプショナルフィールド

- 地域・配送・顧客情報は段階的に追加
- 既存データとの互換性を保つ

### データ型の制約

- 日付: ISO 8601形式（YYYY-MM-DD）
- 数値: 小数点以下3桁まで
- 文字列: 最大255文字

## 段階的実装計画

### Phase 1: 基本拡張

- [ ] 利益情報の追加
- [ ] 数量情報の追加
- [ ] 地域情報の追加

### Phase 2: 配送情報

- [ ] 配送モード
- [ ] 配送日数・コスト
- [ ] 配送パフォーマンス分析

### Phase 3: 顧客・製品詳細

- [ ] 顧客情報
- [ ] 製品詳細
- [ ] 注文情報

## 互換性

### 既存データとの互換性

- 既存のフィールドは変更なし
- 新しいフィールドはオプショナル
- 段階的な移行をサポート

### フォールバック処理

- 不足フィールドがある場合はデフォルト値を使用
- エラー処理とログ出力
