// グローバル変数
let dashboardData = null;
let currentPage = "overview";
const chartInstances = new Set();

function ensureEchartsTheme() {
  if (!window.__echartsThemeRegistered && window.echarts) {
    const theme = {
      color: [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#8B5CF6",
        "#EF4444",
        "#14B8A6",
        "#F472B6",
        "#22C55E",
      ],
      textStyle: {
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto",
      },
      axisPointer: { lineStyle: { color: "#9CA3AF" } },
      grid: { top: 24, right: 16, bottom: 32, left: 40, containLabel: true },
      tooltip: {
        backgroundColor: "#111827",
        borderColor: "#374151",
        textStyle: { color: "#F9FAFB" },
      },
      categoryAxis: {
        axisLine: { lineStyle: { color: "#D1D5DB" } },
        axisLabel: { color: "#6B7280", hideOverlap: true },
      },
      valueAxis: {
        splitLine: { lineStyle: { color: "#E5E7EB" } },
        axisLabel: { color: "#6B7280" },
      },
    };
    echarts.registerTheme("dashboard", theme);
    window.__echartsThemeRegistered = true;
  }
}

function registerChartInstance(instance) {
  if (!instance) return;
  chartInstances.add(instance);
  try {
    const dom = instance.getDom && instance.getDom();
    if (dom && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        try {
          instance.resize();
        } catch {}
      });
      ro.observe(dom);
    }
  } catch {}
  // レイアウト確定後に再計測
  try {
    setTimeout(() => instance.resize(), 0);
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => instance.resize());
    }
  } catch {}
}

function resizeAllCharts() {
  chartInstances.forEach((c) => {
    try {
      c.resize();
    } catch {}
  });
}

let __resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(__resizeTimer);
  __resizeTimer = setTimeout(resizeAllCharts, 100);
});
window.addEventListener("load", () => {
  // フォント読み込み後の再レイアウトでのクリップ防止
  setTimeout(resizeAllCharts, 0);
});

// ページ初期化
document.addEventListener("DOMContentLoaded", function () {
  ensureEchartsTheme();
  initializeNavigation();
  initializeFiltering();
  initializeFilterBarUX();
  loadDashboardData();
});

// ナビゲーション初期化
function initializeNavigation() {
  const bind = () => {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      item.addEventListener("click", function () {
        const targetPage = this.getAttribute("data-page");
        switchPage(targetPage);
      });
    });
    const select = document.getElementById("page-select-mobile");
    if (select) {
      select.addEventListener("change", (e) => {
        switchPage(e.target.value);
      });
    }
  };
  bind();
}

// ページ切り替え
function switchPage(pageName) {
  // 現在のページを非表示
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  // ナビゲーションアイテムのアクティブ状態を更新
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  // 新しいページを表示
  document.getElementById(pageName).classList.add("active");
  document.querySelector(`[data-page="${pageName}"]`).classList.add("active");

  currentPage = pageName;

  // ページ固有の初期化処理
  initializePage(pageName);
}

// ページ固有の初期化処理
function initializePage(pageName) {
  switch (pageName) {
    case "overview":
      renderOverviewCharts();
      break;
    case "geography":
      renderGeographyPage();
      break;
    case "products":
      renderProductsPage();
      break;
    case "customers":
      renderCustomersPage();
      break;
    case "time":
      renderTimePage();
      break;
    case "operations":
      renderOperationsPage();
      break;
  }
}

// ダッシュボードデータ読み込み
async function loadDashboardData() {
  try {
    console.log("Starting data load...");

    // Try enhanced_latest.json first
    console.log("Loading enhanced_latest.json...");
    const enhancedLatestResponse = await fetch("data/enhanced_latest.json");
    if (enhancedLatestResponse.ok) {
      console.log("Loaded enhanced_latest.json");
      dashboardData = await enhancedLatestResponse.json();
      updateLastUpdated("enhanced_latest.json");
      renderDashboard();
    } else {
      console.log("enhanced_latest.json not found, trying latest.json...");
      // Fallback: latest.json
      const response = await fetch("data/latest.json");
      if (response.ok) {
        console.log("Loaded latest.json");
        dashboardData = await response.json();
        updateLastUpdated("latest.json");
        renderDashboard();
      } else {
        console.log("latest.json not found, trying enhanced_sample.json...");
        // Fallback: enhanced_sample.json
        const enhancedSampleResponse = await fetch("data/enhanced_sample.json");
        if (enhancedSampleResponse.ok) {
          console.log("Loaded enhanced_sample.json");
          dashboardData = await enhancedSampleResponse.json();
          updateLastUpdated("enhanced_sample.json");
          renderDashboard();
        } else {
          console.log("enhanced_sample.json not found, trying sample.json...");
          // Fallback: sample.json
          const sampleResponse = await fetch("data/sample.json");
          if (sampleResponse.ok) {
            console.log("Loaded sample.json");
            dashboardData = await sampleResponse.json();
            updateLastUpdated("sample.json");
            renderDashboard();
          } else {
            throw new Error("No data files found");
          }
        }
      }
    }
  } catch (error) {
    console.error("Data load error:", error);
    showError("Failed to load data: " + error.message);
  }
}

// 最終更新時刻更新
function updateLastUpdated(filename = "latest.json") {
  const now = new Date();
  const timeString = now.toLocaleString("en-US");
  document.getElementById("last-updated").textContent =
    `Last updated: ${timeString} (${filename})`;
}

