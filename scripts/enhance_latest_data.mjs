#!/usr/bin/env node

/**
 * 既存のlatest.jsonデータを拡張するスクリプト
 * 地域情報、配送情報、利益情報などを追加
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 設定
const INPUT_FILE = path.join(__dirname, "../site/data/latest.json");
const OUTPUT_FILE = path.join(__dirname, "../site/data/enhanced_latest.json");

// 地域データ
const REGIONS = ["West", "East", "Central", "South"];
const STATES = {
  West: ["California", "Washington", "Oregon", "Nevada", "Arizona"],
  East: [
    "New York",
    "Massachusetts",
    "Pennsylvania",
    "New Jersey",
    "Connecticut",
  ],
  Central: ["Illinois", "Michigan", "Ohio", "Indiana", "Wisconsin"],
  South: ["Texas", "Florida", "Georgia", "North Carolina", "Virginia"],
};

const CITIES = {
  California: ["Los Angeles", "San Francisco", "San Diego", "Sacramento"],
  "New York": ["New York City", "Buffalo", "Rochester", "Syracuse"],
  Texas: ["Houston", "Dallas", "Austin", "San Antonio"],
  Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
  Illinois: ["Chicago", "Springfield", "Peoria", "Rockford"],
};

// 配送モード
const SHIPPING_MODES = [
  "Standard Class",
  "Second Class",
  "First Class",
  "Same Day",
];

// 利益率（カテゴリ別）
const PROFIT_MARGINS = {
  Furniture: 0.15, // 15%
  "Office Supplies": 0.1, // 10%
  Technology: 0.2, // 20%
};

// 配送日数（配送モード別）
const SHIPPING_DAYS = {
  "Standard Class": 5,
  "Second Class": 3,
  "First Class": 2,
  "Same Day": 1,
};

// 配送コスト（配送モード別）
const SHIPPING_COSTS = {
  "Standard Class": 12.99,
  "Second Class": 8.5,
  "First Class": 25.0,
  "Same Day": 45.0,
};

/**
 * ランダムな要素を配列から選択
 */
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * ランダムな数値範囲を生成
 */
function getRandomNumber(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * 地域情報を生成
 */
function generateLocationData() {
  const region = getRandomElement(REGIONS);
  const state = getRandomElement(STATES[region]);
  const city = getRandomElement(CITIES[state] || ["Unknown"]);

  return {
    region,
    state,
    city,
    postal_code: Math.floor(Math.random() * 90000) + 10000,
  };
}

/**
 * 配送情報を生成
 */
function generateShippingData() {
  const shipping_mode = getRandomElement(SHIPPING_MODES);

  return {
    shipping_mode,
    shipping_days: SHIPPING_DAYS[shipping_mode],
    shipping_cost: SHIPPING_COSTS[shipping_mode],
  };
}

/**
 * 利益情報を生成
 */
function generateProfitData(category, value) {
  const profitMargin = PROFIT_MARGINS[category] || 0.12;
  const profit = Math.round(value * profitMargin * 100) / 100;

  return {
    profit,
    profit_margin: Math.round(profitMargin * 10000) / 100,
  };
}

/**
 * 数量を生成
 */
function generateQuantityData(category, value) {
  // カテゴリ別の単価を想定して数量を逆算
  const avgUnitPrices = {
    Furniture: 200,
    "Office Supplies": 15,
    Technology: 500,
  };

  const avgUnitPrice = avgUnitPrices[category] || 100;
  const estimatedQuantity = Math.max(1, Math.round(value / avgUnitPrice));

  return {
    quantity: estimatedQuantity,
  };
}

/**
 * 顧客名を生成
 */
function generateCustomerName(segment) {
  const firstNames = [
    "John",
    "Jane",
    "Mike",
    "Sarah",
    "David",
    "Emily",
    "Robert",
    "Lisa",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
  ];

  if (segment === "Corporate") {
    const companySuffixes = ["Inc", "Corp", "LLC", "Ltd", "Company"];
    const companyNames = [
      "TechCorp",
      "OfficeMax",
      "BusinessPro",
      "Enterprise",
      "Global",
    ];
    return `${getRandomElement(companyNames)} ${getRandomElement(companySuffixes)}`;
  } else {
    return `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
  }
}

/**
 * 製品名を生成
 */
function generateProductName(category) {
  const productNames = {
    Furniture: [
      "Office Chair Deluxe",
      "Conference Table",
      "Desk Organizer",
      "Filing Cabinet",
      "Ergonomic Desk",
      "Meeting Room Chair",
      "Storage Shelf",
      "Workstation",
    ],
    "Office Supplies": [
      "Premium Paper Set",
      "Desk Organizer",
      "Pen Collection",
      "Notebook Set",
      "Stapler Pro",
      "Tape Dispenser",
      "Calendar Planner",
      "Whiteboard",
    ],
    Technology: [
      "Wireless Keyboard Pro",
      "USB-C Hub",
      "Monitor Stand",
      "Webcam HD",
      "Bluetooth Speaker",
      "Power Bank",
      "Cable Organizer",
      "Phone Stand",
    ],
  };

  return getRandomElement(productNames[category] || ["Unknown Product"]);
}

/**
 * メイン処理
 */
async function enhanceData() {
  try {
    console.log("データ拡張を開始します...");

    // 既存データを読み込み
    const rawData = fs.readFileSync(INPUT_FILE, "utf8");
    const data = JSON.parse(rawData);

    console.log(`元データ: ${data.records.length}件のレコード`);

    // 各レコードを拡張
    const enhancedRecords = data.records.map((record, index) => {
      // 基本情報
      const locationData = generateLocationData();
      const shippingData = generateShippingData();
      const profitData = generateProfitData(record.category, record.value);
      const quantityData = generateQuantityData(record.category, record.value);

      // 拡張されたレコード
      const enhancedRecord = {
        ...record,
        ...locationData,
        ...shippingData,
        ...profitData,
        ...quantityData,
        customer_name: generateCustomerName(record.segment),
        product_name: generateProductName(record.category),
      };

      // 進捗表示
      if ((index + 1) % 100 === 0) {
        console.log(`処理中: ${index + 1}/${data.records.length}件`);
      }

      return enhancedRecord;
    });

    // メタデータを更新
    const enhancedData = {
      ...data,
      meta: {
        ...data.meta,
        source: "enhanced_tableau",
        enhancedAt: new Date().toISOString(),
        totalRecords: enhancedRecords.length,
        fields: {
          required: ["date", "category", "segment", "value"],
          optional: [
            "profit",
            "profit_margin",
            "quantity",
            "region",
            "state",
            "city",
            "postal_code",
            "shipping_mode",
            "shipping_days",
            "shipping_cost",
            "customer_name",
            "product_name",
          ],
        },
      },
      records: enhancedRecords,
    };

    // 拡張されたデータを保存
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(enhancedData, null, 2));

    console.log(`✅ データ拡張完了！`);
    console.log(`📁 出力ファイル: ${OUTPUT_FILE}`);
    console.log(`📊 拡張されたレコード: ${enhancedRecords.length}件`);
    console.log(
      `🆕 追加されたフィールド: 地域、配送、利益、数量、顧客、製品情報`,
    );

    // サンプルレコードを表示
    console.log("\n📋 サンプルレコード:");
    console.log(JSON.stringify(enhancedRecords[0], null, 2));
  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  enhanceData();
}

export { enhanceData };
