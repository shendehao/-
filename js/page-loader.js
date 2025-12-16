// 页面加载器 - 用于动态加载templates目录下的页面
(function() {
  'use strict';

  const PageLoader = {
    // 页面配置
    pages: {
      'dashboard': { file: 'dashboard.html', nav: 0, loader: 'initDashboard' },
      'items': { file: 'items.html', nav: 1, loader: 'loadItemsPage' },
      'inbound': { file: 'inbound.html', nav: 2, loader: 'loadInboundPage' },
      'outbound': { file: 'outbound.html', nav: 3, loader: 'loadOutboundPage' },
      'transfer': { file: 'transfer.html', nav: 4, loader: 'loadTransferPage' },
      'warehouse': { file: 'warehouse.html', nav: 5, loader: null },
      'supplier': { file: 'supplier.html', nav: 6, loader: null },
      'reports': { file: 'reports.html', nav: 7, loader: null },
      'settings': { file: 'settings.html', nav: 8, loader: null }
    },

    currentPage: 'dashboard',
    contentContainer: null,
    loadingHTML: '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-3xl text-primary"></i><p class="mt-4 text-gray-dark">加载中...</p></div>',

    // 初始化
    init() {
      this.contentContainer = document.getElementById('page-content');
      if (!this.contentContainer) {
        console.error('未找到页面内容容器 #page-content');
        return;
      }

      // 绑定导航点击事件
      this.bindNavigation();

      // 加载默认页面
      this.loadPage('dashboard');
    },

    // 绑定导航事件
    bindNavigation() {
      const navLinks = document.querySelectorAll('aside nav a');
      const pageNames = Object.keys(this.pages);

      navLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const pageName = pageNames[index];
          if (pageName) {
            this.loadPage(pageName);
          }
        });
      });
    },

    // 加载页面
    async loadPage(pageName) {
      if (!this.pages[pageName]) {
        console.error(`页面 ${pageName} 不存在`);
        return;
      }

      // 显示加载状态
      this.contentContainer.innerHTML = this.loadingHTML;

      // 更新导航高亮
      this.updateNavigation(pageName);

      try {
        // 加载HTML文件
        const response = await fetch(`templates/${this.pages[pageName].file}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        this.contentContainer.innerHTML = html;

        // 保存当前页面
        this.currentPage = pageName;

        // 执行页面特定的初始化函数
        const loader = this.pages[pageName].loader;
        if (loader && typeof window[loader] === 'function') {
          // 等待DOM渲染完成
          setTimeout(() => {
            window[loader]();
          }, 50);
        }

        // 如果是仪表盘页面，初始化图表
        if (pageName === 'dashboard') {
          setTimeout(() => {
            if (window.initDashboardCharts) {
              window.initDashboardCharts();
            }
          }, 100);
        }

        console.log(`页面 ${pageName} 加载成功`);
      } catch (error) {
        console.error(`加载页面 ${pageName} 失败:`, error);
        this.contentContainer.innerHTML = `
          <div class="text-center py-12">
            <i class="fas fa-exclamation-triangle text-3xl text-danger mb-4"></i>
            <p class="text-gray-dark">页面加载失败</p>
            <button onclick="PageLoader.loadPage('${pageName}')" class="mt-4 px-4 py-2 bg-primary text-white rounded-apple-sm">
              重新加载
            </button>
          </div>
        `;
      }
    },

    // 更新导航高亮
    updateNavigation(pageName) {
      const navLinks = document.querySelectorAll('aside nav a');
      const pageConfig = this.pages[pageName];

      navLinks.forEach((link, index) => {
        if (index === pageConfig.nav) {
          link.classList.remove('text-gray-dark', 'hover:bg-light');
          link.classList.add('bg-primary/10', 'text-primary');
        } else {
          link.classList.remove('bg-primary/10', 'text-primary');
          link.classList.add('text-gray-dark', 'hover:bg-light');
        }
      });
    },

    // 重新加载当前页面
    reload() {
      this.loadPage(this.currentPage);
    }
  };

  // 将PageLoader暴露到全局
  window.PageLoader = PageLoader;

  // 页面加载完成后自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PageLoader.init());
  } else {
    PageLoader.init();
  }
})();
