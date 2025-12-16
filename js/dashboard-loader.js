// 仪表盘数据加载器
(function() {
  'use strict';

  // API配置
  const API_BASE_URL = 'http://localhost:8000/api';
  const USE_MOCK_DATA = true; // 设置为false时使用真实API

  // 获取Token
  function getToken() {
    return localStorage.getItem('auth_token') || localStorage.getItem('access_token') || '';
  }

  // API请求封装
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    try {
      console.log(`📡 请求API: ${endpoint}`);
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ API响应:`, data);
      return data;
    } catch (error) {
      console.warn(`⚠️ API请求失败，使用模拟数据: ${error.message}`);
      return getMockData(endpoint);
    }
  }

  // 模拟数据
  function getMockData(endpoint) {
    const mockDataMap = {
      '/dashboard/stats/': {
        success: true,
        data: {
          total_items: { count: 1284, change_percent: 12, trend: 'up' },
          low_stock_items: { count: 36, change_percent: 8, trend: 'up' },
          total_value: { amount: 286450.00, change_percent: 5, trend: 'up' },
          turnover_rate: { rate: 12.8, change_percent: -2, trend: 'down' }
        }
      },
      '/dashboard/trend/': {
        success: true,
        data: {
          labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
          datasets: [
            {
              label: '入库',
              data: [120, 190, 130, 240, 180, 210],
              color: '#34C759'
            },
            {
              label: '出库',
              data: [90, 160, 110, 200, 150, 180],
              color: '#FF3B30'
            }
          ]
        }
      },
      '/dashboard/categories/': {
        success: true,
        data: [
          { name: '电子设备', value: 450, color: '#007AFF' },
          { name: '办公用品', value: 320, color: '#5AC8FA' },
          { name: '包装材料', value: 280, color: '#34C759' },
          { name: '其他', value: 234, color: '#FF9500' }
        ]
      },
      '/dashboard/activities/': {
        success: true,
        data: [
          {
            id: 1,
            type: 'inbound',
            item_name: '笔记本电脑包',
            quantity: 50,
            operator: '王芳',
            time: '2小时前'
          },
          {
            id: 2,
            type: 'outbound',
            item_name: '无线鼠标',
            quantity: 30,
            operator: '李明',
            time: '4小时前'
          },
          {
            id: 3,
            type: 'transfer',
            item_name: '机械键盘',
            quantity: 20,
            operator: '张伟',
            time: '6小时前'
          }
        ]
      },
      '/dashboard/low-stock/': {
        success: true,
        data: [
          {
            id: 1,
            name: 'USB数据线',
            code: 'USB-100',
            stock: 8,
            min_stock: 20,
            warehouse: '主仓库'
          },
          {
            id: 2,
            name: '鼠标垫',
            code: 'MP-200',
            stock: 12,
            min_stock: 30,
            warehouse: '主仓库'
          },
          {
            id: 3,
            name: '键盘膜',
            code: 'KF-150',
            stock: 5,
            min_stock: 15,
            warehouse: '副仓库'
          }
        ]
      }
    };

    return mockDataMap[endpoint] || { success: false, error: '未找到模拟数据' };
  }

  // 更新统计卡片
  async function updateStatsCards() {
    try {
      const response = USE_MOCK_DATA 
        ? getMockData('/dashboard/stats/')
        : await apiRequest('/dashboard/stats/');
      
      if (!response.success) {
        throw new Error('获取统计数据失败');
      }

      const stats = response.data;

      // 更新总物品数
      const totalItemsEl = document.getElementById('total-items-count');
      const totalItemsChangeEl = document.getElementById('total-items-change');
      if (totalItemsEl) {
        totalItemsEl.textContent = stats.total_items.count.toLocaleString();
        totalItemsChangeEl.textContent = `${stats.total_items.change_percent}%`;
      }

      // 更新低库存
      const lowStockEl = document.getElementById('low-stock-count');
      const lowStockChangeEl = document.getElementById('low-stock-change');
      if (lowStockEl) {
        lowStockEl.textContent = stats.low_stock_items.count.toLocaleString();
        lowStockChangeEl.textContent = `${stats.low_stock_items.change_percent}%`;
      }

      // 更新库存价值
      const totalValueEl = document.getElementById('total-value');
      const totalValueChangeEl = document.getElementById('total-value-change');
      if (totalValueEl) {
        totalValueEl.textContent = `￥${stats.total_value.amount.toLocaleString()}`;
        totalValueChangeEl.textContent = `${stats.total_value.change_percent}%`;
      }

      // 更新周转率
      const turnoverRateEl = document.getElementById('turnover-rate');
      const turnoverRateChangeEl = document.getElementById('turnover-rate-change');
      if (turnoverRateEl) {
        turnoverRateEl.textContent = `${stats.turnover_rate.rate}%`;
        turnoverRateChangeEl.textContent = `${Math.abs(stats.turnover_rate.change_percent)}%`;
      }

      console.log('✅ 统计卡片更新成功');
    } catch (error) {
      console.error('❌ 更新统计卡片失败:', error);
    }
  }

  // 初始化库存趋势图表
  async function initTrendChart() {
    const chartDom = document.getElementById('trend-chart');
    if (!chartDom || !window.echarts) {
      console.warn('⚠️ 图表容器或ECharts未找到');
      return;
    }

    try {
      const response = USE_MOCK_DATA 
        ? getMockData('/dashboard/trend/')
        : await apiRequest('/dashboard/trend/');
      
      if (!response.success) {
        throw new Error('获取趋势数据失败');
      }

      const trendData = response.data;
      const chart = echarts.init(chartDom);
      
      const option = {
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: trendData.datasets.map(d => d.label),
          bottom: 0,
          textStyle: {
            color: '#8E8E93'
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: trendData.labels,
          axisLine: {
            lineStyle: {
              color: '#E5E5EA'
            }
          },
          axisLabel: {
            color: '#8E8E93'
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            show: false
          },
          axisLabel: {
            color: '#8E8E93'
          },
          splitLine: {
            lineStyle: {
              color: '#F5F7FA'
            }
          }
        },
        series: trendData.datasets.map(dataset => ({
          name: dataset.label,
          type: 'line',
          smooth: true,
          data: dataset.data,
          lineStyle: {
            color: dataset.color,
            width: 2
          },
          itemStyle: {
            color: dataset.color
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: dataset.color + '40' },
                { offset: 1, color: dataset.color + '00' }
              ]
            }
          }
        }))
      };

      chart.setOption(option);
      console.log('✅ 趋势图表初始化成功');
      
      // 响应式调整
      window.addEventListener('resize', () => chart.resize());
    } catch (error) {
      console.error('❌ 初始化趋势图表失败:', error);
    }
  }

  // 初始化类别分布图表
  async function initCategoryChart() {
    const chartDom = document.getElementById('category-chart');
    if (!chartDom || !window.echarts) {
      console.warn('⚠️ 图表容器或ECharts未找到');
      return;
    }

    try {
      const response = USE_MOCK_DATA 
        ? getMockData('/dashboard/categories/')
        : await apiRequest('/dashboard/categories/');
      
      if (!response.success) {
        throw new Error('获取类别数据失败');
      }

      const categoryData = response.data;
      const chart = echarts.init(chartDom);
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: '10%',
          top: 'center',
          textStyle: {
            color: '#8E8E93'
          }
        },
        series: [
          {
            name: '类别分布',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            data: categoryData.map(item => ({
              value: item.value,
              name: item.name,
              itemStyle: {
                color: item.color
              }
            }))
          }
        ]
      };

      chart.setOption(option);
      console.log('✅ 类别图表初始化成功');
      
      // 响应式调整
      window.addEventListener('resize', () => chart.resize());
    } catch (error) {
      console.error('❌ 初始化类别图表失败:', error);
    }
  }

  // 加载最近活动
  async function loadRecentActivities() {
    const container = document.getElementById('recent-activities');
    if (!container) {
      console.warn('⚠️ 活动容器未找到');
      return;
    }

    try {
      const response = USE_MOCK_DATA 
        ? getMockData('/dashboard/activities/')
        : await apiRequest('/dashboard/activities/');
      
      if (!response.success) {
        throw new Error('获取活动数据失败');
      }

      const activities = response.data;
      
      const activityTypeMap = {
        'inbound': { icon: 'fa-shopping-cart', color: 'success', text: '入库' },
        'outbound': { icon: 'fa-shipping-fast', color: 'danger', text: '出库' },
        'transfer': { icon: 'fa-exchange-alt', color: 'info', text: '调拨' }
      };

      container.innerHTML = activities.map(activity => {
        const typeInfo = activityTypeMap[activity.type] || activityTypeMap['inbound'];
        return `
          <div class="flex items-start space-x-3 p-3 hover:bg-light/50 rounded-apple-sm transition-colors">
            <div class="w-10 h-10 rounded-full bg-${typeInfo.color}/10 flex items-center justify-center flex-shrink-0">
              <i class="fas ${typeInfo.icon} text-${typeInfo.color}"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm">${activity.item_name}</p>
              <p class="text-xs text-gray-dark mt-1">
                ${typeInfo.text} ${activity.quantity} 件 · ${activity.operator}
              </p>
            </div>
            <span class="text-xs text-gray-dark flex-shrink-0">${activity.time}</span>
          </div>
        `;
      }).join('');

      console.log('✅ 最近活动加载成功');
    } catch (error) {
      console.error('❌ 加载最近活动失败:', error);
      container.innerHTML = '<p class="text-center text-gray-dark py-4">暂无活动记录</p>';
    }
  }

  // 加载低库存物品
  async function loadLowStockItems() {
    const container = document.getElementById('low-stock-items');
    if (!container) {
      console.warn('⚠️ 低库存容器未找到');
      return;
    }

    try {
      const response = USE_MOCK_DATA 
        ? getMockData('/dashboard/low-stock/')
        : await apiRequest('/dashboard/low-stock/');
      
      if (!response.success) {
        throw new Error('获取低库存数据失败');
      }

      const items = response.data;

      container.innerHTML = items.map(item => {
        const percentage = (item.stock / item.min_stock * 100).toFixed(0);
        return `
          <div class="flex items-center justify-between p-3 hover:bg-light/50 rounded-apple-sm transition-colors">
            <div class="flex items-center space-x-3 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-apple-sm bg-danger/10 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-box text-danger"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm truncate">${item.name}</p>
                <p class="text-xs text-gray-dark">${item.code} · ${item.warehouse}</p>
              </div>
            </div>
            <div class="text-right flex-shrink-0 ml-3">
              <p class="text-sm font-medium text-danger">${item.stock}</p>
              <p class="text-xs text-gray-dark">最低 ${item.min_stock}</p>
            </div>
          </div>
        `;
      }).join('');

      console.log('✅ 低库存物品加载成功');
    } catch (error) {
      console.error('❌ 加载低库存物品失败:', error);
      container.innerHTML = '<p class="text-center text-gray-dark py-4">暂无低库存物品</p>';
    }
  }

  // 初始化仪表盘
  async function initDashboard() {
    console.log('🚀 开始初始化仪表盘...');
    console.log(`📊 数据模式: ${USE_MOCK_DATA ? '模拟数据' : '真实API'}`);
    
    // 并行加载所有数据
    await Promise.all([
      updateStatsCards(),
      initTrendChart(),
      initCategoryChart(),
      loadRecentActivities(),
      loadLowStockItems()
    ]);
    
    console.log('✅ 仪表盘初始化完成！');
  }

  // 导出到全局
  window.DashboardLoader = {
    init: initDashboard,
    updateStats: updateStatsCards,
    loadActivities: loadRecentActivities,
    loadLowStock: loadLowStockItems
  };

  // 自动初始化（如果页面已加载）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }

})();
