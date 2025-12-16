/**
 * 库存管理系统 - 主应用脚本
 * 处理页面交互和数据加载
 */

// 应用状态
const AppState = {
    currentPage: 'dashboard',
    currentUser: null,
    isLoading: false,
    cache: {
        items: null,
        warehouses: null,
        suppliers: null,
        categories: null,
        cacheTime: {},
    },
    CACHE_DURATION: 30 * 1000, // 30秒缓存（后端也有缓存，前端缓存时间可以短一些）
    isLoadingDashboard: false, // 防止重复加载
};

// 工具函数
const Utils = {
    // 缓存管理
    getCachedData(key) {
        const cached = AppState.cache[key];
        const cacheTime = AppState.cache.cacheTime[key];
        
        if (cached && cacheTime && (Date.now() - cacheTime < AppState.CACHE_DURATION)) {
            return cached;
        }
        return null;
    },
    
    setCachedData(key, data) {
        AppState.cache[key] = data;
        AppState.cache.cacheTime[key] = Date.now();
    },
    
    clearCache(key) {
        if (key) {
            AppState.cache[key] = null;
            AppState.cache.cacheTime[key] = null;
        } else {
            // 清除所有缓存
            AppState.cache = {
                items: null,
                warehouses: null,
                suppliers: null,
                categories: null,
                cacheTime: {},
            };
        }
    },
    
    // 处理图片URL，确保在内网穿透时也能正常工作
    getImageUrl(imageUrl) {
        if (!imageUrl) return null;
        // 如果是完整URL，提取路径部分（处理内网穿透情况）
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            try {
                const url = new URL(imageUrl);
                // 返回相对路径，让浏览器使用当前域名
                return url.pathname;
            } catch (e) {
                return imageUrl;
            }
        }
        // 如果是相对路径，确保以/开头
        if (!imageUrl.startsWith('/')) {
            return '/' + imageUrl;
        }
        return imageUrl;
    },
    
    // 显示加载状态
    showLoading(message = '加载中...') {
        AppState.isLoading = true;
        // 显示loading遮罩
        let loadingEl = document.getElementById('global-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'global-loading';
            loadingEl.className = 'fixed inset-0 bg-black/20 flex items-center justify-center z-50';
            loadingEl.innerHTML = `
                <div class="bg-white rounded-xl p-6 shadow-lg flex items-center space-x-3">
                    <i class="fas fa-spinner fa-spin text-primary text-xl"></i>
                    <span class="text-gray-700">${message}</span>
                </div>
            `;
            document.body.appendChild(loadingEl);
        } else {
            loadingEl.classList.remove('hidden');
        }
        // 设置超时自动隐藏（防止卡死）
        setTimeout(() => this.hideLoading(), 10000);
    },
    
    // 隐藏加载状态
    hideLoading() {
        AppState.isLoading = false;
        const loadingEl = document.getElementById('global-loading');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    },
    
    // 显示成功消息
    showSuccess(message) {
        alert(message);
    },
    
    // 显示错误消息
    showError(message) {
        console.error('❌', message);
        alert('错误: ' + message);
    },
    
    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    },
    
    // 格式化金额
    formatMoney(amount) {
        return '¥' + parseFloat(amount).toFixed(2);
    },
    
    // 格式化数字
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return Number(num).toLocaleString('zh-CN');
    },
};

// 页面管理
const PageManager = {
    // 显示指定页面
    showPage(pageId) {
        // 隐藏所有页面
        document.querySelectorAll('[id$="-page"]').forEach(page => {
            page.classList.add('hidden');
        });
        
        // 显示目标页面
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            AppState.currentPage = pageId;
        }
        
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-page="${pageId}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    },
    
    // 初始化页面导航
    initNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = item.getAttribute('data-page');
                if (pageId) {
                    this.showPage(pageId);
                    // 加载页面数据
                    this.loadPageData(pageId);
                    // 关闭用户下拉菜单
                    document.getElementById('user-dropdown')?.classList.add('hidden');
                    document.getElementById('notification-dropdown')?.classList.add('hidden');
                }
            });
        });
    },
    
    // 加载页面数据
    async loadPageData(pageId) {
        switch(pageId) {
            case 'dashboard-page':
                await DashboardController.loadData();
                break;
            case 'items-page':
                await ItemsController.loadData();
                break;
            case 'inbound-page':
                await InboundController.loadData();
                break;
            case 'outbound-page':
                await OutboundController.loadData();
                break;
            case 'transfer-page':
                await TransferController.loadData();
                break;
            case 'warehouse-page':
                await WarehouseController.loadData();
                break;
            case 'supplier-page':
                await SupplierController.loadData();
                break;
            case 'categories-page':
                if (typeof loadCategoriesPage === 'function') {
                    await loadCategoriesPage();
                }
                break;
            case 'settings-page':
                await SettingsController.loadData();
                break;
        }
    },
};

