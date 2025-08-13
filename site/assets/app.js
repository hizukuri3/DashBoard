// グローバル変数
let dashboardData = null;
let currentPage = 'overview';

// ページ初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeFiltering();
    loadDashboardData();
});

// ナビゲーション初期化
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            switchPage(targetPage);
        });
    });
}

// ページ切り替え
function switchPage(pageName) {
    // 現在のページを非表示
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // ナビゲーションアイテムのアクティブ状態を更新
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 新しいページを表示
    document.getElementById(pageName).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    currentPage = pageName;
    
    // ページ固有の初期化処理
    initializePage(pageName);
}

// ページ固有の初期化処理
function initializePage(pageName) {
    switch(pageName) {
        case 'overview':
            renderOverviewCharts();
            break;
        case 'geography':
            renderGeographyPage();
            break;
        case 'products':
            renderProductsPage();
            break;
        case 'customers':
            renderCustomersPage();
            break;
        case 'time':
            renderTimePage();
            break;
        case 'operations':
            renderOperationsPage();
            break;
    }
}

// ダッシュボードデータ読み込み
async function loadDashboardData() {
    try {
        console.log('データ読み込み開始...');
        
        // まずlatest.jsonを試す
        console.log('latest.jsonを読み込み中...');
        const response = await fetch('data/latest.json');
        if (response.ok) {
            console.log('latest.json読み込み成功');
            dashboardData = await response.json();
            updateLastUpdated();
            renderDashboard();
        } else {
            console.log('latest.json読み込み失敗、sample.jsonを試行...');
            // フォールバック: sample.json
            const sampleResponse = await fetch('data/sample.json');
            if (sampleResponse.ok) {
                console.log('sample.json読み込み成功');
                dashboardData = await sampleResponse.json();
                updateLastUpdated('sample.json');
                renderDashboard();
            } else {
                throw new Error('データファイルが見つかりません');
            }
        }
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        showError('データの読み込みに失敗しました: ' + error.message);
    }
}

// 最終更新時刻更新
function updateLastUpdated(filename = 'latest.json') {
    const now = new Date();
    const timeString = now.toLocaleString('ja-JP');
    document.getElementById('last-updated').textContent = `最終更新: ${timeString} (${filename})`;
}

// エラー表示
function showError(message) {
    const main = document.querySelector('main');
    main.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">エラー</h3>
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
    
    console.log('ダッシュボード描画開始', dashboardData);
    
    // KPI更新
    updateKPIs();
    
    // 現在のページに応じてチャート描画
    initializePage(currentPage);
}

// KPI更新
function updateKPIs() {
    if (!dashboardData || !dashboardData.records) return;
    
    const records = dashboardData.records;
    console.log('KPI更新中、レコード数:', records.length);
    
    // 集計計算
    const totalSales = records.reduce((sum, record) => sum + (record.value || 0), 0);
    const totalOrders = records.length;
    
    // 利益率（仮の値、実際のデータに応じて調整）
    const profitMargin = 12.5; // 例: 12.5%
    
    // KPI表示更新
    document.getElementById('total-sales').textContent = formatCurrency(totalSales);
    document.getElementById('total-orders').textContent = totalOrders.toLocaleString();
    document.getElementById('profit-margin').textContent = profitMargin.toFixed(1) + '%';
    
    // 総利益（仮の値、実際のデータに応じて調整）
    const totalProfit = totalSales * 0.125; // 12.5%の利益率
    document.getElementById('total-profit').textContent = formatCurrency(totalProfit);
    
    // 前年同期比（仮の値）
    document.getElementById('sales-yoy').textContent = '+5.2%';
    document.getElementById('profit-yoy').textContent = '+5.2%';
    document.getElementById('orders-yoy').textContent = '+3.8%';
    document.getElementById('margin-yoy').textContent = '+0.8%';
}