// エラー表示
function showError(message) {
  const main = document.querySelector("main");
  main.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <p>${message}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ダッシュボード描画
function renderDashboard() {
  if (!dashboardData) return;

  console.log("Render dashboard", dashboardData);

  // KPI更新
  updateKPIs();

  // 現在のページに応じてチャート描画
  initializePage(currentPage);
}

// KPI更新
function updateKPIs() {
  if (!dashboardData || !dashboardData.records) return;

  const records = dashboardData.records;
  console.log("KPI更新中、レコード数:", records.length);

  // 集計計算
  const totalSales = records.reduce(
    (sum, record) => sum + (record.value || 0),
    0,
  );
  const totalOrders = records.length;

  // 利益計算（拡張されたデータがある場合は実際の値、ない場合は仮の値）
  let totalProfit, profitMargin;
  if (records.some((record) => record.profit)) {
    totalProfit = records.reduce(
      (sum, record) => sum + (record.profit || 0),
      0,
    );
    profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  } else {
    // 仮の値（12.5%の利益率）
    profitMargin = 12.5;
    totalProfit = totalSales * 0.125;
  }

  // KPI表示更新（コンパクト表記）
  document.getElementById("total-sales").textContent =
    formatCompactCurrency(totalSales);
  document.getElementById("total-orders").textContent =
    formatCompactNumber(totalOrders);
  document.getElementById("profit-margin").textContent =
    profitMargin.toFixed(1) + "%";
  document.getElementById("total-profit").textContent =
    formatCompactCurrency(totalProfit);

  // 前年同期比（仮の値）
  document.getElementById("sales-yoy").textContent = "+5.2%";
  document.getElementById("profit-yoy").textContent = "+5.2%";
  document.getElementById("orders-yoy").textContent = "+3.8%";
  document.getElementById("margin-yoy").textContent = "+0.8%";
}

// 数値/通貨フォーマット
function formatCurrency(amount, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatCompactCurrency(value) {
  return (
    "$" +
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value || 0)
  );
}

// オーバービューページのチャート描画
function renderOverviewCharts() {
  if (!dashboardData || !dashboardData.records) return;

  console.log("Render overview charts");
  ensureEchartsTheme();

  renderMonthlyTrendChart();
  renderGeographyChart();
  renderCategoryChart();
  renderSegmentChart();
}

// 月次トレンドチャート（Sales & Profit）
function renderMonthlyTrendChart() {
  const chartDom = document.getElementById("monthly-trend-chart");
  if (!chartDom) return;

  const chart = echarts.init(chartDom, "dashboard");
  registerChartInstance(chart);

  // 実際のデータから月次データを生成
  const monthlyData = processMonthlyDataFromRecords();

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
    },
    legend: { data: ["Sales", "Profit"], top: 8 },
    grid: { left: 48, right: 56, top: 64, bottom: 40, containLabel: true },
    xAxis: {
      type: "category",
      data: monthlyData.months,
    },
    yAxis: [
      {
        type: "value",
        name: "Sales",
        position: "left",
        axisLabel: { formatter: (v) => formatCompactCurrency(v) },
      },
      {
        type: "value",
        name: "Profit",
        position: "right",
        axisLabel: { formatter: (v) => formatCompactCurrency(v) },
      },
    ],
    series: [
      {
        name: "Sales",
        type: "line",
        yAxisIndex: 0,
        data: monthlyData.sales,
        itemStyle: { color: "#3B82F6" },
      },
      {
        name: "Profit",
        type: "line",
        yAxisIndex: 1,
        data: monthlyData.profits,
        itemStyle: { color: "#10B981" },
      },
    ],
  };

  chart.setOption(option);
}

// 実際のデータから月次データを処理（Overviewページ用）
function processMonthlyDataFromRecords() {
  if (!filteredData) return { months: [], sales: [], profits: [], orders: [] };
  if (!dashboardData || !dashboardData.records) {
    return { months: [], sales: [], profits: [], orders: [] };
  }

  const records =
    filteredData && filteredData.length ? filteredData : dashboardData.records;
  const monthlyData = {};

  records.forEach((record) => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { sales: 0, profits: 0, orders: 0 };
    }

    monthlyData[monthKey].sales += record.value || 0;
    monthlyData[monthKey].profits += record.profit || 0;
    monthlyData[monthKey].orders += 1;
  });

  // 月順にソート
  const sortedMonths = Object.keys(monthlyData).sort();

  return {
    months: sortedMonths.map((month) => {
      const [year, monthNum] = month.split("-");
      const d = new Date(Number(year), Number(monthNum) - 1, 1);
      const mon = d.toLocaleString("en-US", { month: "short" });
      return `${mon} ${year}`;
    }),
    sales: sortedMonths.map((month) => monthlyData[month].sales),
    profits: sortedMonths.map((month) => monthlyData[month].profits),
    orders: sortedMonths.map((month) => monthlyData[month].orders),
  };
}

// 実際のデータから日次データを処理（Timeページ用）
function processDailyDataFromRecords() {
  if (!filteredData) return { days: [], sales: [], profits: [], orders: [] };
  if (!dashboardData || !dashboardData.records) {
    return { days: [], sales: [], profits: [], orders: [] };
  }

  const records =
    filteredData && filteredData.length ? filteredData : dashboardData.records;
  const dailyData = {};

  records.forEach((record) => {
    const date = new Date(record.date);
    const dayKey = date.toISOString().split("T")[0]; // YYYY-MM-DD形式

    if (!dailyData[dayKey]) {
      dailyData[dayKey] = { sales: 0, profits: 0, orders: 0 };
    }

    dailyData[dayKey].sales += record.value || 0;
    dailyData[dayKey].profits += record.profit || 0;
    dailyData[dayKey].orders += 1;
  });

  // 日付順にソート
  const sortedDays = Object.keys(dailyData).sort();

  return {
    days: sortedDays.map((day) => {
      const date = new Date(day);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }),
    sales: sortedDays.map((day) => dailyData[day].sales),
    profits: sortedDays.map((day) => dailyData[day].profits),
    orders: sortedDays.map((day) => dailyData[day].orders),
  };
}