// 仪表盘控制器
const DashboardController = {
    async loadData(forceRefresh = false) {
        // 防止重复加载
        if (AppState.isLoadingDashboard) {
            if (AppState.dashboardLoadStartTime && Date.now() - AppState.dashboardLoadStartTime > 5000) {
                AppState.isLoadingDashboard = false;
            } else {
                return;
            }
        }
        
        AppState.isLoadingDashboard = true;
        AppState.dashboardLoadStartTime = Date.now();
        
        if (forceRefresh) {
            Utils.clearCache('dashboard_overview');
        }
        
        let overviewData, activities, lowStock;
        
        try {
            [overviewData, activities, lowStock] = await Promise.all([
                API.dashboard.overview().catch(() => ({ success: false })),
                API.dashboard.activities(10).catch(() => ({ success: false })),
                API.dashboard.lowStock().catch(() => ({ success: false }))
            ]);
        } catch (error) {
            overviewData = { success: false };
            activities = { success: false };
            lowStock = { success: false };
        }
        
        if (overviewData?.success && overviewData?.data) {
            this.renderOverview(overviewData.data);
        } else {
            this.renderOverview({ overview: { total_items: 0, low_stock_items: 0, total_value: 0, turnover_rate: 0 }, changes: {} });
        }
        
        if (activities?.success) {
            this.renderActivities(activities.data || []);
        } else {
            this.renderActivities([]);
        }
        
        if (lowStock?.success) {
            this.renderLowStock(lowStock.data || []);
        } else {
            this.renderLowStock([]);
        }
        
        AppState.isLoadingDashboard = false;
        this.loadChartsAsync();
    },
    
    async loadChartsAsync() {
        try {
            const [trendData, distData] = await Promise.all([
                API.dashboard.trend('month').catch(() => ({ success: false })),
                API.dashboard.distribution().catch(() => ({ success: false }))
            ]);
            
            if (trendData?.success) {
                this.renderTrendChartWithData(trendData);
            }
            if (distData?.success) {
                this.renderCategoryChartWithData(distData);
            }
            
            this.initTrendPeriodButtons();
        } catch (error) {
            // 静默处理错误
        }
    },
    
    renderOverview(data) {
        
        // 数据可能在 data.overview 中
        const overview = data.overview || data;
        const changes = data.changes || {};
        
        // 更新统计卡片 - 使用正确的HTML ID
        const totalItemsCount = document.getElementById('total-items-count');
        if (totalItemsCount && overview.total_items !== undefined) {
            totalItemsCount.textContent = Utils.formatNumber(overview.total_items);
        }
        
        // 更新总物品数量变化
        const totalItemsChange = document.getElementById('total-items-change');
        if (totalItemsChange && changes.items_change !== undefined) {
            const change = changes.items_change;
            totalItemsChange.textContent = Math.abs(change).toFixed(1) + '%';
            
            // 更新图标和颜色
            const parent = totalItemsChange.parentElement;
            const icon = parent.querySelector('i');
            if (change >= 0) {
                parent.classList.remove('text-danger');
                parent.classList.add('text-success');
                if (icon) icon.className = 'fas fa-arrow-up mr-1';
            } else {
                parent.classList.remove('text-success');
                parent.classList.add('text-danger');
                if (icon) icon.className = 'fas fa-arrow-down mr-1';
            }
        }
        
        const lowStockCount = document.getElementById('low-stock-count');
        if (lowStockCount && overview.low_stock_items !== undefined) {
            lowStockCount.textContent = Utils.formatNumber(overview.low_stock_items);
        }
        
        // 更新低库存变化
        const lowStockChange = document.getElementById('low-stock-change');
        if (lowStockChange && changes.low_stock_change !== undefined) {
            const change = changes.low_stock_change;
            lowStockChange.textContent = Math.abs(change).toFixed(1) + '%';
            
            const parent = lowStockChange.parentElement;
            const icon = parent.querySelector('i');
            // 低库存增加是坏事，所以颜色相反
            if (change >= 0) {
                parent.classList.remove('text-success');
                parent.classList.add('text-danger');
                if (icon) icon.className = 'fas fa-arrow-up mr-1';
            } else {
                parent.classList.remove('text-danger');
                parent.classList.add('text-success');
                if (icon) icon.className = 'fas fa-arrow-down mr-1';
            }
        }
        
        const totalValue = document.getElementById('total-value');
        if (totalValue && overview.total_value !== undefined) {
            totalValue.textContent = '¥' + Utils.formatNumber(overview.total_value);
        }
        
        // 更新库存价值变化
        const totalValueChange = document.getElementById('total-value-change');
        if (totalValueChange && changes.value_change !== undefined) {
            const change = changes.value_change;
            totalValueChange.textContent = Math.abs(change).toFixed(1) + '%';
            
            const parent = totalValueChange.parentElement;
            const icon = parent.querySelector('i');
            if (change >= 0) {
                parent.classList.remove('text-danger');
                parent.classList.add('text-success');
                if (icon) icon.className = 'fas fa-arrow-up mr-1';
            } else {
                parent.classList.remove('text-success');
                parent.classList.add('text-danger');
                if (icon) icon.className = 'fas fa-arrow-down mr-1';
            }
        }
        
        // 更新周转率
        const turnoverRate = document.getElementById('turnover-rate');
        if (turnoverRate) {
            const rate = overview.turnover_rate || 0;
            turnoverRate.textContent = rate.toFixed(1) + '%';
        }
        
        // 更新周转率变化
        const turnoverRateChange = document.getElementById('turnover-rate-change');
        if (turnoverRateChange && changes.turnover_change !== undefined) {
            const change = changes.turnover_change;
            turnoverRateChange.textContent = Math.abs(change).toFixed(1) + '%';
            
            const parent = turnoverRateChange.parentElement;
            const icon = parent.querySelector('i');
            if (change >= 0) {
                parent.classList.remove('text-danger');
                parent.classList.add('text-success');
                if (icon) icon.className = 'fas fa-arrow-up mr-1';
            } else {
                parent.classList.remove('text-success');
                parent.classList.add('text-danger');
                if (icon) icon.className = 'fas fa-arrow-down mr-1';
            }
        }
        
        // 更新进度条
        this.updateProgressBars(overview, changes);
    },
    
    updateProgressBars(overview, changes) {
        // 总物品进度条 - 基于环比变化
        const totalItemsProgress = document.getElementById('total-items-progress');
        if (totalItemsProgress && changes.items_change !== undefined) {
            // 将环比转换为0-100的进度值
            const progress = Math.min(Math.abs(changes.items_change), 100);
            setTimeout(() => {
                totalItemsProgress.style.width = progress + '%';
            }, 100);
        }
        
        // 低库存进度条 - 基于低库存占比
        const lowStockProgress = document.getElementById('low-stock-progress');
        if (lowStockProgress && overview.total_items > 0) {
            const percentage = (overview.low_stock_items / overview.total_items) * 100;
            setTimeout(() => {
                lowStockProgress.style.width = Math.min(percentage, 100) + '%';
            }, 100);
        }
        
        // 库存价值进度条 - 基于环比变化
        const totalValueProgress = document.getElementById('total-value-progress');
        if (totalValueProgress && changes.value_change !== undefined) {
            const progress = Math.min(Math.abs(changes.value_change), 100);
            setTimeout(() => {
                totalValueProgress.style.width = progress + '%';
            }, 100);
        }
        
        // 周转率进度条 - 基于周转率本身
        const turnoverRateProgress = document.getElementById('turnover-rate-progress');
        if (turnoverRateProgress && overview.turnover_rate !== undefined) {
            // 周转率通常在0-50%之间，映射到进度条
            const progress = Math.min(overview.turnover_rate * 2, 100);
            setTimeout(() => {
                turnoverRateProgress.style.width = progress + '%';
            }, 100);
        }
    },
    
    renderActivities(activities) {
        const tbody = document.getElementById('recent-activities-tbody');
        if (!tbody) return;
        
        if (!activities || activities.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-dark">暂无活动记录</td></tr>';
            return;
        }
        
        const html = activities.map(activity => {
            const typeClass = activity.operation_type === 'in' ? 'success' : 'danger';
            const typeText = activity.operation_type === 'in' ? '入库' : '出库';
            const firstChar = (activity.item_name || '?').charAt(0).toUpperCase();
            const imageUrl = Utils.getImageUrl(activity.item_image);
            const hasImage = imageUrl && imageUrl !== '';
            const imageHtml = hasImage 
                ? `<img src="${imageUrl}" alt="${activity.item_name}" class="w-8 h-8 rounded object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="w-8 h-8 rounded bg-primary/10 items-center justify-center text-primary text-xs font-bold hidden">${firstChar}</div>`
                : `<div class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">${firstChar}</div>`;
            
            return `
                <tr class="border-b border-gray-light hover:bg-light/50 transition-colors">
                    <td class="py-3 px-4">
                        <div class="flex items-center space-x-3">
                            ${imageHtml}
                            <div>
                                <div class="font-medium text-sm">${activity.item_name}</div>
                                <div class="text-xs text-gray-dark">${activity.item_code || ''}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 text-xs bg-${typeClass}/10 text-${typeClass} rounded-full">
                            ${typeText}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-sm">${activity.quantity}</td>
                    <td class="py-3 px-4 text-sm text-gray-dark">${Utils.formatDate(activity.created_at)}</td>
                    <td class="py-3 px-4 text-sm">${activity.operator_name || '系统'}</td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = html;
    },
    
    // 存储低库存物品数据，供快速入库使用
    lowStockItems: [],
    
    renderLowStock(items) {
        const container = document.getElementById('low-stock-items');
        if (!container) return;
        
        if (!items || items.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-dark">暂无低库存物品</div>';
            return;
        }
        
        // 存储物品数据供快速入库使用
        this.lowStockItems = items.slice(0, 5);
        
        const html = this.lowStockItems.map((item, index) => {
            const firstChar = (item.name || '?').charAt(0).toUpperCase();
            const imageUrl = Utils.getImageUrl(item.image);
            const hasImage = imageUrl && imageUrl !== '';
            const imageHtml = hasImage 
                ? `<img src="${imageUrl}" alt="${item.name}" class="w-10 h-10 rounded object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="w-10 h-10 rounded bg-warning/20 items-center justify-center text-warning text-sm font-bold hidden">${firstChar}</div>`
                : `<div class="w-10 h-10 rounded bg-warning/20 flex items-center justify-center text-warning text-sm font-bold">${firstChar}</div>`;
            
            return `
            <div class="flex items-center justify-between p-3 bg-warning/5 rounded-apple-sm">
                <div class="flex items-center space-x-3">
                    ${imageHtml}
                    <div>
                        <div class="font-medium text-sm">${item.name}</div>
                        <div class="text-xs text-gray-dark">库存: ${item.stock}</div>
                    </div>
                </div>
                <button onclick="quickInboundFromLowStockIndex(${index})" 
                        class="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        title="快速入库">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `}).join('');
        
        container.innerHTML = html;
    },
    
    async renderCharts() {
        try {
            // 并行渲染两个图表，提升加载速度
            await Promise.all([
                this.renderTrendChart(),
                this.renderCategoryChart()
            ]);
        } catch (error) {
            // 静默处理
        }
    },
    
    // 使用预加载数据渲染趋势图（更快）
    renderTrendChartWithData(trendData) {
        const canvas = document.getElementById('inventory-trend-chart');
        if (!canvas || !trendData?.success || !trendData?.data) return;
        
        // 检查Chart库是否已加载
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js 未加载，延迟渲染趋势图');
            setTimeout(() => this.renderTrendChartWithData(trendData), 500);
            return;
        }
        
        canvas.innerHTML = '<canvas id="trend-canvas"></canvas>';
        const ctx = document.getElementById('trend-canvas');
        const data = trendData.data;
        
        // 确保数据格式正确
        const inboundData = Array.isArray(data.inbound) ? data.inbound : [];
        const outboundData = Array.isArray(data.outbound) ? data.outbound : [];
        
        if (this.trendChartInstance) this.trendChartInstance.destroy();
        
        this.trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: '入库',
                    data: inboundData,
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }, {
                    label: '出库',
                    data: outboundData,
                    borderColor: '#FF3B30',
                    backgroundColor: 'rgba(255, 59, 48, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        display: true, 
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    } 
                },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    } 
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },
    
    // 使用预加载数据渲染分类图（更快）
    renderCategoryChartWithData(distData) {
        const canvas = document.getElementById('category-distribution-chart');
        const legendContainer = document.getElementById('category-legend');
        if (!canvas || !distData?.success || !distData?.data) return;
        
        // 检查Chart库是否已加载
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js 未加载，延迟渲染分类图');
            setTimeout(() => this.renderCategoryChartWithData(distData), 500);
            return;
        }
        
        canvas.innerHTML = '<canvas id="category-canvas"></canvas>';
        const ctx = document.getElementById('category-canvas');
        const data = distData.data;
        
        const colors = ['#007AFF', '#5AC8FA', '#FF9500', '#34C759', '#5856D6', '#FF3B30'];
        const labels = data.labels || [];
        const values = data.values || [];
        
        // 处理超过6个类别的情况
        let chartLabels = labels;
        let chartValues = values;
        let chartColors = colors.slice(0, labels.length);
        
        if (labels.length > 6) {
            chartLabels = labels.slice(0, 5).concat(['其他']);
            chartValues = values.slice(0, 5).concat([values.slice(5).reduce((a, b) => a + b, 0)]);
            chartColors = colors;
        }
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartValues,
                    backgroundColor: chartColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
        
        // 动态生成图例
        if (legendContainer) {
            legendContainer.innerHTML = chartLabels.map((label, i) => `
                <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 rounded-full" style="background-color: ${chartColors[i]};"></span>
                    <span class="text-sm text-gray-dark">${label}</span>
                </div>
            `).join('');
        }
    },
    
    currentPeriod: 'month',
    trendChartInstance: null,
    
    async renderTrendChart(period = 'month') {
        const canvas = document.getElementById('inventory-trend-chart');
        if (!canvas) {
            console.warn('未找到库存趋势图表容器');
            return;
        }
        
        // 创建canvas元素
        canvas.innerHTML = '<canvas id="trend-canvas"></canvas>';
        const ctx = document.getElementById('trend-canvas');
        
        const trendData = await API.dashboard.trend(period);
        
        if (!trendData.success || !trendData.data) {
            console.error('趋势数据格式错误');
            return;
        }
        
        const data = trendData.data;
        
        // 销毁旧图表实例
        if (this.trendChartInstance) {
            this.trendChartInstance.destroy();
        }
        
        // 创建新图表 - 使用真实数据，不使用假数据
        this.trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: '入库',
                    data: data.inbound || [],
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: '出库',
                    data: data.outbound || [],
                    borderColor: '#FF3B30',
                    backgroundColor: 'rgba(255, 59, 48, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },
    
    initTrendPeriodButtons() {
        const buttons = document.querySelectorAll('.trend-period-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const period = btn.getAttribute('data-period');
                
                // 更新按钮样式
                buttons.forEach(b => {
                    b.classList.remove('bg-primary/10', 'text-primary');
                    b.classList.add('text-gray-dark');
                });
                btn.classList.add('bg-primary/10', 'text-primary');
                btn.classList.remove('text-gray-dark');
                
                // 重新渲染图表
                this.currentPeriod = period;
                await this.renderTrendChart(period);
            });
        });
    },
    
    async renderCategoryChart() {
        const canvas = document.getElementById('category-distribution-chart');
        if (!canvas) {
            console.warn('未找到类别分布图表容器');
            return;
        }
        
        // 创建canvas元素
        canvas.innerHTML = '<canvas id="category-canvas"></canvas>';
        const ctx = document.getElementById('category-canvas');
        
        const distData = await API.dashboard.distribution();
        
        if (!distData.success || !distData.data) {
            console.error('分布数据格式错误');
            return;
        }
        
        const data = distData.data;
        
        // 使用真实数据，不使用假数据
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: [
                        '#007AFF', // 电子设备 - 蓝色
                        '#5AC8FA', // 办公用品 - 浅蓝
                        '#FF9500', // 原材料 - 橙色
                        '#34C759', // 成品 - 绿色
                        '#5856D6', // 包装材料 - 紫色
                        '#FF3B30'  // 其他 - 红色
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },
};