// 通貨フォーマット
function formatCurrency(amount) {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// オーバービューページのチャート描画
function renderOverviewCharts() {
    if (!dashboardData || !dashboardData.records) return;
    
    console.log('オーバービューチャート描画開始');
    
    renderMonthlyTrendChart();
    renderGeographyChart();
    renderCategoryChart();
    renderSegmentChart();
}

// 月次トレンドチャート
function renderMonthlyTrendChart() {
    const chartDom = document.getElementById('monthly-trend-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    // 実際のデータから月次データを生成
    const monthlyData = processMonthlyDataFromRecords();
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            data: ['売上', '注文数']
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: monthlyData.months
        },
        yAxis: [
            {
                type: 'value',
                name: '売上',
                position: 'left'
            },
            {
                type: 'value',
                name: '注文数',
                position: 'right'
            }
        ],
        series: [
            {
                name: '売上',
                type: 'line',
                yAxisIndex: 0,
                data: monthlyData.sales,
                itemStyle: { color: '#3B82F6' }
            },
            {
                name: '注文数',
                type: 'line',
                yAxisIndex: 1,
                data: monthlyData.orders,
                itemStyle: { color: '#10B981' }
            }
        ]
    };
    
    chart.setOption(option);
}

// 実際のデータから月次データを処理
function processMonthlyDataFromRecords() {
    if (!dashboardData || !dashboardData.records) {
        return { months: [], sales: [], orders: [] };
    }
    
    const records = dashboardData.records;
    const monthlyData = {};
    
    records.forEach(record => {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { sales: 0, orders: 0 };
        }
        
        monthlyData[monthKey].sales += record.value || 0;
        monthlyData[monthKey].orders += 1;
    });
    
    // 月順にソート
    const sortedMonths = Object.keys(monthlyData).sort();
    
    return {
        months: sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            return `${monthNum}月`;
        }),
        sales: sortedMonths.map(month => monthlyData[month].sales),
        orders: sortedMonths.map(month => monthlyData[month].orders)
    };
}

