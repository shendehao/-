// UI事件处理器
(function() {
  'use strict';

  // 模态框管理
  const ModalManager = {
    modal: null,
    modalContent: null,

    init() {
      this.modal = document.getElementById('add-item-modal');
      this.modalContent = document.getElementById('modal-content');

      if (!this.modal || !this.modalContent) {
        console.warn('模态框元素未找到');
        return;
      }

      // 绑定打开按钮事件（使用事件委托）
      document.addEventListener('click', (e) => {
        if (e.target.id === 'add-item-btn' || e.target.closest('#add-item-btn')) {
          this.open();
        }
      });

      // 绑定关闭按钮
      const closeBtn = document.getElementById('close-modal');
      const cancelBtn = document.getElementById('cancel-add-item');

      if (closeBtn) closeBtn.addEventListener('click', () => this.close());
      if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());

      // 点击外部关闭
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });

      // ESC键关闭
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
          this.close();
        }
      });
    },

    open() {
      if (!this.modal) return;
      
      this.modal.classList.remove('hidden');
      setTimeout(() => {
        this.modalContent.classList.remove('scale-95', 'opacity-0');
        this.modalContent.classList.add('scale-100', 'opacity-100');
      }, 10);
      document.body.style.overflow = 'hidden';
    },

    close() {
      if (!this.modal) return;

      this.modalContent.classList.remove('scale-100', 'opacity-100');
      this.modalContent.classList.add('scale-95', 'opacity-0');
      setTimeout(() => {
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
      }, 300);
    }
  };

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ModalManager.init();
      console.log('UI处理器已初始化');
    });
  } else {
    ModalManager.init();
    console.log('UI处理器已初始化');
  }

  // 暴露到全局
  window.ModalManager = ModalManager;
})();