// 地域別チャート（実際のデータから生成）
function renderGeographyChart() {
  const chartDom = document.getElementById("geography-chart");
  if (!chartDom) return;

  const chart = echarts.init(chartDom, "dashboard");
  registerChartInstance(chart);

  // 実際のデータから地域データを生成（仮の地域データ）
  const geographyData = [
    { value: 1048, name: "East" },
    { value: 735, name: "West" },
    { value: 580, name: "South" },
    { value: 484, name: "Central" },
  ];

  const option = {
    tooltip: {
      trigger: "item",
    },
    series: [
      {
        name: "Sales by Region",
        type: "pie",
        radius: "50%",
        data: geographyData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  chart.setOption(option);
}

// カテゴリ別チャート（実際のデータから生成）
function renderCategoryChart() {
  const chartDom = document.getElementById("category-chart");
  if (!chartDom) return;

  const chart = echarts.init(chartDom, "dashboard");
  registerChartInstance(chart);

  // 実際のデータからカテゴリデータを生成
  const categoryData = processCategoryDataFromRecords();

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: { data: ["Sales", "Orders"], top: 8 },
    grid: { left: 48, right: 56, top: 64, bottom: 40, containLabel: true },
    xAxis: {
      type: "category",
      data: categoryData.categories,
    },
    yAxis: [
      {
        type: "value",
        name: "Sales",
        position: "left",
        axisLabel: { formatter: (v) => formatCompactCurrency(v) },
      },
      {
        type: "value",
        name: "Orders",
        position: "right",
        axisLabel: { formatter: (v) => formatCompactNumber(v) },
      },
    ],
    series: [
      {
        name: "Sales",
        type: "bar",
        yAxisIndex: 0,
        data: categoryData.sales,
        itemStyle: { color: "#3B82F6" },
      },
      {
        name: "Orders",
        type: "bar",
        yAxisIndex: 1,
        data: categoryData.orders,
        itemStyle: { color: "#10B981" },
      },
    ],
  };

  chart.setOption(option);
}

// 実際のデータからカテゴリデータを処理
function processCategoryDataFromRecords() {
  if (!filteredData) return { categories: [], sales: [], orders: [] };
  if (!dashboardData || !dashboardData.records) {
    return { categories: [], sales: [], orders: [] };
  }

  const records =
    filteredData && filteredData.length ? filteredData : dashboardData.records;
  const categoryData = {};

  records.forEach((record) => {
    const category = record.category || "Unknown";

    if (!categoryData[category]) {
      categoryData[category] = { sales: 0, orders: 0 };
    }

    categoryData[category].sales += record.value || 0;
    categoryData[category].orders += 1;
  });

  const categories = Object.keys(categoryData);

  return {
    categories: categories,
    sales: categories.map((cat) => categoryData[cat].sales),
    orders: categories.map((cat) => categoryData[cat].orders),
  };
}

// セグメント別チャート（実際のデータから生成）
function renderSegmentChart() {
  const chartDom = document.getElementById("segment-chart");
  if (!chartDom) return;

  const chart = echarts.init(chartDom, "dashboard");
  registerChartInstance(chart);

  // 実際のデータからセグメントデータを生成
  const segmentData = processSegmentDataFromRecords();

  const option = {
    tooltip: {
      trigger: "item",
    },
    series: [
      {
        name: "Customer Segment",
        type: "pie",
        radius: "50%",
        data: segmentData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  chart.setOption(option);
}

// 実際のデータからセグメントデータを処理
function processSegmentDataFromRecords() {
  if (!filteredData) return [];
  if (!dashboardData || !dashboardData.records) {
    return [];
  }

  const records =
    filteredData && filteredData.length ? filteredData : dashboardData.records;
  const segmentData = {};

  records.forEach((record) => {
    const segment = record.segment || "Unknown";

    if (!segmentData[segment]) {
      segmentData[segment] = 0;
    }

    segmentData[segment] += record.value || 0;
  });

  return Object.keys(segmentData).map((segment) => ({
    name: segment,
    value: segmentData[segment],
  }));
}

// 各ページの描画関数
function renderGeographyPage() {
  if (!dashboardData || !dashboardData.records) return;

  console.log("Render geography page");

  // 地域別データの処理
  const regionData = processRegionData();

  // KPI更新
  updateGeographyKPIs(regionData);

  // チャート描画
  renderRegionCharts(regionData);

  // テーブル描画
  renderRegionTable(regionData);

  // 地域フィルター初期化
  initializeRegionFilter(regionData);
}

function renderProductsPage() {
  if (!dashboardData || !dashboardData.records) return;

  const page = document.getElementById("products");
  page.innerHTML = `
		<div class="max-w-5xl mx-auto">
			<!-- タイトルと説明文を保持 -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">Products</h2>
				<p class="text-gray-600">Detailed analysis by product category</p>
			</div>
			
			<!-- チャートとテーブル -->
			<div class="space-y-6">
				<div class="grid grid-cols-12 gap-6 items-start">
					<div class="bg-white rounded-lg shadow p-6 col-span-12 md:col-span-6">
						<h3 class="text-lg font-medium text-gray-900 mb-4">Sales & Orders by Category</h3>
						<div id="category-combo-chart" class="h-80"></div>
					</div>
					<div class="bg-white rounded-lg shadow p-6 col-span-12 md:col-span-6">
						<h3 class="text-lg font-medium text-gray-900 mb-4">Sales Distribution by Category</h3>
						<div id="category-pie-chart" class="h-80"></div>
					</div>
					<div class="bg-white rounded-lg shadow p-6 col-span-12">
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
									</tr>
								</thead>
								<tbody id="products-table-body" class="bg-white divide-y divide-gray-200"></tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;

  const cat = processCategoryDataFromRecords();
  const combo = echarts.init(
    document.getElementById("category-combo-chart"),
    "dashboard",
  );
  registerChartInstance(combo);
  combo.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: ["Sales", "Orders"], top: 8 },
    grid: { left: 48, right: 56, top: 64, bottom: 36, containLabel: true },
    xAxis: { type: "category", data: cat.categories },
    yAxis: [
      { type: "value", name: "Sales" },
      { type: "value", name: "Orders" },
    ],
    series: [
      {
        name: "Sales",
        type: "bar",
        data: cat.sales,
        yAxisIndex: 0,
        itemStyle: { color: "#3B82F6" },
      },
      {
        name: "Orders",
        type: "line",
        data: cat.orders,
        yAxisIndex: 1,
        itemStyle: { color: "#10B981" },
      },
    ],
  });

  const pie = echarts.init(
    document.getElementById("category-pie-chart"),
    "dashboard",
  );
  registerChartInstance(pie);
  pie.setOption({
    tooltip: { trigger: "item" },
    grid: { left: 24, right: 24, top: 24, bottom: 24, containLabel: true },
    series: [
      {
        type: "pie",
        radius: "50%",
        data: cat.categories.map((c, i) => ({ name: c, value: cat.sales[i] })),
      },
    ],
  });

  const tbody = document.getElementById("products-table-body");
  tbody.innerHTML = cat.categories
    .map(
      (c, i) => `
		<tr>
			<td class="px-6 py-3 text-sm">${c}</td>
			<td class="px-6 py-3 text-sm">${formatCurrency(cat.sales[i])}</td>
			<td class="px-6 py-3 text-sm">${cat.orders[i].toLocaleString()}</td>
		</tr>
	`,
    )
    .join("");
}

function renderCustomersPage() {
  if (!dashboardData || !dashboardData.records) return;

  const page = document.getElementById("customers");
  page.innerHTML = `
		<div class="max-w-5xl mx-auto">
			<!-- タイトルと説明文を保持 -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">Customers</h2>
				<p class="text-gray-600">Detailed analysis by customer segment</p>
			</div>
			
			<!-- チャートとテーブル -->
			<div class="space-y-6">
				<div class="grid grid-cols-12 gap-6 items-start">
					<div class="bg-white rounded-lg shadow p-6 col-span-12 md:col-span-6">
						<h3 class="text-lg font-medium text-gray-900 mb-4">Segment Distribution (Sales)</h3>
						<div id="segment-pie-chart" class="h-80"></div>
					</div>
					<div class="bg-white rounded-lg shadow p-6 col-span-12 md:col-span-6">
						<h3 class="text-lg font-medium text-gray-900 mb-4">Sales & Orders by Segment</h3>
						<div id="segment-bar-chart" class="h-80"></div>
					</div>
					<div class="bg-white rounded-lg shadow p-6 col-span-12">
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
									</tr>
								</thead>
								<tbody id="customers-table-body" class="bg-white divide-y divide-gray-200"></tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;

  const seg = processSegmentDataFromRecords();
  const pie = echarts.init(
    document.getElementById("segment-pie-chart"),
    "dashboard",
  );
  registerChartInstance(pie);
  pie.setOption({
    tooltip: { trigger: "item" },
    grid: { left: 24, right: 24, top: 24, bottom: 24, containLabel: true },
    series: [{ type: "pie", radius: "50%", data: seg }],
  });

  const bar = echarts.init(
    document.getElementById("segment-bar-chart"),
    "dashboard",
  );
  registerChartInstance(bar);
  bar.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["Sales", "Orders"], top: 8 },
    grid: { left: 48, right: 56, top: 64, bottom: 36, containLabel: true },
    xAxis: { type: "category", data: seg.map((s) => s.name) },
    yAxis: [
      { type: "value", name: "Sales" },
      { type: "value", name: "Orders" },
    ],
    series: [
      {
        name: "Sales",
        type: "bar",
        data: seg.map((s) => s.value),
        yAxisIndex: 0,
        itemStyle: { color: "#3B82F6" },
      },
      {
        name: "Orders",
        type: "line",
        data: seg.map((s) => Math.max(1, Math.round(s.value / 100))),
        yAxisIndex: 1,
        itemStyle: { color: "#10B981" },
      },
    ],
  });

  const tbody = document.getElementById("customers-table-body");
  tbody.innerHTML = seg
    .map(
      (s) => `
		<tr>
			<td class="px-6 py-3 text-sm">${s.name}</td>
			<td class="px-6 py-3 text-sm">${formatCurrency(s.value)}</td>
			<td class="px-6 py-3 text-sm">${Math.max(1, Math.round(s.value / 100)).toLocaleString()}</td>
		</tr>
	`,
    )
    .join("");
}

function renderTimePage() {
  if (!dashboardData || !dashboardData.records) return;

  const page = document.getElementById("time");
  page.innerHTML = `
		<div class="max-w-5xl mx-auto">
			<!-- タイトルと説明文を保持 -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">Time</h2>
				<p class="text-gray-600">Detailed analysis over time</p>
			</div>
			
			<!-- チャートとテーブル -->
			<div class="space-y-6">
				<div class="grid grid-cols-12 gap-6 items-start">
					<div class="bg-white rounded-lg shadow p-6 col-span-12 md:col-span-6">
						<h3 class="text-lg font-medium text-gray-900 mb-4">Daily Sales & Profit</h3>
						<div id="time-trend-chart" style="height:320px;width:100%"></div>
					</div>
					<div class="bg-white rounded-lg shadow p-6 col-span-12 md:col-span-6">
						<h3 class="text-lg font-medium text-gray-900 mb-4">Daily Details</h3>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
									</tr>
								</thead>
								<tbody id="time-table-body" class="bg-white divide-y divide-gray-200"></tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;

  const daily = processDailyDataFromRecords();
  const chart = echarts.init(
    document.getElementById("time-trend-chart"),
    "dashboard",
  );
  registerChartInstance(chart);
  chart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: ["Sales", "Profit"], top: 8 },
    grid: { left: 48, right: 56, top: 64, bottom: 36, containLabel: true },
    xAxis: { type: "category", data: daily.days },
    yAxis: [
      { type: "value", name: "Sales" },
      { type: "value", name: "Profit" },
    ],
    series: [
      {
        name: "Sales",
        type: "line",
        data: daily.sales,
        yAxisIndex: 0,
        itemStyle: { color: "#3B82F6" },
      },
      {
        name: "Profit",
        type: "line",
        data: daily.profits,
        yAxisIndex: 1,
        itemStyle: { color: "#10B981" },
      },
    ],
  });

  const tbody = document.getElementById("time-table-body");
  tbody.innerHTML = daily.days
    .map((day, i) => {
      const sales = daily.sales[i];
      const profit = daily.profits[i];
      const orders = daily.orders[i];
      return `<tr><td class="px-6 py-3 text-sm">${day}</td><td class="px-6 py-3 text-sm">${formatCurrency(sales)}</td><td class="px-6 py-3 text-sm">${formatCurrency(profit)}</td><td class="px-6 py-3 text-sm">${orders.toLocaleString()}</td></tr>`;
    })
    .join("");
}

function renderOperationsPage() {
  if (!dashboardData || !dashboardData.records) return;

  console.log("Render operations page");

  // 配送データの処理
  const shippingData = processShippingData();

  // KPI更新
  updateShippingKPIs(shippingData);

  // チャート描画
  renderShippingCharts(shippingData);

  // テーブル描画
  renderShippingTable(shippingData);

  // 配送モードフィルター初期化
  initializeShippingModeFilter(shippingData);
}

// ===== フィルタリング機能 =====

// フィルタリング状態管理
let filteredData = null;
let currentPageNum = 1;
let pageSize = 50;
let sortField = "date";
let sortDirection = "asc";

// フィルタリング機能の初期化
function initializeFiltering() {
  // 日付フィールドの初期値を設定
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  document.getElementById("start-date").value = firstOfMonth
    .toISOString()
    .split("T")[0];
  document.getElementById("end-date").value = today.toISOString().split("T")[0];

  // イベントリスナーの設定（Enterで適用、Escでリセット）
  document
    .getElementById("apply-filter")
    .addEventListener("click", applyFilters);
  document
    .getElementById("reset-filter")
    .addEventListener("click", resetFilters);
  document
    .getElementById("page-size")
    .addEventListener("change", onPageSizeChange);
  ["start-date", "end-date"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") applyFilters();
      if (e.key === "Escape") resetFilters();
    });
  });

  // ページネーション
  document
    .getElementById("prev-page")
    .addEventListener("click", () => changePage(-1));
  document
    .getElementById("next-page")
    .addEventListener("click", () => changePage(1));

  // ソート機能
  document.querySelectorAll("[data-sort]").forEach((th) => {
    th.addEventListener("click", () => sortTable(th.getAttribute("data-sort")));
  });

  // 初期データ表示（当月1日〜今日）
  applyFilters();
}

// フィルタバーUI（固定・折りたたみ・状態保存）
function initializeFilterBarUX() {
  const KEY = "dashboard-ui-state";
  // 左ペイン内に移したため、トップバーのトグルは存在しないケースあり
  const toggleBtn = document.getElementById("toggle-filterbar");
  const content = document.getElementById("filterbar-content");
  if (!content) return;

  // 保存状態の復元
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (saved.filterbarCollapsed) {
      content.style.display = "none";
      toggleBtn.textContent = "Expand";
      toggleBtn.setAttribute("aria-expanded", "false");
    }
    if (saved.pageSize) {
      const ps = document.getElementById("page-size");
      if (ps) ps.value = saved.pageSize;
    }
  } catch {}

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const collapsed = content.style.display === "none";
      content.style.display = collapsed ? "" : "none";
      toggleBtn.textContent = collapsed ? "Collapse" : "Expand";
      toggleBtn.setAttribute("aria-expanded", collapsed ? "true" : "false");
      persistUIState();
    });
  }

  // ページサイズの永続化
  const ps = document.getElementById("page-size");
  if (ps) ps.addEventListener("change", persistUIState);

  function persistUIState() {
    try {
      const state = {
        filterbarCollapsed: content.style.display === "none",
        pageSize: document.getElementById("page-size")?.value,
      };
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }
}

// フィルター適用
function applyFilters() {
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  if (!startDate || !endDate) {
    alert("Please select start and end dates");
    return;
  }

  // データフィルタリング
  filteredData = filterDataByDateRange(startDate, endDate);

  // テーブル更新
  renderDataTable();

  // KPI更新
  updateKPIsWithFilteredData();

  // 可視ページの再描画（フィルタ済みデータに基づく集計へ更新）
  try {
    renderOverviewCharts();
    renderGeographyPage();
    renderProductsPage();
    renderCustomersPage();
    renderTimePage();
    renderOperationsPage();
  } catch {}

  console.log("フィルター適用完了:", filteredData.length, "件");
}

// 日付範囲でデータをフィルタリング
function filterDataByDateRange(startDate, endDate) {
  if (!dashboardData || !dashboardData.records) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  return dashboardData.records.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate >= start && recordDate <= end;
  });
}

// データテーブルの描画
function renderDataTable() {
  if (!filteredData) return;

  const tbody = document.getElementById("data-table-body");
  const startIndex = (currentPageNum - 1) * pageSize;
  const endIndex =
    pageSize === "all" ? filteredData.length : startIndex + pageSize;
  const pageData = filteredData.slice(startIndex, endIndex);

  // ソート適用
  const sortedData = sortData(pageData, sortField, sortDirection);

  // テーブル行の生成
  tbody.innerHTML = sortedData
    .map(
      (record) => `
        <tr class="hover:bg-gray-50">
            <td class="sticky left-0 bg-white px-6 py-4 text-sm text-gray-900">${formatDate(record.date)}</td>
            <td class="px-6 py-4 text-sm text-gray-900"><span class="ellipsis" title="${record.category}">${record.category}</span></td>
            <td class="px-6 py-4 text-sm text-gray-900"><span class="ellipsis" title="${record.segment}">${record.segment}</span></td>
            <td class="px-6 py-4 text-sm text-right text-gray-900">${formatCurrency(record.value, 0)}</td>
            <td class="px-6 py-4 text-sm text-right text-gray-900">${record.profit ? formatCurrency(record.profit, 0) : "--"}</td>
            <td class="px-6 py-4 text-sm text-right text-gray-900">${record.quantity ? record.quantity.toLocaleString() : "--"}</td>
            <td class="px-6 py-4 text-sm text-gray-900"><span class="ellipsis" title="${record.region || ""}">${record.region || "--"}</span></td>
            <td class="px-6 py-4 text-sm text-gray-900"><span class="ellipsis" title="${record.shipping_mode || ""}">${record.shipping_mode || "--"}</span></td>
        </tr>
    `,
    )
    .join("");

  // 統計情報更新
  updateTableStats();

  // ページネーション更新
  updatePagination();
}

// データソート
function sortData(data, field, direction) {
  return [...data].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];

    if (field === "date") {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else if (field === "value") {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }

    if (direction === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
}

// テーブルソート
function sortTable(field) {
  if (sortField === field) {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortField = field;
    sortDirection = "asc";
  }

  // ソートインジケーター更新
  updateSortIndicators();

  // テーブル再描画
  renderDataTable();
}

// ソートインジケーター更新
function updateSortIndicators() {
  document.querySelectorAll("[data-sort]").forEach((th) => {
    const indicator = th.querySelector(".sort-indicator");
    if (th.getAttribute("data-sort") === sortField) {
      indicator.textContent = sortDirection === "asc" ? "▲" : "▼";
    } else {
      indicator.textContent = "▼";
    }
  });
}

// ページサイズ変更
function onPageSizeChange() {
  pageSize = document.getElementById("page-size").value;
  currentPageNum = 1;
  renderDataTable();
}

// ページ変更
function changePage(delta) {
  const newPage = currentPageNum + delta;
  const totalPages = Math.ceil(
    filteredData.length / (pageSize === "all" ? filteredData.length : pageSize),
  );

  if (newPage >= 1 && newPage <= totalPages) {
    currentPageNum = newPage;
    renderDataTable();
  }
}

// テーブル統計情報更新
function updateTableStats() {
  if (!filteredData) return;

  document.getElementById("total-records").textContent =
    filteredData.length.toLocaleString();

  const startIndex = (currentPageNum - 1) * pageSize;
  const endIndex =
    pageSize === "all" ? filteredData.length : startIndex + pageSize;
  const displayedCount = endIndex - startIndex;

  document.getElementById("displayed-records").textContent =
    displayedCount.toLocaleString();
}

// ページネーション更新
function updatePagination() {
  if (!filteredData) return;

  const totalPages = Math.ceil(
    filteredData.length / (pageSize === "all" ? filteredData.length : pageSize),
  );
  const startIndex = (currentPageNum - 1) * pageSize;
  const endIndex =
    pageSize === "all" ? filteredData.length : startIndex + pageSize;

  document.getElementById("current-page").textContent = currentPageNum;
  document.getElementById("total-pages").textContent = totalPages;
  document.getElementById("page-info").textContent =
    `Showing ${startIndex + 1}-${endIndex}`;

  // ボタンの有効/無効状態
  document.getElementById("prev-page").disabled = currentPageNum <= 1;
  document.getElementById("next-page").disabled = currentPageNum >= totalPages;
}

// フィルターリセット
function resetFilters() {
  document.getElementById("start-date").value = "";
  document.getElementById("end-date").value = "";
  document.getElementById("page-size").value = "50";

  pageSize = 50;
  currentPageNum = 1;
  sortField = "date";
  sortDirection = "asc";

  filteredData = dashboardData ? dashboardData.records : [];
  renderDataTable();
  updateKPIsWithFilteredData();
  updateSortIndicators();
}

// フィルタリングされたデータでKPI更新
function updateKPIsWithFilteredData() {
  if (!filteredData) return;

  const totalSales = filteredData.reduce(
    (sum, record) => sum + (record.value || 0),
    0,
  );
  const totalOrders = filteredData.length;

  // KPI表示更新（フィルタリングされたデータ）
  document.getElementById("total-sales").textContent =
    formatCompactCurrency(totalSales);
  document.getElementById("total-orders").textContent =
    formatCompactNumber(totalOrders);

  // 利益率（仮の値）
  const profitMargin = 12.5;
  const totalProfit = totalSales * 0.125;

  document.getElementById("total-profit").textContent =
    formatCompactCurrency(totalProfit);
  document.getElementById("profit-margin").textContent =
    profitMargin.toFixed(1) + "%";
}

// 日付フォーマット
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// ===== 地域分析機能 =====

// 地域別データの処理
function processRegionData() {
  if (
    (!filteredData || filteredData.length === 0) &&
    (!dashboardData || !dashboardData.records)
  )
    return { regions: [], summary: {} };

  const records =
    filteredData && filteredData.length ? filteredData : dashboardData.records;
  const regionMap = new Map();

  records.forEach((record) => {
    const region = record.region || "Unknown";
    const state = record.state || "Unknown";

    if (!regionMap.has(region)) {
      regionMap.set(region, {
        name: region,
        states: new Set(),
        sales: 0,
        profit: 0,
        orders: 0,
        shippingDays: [],
        categories: new Map(),
        segments: new Map(),
      });
    }

    const regionData = regionMap.get(region);
    regionData.sales += record.value || 0;
    regionData.profit += record.profit || 0;
    regionData.orders += 1;
    regionData.states.add(state);

    if (record.shipping_days) {
      regionData.shippingDays.push(record.shipping_days);
    }

    // カテゴリ集計
    const category = record.category || "Unknown";
    regionData.categories.set(
      category,
      (regionData.categories.get(category) || 0) + (record.value || 0),
    );

    // セグメント集計
    const segment = record.segment || "Unknown";
    regionData.segments.set(
      segment,
      (regionData.segments.get(segment) || 0) + (record.value || 0),
    );
  });

  // Mapを配列に変換
  const regions = Array.from(regionMap.values()).map((region) => ({
    ...region,
    states: Array.from(region.states),
    avgShippingDays:
      region.shippingDays.length > 0
        ? region.shippingDays.reduce((a, b) => a + b, 0) /
          region.shippingDays.length
        : 0,
    topCategory:
      Array.from(region.categories.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] || "Unknown",
    topSegment:
      Array.from(region.segments.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] || "Unknown",
  }));

  // 売上順でソート
  regions.sort((a, b) => b.sales - a.sales);

  return {
    regions,
    summary: {
      totalRegions: regions.length,
      topSalesRegion: regions[0] || null,
      topProfitRegion: regions.reduce(
        (top, current) => (current.profit > top.profit ? current : top),
        regions[0] || { profit: 0 },
      ),
      avgShippingDays:
        regions.reduce((sum, region) => sum + region.avgShippingDays, 0) /
          regions.length || 0,
    },
  };
}

// 地域分析KPI更新
function updateGeographyKPIs(regionData) {
  if (!regionData || !regionData.summary) return;

  const summary = regionData.summary;

  document.getElementById("total-regions").textContent = summary.totalRegions;
  document.getElementById("top-region-sales").textContent =
    summary.topSalesRegion
      ? formatCompactCurrency(summary.topSalesRegion.sales)
      : "--";
  document.getElementById("top-region-name").textContent =
    summary.topSalesRegion ? summary.topSalesRegion.name : "--";
  document.getElementById("top-region-profit").textContent =
    summary.topProfitRegion
      ? formatCompactCurrency(summary.topProfitRegion.profit)
      : "--";
  document.getElementById("top-region-profit-name").textContent =
    summary.topProfitRegion ? summary.topProfitRegion.name : "--";
  document.getElementById("avg-shipping-days").textContent =
    summary.avgShippingDays
      ? summary.avgShippingDays.toFixed(1) + " days"
      : "--";
}

// 地域分析チャート描画
function renderRegionCharts(regionData) {
  if (!regionData || !regionData.regions) return;

  const regions = regionData.regions;

  // 地域別売上分布チャート
  const salesChart = echarts.init(
    document.getElementById("region-sales-chart"),
    "dashboard",
  );
  registerChartInstance(salesChart);
  salesChart.setOption({
    tooltip: { trigger: "item" },
    grid: { left: 24, right: 24, top: 24, bottom: 24, containLabel: true },
    series: [
      {
        type: "pie",
        radius: "50%",
        data: regions.map((region) => ({
          name: region.name,
          value: region.sales,
        })),
      },
    ],
  });

  // 地域別利益分布チャート
  const profitChart = echarts.init(
    document.getElementById("region-profit-chart"),
  );
  profitChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["Profit"], top: 8 },
    grid: { left: 48, right: 56, top: 64, bottom: 36, containLabel: true },
    xAxis: { type: "category", data: regions.map((r) => r.name) },
    yAxis: { type: "value", name: "利益" },
    series: [
      {
        name: "Profit",
        type: "bar",
        data: regions.map((r) => r.profit),
        itemStyle: { color: "#8B5CF6" },
      },
    ],
  });

  // 地域別配送パフォーマンスチャート
  const shippingChart = echarts.init(
    document.getElementById("region-shipping-chart"),
    "dashboard",
  );
  registerChartInstance(shippingChart);
  shippingChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: ["Sales", "Avg Shipping Days"], top: 8 },
    grid: { left: 56, right: 80, top: 64, bottom: 40, containLabel: true },
    xAxis: {
      type: "category",
      data: regions.map((r) => r.name),
      axisLabel: { margin: 10 },
    },
    yAxis: [
      {
        type: "value",
        name: "Sales",
        nameLocation: "middle",
        nameRotate: 90,
        nameGap: 50,
        axisLabel: { margin: 10, formatter: (v) => formatCompactCurrency(v) },
      },
      {
        type: "value",
        name: "Ship Days",
        nameLocation: "middle",
        nameRotate: 90,
        nameGap: 50,
        inverse: true,
        axisLabel: { margin: 10 },
      },
    ],
    series: [
      {
        name: "Sales",
        type: "bar",
        data: regions.map((r) => r.sales),
        yAxisIndex: 0,
        itemStyle: { color: "#3B82F6" },
      },
      {
        name: "Avg Shipping Days",
        type: "line",
        data: regions.map((r) => r.avgShippingDays),
        yAxisIndex: 1,
        itemStyle: { color: "#F59E0B" },
      },
    ],
  });

  // 地域別顧客セグメント分布チャート
  const segmentChart = echarts.init(
    document.getElementById("region-segment-chart"),
    "dashboard",
  );
  registerChartInstance(segmentChart);
  segmentChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: {
      data: regions.map((r) => r.name),
      top: 8,
      icon: "roundRect",
      itemWidth: 18,
      itemHeight: 10,
    },
    grid: { left: 64, right: 64, top: 64, bottom: 40, containLabel: true },
    xAxis: {
      type: "category",
      data: ["Consumer", "Corporate", "Home Office"],
      axisLabel: { margin: 10 },
    },
    yAxis: {
      type: "value",
      name: "Sales",
      nameLocation: "middle",
      nameRotate: 90,
      nameGap: 56,
      axisLabel: { formatter: (v) => formatCompactCurrency(v), margin: 10 },
    },
    series: regions.map((region) => ({
      name: region.name,
      type: "bar",
      stack: "total",
      data: [
        region.segments.get("Consumer") || 0,
        region.segments.get("Corporate") || 0,
        region.segments.get("Home Office") || 0,
      ],
    })),
  });
}

// 地域分析テーブル描画
function renderRegionTable(regionData) {
  if (!regionData || !regionData.regions) return;

  const tbody = document.getElementById("region-table-body");
  tbody.innerHTML = regionData.regions
    .map(
      (region) => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900 break-words">${region.name}</td>
            <td class="px-6 py-4 text-sm text-gray-900 break-words">${region.states.join(", ")}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${formatCompactCurrency(region.sales)}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${formatCompactCurrency(region.profit)}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${formatCompactNumber(region.orders)}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${region.avgShippingDays.toFixed(1)} days</td>
            <td class="px-6 py-4 text-sm text-gray-900 break-words">${region.topCategory}</td>
        </tr>
    `,
    )
    .join("");
}

// 地域フィルター初期化
function initializeRegionFilter(regionData) {
  if (!regionData || !regionData.regions) return;

  const filterSelect = document.getElementById("region-filter");
  if (!filterSelect) return;

  // Reset options
  filterSelect.innerHTML = '<option value="">All regions</option>';

  // 地域オプションを追加
  regionData.regions.forEach((region) => {
    const option = document.createElement("option");
    option.value = region.name;
    option.textContent = region.name;
    filterSelect.appendChild(option);
  });

  // フィルターイベントリスナー
  filterSelect.addEventListener("change", (e) => {
    const selectedRegion = e.target.value;
    filterRegionData(selectedRegion, regionData);
  });
}

// 地域データフィルタリング
function filterRegionData(selectedRegion, regionData) {
  if (!selectedRegion) {
    // 全地域表示
    renderRegionTable(regionData);
    return;
  }

  // 選択された地域のみ表示
  const filteredData = {
    ...regionData,
    regions: regionData.regions.filter(
      (region) => region.name === selectedRegion,
    ),
  };

  renderRegionTable(filteredData);
}

// ===== 配送・運営機能 =====

// 配送データの処理
function processShippingData() {
  if (
    (!filteredData || filteredData.length === 0) &&
    (!dashboardData || !dashboardData.records)
  )
    return { shippingModes: [], summary: {} };

  const records =
    filteredData && filteredData.length ? filteredData : dashboardData.records;
  const shippingMap = new Map();

  records.forEach((record) => {
    const shippingMode = record.shipping_mode || "Unknown";
    const shippingDays = record.shipping_days || 0;
    const shippingCost = record.shipping_cost || 0;

    if (!shippingMap.has(shippingMode)) {
      shippingMap.set(shippingMode, {
        name: shippingMode,
        orders: 0,
        sales: 0,
        profit: 0,
        shippingDays: [],
        shippingCosts: [],
        categories: new Map(),
      });
    }

    const shippingData = shippingMap.get(shippingMode);
    shippingData.orders += 1;
    shippingData.sales += record.value || 0;
    shippingData.profit += record.profit || 0;

    if (shippingDays > 0) {
      shippingData.shippingDays.push(shippingDays);
    }

    if (shippingCost > 0) {
      shippingData.shippingCosts.push(shippingCost);
    }

    // カテゴリ集計
    const category = record.category || "Unknown";
    shippingData.categories.set(
      category,
      (shippingData.categories.get(category) || 0) + (record.value || 0),
    );
  });

  // Mapを配列に変換
  const shippingModes = Array.from(shippingMap.values()).map((mode) => ({
    ...mode,
    avgShippingDays:
      mode.shippingDays.length > 0
        ? mode.shippingDays.reduce((a, b) => a + b, 0) /
          mode.shippingDays.length
        : 0,
    totalShippingCost: mode.shippingCosts.reduce((a, b) => a + b, 0),
    avgShippingCost:
      mode.shippingCosts.length > 0
        ? mode.shippingCosts.reduce((a, b) => a + b, 0) /
          mode.shippingCosts.length
        : 0,
    topCategory:
      Array.from(mode.categories.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] || "Unknown",
  }));

  // 売上順でソート
  shippingModes.sort((a, b) => b.sales - a.sales);

  return {
    shippingModes,
    summary: {
      totalOrders: shippingModes.reduce((sum, mode) => sum + mode.orders, 0),
      avgShippingDays:
        shippingModes.reduce((sum, mode) => sum + mode.avgShippingDays, 0) /
          shippingModes.length || 0,
      totalShippingCost: shippingModes.reduce(
        (sum, mode) => sum + mode.totalShippingCost,
        0,
      ),
      fastestMode: shippingModes.reduce(
        (fastest, current) =>
          current.avgShippingDays < fastest.avgShippingDays &&
          current.avgShippingDays > 0
            ? current
            : fastest,
        shippingModes.find((m) => m.avgShippingDays > 0) || {
          name: "Unknown",
          avgShippingDays: Infinity,
        },
      ),
    },
  };
}

// 配送・運営KPI更新
function updateShippingKPIs(shippingData) {
  if (!shippingData || !shippingData.summary) return;

  const summary = shippingData.summary;

  document.getElementById("total-shipping-orders").textContent =
    formatCompactNumber(summary.totalOrders);
  document.getElementById("avg-shipping-days-ops").textContent =
    summary.avgShippingDays
      ? summary.avgShippingDays.toFixed(1) + " days"
      : "--";
  document.getElementById("total-shipping-cost").textContent =
    formatCompactCurrency(summary.totalShippingCost);
  document.getElementById("fastest-shipping-mode").textContent =
    summary.fastestMode.name !== "Unknown" ? summary.fastestMode.name : "--";
}

// 配送・運営チャート描画
function renderShippingCharts(shippingData) {
  if (!shippingData || !shippingData.shippingModes) return;

  const modes = shippingData.shippingModes;

  // 配送モード別売上・件数チャート
  const modeChart = echarts.init(
    document.getElementById("shipping-mode-chart"),
    "dashboard",
  );
  registerChartInstance(modeChart);
  modeChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: ["Sales", "Orders"], top: 8 },
    grid: { left: 48, right: 56, top: 64, bottom: 36, containLabel: true },
    xAxis: { type: "category", data: modes.map((m) => m.name) },
    yAxis: [
      { type: "value", name: "Sales" },
      { type: "value", name: "Orders" },
    ],
    series: [
      {
        name: "Sales",
        type: "bar",
        data: modes.map((m) => m.sales),
        yAxisIndex: 0,
        itemStyle: { color: "#3B82F6" },
      },
      {
        name: "Orders",
        type: "line",
        data: modes.map((m) => m.orders),
        yAxisIndex: 1,
        itemStyle: { color: "#10B981" },
      },
    ],
  });

  // 配送モード別配送日数チャート
  const daysChart = echarts.init(
    document.getElementById("shipping-days-chart"),
    "dashboard",
  );
  registerChartInstance(daysChart);
  daysChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 48, right: 56, top: 40, bottom: 36, containLabel: true },
    xAxis: { type: "category", data: modes.map((m) => m.name) },
    yAxis: { type: "value", name: "Avg Ship Days" },
    series: [
      {
        type: "bar",
        data: modes.map((m) => m.avgShippingDays),
        itemStyle: { color: "#F59E0B" },
      },
    ],
  });

  // 配送コスト分析チャート
  const costChart = echarts.init(
    document.getElementById("shipping-cost-chart"),
    "dashboard",
  );
  registerChartInstance(costChart);
  costChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: ["Sales", "Ship Cost"], top: 8 },
    grid: { left: 48, right: 56, top: 64, bottom: 36, containLabel: true },
    xAxis: { type: "category", data: modes.map((m) => m.name) },
    yAxis: [
      { type: "value", name: "Sales" },
      { type: "value", name: "Ship Cost" },
    ],
    series: [
      {
        name: "Sales",
        type: "bar",
        data: modes.map((m) => m.sales),
        yAxisIndex: 0,
        itemStyle: { color: "#3B82F6" },
      },
      {
        name: "Ship Cost",
        type: "line",
        data: modes.map((m) => m.totalShippingCost),
        yAxisIndex: 1,
        itemStyle: { color: "#EF4444" },
      },
    ],
  });

  // 地域別配送パフォーマンスチャート
  const regionPerformanceChart = echarts.init(
    document.getElementById("region-shipping-performance-chart"),
    "dashboard",
  );
  registerChartInstance(regionPerformanceChart);

  // 地域別データを取得
  const regionData = processRegionData();
  if (regionData.regions) {
    regionPerformanceChart.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      legend: { data: ["Sales", "Avg Shipping Days"], top: 8 },
      grid: { left: 48, right: 56, top: 64, bottom: 36, containLabel: true },
      xAxis: { type: "category", data: regionData.regions.map((r) => r.name) },
      yAxis: [
        { type: "value", name: "Sales" },
        { type: "value", name: "Ship Days", inverse: true },
      ],
      series: [
        {
          name: "Sales",
          type: "bar",
          data: regionData.regions.map((r) => r.sales),
          yAxisIndex: 0,
          itemStyle: { color: "#3B82F6" },
        },
        {
          name: "Avg Shipping Days",
          type: "line",
          data: regionData.regions.map((r) => r.avgShippingDays),
          yAxisIndex: 1,
          itemStyle: { color: "#F59E0B" },
        },
      ],
    });
  }
}