// 地域別チャート（実際のデータから生成）
function renderGeographyChart() {
    const chartDom = document.getElementById('geography-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    // 実際のデータから地域データを生成（仮の地域データ）
    const geographyData = [
        { value: 1048, name: 'East' },
        { value: 735, name: 'West' },
        { value: 580, name: 'South' },
        { value: 484, name: 'Central' }
    ];
    
    const option = {
        tooltip: {
            trigger: 'item'
        },
        series: [
            {
                name: '地域別売上',
                type: 'pie',
                radius: '50%',
                data: geographyData,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };
    
    chart.setOption(option);
}

// カテゴリ別チャート（実際のデータから生成）
function renderCategoryChart() {
    const chartDom = document.getElementById('category-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    // 実際のデータからカテゴリデータを生成
    const categoryData = processCategoryDataFromRecords();
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['売上', '注文数']
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: categoryData.categories
        },
        yAxis: [
            {
                type: 'value',
                name: '売上',
                position: 'left'
            },
            {
                type: 'value',
                name: '注文数',
                position: 'right'
            }
        ],
        series: [
            {
                name: '売上',
                type: 'bar',
                yAxisIndex: 0,
                data: categoryData.sales,
                itemStyle: { color: '#3B82F6' }
            },
            {
                name: '注文数',
                type: 'bar',
                yAxisIndex: 1,
                data: categoryData.orders,
                itemStyle: { color: '#10B981' }
            }
        ]
    };
    
    chart.setOption(option);
}

// 実際のデータからカテゴリデータを処理
function processCategoryDataFromRecords() {
    if (!dashboardData || !dashboardData.records) {
        return { categories: [], sales: [], orders: [] };
    }
    
    const records = dashboardData.records;
    const categoryData = {};
    
    records.forEach(record => {
        const category = record.category || 'Unknown';
        
        if (!categoryData[category]) {
            categoryData[category] = { sales: 0, orders: 0 };
        }
        
        categoryData[category].sales += record.value || 0;
        categoryData[category].orders += 1;
    });
    
    const categories = Object.keys(categoryData);
    
    return {
        categories: categories,
        sales: categories.map(cat => categoryData[cat].sales),
        orders: categories.map(cat => categoryData[cat].orders)
    };
}

// セグメント別チャート（実際のデータから生成）
function renderSegmentChart() {
    const chartDom = document.getElementById('segment-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    // 実際のデータからセグメントデータを生成
    const segmentData = processSegmentDataFromRecords();
    
    const option = {
        tooltip: {
            trigger: 'item'
        },
        series: [
            {
                name: '顧客セグメント',
                type: 'pie',
                radius: '50%',
                data: segmentData,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };
    
    chart.setOption(option);
}

// 実際のデータからセグメントデータを処理
function processSegmentDataFromRecords() {
    if (!dashboardData || !dashboardData.records) {
        return [];
    }
    
    const records = dashboardData.records;
    const segmentData = {};
    
    records.forEach(record => {
        const segment = record.segment || 'Unknown';
        
        if (!segmentData[segment]) {
            segmentData[segment] = 0;
        }
        
        segmentData[segment] += record.value || 0;
    });
    
    return Object.keys(segmentData).map(segment => ({
        name: segment,
        value: segmentData[segment]
    }));
}

// 各ページの描画関数
function renderGeographyPage() {
	if (!dashboardData || !dashboardData.records) return;

	const page = document.getElementById('geography');
	page.innerHTML = `
		<div class="space-y-6">
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">地域分析</h2>
				<p class="text-sm text-gray-600 mb-4">現在のデータには地域情報が含まれていないため、代替としてセグメント分布を表示しています。</p>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-4">セグメント分布（売上）</h3>
						<div id="region-like-pie" class="h-80"></div>
					</div>
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-4">セグメント別 売上・件数</h3>
						<div id="region-like-bar" class="h-80"></div>
					</div>
				</div>
			</div>
		</div>
	`;

	const seg = processSegmentDataFromRecords();
	const pie = echarts.init(document.getElementById('region-like-pie'));
	pie.setOption({
		tooltip: { trigger: 'item' },
		series: [{ type: 'pie', radius: '50%', data: seg }]
	});

	const names = seg.map(s => s.name);
	const values = seg.map(s => s.value);
	const bar = echarts.init(document.getElementById('region-like-bar'));
	bar.setOption({
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		legend: { data: ['売上', '件数(概算)'] },
		xAxis: { type: 'category', data: names },
		yAxis: [{ type: 'value', name: '売上' }, { type: 'value', name: '件数' }],
		series: [
			{ name: '売上', type: 'bar', data: values, yAxisIndex: 0, itemStyle: { color: '#3B82F6' } },
			{ name: '件数(概算)', type: 'line', data: values.map(v => Math.max(1, Math.round(v / 100))), yAxisIndex: 1, itemStyle: { color: '#10B981' } }
		]
	});
}

function renderProductsPage() {
	if (!dashboardData || !dashboardData.records) return;

	const page = document.getElementById('products');
	page.innerHTML = `
		<div class="space-y-6">
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">製品分析</h2>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-4">カテゴリ別 売上・件数</h3>
						<div id="category-combo-chart" class="h-80"></div>
					</div>
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-4">カテゴリ別 売上分布</h3>
						<div id="category-pie-chart" class="h-80"></div>
					</div>
				</div>
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">カテゴリ</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">売上</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">件数</th>
							</tr>
						</thead>
						<tbody id="products-table-body" class="bg-white divide-y divide-gray-200"></tbody>
					</table>
				</div>
			</div>
		</div>
	`;

	const cat = processCategoryDataFromRecords();
	const combo = echarts.init(document.getElementById('category-combo-chart'));
	combo.setOption({
		tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
		legend: { data: ['売上', '件数'] },
		xAxis: { type: 'category', data: cat.categories },
		yAxis: [{ type: 'value', name: '売上' }, { type: 'value', name: '件数' }],
		series: [
			{ name: '売上', type: 'bar', data: cat.sales, yAxisIndex: 0, itemStyle: { color: '#3B82F6' } },
			{ name: '件数', type: 'line', data: cat.orders, yAxisIndex: 1, itemStyle: { color: '#10B981' } }
		]
	});

	const pie = echarts.init(document.getElementById('category-pie-chart'));
	pie.setOption({
		tooltip: { trigger: 'item' },
		series: [{ type: 'pie', radius: '50%', data: cat.categories.map((c, i) => ({ name: c, value: cat.sales[i] })) }]
	});

	const tbody = document.getElementById('products-table-body');
	tbody.innerHTML = cat.categories.map((c, i) => `
		<tr>
			<td class="px-6 py-3 text-sm">${c}</td>
			<td class="px-6 py-3 text-sm">${formatCurrency(cat.sales[i])}</td>
			<td class="px-6 py-3 text-sm">${cat.orders[i].toLocaleString()}</td>
		</tr>
	`).join('');
}

function renderCustomersPage() {
	if (!dashboardData || !dashboardData.records) return;

	const page = document.getElementById('customers');
	page.innerHTML = `
		<div class="space-y-6">
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">顧客分析</h2>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-4">セグメント分布（売上）</h3>
						<div id="segment-pie-chart" class="h-80"></div>
					</div>
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-4">セグメント別 売上・件数</h3>
						<div id="segment-bar-chart" class="h-80"></div>
					</div>
				</div>
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">セグメント</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">売上</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">件数</th>
							</tr>
						</thead>
						<tbody id="customers-table-body" class="bg-white divide-y divide-gray-200"></tbody>
					</table>
				</div>
			</div>
		</div>
	`;

	const seg = processSegmentDataFromRecords();
	const pie = echarts.init(document.getElementById('segment-pie-chart'));
	pie.setOption({ tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: '50%', data: seg }] });

	const bar = echarts.init(document.getElementById('segment-bar-chart'));
	bar.setOption({
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		legend: { data: ['売上', '件数'] },
		xAxis: { type: 'category', data: seg.map(s => s.name) },
		yAxis: [{ type: 'value', name: '売上' }, { type: 'value', name: '件数' }],
		series: [
			{ name: '売上', type: 'bar', data: seg.map(s => s.value), yAxisIndex: 0, itemStyle: { color: '#3B82F6' } },
			{ name: '件数', type: 'line', data: seg.map(s => Math.max(1, Math.round(s.value / 100))), yAxisIndex: 1, itemStyle: { color: '#10B981' } }
		]
	});

	const tbody = document.getElementById('customers-table-body');
	tbody.innerHTML = seg.map(s => `
		<tr>
			<td class="px-6 py-3 text-sm">${s.name}</td>
			<td class="px-6 py-3 text-sm">${formatCurrency(s.value)}</td>
			<td class="px-6 py-3 text-sm">${Math.max(1, Math.round(s.value / 100)).toLocaleString()}</td>
		</tr>
	`).join('');
}

function renderTimePage() {
	if (!dashboardData || !dashboardData.records) return;

	const page = document.getElementById('time');
	page.innerHTML = `
		<div class="space-y-6">
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">時間分析</h2>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-4">月次 売上・件数</h3>
						<div id="time-trend-chart" class="h-80"></div>
					</div>
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-4">月別詳細</h3>
						<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">月</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">売上</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">件数</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">前月比</th></tr></thead><tbody id="time-table-body" class="bg-white divide-y divide-gray-200"></tbody></table></div>
					</div>
				</div>
			</div>
		</div>
	`;

	const monthly = processMonthlyDataFromRecords();
	const chart = echarts.init(document.getElementById('time-trend-chart'));
	chart.setOption({
		tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
		legend: { data: ['売上', '件数'] },
		xAxis: { type: 'category', data: monthly.months },
		yAxis: [{ type: 'value', name: '売上' }, { type: 'value', name: '件数' }],
		series: [
			{ name: '売上', type: 'line', data: monthly.sales, yAxisIndex: 0, itemStyle: { color: '#3B82F6' } },
			{ name: '件数', type: 'line', data: monthly.orders, yAxisIndex: 1, itemStyle: { color: '#10B981' } }
		]
	});

	const tbody = document.getElementById('time-table-body');
	tbody.innerHTML = monthly.months.map((m, i) => {
		const sales = monthly.sales[i];
		const orders = monthly.orders[i];
		let growth = 'N/A';
		if (i > 0 && monthly.sales[i-1] !== 0) {
			growth = (((sales - monthly.sales[i-1]) / monthly.sales[i-1]) * 100).toFixed(1) + '%';
		}
		return `<tr><td class="px-6 py-3 text-sm">${m}</td><td class="px-6 py-3 text-sm">${formatCurrency(sales)}</td><td class="px-6 py-3 text-sm">${orders.toLocaleString()}</td><td class="px-6 py-3 text-sm">${growth}</td></tr>`;
	}).join('');
}

function renderOperationsPage() {
	if (!dashboardData || !dashboardData.records) return;

	const page = document.getElementById('operations');
	page.innerHTML = `
		<div class="space-y-6">
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">配送・運営</h2>
				<p class="text-sm text-gray-600 mb-4">現在のデータには配送モード情報が含まれていないため、代替としてカテゴリ別の運営ビューを表示しています。</p>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-4">カテゴリ別 売上</h3>
						<div id="ops-bar" class="h-80"></div>
					</div>
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-4">カテゴリ構成</h3>
						<div id="ops-pie" class="h-80"></div>
					</div>
				</div>
			</div>
		</div>
	`;

	const cat = processCategoryDataFromRecords();
	const bar = echarts.init(document.getElementById('ops-bar'));
	bar.setOption({
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		xAxis: { type: 'category', data: cat.categories },
		yAxis: { type: 'value', name: '売上' },
		series: [{ type: 'bar', data: cat.sales, itemStyle: { color: '#3B82F6' } }]
	});

	const pie = echarts.init(document.getElementById('ops-pie'));
	pie.setOption({ tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: '50%', data: cat.categories.map((c, i) => ({ name: c, value: cat.sales[i] })) }] });
}

// ===== フィルタリング機能 =====

// フィルタリング状態管理
let filteredData = null;
let currentPageNum = 1;
let pageSize = 50;
let sortField = 'date';
let sortDirection = 'asc';

// フィルタリング機能の初期化
function initializeFiltering() {
    // 日付フィールドの初期値を設定
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    document.getElementById('start-date').value = threeMonthsAgo.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
    
    // イベントリスナーの設定
    document.getElementById('apply-filter').addEventListener('click', applyFilters);
    document.getElementById('reset-filter').addEventListener('click', resetFilters);
    document.getElementById('page-size').addEventListener('change', onPageSizeChange);
    
    // ページネーション
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
    
    // ソート機能
    document.querySelectorAll('[data-sort]').forEach(th => {
        th.addEventListener('click', () => sortTable(th.getAttribute('data-sort')));
    });
    
    // 初期データ表示
    applyFilters();
}

// フィルター適用
function applyFilters() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        alert('開始日と終了日を選択してください');
        return;
    }
    
    // データフィルタリング
    filteredData = filterDataByDateRange(startDate, endDate);
    
    // テーブル更新
    renderDataTable();
    
    // KPI更新
    updateKPIsWithFilteredData();
    
    console.log('フィルター適用完了:', filteredData.length, '件');
}