// 物品列表控制器
const ItemsController = {
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    
    async loadData(page = 1, forceRefresh = false) {
        try {
            this.currentPage = page;
            
            const params = {
                page: page,
                page_size: this.pageSize,
            };
            
            // 获取搜索和过滤条件
            const search = document.getElementById('items-search')?.value;
            if (search) params.search = search;
            
            const category = document.getElementById('category-filter')?.value;
            if (category) params.category = category;
            
            // 强制刷新时清除所有物品缓存
            if (forceRefresh) {
                Utils.clearCache();
            }
            
            // 直接从API获取数据（不使用缓存，确保数据最新）
            const data = await API.items.list(params);
            
            if (data?.data) {
                this.renderItems(data.data);
                this.renderPagination(data.data);
            } else {
                this.renderItems({ results: [] });
            }
        } catch (error) {
            this.renderItems({ results: [] });
        }
    },
    
    renderItems(data) {
        const tbody = document.getElementById('items-table-body');
        if (!tbody) return;
        
        const items = data.results || data;
        this.totalCount = data.count || items.length;
        

        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-dark">暂无数据</td></tr>';
            return;
        }
        
        const html = items.map(item => {
            const firstChar = (item.name || '?').charAt(0).toUpperCase();
            const imageUrl = Utils.getImageUrl(item.image);
            const hasImage = imageUrl && imageUrl !== '';
            const imageHtml = hasImage 
                ? `<img src="${imageUrl}" alt="${item.name}" class="w-10 h-10 rounded-lg object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center text-primary text-sm font-bold hidden">${firstChar}</div>`
                : `<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">${firstChar}</div>`;
            
            return `
            <tr class="border-b border-gray-light hover:bg-light/50 transition-colors">
                <td class="py-3 px-4">
                    <div class="flex items-center space-x-3">
                        ${imageHtml}
                        <div>
                            <p class="font-medium">${item.name}</p>
                            <p class="text-sm text-gray-dark">${item.code}</p>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-4 text-sm">${item.category_name || '-'}</td>
                <td class="py-3 px-4 text-sm">${item.warehouse_name || '-'}</td>
                <td class="py-3 px-4 text-sm">${item.warehouse_location || '-'}</td>
                <td class="py-3 px-4 text-sm">${item.stock}</td>
                <td class="py-3 px-4 text-sm">${Utils.formatMoney(item.price)}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getStatusClass(item.status)}">
                        ${item.status_display}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <button class="text-success hover:text-success/80 text-sm mr-2" onclick="showItemQRCode(${item.id}, '${item.code}', '${item.name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-qrcode"></i>
                    </button>
                    <button class="text-primary hover:text-primary/80 text-sm mr-2" onclick="editItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-danger hover:text-danger/80 text-sm" onclick="ItemsController.deleteItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `}).join('');
        
        tbody.innerHTML = html;
        
        // 更新总数
        const itemsTotal = document.getElementById('items-total');
        if (itemsTotal) itemsTotal.textContent = this.totalCount;
    },
    
    renderPagination(data) {
        const paginationContainer = document.getElementById('items-pagination');
        if (!paginationContainer) return;
        
        const totalPages = Math.ceil(this.totalCount / this.pageSize);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let html = '<div class="flex items-center justify-between mt-4">';
        
        // 显示当前页信息
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.totalCount);
        html += `<div class="text-sm text-gray-dark">显示 ${start}-${end} 条，共 ${this.totalCount} 条</div>`;
        
        // 分页按钮
        html += '<div class="flex items-center space-x-2">';
        
        // 上一页按钮
        if (this.currentPage > 1) {
            html += `<button onclick="ItemsController.loadData(${this.currentPage - 1})" class="px-3 py-1 rounded-lg border border-gray-light hover:bg-light transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        } else {
            html += `<button disabled class="px-3 py-1 rounded-lg border border-gray-light text-gray-medium cursor-not-allowed">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }
        
        // 页码按钮
        const maxButtons = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }
        
        if (startPage > 1) {
            html += `<button onclick="ItemsController.loadData(1)" class="px-3 py-1 rounded-lg border border-gray-light hover:bg-light transition-colors">1</button>`;
            if (startPage > 2) {
                html += `<span class="px-2 text-gray-dark">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                html += `<button class="px-3 py-1 rounded-lg bg-primary text-white">${i}</button>`;
            } else {
                html += `<button onclick="ItemsController.loadData(${i})" class="px-3 py-1 rounded-lg border border-gray-light hover:bg-light transition-colors">${i}</button>`;
            }
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="px-2 text-gray-dark">...</span>`;
            }
            html += `<button onclick="ItemsController.loadData(${totalPages})" class="px-3 py-1 rounded-lg border border-gray-light hover:bg-light transition-colors">${totalPages}</button>`;
        }
        
        // 下一页按钮
        if (this.currentPage < totalPages) {
            html += `<button onclick="ItemsController.loadData(${this.currentPage + 1})" class="px-3 py-1 rounded-lg border border-gray-light hover:bg-light transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        } else {
            html += `<button disabled class="px-3 py-1 rounded-lg border border-gray-light text-gray-medium cursor-not-allowed">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        html += '</div></div>';
        
        paginationContainer.innerHTML = html;
    },
    
    getStatusClass(status) {
        const classes = {
            'normal': 'bg-success/10 text-success',
            'low_stock': 'bg-warning/10 text-warning',
            'out_of_stock': 'bg-danger/10 text-danger',
        };
        return classes[status] || 'bg-gray-100 text-gray-dark';
    },
    
    async editItem(id) {
        // 调用全局编辑函数
        if (window.editItem) {
            window.editItem(id);
        }
    },
    
    async deleteItem(id) {
        if (!confirm('确定要删除这个物品吗？')) return;
        
        try {
            Utils.showLoading();
            const result = await API.items.delete(id);
            Utils.hideLoading();
            
            if (result.success) {
                Utils.showSuccess('删除成功');
                // 清除缓存并强制刷新列表
                Utils.clearCache('items');
                await this.loadData(this.currentPage, true);
            } else {
                Utils.showError(result.error?.message || result.message || '删除失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('删除失败: ' + error.message);
        }
    },
};

// 入库控制器
const InboundController = {
    selectedIds: [],
    
    async loadData() {
        try {
            // 只加载入库记录，减少数据量
            const data = await API.operations.list({ operation_type: 'in', page_size: 20 });
            if (data?.data) {
                this.renderRecords(data.data);
            } else {
                this.renderRecords({ results: [] });
            }
            
            // 异步加载统计数据（不阻塞页面）
            API.operations.statistics(30).then(stats => {
                if (stats.success) {
                    this.renderStats(stats.data);
                }
            }).catch(() => {});
            
        } catch (error) {
            this.renderRecords({ results: [] });
        }
    },
    
    renderRecords(data) {
        const tbody = document.getElementById('inbound-table-body');
        if (!tbody) return;
        
        const records = data.results || data;
        this.selectedIds = [];
        
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-dark">暂无入库记录</td></tr>';
            return;
        }
        
        const html = records.map(record => {
            const warehouseInfo = record.item_warehouse_name || '-';
            const locationInfo = record.item_warehouse_location ? ` (${record.item_warehouse_location})` : '';
            return `
            <tr class="border-b border-gray-light hover:bg-light/50 transition-colors">
                <td class="py-3 px-4">
                    <input type="checkbox" class="inbound-checkbox" value="${record.id}" onchange="InboundController.toggleSelect(${record.id}, this.checked)">
                </td>
                <td class="py-3 px-4">${record.item_name}</td>
                <td class="py-3 px-4">${record.quantity}</td>
                <td class="py-3 px-4">${record.supplier_name || '-'}</td>
                <td class="py-3 px-4">${warehouseInfo}${locationInfo}</td>
                <td class="py-3 px-4">${record.operator_name || '-'}</td>
                <td class="py-3 px-4 text-sm text-gray-dark">${Utils.formatDate(record.created_at)}</td>
                <td class="py-3 px-4">
                    <button class="text-danger hover:text-danger/80 text-sm" onclick="InboundController.deleteRecord(${record.id}, '${record.item_name}', ${record.quantity})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `}).join('');
        
        tbody.innerHTML = html;
        this.updateBatchDeleteButton();
    },
    
    toggleSelect(id, checked) {
        if (checked) {
            if (!this.selectedIds.includes(id)) {
                this.selectedIds.push(id);
            }
        } else {
            this.selectedIds = this.selectedIds.filter(i => i !== id);
        }
        this.updateBatchDeleteButton();
    },
    
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.inbound-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            const id = parseInt(cb.value);
            if (checked) {
                if (!this.selectedIds.includes(id)) {
                    this.selectedIds.push(id);
                }
            } else {
                this.selectedIds = this.selectedIds.filter(i => i !== id);
            }
        });
        this.updateBatchDeleteButton();
    },
    
    updateBatchDeleteButton() {
        const btn = document.getElementById('inbound-batch-delete-btn');
        if (btn) {
            btn.disabled = this.selectedIds.length === 0;
            btn.textContent = this.selectedIds.length > 0 ? `批量删除 (${this.selectedIds.length})` : '批量删除';
        }
    },
    
    async batchDelete() {
        if (this.selectedIds.length === 0) {
            Utils.showError('请选择要删除的记录');
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${this.selectedIds.length} 条入库记录吗？\n\n注意：采用软删除机制，记录将被隐藏但数据仍保留用于审计。\n删除后不会影响当前库存和报表统计。`)) {
            return;
        }
        
        const password = prompt('请输入您的登录密码以确认批量删除：');
        if (!password) {
            return;
        }
        
        try {
            Utils.showLoading();
            const result = await API.operations.batchDeleteWithPassword(this.selectedIds, password);
            Utils.hideLoading();
            Utils.showSuccess(result.message || '批量删除成功');
            this.selectedIds = [];
            this.loadData();
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('批量删除失败: ' + error.message);
        }
    },
    
    async deleteRecord(id, itemName, quantity) {
        if (!confirm(`确定要删除这条入库记录吗？\n物品：${itemName}\n数量：${quantity}\n\n注意：采用软删除机制，记录将被隐藏但数据仍保留用于审计。\n删除后不会影响当前库存和报表统计。`)) {
            return;
        }
        
        // 弹出密码输入框
        const password = prompt('请输入您的登录密码以确认删除：');
        if (!password) {
            return;
        }
        
        try {
            Utils.showLoading();
            const result = await API.operations.deleteWithPassword(id, password);
            Utils.hideLoading();
            if (result.success) {
                Utils.showSuccess(result.message || '入库记录已标记为删除（已隐藏，数据保留用于审计）');
                await this.loadData();
            } else {
                Utils.showError(result.error?.message || result.message || '删除失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('删除失败: ' + error.message);
        }
    },
    
    renderStats(stats) {
        // 更新统计卡片
    },
};

// 出库控制器
const OutboundController = {
    selectedIds: [],
    
    async loadData() {
        try {
            const data = await API.operations.list({ operation_type: 'out', page_size: 20 });
            if (data?.data) {
                this.renderRecords(data.data);
            } else {
                this.renderRecords({ results: [] });
            }
        } catch (error) {
            this.renderRecords({ results: [] });
        }
    },
    
    renderRecords(data) {
        const tbody = document.getElementById('outbound-table-body');
        if (!tbody) return;
        
        const records = data.results || data;
        this.selectedIds = [];
        
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-dark">暂无出库记录</td></tr>';
            return;
        }
        
        const html = records.map(record => `
            <tr class="border-b border-gray-light hover:bg-light/50 transition-colors">
                <td class="py-3 px-4">
                    <input type="checkbox" class="outbound-checkbox" value="${record.id}" onchange="OutboundController.toggleSelect(${record.id}, this.checked)">
                </td>
                <td class="py-3 px-4">${record.item_name}</td>
                <td class="py-3 px-4">${record.quantity}</td>
                <td class="py-3 px-4">${record.recipient || '-'}</td>
                <td class="py-3 px-4">${record.department || '-'}</td>
                <td class="py-3 px-4">${record.operator_name || '-'}</td>
                <td class="py-3 px-4 text-sm text-gray-dark">${Utils.formatDate(record.created_at)}</td>
                <td class="py-3 px-4">
                    <button class="text-danger hover:text-danger/80 text-sm" onclick="OutboundController.deleteRecord(${record.id}, '${record.item_name}', ${record.quantity})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
        this.updateBatchDeleteButton();
    },
    
    toggleSelect(id, checked) {
        if (checked) {
            if (!this.selectedIds.includes(id)) {
                this.selectedIds.push(id);
            }
        } else {
            this.selectedIds = this.selectedIds.filter(i => i !== id);
        }
        this.updateBatchDeleteButton();
    },
    
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.outbound-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            const id = parseInt(cb.value);
            if (checked) {
                if (!this.selectedIds.includes(id)) {
                    this.selectedIds.push(id);
                }
            } else {
                this.selectedIds = this.selectedIds.filter(i => i !== id);
            }
        });
        this.updateBatchDeleteButton();
    },
    
    updateBatchDeleteButton() {
        const btn = document.getElementById('outbound-batch-delete-btn');
        if (btn) {
            btn.disabled = this.selectedIds.length === 0;
            btn.textContent = this.selectedIds.length > 0 ? `批量删除 (${this.selectedIds.length})` : '批量删除';
        }
    },
    
    async batchDelete() {
        if (this.selectedIds.length === 0) {
            Utils.showError('请选择要删除的记录');
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${this.selectedIds.length} 条出库记录吗？\n\n注意：采用软删除机制，记录将被隐藏但数据仍保留用于审计。\n删除后不会影响当前库存和报表统计。`)) {
            return;
        }
        
        const password = prompt('请输入您的登录密码以确认批量删除：');
        if (!password) {
            return;
        }
        
        try {
            Utils.showLoading();
            const result = await API.operations.batchDeleteWithPassword(this.selectedIds, password);
            Utils.hideLoading();
            Utils.showSuccess(result.message || '批量删除成功');
            this.selectedIds = [];
            this.loadData();
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('批量删除失败: ' + error.message);
        }
    },
    
    async deleteRecord(id, itemName, quantity) {
        if (!confirm(`确定要删除这条出库记录吗？\n物品：${itemName}\n数量：${quantity}\n\n注意：采用软删除机制，记录将被隐藏但数据仍保留用于审计。\n删除后不会影响当前库存和报表统计。`)) {
            return;
        }
        
        // 弹出密码输入框
        const password = prompt('请输入您的登录密码以确认删除：');
        if (!password) {
            return;
        }
        
        try {
            Utils.showLoading();
            const result = await API.operations.deleteWithPassword(id, password);
            Utils.hideLoading();
            if (result.success) {
                Utils.showSuccess(result.message || '出库记录已标记为删除（已隐藏，数据保留用于审计）');
                await this.loadData();
            } else {
                Utils.showError(result.error?.message || result.message || '删除失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('删除失败: ' + error.message);
        }
    },
};

// 调拨控制器
const TransferController = {
    selectedIds: [],
    
    async loadData() {
        try {
            const data = await API.operations.list({ operation_type: 'transfer', page_size: 20 });
            if (data?.data) {
                this.renderRecords(data.data);
            } else {
                this.renderRecords({ results: [] });
            }
        } catch (error) {
            this.renderRecords({ results: [] });
        }
    },
    
    renderRecords(data) {
        const tbody = document.getElementById('transfer-table-body');
        if (!tbody) return;
        
        const records = data?.results || data || [];
        this.selectedIds = [];
        
        if (!records || records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-dark">
                <i class="fas fa-exchange-alt text-4xl mb-4"></i>
                <p>暂无调拨记录</p>
            </td></tr>`;
            return;
        }
        
        const html = records.map(record => `
            <tr class="border-b border-gray-light hover:bg-light/50 transition-colors">
                <td class="py-3 px-4">
                    <input type="checkbox" class="transfer-checkbox" value="${record.id}" onchange="TransferController.toggleSelect(${record.id}, this.checked)">
                </td>
                <td class="py-3 px-4">${record.item_name || '-'}</td>
                <td class="py-3 px-4">${record.quantity || 0}</td>
                <td class="py-3 px-4">${record.from_warehouse || '-'}</td>
                <td class="py-3 px-4">${record.to_warehouse || '-'}</td>
                <td class="py-3 px-4">${record.operator_name || '-'}</td>
                <td class="py-3 px-4 text-sm text-gray-dark">${Utils.formatDate(record.created_at)}</td>
                <td class="py-3 px-4">
                    <button class="text-danger hover:text-danger/80 text-sm" onclick="TransferController.deleteRecord(${record.id}, '${record.item_name}', ${record.quantity})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
        this.updateBatchDeleteButton();
    },
    
    toggleSelect(id, checked) {
        if (checked) {
            if (!this.selectedIds.includes(id)) {
                this.selectedIds.push(id);
            }
        } else {
            this.selectedIds = this.selectedIds.filter(i => i !== id);
        }
        this.updateBatchDeleteButton();
    },
    
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.transfer-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            const id = parseInt(cb.value);
            if (checked) {
                if (!this.selectedIds.includes(id)) {
                    this.selectedIds.push(id);
                }
            } else {
                this.selectedIds = this.selectedIds.filter(i => i !== id);
            }
        });
        this.updateBatchDeleteButton();
    },
    
    updateBatchDeleteButton() {
        const btn = document.getElementById('transfer-batch-delete-btn');
        if (btn) {
            btn.disabled = this.selectedIds.length === 0;
            btn.textContent = this.selectedIds.length > 0 ? `批量删除 (${this.selectedIds.length})` : '批量删除';
        }
    },
    
    async batchDelete() {
        if (this.selectedIds.length === 0) {
            Utils.showError('请选择要删除的记录');
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${this.selectedIds.length} 条调拨记录吗？\n\n删除后将自动回滚库存！`)) {
            return;
        }
        
        const password = prompt('请输入您的登录密码以确认批量删除：');
        if (!password) {
            return;
        }
        
        try {
            Utils.showLoading();
            const result = await API.operations.batchDeleteWithPassword(this.selectedIds, password);
            Utils.hideLoading();
            Utils.showSuccess(result.message || '批量删除成功');
            this.selectedIds = [];
            this.loadData();
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('批量删除失败: ' + error.message);
        }
    },
    
    async deleteRecord(id, itemName, quantity) {
        if (!confirm(`确定要删除这条调拨记录吗？\n物品：${itemName}\n数量：${quantity}\n\n注意：只删除记录，不影响当前库存`)) {
            return;
        }
        
        // 弹出密码输入框
        const password = prompt('请输入您的登录密码以确认删除：');
        if (!password) {
            return;
        }
        
        try {
            Utils.showLoading();
            const result = await API.operations.deleteWithPassword(id, password);
            Utils.hideLoading();
            if (result.success) {
                Utils.showSuccess('调拨记录已删除');
                await this.loadData();
            } else {
                Utils.showError(result.error?.message || result.message || '删除失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('删除失败: ' + error.message);
        }
    },
};

// 仓库控制器
const WarehouseController = {
    async loadData() {
        try {
            const data = await API.warehouses.list();
            if (data?.data) {
                this.renderWarehouses(data.data);
            } else {
                this.renderWarehouses({ results: [] });
            }
        } catch (error) {
            this.renderWarehouses({ results: [] });
        }
    },
    
    renderWarehouses(data) {
        const container = document.getElementById('warehouse-grid');
        if (!container) return;
        
        const warehouses = data?.results || data || [];
        
        if (!warehouses || warehouses.length === 0) {
            container.innerHTML = '<p class="text-gray-dark text-center py-8 col-span-3">暂无仓库数据</p>';
            return;
        }
        
        const html = warehouses.map(warehouse => `
            <div class="bg-white rounded-apple p-6 shadow-apple hover:shadow-apple-hover transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="font-semibold text-lg">${warehouse.name || '-'}</h3>
                        <p class="text-sm text-gray-dark mt-1">${warehouse.code || '-'}</p>
                    </div>
                    <span class="px-3 py-1 ${warehouse.is_active ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-dark'} text-xs rounded-full">
                        ${warehouse.is_active ? '运营中' : '已停用'}
                    </span>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center text-sm">
                        <i class="fas fa-map-marker-alt text-gray-dark w-5"></i>
                        <span class="text-gray-dark">${warehouse.location || '-'}</span>
                    </div>
                    <div class="flex items-center text-sm">
                        <i class="fas fa-user text-gray-dark w-5"></i>
                        <span class="text-gray-dark">${warehouse.manager || '-'} ${warehouse.phone ? '- ' + warehouse.phone : ''}</span>
                    </div>
                    <div class="mt-4">
                        <div class="flex justify-between text-sm mb-2">
                            <span class="text-gray-dark">使用率</span>
                            <span class="font-medium">${warehouse.usage_rate || 0}%</span>
                        </div>
                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full bg-primary rounded-full" style="width: ${warehouse.usage_rate || 0}%"></div>
                        </div>
                        <p class="text-xs text-gray-dark mt-1">${warehouse.current_usage || 0} / ${warehouse.capacity || 0}</p>
                    </div>
                </div>
                <div class="flex space-x-2 mt-4 pt-4 border-t border-gray-light">
                    <button onclick="editWarehouse(${warehouse.id})" class="flex-1 py-2 text-sm text-primary hover:bg-primary/10 rounded-apple-sm transition-colors">
                        <i class="fas fa-edit mr-1"></i>编辑
                    </button>
                    <button onclick="deleteWarehouse(${warehouse.id})" class="flex-1 py-2 text-sm text-danger hover:bg-danger/10 rounded-apple-sm transition-colors">
                        <i class="fas fa-trash mr-1"></i>删除
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    },
};

// 供应商控制器
const SupplierController = {
    async loadData() {
        try {
            const data = await API.suppliers.list();
            if (data?.data) {
                this.renderSuppliers(data.data);
            } else {
                this.renderSuppliers({ results: [] });
            }
        } catch (error) {
            this.renderSuppliers({ results: [] });
        }
    },
    
    renderSuppliers(data) {
        const tbody = document.getElementById('supplier-table-body');
        if (!tbody) return;
        
        const suppliers = data?.results || data || [];
        
        if (!suppliers || suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-dark">暂无供应商数据</td></tr>';
            return;
        }
        
        const html = suppliers.map(supplier => `
            <tr class="border-b border-gray-light hover:bg-light/50 transition-colors">
                <td class="py-3 px-4 font-medium">${supplier.name || '-'}</td>
                <td class="py-3 px-4 text-sm text-gray-dark">${supplier.code || '-'}</td>
                <td class="py-3 px-4 text-sm">${supplier.contact || '-'}</td>
                <td class="py-3 px-4 text-sm">${supplier.phone || '-'}</td>
                <td class="py-3 px-4 text-sm">${supplier.email || '-'}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 ${supplier.status === 'active' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-dark'} text-xs rounded-full">
                        ${supplier.status_display || '活跃'}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <button class="text-primary hover:text-primary/80 text-sm mr-2" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-danger hover:text-danger/80 text-sm" title="删除" onclick="deleteSupplier(${supplier.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
    },
};

// 通知管理
const NotificationManager = {
    notifications: [],
    readNotifications: new Set(), // 存储已读通知的ID
    
    init() {
        // 从localStorage加载已读通知ID
        this.loadReadNotifications();
        
        // 绑定通知按钮点击事件
        const notificationBtn = document.getElementById('notification-btn');
        const notificationDropdown = document.getElementById('notification-dropdown');
        
        if (notificationBtn && notificationDropdown) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationDropdown.classList.toggle('hidden');
                // 关闭用户菜单
                document.getElementById('user-dropdown')?.classList.add('hidden');
            });
        }
        
        // 绑定全部已读按钮
        const markAllReadBtn = document.getElementById('mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }
        
        // 加载通知
        this.loadNotifications();
    },
    
    loadReadNotifications() {
        try {
            const savedReadIds = localStorage.getItem('read_notifications');
            if (savedReadIds) {
                const ids = JSON.parse(savedReadIds);
                this.readNotifications = new Set(ids);
            } else {
                this.readNotifications = new Set();
            }
        } catch (e) {
            console.error('❌ 加载已读通知失败:', e);
            this.readNotifications = new Set();
        }
    },
    
    async loadNotifications() {
        try {
            // 从仪表盘API获取真实数据生成通知
            this.notifications = [];
            
            // 获取低库存物品
            const lowStockData = await API.dashboard.lowStock();
            if (lowStockData.success && lowStockData.data && lowStockData.data.length > 0) {
                lowStockData.data.slice(0, 3).forEach(item => {
                    const notifId = `low-${item.id}`;
                    this.notifications.push({
                        id: notifId,
                        type: 'warning',
                        title: '低库存提醒',
                        message: `${item.name}库存不足，当前库存: ${item.stock}`,
                        time: item.updated_at ? this.formatTime(item.updated_at) : '刚刚',
                        read: this.readNotifications.has(notifId) // 检查是否已读
                    });
                });
            }
            
            // 获取最近活动
            const activitiesData = await API.dashboard.activities(5);
            if (activitiesData.success && activitiesData.data && activitiesData.data.length > 0) {
                activitiesData.data.slice(0, 2).forEach(activity => {
                    const type = activity.operation_type === 'in' ? 'info' : 'success';
                    const title = activity.operation_type === 'in' ? '入库完成' : '出库完成';
                    const notifId = `activity-${activity.id}`;
                    
                    this.notifications.push({
                        id: notifId,
                        type: type,
                        title: title,
                        message: `${activity.item_name} ${activity.operation_type === 'in' ? '已入库' : '已出库'} ${activity.quantity} 件`,
                        time: this.formatTime(activity.created_at),
                        read: this.readNotifications.has(notifId) // 检查是否已读
                    });
                });
            }
            

            
            this.renderNotifications();
            this.updateBadge();
        } catch (error) {
            console.error('加载通知失败:', error);
        }
    },
    
    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // 秒
        
        if (diff < 60) return '刚刚';
        if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
        if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
        if (diff < 2592000) return Math.floor(diff / 86400) + '天前';
        return date.toLocaleDateString();
    },
    
    renderNotifications() {
        const container = document.getElementById('notification-list');
        if (!container) return;
        
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="p-4 text-center text-gray-dark">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>暂无通知</p>
                </div>
            `;
            return;
        }
        
        const html = this.notifications.map(notif => {
            const iconClass = {
                'warning': 'fa-exclamation-triangle text-warning',
                'info': 'fa-info-circle text-info',
                'success': 'fa-check-circle text-success',
                'error': 'fa-times-circle text-danger'
            }[notif.type] || 'fa-bell text-gray-dark';
            
            return `
                <div class="p-4 border-b border-gray-light hover:bg-light transition-colors ${notif.read ? 'opacity-60' : ''}">
                    <div class="flex items-start space-x-3">
                        <i class="fas ${iconClass} mt-1"></i>
                        <div class="flex-1">
                            <p class="font-medium text-sm">${notif.title}</p>
                            <p class="text-sm text-gray-dark mt-1">${notif.message}</p>
                            <p class="text-xs text-gray-dark mt-2">${notif.time}</p>
                        </div>
                        ${!notif.read ? '<span class="w-2 h-2 bg-primary rounded-full mt-2"></span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    },
    
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (badge) {
            if (unreadCount > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    },
    
    markAllAsRead() {
        this.notifications.forEach(n => {
            n.read = true;
            this.readNotifications.add(n.id); // 添加到已读集合
        });
        
        // 保存到localStorage
        this.saveReadNotifications();
        
        this.renderNotifications();
        this.updateBadge();
    },
    
    saveReadNotifications() {
        try {
            const idsArray = [...this.readNotifications];
            localStorage.setItem('read_notifications', JSON.stringify(idsArray));
        } catch (e) {
            // 静默处理
        }
    }
};

// 用户菜单管理
const UserMenuManager = {
    init() {
        // 绑定用户菜单按钮
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
                // 关闭通知菜单
                document.getElementById('notification-dropdown')?.classList.add('hidden');
            });
        }
        
        // 绑定退出登录按钮
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
        
        // 加载用户信息
        this.loadUserInfo();
    },
    
    loadUserInfo() {
        const userInfo = API.TokenManager.getUserInfo();
        
        if (userInfo) {
            // 更新顶部用户名
            const userName = document.getElementById('user-name');
            if (userName) userName.textContent = userInfo.username || '用户';
            
            // 更新顶部邮箱
            const userEmail = document.getElementById('user-email');
            if (userEmail) userEmail.textContent = userInfo.email || '';
            
            // 更新头像缩写
            const userInitials = document.getElementById('user-initials');
            if (userInitials) {
                const name = userInfo.username || 'User';
                userInitials.textContent = name.substring(0, 2).toUpperCase();
            }
            
            // 更新系统设置页面的用户信息
            const settingsUsername = document.getElementById('settings-username');
            if (settingsUsername) settingsUsername.value = userInfo.username || '';
            
            const settingsEmail = document.getElementById('settings-email');
            if (settingsEmail) settingsEmail.value = userInfo.email || '';
        }
    },
    
    async logout() {
        if (confirm('确定要退出登录吗？')) {
            try {
                // 调用退出API
                await API.auth.logout();
                
                // 清除本地存储
                API.TokenManager.clear();
                
                // 跳转到登录页
                window.location.href = '/login/';
            } catch (error) {
                console.error('退出登录失败:', error);
                // 即使API失败也清除本地数据
                API.TokenManager.clear();
                window.location.href = '/login/';
            }
        }
    }
};

// 初始化应用
async function initApp() {
    // 检查登录状态
    const token = API.TokenManager.getToken();
    
    // 初始化导航
    PageManager.initNavigation();
    
    // 初始化通知
    NotificationManager.init();
    
    // 初始化用户菜单
    UserMenuManager.init();
    
    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', () => {
        document.getElementById('notification-dropdown')?.classList.add('hidden');
        document.getElementById('user-dropdown')?.classList.add('hidden');
    });
    
    // 加载初始页面数据
    await DashboardController.loadData();
    
    // 绑定搜索事件
    const searchInput = document.getElementById('items-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            ItemsController.loadData(1);
        }, 500));
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ==================== 模态框管理 ====================
const ModalManager = {
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // 添加动画类
            modal.classList.add('modal-overlay', 'modal-enter');
            modal.classList.remove('hidden');
            
            // 触发重排后添加激活类
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    modal.classList.remove('modal-enter');
                    modal.classList.add('modal-active');
                });
            });
            
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // 添加退出动画
            modal.classList.remove('modal-active');
            modal.classList.add('modal-enter');
            
            // 动画结束后隐藏
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('modal-overlay', 'modal-enter');
                document.body.style.overflow = '';
            }, 300);
        }
    },
    
    init() {
        // 绑定所有关闭按钮
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('[id$="-modal"]');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // 点击背景关闭
        document.querySelectorAll('[id$="-modal"]').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // ESC关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('[id$="-modal"]:not(.hidden)').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });
        
        // 给所有主要按钮添加动画类
        document.querySelectorAll('#add-item-btn, #items-add-btn, #inbound-add-btn, #outbound-add-btn, #transfer-add-btn, #warehouse-add-btn, #supplier-add-btn, #dashboard-export-btn, button[type="submit"]').forEach(btn => {
            btn.classList.add('btn-animate');
        });
    }
};

