/**
 * 库存管理系统 - 主应用脚本
 * 处理页面交互和数据加载
 */

// 应用状态
const AppState = {
    currentPage: 'dashboard',
    currentUser: null,
    isLoading: false,
};

// 工具函数
const Utils = {
    // 显示加载状态
    showLoading(message = '加载中...') {
        AppState.isLoading = true;
        // 可以添加loading UI
    },
    
    // 隐藏加载状态
    hideLoading() {
        AppState.isLoading = false;
    },
    
    // 显示成功消息
    showSuccess(message) {
        console.log('✅', message);
        // 可以添加toast提示
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
        return num.toLocaleString('zh-CN');
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
            case 'warehouse-page':
                await WarehouseController.loadData();
                break;
            case 'supplier-page':
                await SupplierController.loadData();
                break;
        }
    },
};

// 仪表盘控制器
const DashboardController = {
    async loadData() {
        try {
            console.log('🔄 开始加载仪表盘数据...');
            Utils.showLoading();
            
            // 加载概览数据
            const overviewData = await API.dashboard.overview();
            console.log('📦 API返回的概览数据:', overviewData);
            
            if (overviewData.success && overviewData.data) {
                this.renderOverview(overviewData.data);
            } else {
                console.error('❌ 概览数据格式错误:', overviewData);
            }
            
            // 加载最近活动
            const activities = await API.dashboard.activities(10);
            console.log('📦 API返回的活动数据:', activities);
            
            if (activities.success && activities.data) {
                this.renderActivities(activities.data);
            } else {
                console.error('❌ 活动数据格式错误:', activities);
            }
            
            // 加载低库存物品
            const lowStock = await API.dashboard.lowStock();
            console.log('📦 API返回的低库存数据:', lowStock);
            
            if (lowStock.success && lowStock.data) {
                this.renderLowStock(lowStock.data);
            } else {
                console.error('❌ 低库存数据格式错误:', lowStock);
            }
            
            // 渲染图表
            await this.renderCharts();
            
            // 初始化时间范围切换按钮
            this.initTrendPeriodButtons();
            
            Utils.hideLoading();
            console.log('✅ 仪表盘数据加载完成');
        } catch (error) {
            Utils.hideLoading();
            console.error('❌ 加载仪表盘数据失败:', error);
            Utils.showError('加载仪表盘数据失败: ' + error.message);
        }
    },
    
    renderOverview(data) {
        console.log('📊 渲染仪表盘数据:', data);
        
        // 数据可能在 data.overview 中
        const overview = data.overview || data;
        const changes = data.changes || {};
        
        // 更新统计卡片 - 使用正确的HTML ID
        const totalItemsCount = document.getElementById('total-items-count');
        if (totalItemsCount && overview.total_items !== undefined) {
            totalItemsCount.textContent = Utils.formatNumber(overview.total_items);
            console.log('✅ 更新总物品数量:', overview.total_items);
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
            console.log('✅ 更新低库存物品:', overview.low_stock_items);
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
            console.log('✅ 更新库存总价值:', overview.total_value);
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
            console.log('✅ 更新周转率:', rate.toFixed(1) + '%');
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
        
        console.log('✅ 仪表盘概览数据已更新');
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
        
        console.log('✅ 进度条已更新');
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
            
            return `
                <tr class="border-b border-gray-light hover:bg-light/50 transition-colors">
                    <td class="py-3 px-4">
                        <div class="flex items-center space-x-3">
                            <img src="${activity.item_image || 'https://via.placeholder.com/40'}" 
                                 alt="${activity.item_name}" 
                                 class="w-8 h-8 rounded object-cover" />
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
        console.log('✅ 最近活动已更新', activities.length, '条');
    },
    
    renderLowStock(items) {
        const container = document.getElementById('low-stock-items');
        if (!container) return;
        
        if (!items || items.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-dark">暂无低库存物品</div>';
            return;
        }
        
        const html = items.slice(0, 5).map(item => `
            <div class="flex items-center justify-between p-3 bg-warning/5 rounded-apple-sm">
                <div class="flex items-center space-x-3">
                    <img src="${item.image || 'https://via.placeholder.com/40'}" 
                         alt="${item.name}" 
                         class="w-10 h-10 rounded object-cover" />
                    <div>
                        <div class="font-medium text-sm">${item.name}</div>
                        <div class="text-xs text-gray-dark">库存: ${item.stock}</div>
                    </div>
                </div>
                <button class="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `).join('');
        
        container.innerHTML = html;
        console.log('✅ 低库存物品已更新', items.length, '个');
    },
    
    async renderCharts() {
        try {
            // 渲染库存趋势图
            await this.renderTrendChart();
            
            // 渲染类别分布图
            await this.renderCategoryChart();
            
            console.log('✅ 图表渲染完成');
        } catch (error) {
            console.error('❌ 图表渲染失败:', error);
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
        
        // 获取趋势数据（传入时间范围参数）
        const trendData = await API.dashboard.trend(period);
        console.log(`📈 趋势数据 (${period}):`, trendData);
        
        if (!trendData.success || !trendData.data) {
            console.error('趋势数据格式错误');
            return;
        }
        
        const data = trendData.data;
        
        // 销毁旧图表实例
        if (this.trendChartInstance) {
            this.trendChartInstance.destroy();
        }
        
        // 创建新图表
        this.trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [{
                    label: '入库',
                    data: data.inbound || [100, 150, 120, 180, 160, 200],
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: '出库',
                    data: data.outbound || [80, 120, 100, 140, 130, 170],
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
        
        console.log(`✅ 库存趋势图已渲染 (${period})`);
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
                
                console.log(`✅ 切换到${period === 'month' ? '月度' : period === 'quarter' ? '季度' : '年度'}视图`);
            });
        });
        
        console.log('✅ 趋势图时间范围按钮已初始化');
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
        
        // 获取分布数据
        const distData = await API.dashboard.distribution();
        console.log('📊 分布数据:', distData);
        
        if (!distData.success || !distData.data) {
            console.error('分布数据格式错误');
            return;
        }
        
        const data = distData.data;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || ['电子设备', '办公用品', '原材料', '成品', '包装材料', '其他'],
                datasets: [{
                    data: data.values || [30, 20, 15, 20, 10, 5],
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
        
        console.log('✅ 类别分布图已渲染');
    },
};

// 物品列表控制器
const ItemsController = {
    currentPage: 1,
    pageSize: 10,
    
    async loadData(page = 1) {
        try {
            Utils.showLoading();
            
            const params = {
                page: page,
                page_size: this.pageSize,
            };
            
            // 获取搜索和过滤条件
            const search = document.getElementById('items-search')?.value;
            if (search) params.search = search;
            
            const category = document.getElementById('category-filter')?.value;
            if (category) params.category = category;
            
            const data = await API.items.list(params);
            this.renderItems(data.data);
            
            Utils.hideLoading();
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('加载物品列表失败: ' + error.message);
        }
    },
    
    renderItems(data) {
        const tbody = document.getElementById('items-table-body');
        if (!tbody) return;
        
        const items = data.results || data;
        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-dark">暂无数据</td></tr>';
            return;
        }
        
        const html = items.map(item => `
            <tr class="border-b border-gray-light hover:bg-light/50 transition-colors">
                <td class="py-3 px-4">
                    <div>
                        <p class="font-medium">${item.name}</p>
                        <p class="text-sm text-gray-dark">${item.code}</p>
                    </div>
                </td>
                <td class="py-3 px-4 text-sm">${item.category_name || '-'}</td>
                <td class="py-3 px-4 text-sm">${item.stock}</td>
                <td class="py-3 px-4 text-sm">${Utils.formatMoney(item.price)}</td>
                <td class="py-3 px-4 text-sm">${item.warehouse_location || '-'}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getStatusClass(item.status)}">
                        ${item.status_display}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <button class="text-primary hover:text-primary/80 text-sm mr-2" onclick="ItemsController.editItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-danger hover:text-danger/80 text-sm" onclick="ItemsController.deleteItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
        
        // 更新总数
        const total = data.count || items.length;
        const itemsTotal = document.getElementById('items-total');
        if (itemsTotal) itemsTotal.textContent = total;
        
        console.log('✅ 物品列表已更新', items.length, '条');
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
        Utils.showSuccess('编辑功能待实现');
    },
    
    async deleteItem(id) {
        if (!confirm('确定要删除这个物品吗？')) return;
        
        try {
            await API.items.delete(id);
            Utils.showSuccess('删除成功');
            this.loadData(this.currentPage);
        } catch (error) {
            Utils.showError('删除失败: ' + error.message);
        }
    },
};

// 入库控制器
const InboundController = {
    async loadData() {
        try {
            Utils.showLoading();
            
            // 加载入库记录
            const data = await API.operations.list({ operation_type: 'in', page_size: 20 });
            this.renderRecords(data.data);
            
            // 加载统计数据
            const stats = await API.operations.statistics(30);
            this.renderStats(stats.data);
            
            Utils.hideLoading();
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('加载入库数据失败: ' + error.message);
        }
    },
    
    renderRecords(data) {
        const tbody = document.getElementById('inbound-table-body');
        if (!tbody) return;
        
        const records = data.results || data;
        
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-dark">暂无入库记录</td></tr>';
            return;
        }
        
        const html = records.map(record => `
            <tr class="border-b border-gray-light hover:bg-light/50 transition-colors">
                <td class="py-3 px-4">${record.item_name}</td>
                <td class="py-3 px-4">${record.quantity}</td>
                <td class="py-3 px-4">${record.supplier_name || '-'}</td>
                <td class="py-3 px-4">-</td>
                <td class="py-3 px-4">${record.operator_name || '-'}</td>
                <td class="py-3 px-4 text-sm text-gray-dark">${Utils.formatDate(record.created_at)}</td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
        console.log('✅ 入库记录已更新', records.length, '条');
    },
    
    renderStats(stats) {
        // 更新统计卡片
        console.log('✅ 入库统计数据', stats);
    },
};

// 出库控制器
const OutboundController = {
    async loadData() {
        try {
            Utils.showLoading();
            
            const data = await API.operations.list({ operation_type: 'out', page_size: 20 });
            this.renderRecords(data.data);
            
            Utils.hideLoading();
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('加载出库数据失败: ' + error.message);
        }
    },
    
    renderRecords(data) {
        const tbody = document.getElementById('outbound-table-body');
        if (!tbody) return;
        
        const records = data.results || data;
        
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-dark">暂无出库记录</td></tr>';
            return;
        }
        
        const html = records.map(record => `
            <tr class="border-b border-gray-light hover:bg-light/50 transition-colors">
                <td class="py-3 px-4">${record.item_name}</td>
                <td class="py-3 px-4">${record.quantity}</td>
                <td class="py-3 px-4">${record.recipient || '-'}</td>
                <td class="py-3 px-4">${record.department || '-'}</td>
                <td class="py-3 px-4">${record.operator_name || '-'}</td>
                <td class="py-3 px-4 text-sm text-gray-dark">${Utils.formatDate(record.created_at)}</td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
        console.log('✅ 出库记录已更新', records.length, '条');
    },
};

// 仓库控制器
const WarehouseController = {
    async loadData() {
        try {
            Utils.showLoading();
            
            const data = await API.warehouses.list();
            this.renderWarehouses(data.data);
            
            Utils.hideLoading();
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('加载仓库数据失败: ' + error.message);
        }
    },
    
    renderWarehouses(warehouses) {
        const container = document.getElementById('warehouse-grid');
        if (!container) return;
        
        if (warehouses.length === 0) {
            container.innerHTML = '<p class="text-gray-dark text-center py-8 col-span-3">暂无仓库数据</p>';
            return;
        }
        
        const html = warehouses.map(warehouse => `
            <div class="bg-white rounded-apple p-6 shadow-apple hover:shadow-apple-hover transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="font-semibold text-lg">${warehouse.name}</h3>
                        <p class="text-sm text-gray-dark mt-1">${warehouse.code}</p>
                    </div>
                    <span class="px-3 py-1 bg-success/10 text-success text-xs rounded-full">
                        ${warehouse.is_active ? '运营中' : '已停用'}
                    </span>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center text-sm">
                        <i class="fas fa-map-marker-alt text-gray-dark w-5"></i>
                        <span class="text-gray-dark">${warehouse.location}</span>
                    </div>
                    <div class="flex items-center text-sm">
                        <i class="fas fa-user text-gray-dark w-5"></i>
                        <span class="text-gray-dark">${warehouse.manager} - ${warehouse.phone}</span>
                    </div>
                    <div class="mt-4">
                        <div class="flex justify-between text-sm mb-2">
                            <span class="text-gray-dark">使用率</span>
                            <span class="font-medium">${warehouse.usage_rate}%</span>
                        </div>
                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full bg-primary rounded-full" style="width: ${warehouse.usage_rate}%"></div>
                        </div>
                        <p class="text-xs text-gray-dark mt-1">${warehouse.current_usage} / ${warehouse.capacity}</p>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        console.log('✅ 仓库数据已更新', warehouses.length, '个');
    },
};

// 供应商控制器
const SupplierController = {
    async loadData() {
        try {
            Utils.showLoading();
            
            const data = await API.suppliers.list();
            this.renderSuppliers(data.data);
            
            Utils.hideLoading();
        } catch (error) {
            Utils.hideLoading();
            Utils.showError('加载供应商数据失败: ' + error.message);
        }
    },
    
    renderSuppliers(data) {
        const tbody = document.getElementById('supplier-table-body');
        if (!tbody) return;
        
        const suppliers = data.results || data;
        
        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-dark">暂无供应商数据</td></tr>';
            return;
        }
        
        const html = suppliers.map(supplier => `
            <tr class="border-b border-gray-light hover:bg-light/50 transition-colors">
                <td class="py-3 px-4 font-medium">${supplier.name}</td>
                <td class="py-3 px-4 text-sm text-gray-dark">${supplier.code}</td>
                <td class="py-3 px-4 text-sm">${supplier.contact}</td>
                <td class="py-3 px-4 text-sm">${supplier.phone}</td>
                <td class="py-3 px-4 text-sm">${supplier.email || '-'}</td>
                <td class="py-3 px-4 text-sm">${supplier.item_count || 0}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                        ${supplier.status_display}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <button class="text-primary hover:text-primary/80 text-sm">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
        console.log('✅ 供应商数据已更新', suppliers.length, '个');
    },
};

// 通知管理
const NotificationManager = {
    notifications: [],
    readNotifications: new Set(), // 存储已读通知的ID
    
    init() {
        // 从localStorage加载已读通知ID
        const savedReadIds = localStorage.getItem('read_notifications');
        if (savedReadIds) {
            try {
                this.readNotifications = new Set(JSON.parse(savedReadIds));
            } catch (e) {
                console.error('加载已读通知失败:', e);
            }
        }
        
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
            
            // 如果没有通知，显示默认消息
            if (this.notifications.length === 0) {
                console.log('暂无通知');
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
        
        console.log('✅ 所有通知已标记为已读');
    },
    
    saveReadNotifications() {
        try {
            localStorage.setItem('read_notifications', JSON.stringify([...this.readNotifications]));
        } catch (e) {
            console.error('保存已读通知失败:', e);
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
            // 更新用户名
            const userName = document.getElementById('user-name');
            if (userName) userName.textContent = userInfo.username || '用户';
            
            // 更新邮箱
            const userEmail = document.getElementById('user-email');
            if (userEmail) userEmail.textContent = userInfo.email || '';
            
            // 更新头像缩写
            const userInitials = document.getElementById('user-initials');
            if (userInitials) {
                const name = userInfo.username || 'User';
                userInitials.textContent = name.substring(0, 2).toUpperCase();
            }
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
    console.log('🚀 初始化应用...');
    
    // 检查登录状态
    const token = API.TokenManager.getToken();
    if (token) {
        console.log('✅ 已登录，Token存在');
    } else {
        console.log('ℹ️ 未登录，使用匿名访问模式');
    }
    
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
    
    console.log('✅ 应用初始化完成');
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

// 导出到全局
window.App = {
    PageManager,
    DashboardController,
    ItemsController,
    InboundController,
    OutboundController,
    WarehouseController,
    SupplierController,
    Utils,
};

console.log('✅ 应用脚本已加载');