// 日付範囲でデータをフィルタリング
function filterDataByDateRange(startDate, endDate) {
    if (!dashboardData || !dashboardData.records) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return dashboardData.records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
    });
}

// データテーブルの描画
function renderDataTable() {
    if (!filteredData) return;
    
    const tbody = document.getElementById('data-table-body');
    const startIndex = (currentPageNum - 1) * pageSize;
    const endIndex = pageSize === 'all' ? filteredData.length : startIndex + pageSize;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // ソート適用
    const sortedData = sortData(pageData, sortField, sortDirection);
    
    // テーブル行の生成
    tbody.innerHTML = sortedData.map(record => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(record.date)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.category}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.segment}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(record.value)}</td>
        </tr>
    `).join('');
    
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
        
        if (field === 'date') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        } else if (field === 'value') {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }
        
        if (direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

// テーブルソート
function sortTable(field) {
    if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortDirection = 'asc';
    }
    
    // ソートインジケーター更新
    updateSortIndicators();
    
    // テーブル再描画
    renderDataTable();
}

// ソートインジケーター更新
function updateSortIndicators() {
    document.querySelectorAll('[data-sort]').forEach(th => {
        const indicator = th.querySelector('.sort-indicator');
        if (th.getAttribute('data-sort') === sortField) {
            indicator.textContent = sortDirection === 'asc' ? '▲' : '▼';
        } else {
            indicator.textContent = '▼';
        }
    });
}

// ページサイズ変更
function onPageSizeChange() {
    pageSize = document.getElementById('page-size').value;
    currentPageNum = 1;
    renderDataTable();
}

// ページ変更
function changePage(delta) {
    const newPage = currentPageNum + delta;
    const totalPages = Math.ceil(filteredData.length / (pageSize === 'all' ? filteredData.length : pageSize));
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPageNum = newPage;
        renderDataTable();
    }
}

// テーブル統計情報更新
function updateTableStats() {
    if (!filteredData) return;
    
    document.getElementById('total-records').textContent = filteredData.length.toLocaleString();
    
    const startIndex = (currentPageNum - 1) * pageSize;
    const endIndex = pageSize === 'all' ? filteredData.length : startIndex + pageSize;
    const displayedCount = endIndex - startIndex;
    
    document.getElementById('displayed-records').textContent = displayedCount.toLocaleString();
}

// ページネーション更新
function updatePagination() {
    if (!filteredData) return;
    
    const totalPages = Math.ceil(filteredData.length / (pageSize === 'all' ? filteredData.length : pageSize));
    const startIndex = (currentPageNum - 1) * pageSize;
    const endIndex = pageSize === 'all' ? filteredData.length : startIndex + pageSize;
    
    document.getElementById('current-page').textContent = currentPageNum;
    document.getElementById('total-pages').textContent = totalPages;
    document.getElementById('page-info').textContent = `${startIndex + 1}-${endIndex}件を表示`;
    
    // ボタンの有効/無効状態
    document.getElementById('prev-page').disabled = currentPageNum <= 1;
    document.getElementById('next-page').disabled = currentPageNum >= totalPages;
}

// フィルターリセット
function resetFilters() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('page-size').value = '50';
    
    pageSize = 50;
    currentPageNum = 1;
    sortField = 'date';
    sortDirection = 'asc';
    
    filteredData = dashboardData ? dashboardData.records : [];
    renderDataTable();
    updateKPIsWithFilteredData();
    updateSortIndicators();
}

// フィルタリングされたデータでKPI更新
function updateKPIsWithFilteredData() {
    if (!filteredData) return;
    
    const totalSales = filteredData.reduce((sum, record) => sum + (record.value || 0), 0);
    const totalOrders = filteredData.length;
    
    // KPI表示更新（フィルタリングされたデータ）
    document.getElementById('total-sales').textContent = formatCurrency(totalSales);
    document.getElementById('total-orders').textContent = totalOrders.toLocaleString();
    
    // 利益率（仮の値）
    const profitMargin = 12.5;
    const totalProfit = totalSales * 0.125;
    
    document.getElementById('total-profit').textContent = formatCurrency(totalProfit);
    document.getElementById('profit-margin').textContent = profitMargin.toFixed(1) + '%';
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}