// ==================== 按钮事件绑定 ====================
function initButtonEvents() {
    // 库存物品页面 - 添加物品按钮
    const itemsAddBtn = document.getElementById('items-add-btn');
    
    if (itemsAddBtn) {
        itemsAddBtn.addEventListener('click', async () => {
            // 加载类别、供应商和仓库选项
            await loadCategoriesForSelect('item-category');
            await loadSuppliersForSelect('item-supplier');
            await loadWarehousesForSelect('item-warehouse');
            
            const modal = document.getElementById('add-item-modal');
            if (modal) {
                modal.classList.remove('hidden');
                const content = document.getElementById('modal-content');
                if (content) {
                    setTimeout(() => {
                        content.classList.remove('scale-95', 'opacity-0');
                        content.classList.add('scale-100', 'opacity-100');
                    }, 10);
                }
            }
        });
    }
    
    // 入库按钮
    const inboundAddBtn = document.getElementById('inbound-add-btn');
    if (inboundAddBtn) {
        inboundAddBtn.addEventListener('click', async () => {
            await loadItemsForSelect('inbound-item', true);  // 显示仓库信息
            await loadWarehousesForSelect('inbound-warehouse');
            await loadSuppliersForSelect('inbound-supplier');
            initInboundValidation();  // 初始化入库表单验证
            ModalManager.openModal('inbound-modal');
        });
    }
    
    // 出库按钮
    const outboundAddBtn = document.getElementById('outbound-add-btn');
    if (outboundAddBtn) {
        outboundAddBtn.addEventListener('click', async () => {
            await loadItemsForSelect('outbound-item');
            ModalManager.openModal('outbound-modal');
            
            // 添加实时验证
            initOutboundValidation();
        });
    }
    
    // 调拨按钮
    const transferAddBtn = document.getElementById('transfer-add-btn');
    if (transferAddBtn) {
        transferAddBtn.addEventListener('click', async () => {
            // 加载物品和目标仓库
            await loadItemsForSelect('transfer-item', true);  // 显示仓库信息
            await loadWarehousesForSelect('transfer-to');
            
            // 重置验证标记
            const itemSelect = document.getElementById('transfer-item');
            if (itemSelect) delete itemSelect.dataset.validationBound;
            
            initTransferValidation();
            ModalManager.openModal('transfer-modal');
        });
    }
    
    // 仓库按钮
    const warehouseAddBtn = document.getElementById('warehouse-add-btn');
    if (warehouseAddBtn) {
        warehouseAddBtn.addEventListener('click', () => {
            // 重置表单为新增模式
            const form = document.getElementById('warehouse-form');
            if (form) {
                form.reset();
                delete form.dataset.editId;
            }
            // 重置标题
            const title = document.querySelector('#warehouse-modal h3');
            if (title) title.textContent = '添加仓库';
            // 隐藏状态行（新增时不显示）
            const statusRow = document.getElementById('warehouse-status-row');
            if (statusRow) statusRow.classList.add('hidden');
            ModalManager.openModal('warehouse-modal');
        });
    }
    
    // 供应商按钮
    const supplierAddBtn = document.getElementById('supplier-add-btn');
    if (supplierAddBtn) {
        supplierAddBtn.addEventListener('click', () => {
            ModalManager.openModal('supplier-modal');
        });
    }
    
    // 报表导出按钮
    document.getElementById('export-inventory-btn')?.addEventListener('click', () => exportReport('inventory'));
    document.getElementById('export-lowstock-btn')?.addEventListener('click', () => exportReport('lowstock'));
    document.getElementById('export-inbound-btn')?.addEventListener('click', () => exportReport('inbound'));
    document.getElementById('export-outbound-btn')?.addEventListener('click', () => exportReport('outbound'));
    
    // 仪表盘导出按钮
    document.getElementById('dashboard-export-btn')?.addEventListener('click', () => exportReport('inventory'));
}