// 配送・運営テーブル描画
function renderShippingTable(shippingData) {
  if (!shippingData || !shippingData.shippingModes) return;

  const tbody = document.getElementById("shipping-table-body");
  tbody.innerHTML = shippingData.shippingModes
    .map(
      (mode) => `
		<tr class="hover:bg-gray-50">
			<td class="px-6 py-4 text-sm text-gray-900 break-words">${mode.name}</td>
			<td class="px-6 py-4 text-sm text-gray-900">${formatCompactNumber(mode.orders)}</td>
			<td class="px-6 py-4 text-sm text-gray-900">${formatCompactCurrency(mode.sales)}</td>
			<td class="px-6 py-4 text-sm text-gray-900">${formatCompactCurrency(mode.profit)}</td>
			<td class="px-6 py-4 text-sm text-gray-900">${mode.avgShippingDays.toFixed(1)} days</td>
			<td class="px-6 py-4 text-sm text-gray-900">${formatCompactCurrency(mode.totalShippingCost)}</td>
			<td class="px-6 py-4 text-sm text-gray-900 break-words">${mode.topCategory}</td>
		</tr>
	`,
    )
    .join("");
}

// 配送モードフィルター初期化
function initializeShippingModeFilter(shippingData) {
  if (!shippingData || !shippingData.shippingModes) return;

  const filterSelect = document.getElementById("shipping-mode-filter");
  if (!filterSelect) return;

  // Reset options
  filterSelect.innerHTML = '<option value="">All ship modes</option>';

  // 配送モードオプションを追加
  shippingData.shippingModes.forEach((mode) => {
    const option = document.createElement("option");
    option.value = mode.name;
    option.textContent = mode.name;
    filterSelect.appendChild(option);
  });

  // フィルターイベントリスナー
  filterSelect.addEventListener("change", (e) => {
    const selectedMode = e.target.value;
    filterShippingData(selectedMode, shippingData);
  });
}

// 配送データフィルタリング
function filterShippingData(selectedMode, shippingData) {
  if (!selectedMode) {
    // 全配送モード表示
    renderShippingTable(shippingData);
    return;
  }

  // 選択された配送モードのみ表示
  const filteredData = {
    ...shippingData,
    shippingModes: shippingData.shippingModes.filter(
      (mode) => mode.name === selectedMode,
    ),
  };

  renderShippingTable(filteredData);
}