// ==================== 辅助函数 ====================

// 初始化入库表单实时验证
function initInboundValidation() {
    const itemSelect = document.getElementById('inbound-item');
    const warehouseSelect = document.getElementById('inbound-warehouse');
    const warehouseHiddenInput = document.getElementById('inbound-warehouse-hidden');
    const quantityInput = document.getElementById('inbound-quantity');
    const warehouseHint = document.getElementById('inbound-warehouse-hint');
    const warehouseHintText = document.getElementById('inbound-warehouse-hint-text');
    const capacityHint = document.getElementById('inbound-capacity-hint');
    const capacityHintText = document.getElementById('inbound-capacity-hint-text');
    
    // 避免重复绑定事件
    if (itemSelect?.dataset.validationBound) return;
    if (itemSelect) itemSelect.dataset.validationBound = 'true';
    
    // 当选择物品时，自动选择该物品所在的仓库
    itemSelect?.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const warehouseId = selectedOption?.dataset?.warehouse;
        const warehouseName = selectedOption?.dataset?.warehouseName;
        
        if (warehouseId && warehouseSelect) {
            // 自动选择物品所在仓库
            warehouseSelect.value = warehouseId;
            if (warehouseHiddenInput) warehouseHiddenInput.value = warehouseId;
            
            // 显示提示信息
            if (warehouseHint && warehouseHintText) {
                warehouseHintText.textContent = `该物品当前在「${warehouseName}」仓库，已自动选择`;
                warehouseHint.classList.remove('hidden');
            }
            
            showToast(`已自动选择物品所在仓库: ${warehouseName}`, 'info');
            
            // 触发仓库选择事件以更新容量提示
            warehouseSelect.dispatchEvent(new Event('change'));
        } else {
            // 物品没有仓库，提示用户选择
            if (warehouseHint && warehouseHintText) {
                warehouseHintText.textContent = '该物品尚未分配仓库，请选择入库仓库';
                warehouseHint.classList.remove('hidden');
            }
            
            // 清空隐藏字段，避免提交无效值
            if (warehouseHiddenInput) warehouseHiddenInput.value = '';
        }
    });
    
    // 当选择仓库时，显示仓库容量信息
    warehouseSelect?.addEventListener('change', function() {
        if (warehouseHiddenInput) warehouseHiddenInput.value = this.value || '';
        
        const selectedOption = this.options[this.selectedIndex];
        const capacity = parseInt(selectedOption?.dataset?.capacity) || 0;
        const currentUsage = parseInt(selectedOption?.dataset?.currentUsage) || 0;
        const available = capacity - currentUsage;
        
        if (capacity > 0 && capacityHint && capacityHintText) {
            const usagePercent = Math.round((currentUsage / capacity) * 100);
            capacityHintText.textContent = `仓库容量: ${currentUsage}/${capacity} (已用${usagePercent}%)，可用空间: ${available}`;
            capacityHint.classList.remove('hidden');
            
            // 如果容量不足，显示警告
            if (available <= 0) {
                capacityHint.classList.add('text-danger');
                capacityHint.classList.remove('text-gray-dark');
            } else if (usagePercent >= 80) {
                capacityHint.classList.add('text-warning');
                capacityHint.classList.remove('text-gray-dark', 'text-danger');
            } else {
                capacityHint.classList.remove('text-danger', 'text-warning');
                capacityHint.classList.add('text-gray-dark');
            }
        } else {
            capacityHint?.classList.add('hidden');
        }
    });
    
    // 当输入数量时，实时验证容量
    quantityInput?.addEventListener('input', function() {
        const selectedWarehouse = warehouseSelect?.options[warehouseSelect.selectedIndex];
        const capacity = parseInt(selectedWarehouse?.dataset?.capacity) || 0;
        const currentUsage = parseInt(selectedWarehouse?.dataset?.currentUsage) || 0;
        const available = capacity - currentUsage;
        const quantity = parseInt(this.value) || 0;
        
        if (capacity > 0 && quantity > available) {
            this.style.borderColor = '#FF3B30';
            showToast(`仓库容量不足！可用空间仅有 ${available}`, 'warning');
        } else {
            this.style.borderColor = '';
        }
    });
}

// 初始化出库表单实时验证
function initOutboundValidation() {
    const itemSelect = document.getElementById('outbound-item');
    const quantityInput = document.getElementById('outbound-quantity');
    
    // 当选择物品时，更新数量输入框的最大值提示
    itemSelect?.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const itemText = selectedOption?.text || '';
        const stockMatch = itemText.match(/库存:\s*(\d+)/);
        const currentStock = stockMatch ? parseInt(stockMatch[1]) : 0;
        
        if (quantityInput) {
            quantityInput.max = currentStock;
            quantityInput.placeholder = `最大可出库 ${currentStock} 个`;
            // 如果当前输入值超过库存，自动调整
            if (parseInt(quantityInput.value) > currentStock) {
                quantityInput.value = currentStock;
                showToast(`已自动调整为最大可出库数量: ${currentStock}`, 'info');
            }
        }
    });
    
    // 当输入数量时，实时验证
    quantityInput?.addEventListener('input', function() {
        const selectedOption = itemSelect?.options[itemSelect.selectedIndex];
        const itemText = selectedOption?.text || '';
        const stockMatch = itemText.match(/库存:\s*(\d+)/);
        const currentStock = stockMatch ? parseInt(stockMatch[1]) : 0;
        const quantity = parseInt(this.value) || 0;
        
        if (quantity > currentStock && currentStock > 0) {
            this.style.borderColor = '#FF3B30';
            showToast(`库存不足！当前库存仅有 ${currentStock} 个`, 'warning');
        } else {
            this.style.borderColor = '';
        }
    });
}

// 初始化调拨表单实时验证
function initTransferValidation() {
    const itemSelect = document.getElementById('transfer-item');
    const quantityInput = document.getElementById('transfer-quantity');
    const fromSelect = document.getElementById('transfer-from');
    const toSelect = document.getElementById('transfer-to');
    
    // 避免重复绑定事件
    if (itemSelect?.dataset.validationBound) return;
    if (itemSelect) itemSelect.dataset.validationBound = 'true';
    
    // 当选择物品时，更新数量输入框的最大值提示，并自动选择源仓库
    itemSelect?.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const itemText = selectedOption?.text || '';
        
        // 从文本中提取库存数量
        const stockMatch = itemText.match(/库存:\s*(\d+)/);
        const currentStock = stockMatch ? parseInt(stockMatch[1]) : 0;
        
        // 获取仓库ID并自动选择源仓库
        const warehouseId = selectedOption?.dataset?.warehouse;
        if (warehouseId && fromSelect) {
            fromSelect.value = String(warehouseId);
            showToast('已自动选择物品所在仓库', 'info');
        }
        
        if (quantityInput) {
            quantityInput.max = currentStock;
            quantityInput.placeholder = `最大可调拨 ${currentStock} 个`;
            if (parseInt(quantityInput.value) > currentStock) {
                quantityInput.value = currentStock;
            }
        }
    });
    
    // 当输入数量时，实时验证
    quantityInput?.addEventListener('input', function() {
        const selectedOption = itemSelect?.options[itemSelect.selectedIndex];
        const itemText = selectedOption?.text || '';
        const stockMatch = itemText.match(/库存:\s*(\d+)/);
        const currentStock = stockMatch ? parseInt(stockMatch[1]) : 0;
        const quantity = parseInt(this.value) || 0;
        
        if (quantity > currentStock && currentStock > 0) {
            this.style.borderColor = '#FF3B30';
            showToast(`库存不足！当前库存仅有 ${currentStock} 个`, 'warning');
        } else {
            this.style.borderColor = '';
        }
    });
    
    // 当选择目标仓库时，验证不能与源仓库相同，并检查容量
    toSelect?.addEventListener('change', function() {
        if (fromSelect && this.value && this.value === fromSelect.value) {
            showToast('目标仓库不能与源仓库相同', 'warning');
            this.value = '';
            return;
        }
        
        // 验证目标仓库容量
        validateTransferCapacity();
    });
    
    // 当输入数量变化时也验证目标仓库容量
    quantityInput?.addEventListener('input', function() {
        validateTransferCapacity();
    });
    
    // 验证目标仓库容量
    function validateTransferCapacity() {
        if (!toSelect || !quantityInput) return;
        
        const selectedOption = toSelect.options[toSelect.selectedIndex];
        if (!selectedOption || !selectedOption.value) return;
        
        const capacity = parseInt(selectedOption.dataset.capacity) || 0;
        const currentUsage = parseInt(selectedOption.dataset.currentUsage) || 0;
        const available = capacity - currentUsage;
        const quantity = parseInt(quantityInput.value) || 0;
        
        if (capacity > 0 && quantity > available) {
            showToast(`目标仓库容量不足！可用: ${available}，需要: ${quantity}`, 'warning');
            quantityInput.style.borderColor = '#FF3B30';
        }
    }
    
    // 当选择源仓库时，验证不能与目标仓库相同
    fromSelect?.addEventListener('change', function() {
        if (toSelect && this.value && this.value === toSelect.value) {
            showToast('源仓库不能与目标仓库相同', 'warning');
            toSelect.value = '';
        }
    });
}

// 调拨时自动选择物品所在仓库作为源仓库
function initTransferAutoSelectWarehouse() {
    const itemSelect = document.getElementById('transfer-item');
    const fromSelect = document.getElementById('transfer-from');
    
    if (!itemSelect || !fromSelect) return;
    
    // 使用标记避免重复绑定
    if (itemSelect.dataset.autoSelectBound) return;
    itemSelect.dataset.autoSelectBound = 'true';
    
    itemSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const warehouseId = selectedOption?.getAttribute('data-warehouse');
        
        if (warehouseId) {
            fromSelect.value = warehouseId;
            showToast('已自动选择物品所在仓库', 'info');
        }
    });
}

async function loadItemsForSelect(selectId, showWarehouse = false) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    try {
        const response = await API.items.list({ page_size: 100 });
        if (response.success && response.data) {
            const items = response.data.results || response.data;
            select.innerHTML = '<option value="">请选择物品</option>';
            items.forEach(item => {
                const warehouseInfo = showWarehouse && item.warehouse_name ? ` - ${item.warehouse_name}` : '';
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.name} (库存: ${item.stock}${warehouseInfo})`;
                option.dataset.warehouse = item.warehouse || item.warehouse_id || '';
                option.dataset.warehouseName = item.warehouse_name || '';
                option.dataset.stock = item.stock || 0;
                select.appendChild(option);
            });
            
            // 如果是调拨页面，绑定自动设置源仓库事件
            if (selectId === 'transfer-item' && showWarehouse) {
                const fromInput = document.getElementById('transfer-from');
                select.onchange = function() {
                    const selectedOption = this.options[this.selectedIndex];
                    const warehouseId = selectedOption?.dataset?.warehouse;
                    if (warehouseId && fromInput) {
                        fromInput.value = warehouseId;  // 设置隐藏字段的值
                    }
                };
            }
        }
    } catch (error) {
        console.error('加载物品列表失败:', error);
    }
}

async function loadSuppliersForSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    try {
        const response = await API.suppliers.list();
        if (response.success && response.data) {
            const suppliers = response.data.results || response.data;
            select.innerHTML = '<option value="">请选择供应商</option>';
            suppliers.forEach(s => {
                select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });
        }
    } catch (error) {
        console.error('加载供应商列表失败:', error);
    }
}

async function loadWarehousesForSelect(selectId, selectedValue) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    try {
        const response = await API.warehouses.list({ page_size: 100 });
        if (response.success && response.data) {
            // 处理分页和非分页两种情况
            let warehouses = [];
            if (Array.isArray(response.data)) {
                warehouses = response.data;
            } else if (response.data.results) {
                warehouses = response.data.results;
            } else {
                warehouses = response.data;
            }
            
            // 只显示启用的仓库
            warehouses = warehouses.filter(w => w.is_active !== false);
            
            select.innerHTML = '<option value="">请选择仓库</option>';
            warehouses.forEach(w => {
                const capacity = w.capacity || 0;
                const currentUsage = w.current_usage || 0;
                const available = capacity - currentUsage;
                const usageInfo = capacity > 0 ? ` (可用: ${available}/${capacity})` : '';
                const option = document.createElement('option');
                option.value = w.id;
                option.textContent = `${w.name}${usageInfo}`;
                option.dataset.capacity = capacity;
                option.dataset.currentUsage = currentUsage;
                if (w.id == selectedValue) option.selected = true;
                select.appendChild(option);
            });
        } else {
            // 静默处理
        }
    } catch (error) {
        console.error('加载仓库列表失败:', error);
    }
}

function showToast(message, type = 'info') {
    const colors = { success: 'bg-success', error: 'bg-danger', warning: 'bg-warning', info: 'bg-primary' };
    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-4 ${colors[type]} text-white px-6 py-3 rounded-apple shadow-apple-hover z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function exportReport(type) {
    const typeNames = {
        inventory: '库存明细',
        lowstock: '低库存',
        inbound: '入库记录',
        outbound: '出库记录'
    };
    showToast(`正在导出${typeNames[type]}报表...`, 'info');
    
    try {
        let data = [];
        let headers = [];
        let filename = '';
        
        if (type === 'inventory') {
            const response = await API.items.list();
            if (response.success) {
                data = response.data.results || response.data || [];
                headers = ['物品名称', '物品编码', '类别', '库存数量', '单价', '总价值', '仓库', '仓位', '状态'];
                data = data.map(item => [
                    item.name,
                    item.code,
                    item.category_name || '',
                    item.stock,
                    item.price,
                    item.total_value || (item.stock * item.price),
                    item.warehouse_name || '',
                    item.warehouse_location || '',
                    item.status_display || item.status
                ]);
                filename = `库存明细_${formatDate(new Date())}.txt`;
            }
        } else if (type === 'lowstock') {
            const response = await API.items.lowStock();
            if (response.success) {
                data = response.data || [];
                headers = ['物品名称', '物品编码', '当前库存', '最低库存', '缺口数量', '仓库'];
                data = data.map(item => [
                    item.name,
                    item.code,
                    item.stock,
                    item.min_stock || 0,
                    Math.max(0, (item.min_stock || 0) - item.stock),
                    item.warehouse_name || ''
                ]);
                filename = `低库存报表_${formatDate(new Date())}.txt`;
            }
        } else if (type === 'inbound') {
            const response = await API.operations.list({ type: 'inbound' });
            if (response.success) {
                data = response.data.results || response.data || [];
                headers = ['物品名称', '数量', '供应商', '操作员', '时间', '备注'];
                data = data.map(op => [
                    op.item_name || '',
                    op.quantity,
                    op.supplier_name || '',
                    op.operator_name || '',
                    op.created_at ? formatDateTime(op.created_at) : '',
                    op.notes || ''
                ]);
                filename = `入库记录_${formatDate(new Date())}.txt`;
            }
        } else if (type === 'outbound') {
            const response = await API.operations.list({ type: 'outbound' });
            if (response.success) {
                data = response.data.results || response.data || [];
                headers = ['物品名称', '数量', '操作员', '时间', '备注'];
                data = data.map(op => [
                    op.item_name || '',
                    op.quantity,
                    op.operator_name || '',
                    op.created_at ? formatDateTime(op.created_at) : '',
                    op.notes || ''
                ]);
                filename = `出库记录_${formatDate(new Date())}.txt`;
            }
        }
        
        if (data.length === 0) {
            showToast('没有数据可导出', 'warning');
            return;
        }
        
        // 生成TXT内容
        const txtContent = generateTXT(headers, data);
        // 下载文件
        downloadTXT(txtContent, filename);
        showToast('报表导出成功！', 'success');
    } catch (error) {
        console.error('导出失败:', error);
        showToast('导出失败: ' + error.message, 'error');
    }
}

// 生成TXT内容（表格格式）
function generateTXT(headers, rows) {
    const BOM = '\uFEFF';
    const separator = '\t';
    const headerLine = headers.join(separator);
    const divider = headers.map(h => '-'.repeat(h.length * 2)).join(separator);
    const dataLines = rows.map(row => row.map(cell => String(cell)).join(separator));
    return BOM + [headerLine, divider, ...dataLines].join('\n');
}

// 下载TXT文件
function downloadTXT(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// 格式化日期
function formatDate(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

// 格式化日期时间
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
}

// ==================== 表单提交处理 ====================
function initFormHandlers() {
    // 入库表单
    document.getElementById('inbound-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // 验证仓库选择
        const warehouseId = formData.get('warehouse');
        if (!warehouseId) {
            showToast('请选择入库仓库', 'warning');
            return;
        }
        
        // 验证供应商选择
        const supplierId = formData.get('supplier');
        if (!supplierId) {
            showToast('请选择供应商', 'warning');
            return;
        }
        
        try {
            const response = await API.operations.inbound({
                item: formData.get('item'),
                quantity: parseInt(formData.get('quantity')),
                warehouse: parseInt(warehouseId),
                supplier: parseInt(supplierId),
                notes: formData.get('notes')
            });
            if (response.success) {
                showToast('入库成功！', 'success');
                ModalManager.closeModal('inbound-modal');
                e.target.reset();
                // 隐藏提示信息
                document.getElementById('inbound-warehouse-hint')?.classList.add('hidden');
                document.getElementById('inbound-capacity-hint')?.classList.add('hidden');
                // 清除验证标记
                const itemSelect = document.getElementById('inbound-item');
                if (itemSelect) delete itemSelect.dataset.validationBound;
                // 清除所有缓存，强制刷新数据
                Utils.clearCache();
                InboundController.loadData();
                DashboardController.loadData(true);
                // 如果在物品页面，也刷新物品列表
                if (AppState.currentPage === 'items-page') {
                    ItemsController.loadData(ItemsController.currentPage, true);
                }
            } else {
                showToast(response.error?.message || '入库失败', 'error');
            }
        } catch (error) {
            showToast('操作失败: ' + error.message, 'error');
        }
    });
    
    // 出库表单
    document.getElementById('outbound-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // 获取选中的物品信息
        const itemSelect = document.getElementById('outbound-item');
        const selectedOption = itemSelect?.options[itemSelect.selectedIndex];
        const itemText = selectedOption?.text || '';
        
        // 从选项文本中提取库存数量
        const stockMatch = itemText.match(/库存:\s*(\d+)/);
        const currentStock = stockMatch ? parseInt(stockMatch[1]) : 0;
        const quantity = parseInt(formData.get('quantity'));
        
        // 验证出库数量
        if (!quantity || quantity <= 0) {
            showToast('请输入有效的出库数量', 'warning');
            return;
        }
        
        // 验证库存是否足够
        if (quantity > currentStock) {
            showToast(`库存不足！当前库存仅有 ${currentStock} 个，无法出库 ${quantity} 个`, 'error');
            return;
        }
        
        // 验证领用人
        if (!formData.get('recipient')?.trim()) {
            showToast('请输入领用人', 'warning');
            return;
        }
        
        try {
            const response = await API.operations.outbound({
                item: formData.get('item'),
                quantity: quantity,
                recipient: formData.get('recipient'),
                department: formData.get('department'),
                notes: formData.get('notes')
            });
            if (response.success) {
                showToast('出库成功！', 'success');
                ModalManager.closeModal('outbound-modal');
                e.target.reset();
                // 清除所有缓存，强制刷新数据
                Utils.clearCache();
                OutboundController.loadData();
                DashboardController.loadData(true);
                // 如果在物品页面，也刷新物品列表
                if (AppState.currentPage === 'items-page') {
                    ItemsController.loadData(ItemsController.currentPage, true);
                }
            } else {
                // 解析后端错误信息
                let errorMsg = '出库失败';
                if (response.error) {
                    if (typeof response.error === 'string') {
                        errorMsg = response.error;
                    } else if (response.error.message) {
                        errorMsg = response.error.message;
                    } else if (response.error.non_field_errors) {
                        errorMsg = response.error.non_field_errors[0];
                    } else if (response.error.detail) {
                        errorMsg = response.error.detail;
                    }
                }
                showToast(errorMsg, 'error');
            }
        } catch (error) {
            showToast('操作失败: ' + error.message, 'error');
        }
    });
    
    // 调拨表单
    document.getElementById('transfer-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // 获取选中的物品信息
        const itemSelect = document.getElementById('transfer-item');
        const selectedOption = itemSelect?.options[itemSelect.selectedIndex];
        const itemText = selectedOption?.text || '';
        
        // 从选项文本中提取库存数量（格式：物品名 (库存: X)）
        const stockMatch = itemText.match(/库存:\s*(\d+)/);
        const currentStock = stockMatch ? parseInt(stockMatch[1]) : 0;
        const quantity = parseInt(formData.get('quantity'));
        
        // 验证调拨数量
        if (!quantity || quantity <= 0) {
            showToast('请输入有效的调拨数量', 'warning');
            return;
        }
        
        // 验证库存是否足够
        if (quantity > currentStock) {
            showToast(`库存不足！当前库存仅有 ${currentStock} 个，无法调拨 ${quantity} 个`, 'error');
            return;
        }
        
        // 获取源仓库和目标仓库
        let fromWarehouse = formData.get('from_warehouse');
        const toWarehouse = formData.get('to_warehouse');
        const itemId = formData.get('item');
        
        // 如果源仓库为空，通过API获取物品所在仓库
        if (!fromWarehouse || fromWarehouse === '') {
            try {
                const itemRes = await API.items.get(itemId);
                if (itemRes.success && itemRes.data && itemRes.data.warehouse) {
                    fromWarehouse = itemRes.data.warehouse;
                }
            } catch (err) {
                console.error('获取物品信息失败:', err);
            }
        }
        
        if (!fromWarehouse) {
            showToast('无法获取物品所在仓库，请确保物品已分配仓库', 'warning');
            return;
        }
        if (!toWarehouse) {
            showToast('请选择目标仓库', 'warning');
            return;
        }
        if (fromWarehouse === toWarehouse) {
            showToast('目标仓库不能与物品所在仓库相同', 'warning');
            return;
        }
        
        try {
            const response = await API.operations.transfer({
                item: formData.get('item'),
                quantity: quantity,
                from_warehouse: parseInt(fromWarehouse),
                to_warehouse: parseInt(toWarehouse),
                notes: formData.get('notes') || ''
            });
            if (response.success) {
                showToast('调拨成功！', 'success');
                ModalManager.closeModal('transfer-modal');
                e.target.reset();
                // 清除所有缓存，强制刷新数据
                Utils.clearCache();
                TransferController.loadData();
                DashboardController.loadData(true);
                // 如果在物品页面，也刷新物品列表
                if (AppState.currentPage === 'items-page') {
                    ItemsController.loadData(ItemsController.currentPage, true);
                }
            } else {
                // 解析后端错误信息
                let errorMsg = '调拨失败';
                if (response.error) {
                    if (typeof response.error === 'string') {
                        errorMsg = response.error;
                    } else if (response.error.message) {
                        errorMsg = response.error.message;
                    } else if (response.error.non_field_errors) {
                        errorMsg = response.error.non_field_errors[0];
                    } else if (response.error.detail) {
                        errorMsg = response.error.detail;
                    }
                }
                showToast(errorMsg, 'error');
            }
        } catch (error) {
            showToast('操作失败: ' + error.message, 'error');
        }
    });
    
    // 仓库表单
    document.getElementById('warehouse-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const editId = e.target.dataset.editId;
        
        const warehouseData = {
            name: formData.get('name'),
            code: formData.get('code') || undefined,
            location: formData.get('address'),  // 后端字段名是 location
            manager: formData.get('manager'),
            phone: formData.get('phone'),
            capacity: parseInt(formData.get('capacity')) || 0
        };
        
        // 编辑模式时包含is_active字段
        if (editId) {
            const isActiveCheckbox = document.getElementById('warehouse-is-active');
            warehouseData.is_active = isActiveCheckbox ? isActiveCheckbox.checked : true;
        }
        
        try {
            let response;
            if (editId) {
                // 编辑模式
                response = await API.warehouses.update(editId, warehouseData);
            } else {
                // 新增模式
                response = await API.warehouses.create(warehouseData);
            }
            
            if (response.success) {
                showToast(editId ? '仓库更新成功！' : '仓库添加成功！', 'success');
                ModalManager.closeModal('warehouse-modal');
                e.target.reset();
                delete e.target.dataset.editId;
                // 重置模态框标题和隐藏状态行
                const title = document.querySelector('#warehouse-modal h3');
                if (title) title.textContent = '添加仓库';
                const statusRow = document.getElementById('warehouse-status-row');
                if (statusRow) statusRow.classList.add('hidden');
                // 清除缓存并刷新
                Utils.clearCache('warehouses');
                WarehouseController.loadData();
            } else {
                showToast(response.error?.message || '操作失败', 'error');
            }
        } catch (error) {
            showToast('操作失败: ' + error.message, 'error');
        }
    });
    
    // 供应商表单
    document.getElementById('supplier-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const response = await API.suppliers.create({
                name: formData.get('name'),
                code: formData.get('code') || undefined,
                contact: formData.get('contact'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                address: formData.get('address')
            });
            if (response.success) {
                showToast('供应商添加成功！', 'success');
                ModalManager.closeModal('supplier-modal');
                e.target.reset();
                SupplierController.loadData();
            } else {
                showToast(response.error?.message || '添加失败', 'error');
            }
        } catch (error) {
            showToast('操作失败: ' + error.message, 'error');
        }
    });
    
    // 编辑物品表单
    document.getElementById('edit-item-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const id = form.querySelector('#edit-item-id').value;
        const imageInput = document.getElementById('edit-item-image-input');
        const hasNewImage = imageInput && imageInput.files && imageInput.files.length > 0;
        
        try {
            let response;
            
            if (hasNewImage) {
                // 有新图片，使用 FormData 上传
                const uploadData = new FormData();
                uploadData.append('name', form.querySelector('#edit-item-name').value);
                uploadData.append('category', form.querySelector('#edit-item-category').value);
                uploadData.append('price', form.querySelector('#edit-item-price').value);
                uploadData.append('stock', form.querySelector('#edit-item-stock').value || 0);
                uploadData.append('min_stock', form.querySelector('#edit-item-min-stock').value || 0);
                const warehouse = form.querySelector('#edit-item-warehouse').value;
                if (warehouse) uploadData.append('warehouse', warehouse);
                uploadData.append('warehouse_location', form.querySelector('#edit-item-location').value || '');
                uploadData.append('description', form.querySelector('#edit-item-description').value || '');
                uploadData.append('image', imageInput.files[0]);
                
                response = await API.items.updateWithImage(id, uploadData);
            } else {
                // 没有新图片，使用普通 JSON 更新
                const formData = new FormData(form);
                response = await API.items.update(id, {
                    name: formData.get('name'),
                    category: formData.get('category'),
                    price: parseFloat(formData.get('price')),
                    stock: parseInt(formData.get('stock')) || 0,
                    min_stock: parseInt(formData.get('min_stock')) || 0,
                    warehouse: formData.get('warehouse') || null,
                    warehouse_location: formData.get('warehouse_location'),
                    description: formData.get('description')
                });
            }
            
            if (response.success) {
                showToast('物品更新成功！', 'success');
                ModalManager.closeModal('edit-item-modal');
                // 清除图片输入
                if (imageInput) imageInput.value = '';
                // 清除缓存并强制刷新
                Utils.clearCache();
                ItemsController.loadData(ItemsController.currentPage, true);
                DashboardController.loadData(true);
            } else {
                showToast(response.error?.message || '更新失败', 'error');
            }
        } catch (error) {
            showToast('操作失败: ' + error.message, 'error');
        }
    });
}

// ==================== 编辑物品功能 ====================
async function editItem(id) {
    try {
        const response = await API.items.get(id);
        if (response.success && response.data) {
            const item = response.data;
            document.getElementById('edit-item-id').value = item.id;
            document.getElementById('edit-item-name').value = item.name;
            document.getElementById('edit-item-code').value = item.code;
            document.getElementById('edit-item-price').value = item.price;
            document.getElementById('edit-item-stock').value = item.stock;
            document.getElementById('edit-item-min-stock').value = item.min_stock || 0;
            document.getElementById('edit-item-location').value = item.warehouse_location || '';
            document.getElementById('edit-item-description').value = item.description || '';
            
            // 设置物品图片
            if (typeof setEditItemImage === 'function') {
                const imageUrl = Utils.getImageUrl(item.image);
                setEditItemImage(imageUrl || '');
            }
            
            // 获取类别ID（API返回的category可能是对象或ID）
            const categoryId = item.category?.id || item.category;
            // 获取仓库ID（API返回的warehouse可能是对象或ID）
            const warehouseId = item.warehouse?.id || item.warehouse;
            
            // 加载类别和仓库选项，并设置选中值
            await loadCategoriesForSelect('edit-item-category', categoryId);
            await loadWarehousesForSelect('edit-item-warehouse', warehouseId);
            
            ModalManager.openModal('edit-item-modal');
        }
    } catch (error) {
        showToast('加载物品信息失败', 'error');
    }
}

async function loadCategoriesForSelect(selectId, selectedValue) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    try {
        const response = await API.categories.list();
        if (response.success && response.data) {
            const allCategories = Array.isArray(response.data) ? response.data : (response.data.results || []);
            const categories = allCategories.filter(c => c.is_active !== false);
            select.innerHTML = '<option value="">选择类别</option>';
            categories.forEach(c => {
                const selected = c.id == selectedValue ? 'selected' : '';
                select.innerHTML += `<option value="${c.id}" ${selected}>${c.name}</option>`;
            });
        }
    } catch (error) {
        console.error('加载类别失败:', error);
    }
}

// 全局编辑函数
window.editItem = editItem;

// 低库存物品快速入库 - 通过索引获取完整物品信息
function quickInboundFromLowStockIndex(index) {
    const item = DashboardController.lowStockItems[index];
    if (item && typeof QuickInboundManager !== 'undefined') {
        QuickInboundManager.show(item);
    } else {
        showToast('物品信息获取失败', 'error');
    }
}
window.quickInboundFromLowStockIndex = quickInboundFromLowStockIndex;

// 低库存物品快速入库 - 保留旧函数兼容性
async function quickInboundFromLowStock(itemId, itemName, currentStock) {
    // 弹出输入框让用户输入入库数量
    const quantity = prompt(`为 "${itemName}" 补货\n当前库存: ${currentStock}\n\n请输入入库数量:`);
    
    if (quantity === null) return; // 用户取消
    
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
        showToast('请输入有效的入库数量', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/operations/inbound/', {
            method: 'POST',
            credentials: 'include',  // 包含cookies，确保session认证生效
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                item: itemId,
                quantity: qty,
                notes: '低库存补货'
            })
        });
        
        if (response.ok) {
            showToast(`补货成功！${itemName} +${qty}件`, 'success');
            // 刷新仪表盘数据
            if (typeof DashboardController !== 'undefined' && DashboardController.loadData) {
                DashboardController.loadData();
            }
        } else {
            const error = await response.json();
            showToast(error.detail || error.message || '补货失败', 'error');
        }
    } catch (error) {
        console.error('补货失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}
window.quickInboundFromLowStock = quickInboundFromLowStock;

// 获取CSRF Token（如果还没定义）
function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}

// 导出下拉选项加载函数为全局函数
window.loadCategoriesForSelect = loadCategoriesForSelect;
window.loadSuppliersForSelect = loadSuppliersForSelect;
window.loadWarehousesForSelect = loadWarehousesForSelect;

// 打开添加物品模态框
async function openAddItemModal() {
    // 加载类别、供应商和仓库选项
    await loadCategoriesForSelect('item-category');
    await loadSuppliersForSelect('item-supplier');
    await loadWarehousesForSelect('item-warehouse');
    
    const modal = document.getElementById('add-item-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const content = document.getElementById('modal-content');
        if (content) {
            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }, 10);
        }
    }
}
window.openAddItemModal = openAddItemModal;

// 删除仓库
window.deleteWarehouse = async function(id) {
    if (!confirm('确定要删除这个仓库吗？')) return;
    try {
        const response = await API.warehouses.delete(id);
        if (response.success) {
            showToast('仓库删除成功', 'success');
            WarehouseController.loadData();
        } else {
            showToast(response.error?.message || '删除失败', 'error');
        }
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
};

// 删除供应商
window.deleteSupplier = async function(id) {
    if (!confirm('确定要删除这个供应商吗？')) return;
    try {
        const response = await API.suppliers.delete(id);
        if (response.success) {
            showToast('供应商删除成功', 'success');
            SupplierController.loadData();
        } else {
            showToast(response.error?.message || '删除失败', 'error');
        }
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
};

// ==================== 设置控制器 ====================
const SettingsController = {
    async loadData() {
        // 从localStorage获取用户信息
        const userInfo = API.TokenManager.getUserInfo();
        
        if (userInfo) {
            // 更新设置页面的用户信息
            const settingsUsername = document.getElementById('settings-username');
            if (settingsUsername) settingsUsername.value = userInfo.username || '';
            
            const settingsEmail = document.getElementById('settings-email');
            if (settingsEmail) settingsEmail.value = userInfo.email || '';
        } else {
            // 如果localStorage没有用户信息，尝试从API获取
            try {
                const response = await API.auth.profile();
                if (response.success && response.data) {
                    const user = response.data;
                    // 保存到localStorage
                    API.TokenManager.setUserInfo(user);
                    
                    // 更新页面
                    const settingsUsername = document.getElementById('settings-username');
                    if (settingsUsername) settingsUsername.value = user.username || '';
                    
                    const settingsEmail = document.getElementById('settings-email');
                    if (settingsEmail) settingsEmail.value = user.email || '';
                }
            } catch (error) {
                console.error('获取用户信息失败:', error);
            }
        }
        
        // 绑定修改密码表单事件
        this.initPasswordForm();
        
        // 加载系统信息
        this.loadSystemInfo();
    },
    
    async loadSystemInfo() {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;
            
            const res = await fetch('/api/dashboard/system-info/', { headers });
            const response = await res.json();
            
            if (response.success && response.data) {
                const { system, statistics, server_time } = response.data;
                
                // 更新系统信息
                document.getElementById('sys-name').textContent = system.name || '-';
                document.getElementById('sys-version').textContent = system.version || '-';
                document.getElementById('sys-backend').textContent = system.backend || '-';
                document.getElementById('sys-database').textContent = system.database || '-';
                
                // 更新统计信息
                document.getElementById('sys-items-count').textContent = Utils.formatNumber(statistics.items_count || 0);
                document.getElementById('sys-warehouses-count').textContent = statistics.warehouses_count || 0;
                document.getElementById('sys-suppliers-count').textContent = statistics.suppliers_count || 0;
                document.getElementById('sys-operations-count').textContent = Utils.formatNumber(statistics.operations_count || 0);
                
                // 更新服务器时间和版权
                document.getElementById('sys-server-time').textContent = '服务器时间: ' + server_time;
                document.getElementById('sys-copyright').textContent = `© 2024-2025 ${system.name}`;
            }
        } catch (error) {
            console.error('加载系统信息失败:', error);
        }
    },
    
    initPasswordForm() {
        const form = document.getElementById('change-password-form');
        if (!form) return;
        
        // 移除旧的事件监听器（防止重复绑定）
        form.removeEventListener('submit', this.handlePasswordChange);
        form.addEventListener('submit', this.handlePasswordChange.bind(this));
    },
    
    async handlePasswordChange(e) {
        e.preventDefault();
        
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const newPasswordConfirm = document.getElementById('new-password-confirm').value;
        
        // 验证
        if (!oldPassword || !newPassword || !newPasswordConfirm) {
            showToast('请填写所有密码字段', 'warning');
            return;
        }
        
        if (newPassword.length < 6) {
            showToast('新密码至少需要6个字符', 'warning');
            return;
        }
        
        if (newPassword !== newPasswordConfirm) {
            showToast('两次输入的新密码不一致', 'warning');
            return;
        }
        
        const btn = document.getElementById('change-password-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
        }
        
        try {
            const response = await API.auth.changePassword({
                old_password: oldPassword,
                new_password: newPassword,
                new_password_confirm: newPasswordConfirm
            });
            
            if (response.success) {
                showToast('密码修改成功！', 'success');
                // 清空表单
                document.getElementById('change-password-form').reset();
            } else {
                const errorMsg = response.error?.message || response.error?.details?.old_password?.[0] || '密码修改失败';
                showToast(errorMsg, 'error');
            }
        } catch (error) {
            console.error('修改密码失败:', error);
            showToast('修改密码失败: ' + error.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '保存修改';
            }
        }
    }
};

// ==================== 报表控制器 ====================
const ReportsController = {
    async loadData() {
        try {
            // 加载统计数据
            const overview = await API.dashboard.overview();
            if (overview.success && overview.data) {
                const data = overview.data.overview || overview.data;
                document.getElementById('report-total-stock')?.textContent && 
                    (document.getElementById('report-total-stock').textContent = Utils.formatNumber(data.total_stock || 0));
                document.getElementById('report-total-value')?.textContent && 
                    (document.getElementById('report-total-value').textContent = '¥' + Utils.formatNumber(data.total_value || 0));
            }
            
            // 加载出入库统计
            const stats = await API.operations.statistics(30);
            if (stats.success && stats.data) {
                document.getElementById('report-inbound-count')?.textContent && 
                    (document.getElementById('report-inbound-count').textContent = stats.data.inbound_count || 0);
                document.getElementById('report-outbound-count')?.textContent && 
                    (document.getElementById('report-outbound-count').textContent = stats.data.outbound_count || 0);
            }
            
            // 渲染图表
            this.renderCharts();
        } catch (error) {
            console.error('加载报表数据失败:', error);
        }
    },
    
    async renderCharts() {
        // 趋势图
        const trendChart = document.getElementById('report-trend-chart');
        if (trendChart && window.echarts) {
            const chart = echarts.init(trendChart);
            const trendData = await API.dashboard.trend('month');
            if (trendData.success && trendData.data) {
                chart.setOption({
                    tooltip: { trigger: 'axis' },
                    legend: { data: ['入库', '出库'] },
                    xAxis: { type: 'category', data: trendData.data.labels || [] },
                    yAxis: { type: 'value' },
                    series: [
                        { name: '入库', type: 'line', data: trendData.data.inbound || [], smooth: true },
                        { name: '出库', type: 'line', data: trendData.data.outbound || [], smooth: true }
                    ]
                });
            }
        }
        
        // 分类图
        const categoryChart = document.getElementById('report-category-chart');
        if (categoryChart && window.echarts) {
            const chart = echarts.init(categoryChart);
            const distData = await API.dashboard.distribution();
            if (distData.success && distData.data) {
                const pieData = (distData.data.labels || []).map((label, i) => ({
                    name: label,
                    value: (distData.data.values || [])[i] || 0
                }));
                chart.setOption({
                    tooltip: { trigger: 'item' },
                    series: [{
                        type: 'pie',
                        radius: '70%',
                        data: pieData
                    }]
                });
            }
        }
    }
};

// 更新PageManager加载报表页面
const originalLoadPageData = PageManager.loadPageData;
PageManager.loadPageData = async function(pageId) {
    await originalLoadPageData.call(this, pageId);
    if (pageId === 'reports-page') {
        await ReportsController.loadData();
    }
};

// 初始化所有功能
document.addEventListener('DOMContentLoaded', () => {
    ModalManager.init();
    initButtonEvents();
    initFormHandlers();
    initGlobalSearch();
});

// ==================== 全局搜索功能 ====================
function initGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const searchResults = document.getElementById('global-search-results');
    
    if (!searchInput || !searchResults) return;
    
    let searchTimeout = null;
    
    // 输入时搜索
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // 清除之前的定时器
        if (searchTimeout) clearTimeout(searchTimeout);
        
        if (query.length < 1) {
            searchResults.classList.add('hidden');
            return;
        }
        
        // 延迟搜索，避免频繁请求
        searchTimeout = setTimeout(() => {
            performGlobalSearch(query);
        }, 300);
    });
    
    // 聚焦时显示结果
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 1) {
            searchResults.classList.remove('hidden');
        }
    });
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });
    
    // 回车跳转到物品页面
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                // 跳转到物品页面并搜索
                PageManager.showPage('items-page');
                const itemsSearch = document.getElementById('items-search');
                if (itemsSearch) {
                    itemsSearch.value = query;
                    ItemsController.loadData();
                }
                searchResults.classList.add('hidden');
            }
        }
    });
}

// 执行全局搜索
async function performGlobalSearch(query) {
    const searchResults = document.getElementById('global-search-results');
    if (!searchResults) return;
    
    // 显示加载状态
    searchResults.innerHTML = '<div class="p-4 text-center text-gray-dark"><i class="fas fa-spinner fa-spin text-xl"></i><p class="mt-2">搜索中...</p></div>';
    searchResults.classList.remove('hidden');
    
    try {
        const response = await API.items.list({ search: query, page_size: 10 });
        
        if (response.success) {
            const items = response.data?.results || response.data || [];
            
            if (items.length === 0) {
                searchResults.innerHTML = `
                    <div class="p-4 text-center text-gray-dark">
                        <i class="fas fa-search text-2xl mb-2"></i>
                        <p>未找到 "${query}" 相关物品</p>
                    </div>
                `;
                return;
            }
            
            const html = items.map(item => {
                const firstChar = (item.name || '?').charAt(0).toUpperCase();
                const imageUrl = Utils.getImageUrl(item.image);
                const hasImage = imageUrl && imageUrl !== '';
                const imageHtml = hasImage 
                    ? `<img src="${imageUrl}" alt="${item.name}" class="w-10 h-10 rounded-lg object-cover bg-gray-100" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center text-primary text-sm font-bold hidden">${firstChar}</div>`
                    : `<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">${firstChar}</div>`;
                
                return `
                <div class="p-3 hover:bg-light cursor-pointer border-b border-gray-light last:border-b-0 transition-colors" onclick="viewItemFromSearch(${item.id})">
                    <div class="flex items-center space-x-3">
                        ${imageHtml}
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-sm truncate">${item.name}</p>
                            <p class="text-xs text-gray-dark">${item.code} · ${item.category_name || '未分类'}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-medium">¥${parseFloat(item.price).toFixed(2)}</p>
                            <p class="text-xs ${item.stock <= (item.min_stock || 0) ? 'text-danger' : 'text-gray-dark'}">库存: ${item.stock}</p>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
            
            searchResults.innerHTML = `
                ${html}
                <div class="p-3 text-center border-t border-gray-light">
                    <button onclick="goToItemsPageWithSearch('${query}')" class="text-primary text-sm hover:underline">
                        查看全部结果 <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                </div>
            `;
        } else {
            searchResults.innerHTML = '<div class="p-4 text-center text-danger">搜索失败，请重试</div>';
        }
    } catch (error) {
        console.error('搜索失败:', error);
        searchResults.innerHTML = '<div class="p-4 text-center text-danger">搜索出错</div>';
    }
}

// 从搜索结果查看物品详情
window.viewItemFromSearch = function(id) {
    const searchResults = document.getElementById('global-search-results');
    const searchInput = document.getElementById('global-search-input');
    if (searchResults) searchResults.classList.add('hidden');
    if (searchInput) searchInput.value = '';
    
    // 跳转到物品页面并打开编辑
    PageManager.showPage('items-page');
    PageManager.loadPageData('items-page');
    
    // 延迟打开编辑模态框
    setTimeout(() => {
        if (window.editItem) {
            window.editItem(id);
        }
    }, 500);
};

// 跳转到物品页面并搜索
window.goToItemsPageWithSearch = function(query) {
    const searchResults = document.getElementById('global-search-results');
    const searchInput = document.getElementById('global-search-input');
    if (searchResults) searchResults.classList.add('hidden');
    if (searchInput) searchInput.value = '';
    
    PageManager.showPage('items-page');
    const itemsSearch = document.getElementById('items-search');
    if (itemsSearch) {
        itemsSearch.value = query;
        ItemsController.loadData();
    }
};

// 导出到全局
window.App = {
    PageManager,
    DashboardController,
    ItemsController,
    InboundController,
    OutboundController,
    TransferController,
    WarehouseController,
    SupplierController,
    SettingsController,
    ReportsController,
    ModalManager,
    Utils,
};

// 直接暴露控制器到全局（方便其他脚本调用）
window.DashboardController = DashboardController;
window.ItemsController = ItemsController;
window.InboundController = InboundController;
window.OutboundController = OutboundController;
window.TransferController = TransferController;
window.WarehouseController = WarehouseController;
window.SupplierController = SupplierController;
window.Utils = Utils;
