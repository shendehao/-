/**
 * 扫码入库功能模块
 * 包含二维码生成、摄像头扫描和快速入库功能
 */

// ============================================
// QRCodeManager - 二维码管理器
// ============================================
const QRCodeManager = {
    instances: {},  // 存储QRCode实例

    /**
     * 生成二维码并显示在指定元素中
     * @param {string} elementId - 容器元素ID
     * @param {string} code - 物品编码
     * @param {object} options - 配置选项
     */
    generate(elementId, code, options = {}) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element ${elementId} not found`);
            return null;
        }

        // 清除已有的二维码
        element.innerHTML = '';
        
        const defaultOptions = {
            text: code,
            width: options.width || 200,
            height: options.height || 200,
            colorDark: options.colorDark || '#000000',
            colorLight: options.colorLight || '#ffffff',
            correctLevel: QRCode.CorrectLevel.H  // 最高容错级别，更容易扫描
        };

        try {
            const qrcode = new QRCode(element, defaultOptions);
            this.instances[elementId] = qrcode;
            return qrcode;
        } catch (error) {
            console.error('Failed to generate QR code:', error);
            return null;
        }
    },

    /**
     * 下载二维码为PNG图片（带白色边距）
     * @param {string} elementId - 二维码容器元素ID
     * @param {string} filename - 文件名
     */
    download(elementId, filename) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element ${elementId} not found`);
            return;
        }

        const canvas = element.querySelector('canvas');
        const img = element.querySelector('img');
        
        let sourceCanvas;
        if (canvas) {
            sourceCanvas = canvas;
        } else if (img) {
            // 如果是img元素，需要转换为canvas
            sourceCanvas = document.createElement('canvas');
            sourceCanvas.width = img.width;
            sourceCanvas.height = img.height;
            const ctx = sourceCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
        } else {
            console.error('No QR code image found');
            return;
        }

        // 创建带白色边距的新canvas（边距为二维码尺寸的20%）
        const margin = Math.floor(sourceCanvas.width * 0.2);
        const newCanvas = document.createElement('canvas');
        newCanvas.width = sourceCanvas.width + margin * 2;
        newCanvas.height = sourceCanvas.height + margin * 2;
        
        const ctx = newCanvas.getContext('2d');
        // 填充白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        // 绘制二维码到中心
        ctx.drawImage(sourceCanvas, margin, margin);
        
        const dataUrl = newCanvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.download = filename || 'qrcode.png';
        link.href = dataUrl;
        link.click();
    },

    /**
     * 打印物品标签
     * @param {object} item - 物品信息
     */
    printLabel(item) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('无法打开打印窗口，请检查浏览器弹窗设置', 'error');
            return;
        }

        // 创建临时canvas生成二维码
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        
        const qrcode = new QRCode(tempDiv, {
            text: item.code,
            width: 200,
            height: 200,
            correctLevel: QRCode.CorrectLevel.M
        });

        // 等待二维码生成完成
        setTimeout(() => {
            const canvas = tempDiv.querySelector('canvas');
            const img = tempDiv.querySelector('img');
            let qrDataUrl = '';
            
            if (canvas) {
                qrDataUrl = canvas.toDataURL('image/png');
            } else if (img) {
                qrDataUrl = img.src;
            }

            // 清理临时元素
            document.body.removeChild(tempDiv);

            // 生成打印内容
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>物品标签 - ${item.code}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                            box-sizing: border-box;
                        }
                        .label {
                            border: 2px solid #000;
                            padding: 20px;
                            text-align: center;
                            max-width: 300px;
                        }
                        .qrcode {
                            margin: 10px auto;
                        }
                        .qrcode img {
                            width: 150px;
                            height: 150px;
                        }
                        .item-code {
                            font-size: 14px;
                            font-weight: bold;
                            margin: 10px 0;
                            word-break: break-all;
                        }
                        .item-name {
                            font-size: 16px;
                            margin: 10px 0;
                        }
                        @media print {
                            body { margin: 0; padding: 10px; }
                            .label { border-width: 1px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <div class="item-name">${item.name}</div>
                        <div class="qrcode">
                            <img src="${qrDataUrl}" alt="QR Code">
                        </div>
                        <div class="item-code">${item.code}</div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }, 100);
    }
};


// ============================================
// CameraScannerManager - 摄像头扫描管理器
// ============================================
const CameraScannerManager = {
    scanner: null,
    isScanning: false,
    modalElement: null,

    /**
     * 打开摄像头扫描模态框
     */
    async open() {
        // 先清理之前的扫描器实例
        if (this.scanner) {
            try {
                await this.scanner.stop();
            } catch (e) {
                console.log('停止旧扫描器:', e.message);
            }
            try {
                this.scanner.clear();
            } catch (e) {
                console.log('清理旧扫描器:', e.message);
            }
            this.scanner = null;
        }
        this.isScanning = false;
        
        // 清理摄像头预览区域
        const previewElement = document.getElementById('camera-preview');
        if (previewElement) {
            previewElement.innerHTML = '';
        }
        
        // 显示扫描模态框
        this.modalElement = document.getElementById('camera-scan-modal');
        if (!this.modalElement) {
            console.error('Camera scan modal not found');
            return;
        }

        this.modalElement.classList.remove('hidden');
        this.modalElement.classList.add('active');
        this.modalElement.style.display = 'flex';  // 强制显示
        
        // 调整扫描模态框的底部padding，为底部导航留出空间
        const bottomNav = document.getElementById('mobile-bottom-nav');
        if (bottomNav && window.innerWidth <= 767) {
            // 移动端：保持底部导航可见，调整扫描页面
            this.modalElement.style.paddingBottom = '80px';
            bottomNav.style.display = 'flex';
            // 绑定导航点击事件，点击时关闭扫描
            this.bindNavCloseEvents();
        }

        // 初始化扫描器
        try {
            this.scanner = new Html5Qrcode('camera-preview');
            
            // 获取预览区域尺寸来设置扫描框
            const previewElement = document.getElementById('camera-preview');
            const previewWidth = previewElement?.offsetWidth || 300;
            const qrboxSize = Math.min(previewWidth * 0.7, 250);
            
            const config = {
                fps: 10,
                qrbox: { width: qrboxSize, height: qrboxSize },
                aspectRatio: 1.0  // 正方形预览
            };

            await this.scanner.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => this.onScanSuccess(decodedText),
                (error) => this.onScanError(error)
            );

            this.isScanning = true;
            this.updateStatus('对准二维码自动识别');
        } catch (error) {
            console.error('Failed to start camera:', error);
            this.handleCameraError(error);
        }
    },
    
    /**
     * 绑定底部导航点击事件，点击时关闭扫描
     */
    bindNavCloseEvents() {
        const navItems = document.querySelectorAll('#mobile-bottom-nav .nav-item[data-page]');
        navItems.forEach(item => {
            // 移除旧的监听器（如果有）
            item.removeEventListener('click', this.handleNavClick);
            // 添加新的监听器
            item.addEventListener('click', this.handleNavClick);
        });
    },
    
    /**
     * 处理导航点击 - 关闭扫描页面
     */
    handleNavClick: function(e) {
        // 如果扫描页面是打开的，先关闭它
        const scanModal = document.getElementById('camera-scan-modal');
        if (scanModal && !scanModal.classList.contains('hidden')) {
            CameraScannerManager.close();
        }
    },

    /**
     * 关闭扫描并释放摄像头
     */
    async close() {
        // 先标记为不在扫描
        this.isScanning = false;
        
        if (this.scanner) {
            try {
                // 先停止扫描
                await this.scanner.stop();
            } catch (error) {
                console.log('停止扫描器:', error.message);
            }
            
            try {
                // 停止后再清理
                this.scanner.clear();
            } catch (error) {
                console.log('清理扫描器:', error.message);
            }
            
            this.scanner = null;
        }

        // 清理摄像头预览区域
        const previewElement = document.getElementById('camera-preview');
        if (previewElement) {
            previewElement.innerHTML = '';
        }

        // 始终通过ID获取模态框元素，确保能正确隐藏
        const modal = this.modalElement || document.getElementById('camera-scan-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('active');
            modal.style.display = 'none';  // 强制隐藏
            modal.style.paddingBottom = '';  // 恢复padding
        }
        this.modalElement = null;
        
        // 恢复底部导航（如果存在）
        const bottomNav = document.getElementById('mobile-bottom-nav');
        if (bottomNav) {
            // 检查是否是移动端
            if (window.innerWidth <= 767) {
                bottomNav.style.display = 'flex';
            }
        }
    },

    /**
     * 处理扫描成功
     * @param {string} decodedText - 解码后的文本
     */
    async onScanSuccess(decodedText) {
        if (!this.isScanning) return;

        // 暂停扫描，防止重复触发
        this.isScanning = false;
        this.updateStatus('正在查询物品...');

        try {
            // 获取token
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }
            
            // 先尝试用code查询
            let response = await fetch(`/api/inventory/items/?code=${encodeURIComponent(decodedText)}`, { headers });
            let data = await response.json();
            let results = data.data?.results || data.results || [];
            
            // 如果code没找到，尝试用barcode查询
            if (results.length === 0) {
                console.log('code未找到，尝试barcode查询:', decodedText);
                response = await fetch(`/api/inventory/items/?barcode=${encodeURIComponent(decodedText)}`, { headers });
                data = await response.json();
                results = data.data?.results || data.results || [];
            }
            
            // 如果还没找到，尝试用search模糊搜索
            if (results.length === 0) {
                console.log('barcode未找到，尝试search查询:', decodedText);
                response = await fetch(`/api/inventory/items/?search=${encodeURIComponent(decodedText)}`, { headers });
                data = await response.json();
                results = data.data?.results || data.results || [];
            }
            
            console.log('扫描查询结果:', results);
            
            if (results.length > 0) {
                const item = results[0];
                // 关闭摄像头，显示快速入库弹窗
                await this.close();
                QuickInboundManager.show(item);
            } else {
                // 物品未找到，继续扫描
                this.updateStatus('物品未找到，请重新扫描', 'error');
                showToast('物品未找到: ' + decodedText, 'error');
                this.isScanning = true;
            }
        } catch (error) {
            console.error('Error querying item:', error);
            this.updateStatus('查询失败，请重试', 'error');
            showToast('网络错误，请重试', 'error');
            this.isScanning = true;
        }
    },

    /**
     * 处理扫描错误（通常是未检测到二维码，可忽略）
     * @param {string} error - 错误信息
     */
    onScanError(error) {
        // 大多数错误是"未检测到二维码"，可以忽略
        // console.log('Scan error:', error);
    },

    /**
     * 处理摄像头错误
     * @param {Error} error - 错误对象
     */
    handleCameraError(error) {
        let message = '无法访问摄像头';
        
        if (error.name === 'NotAllowedError') {
            message = '摄像头权限被拒绝。请在浏览器设置中允许访问摄像头。';
        } else if (error.name === 'NotFoundError') {
            message = '未检测到摄像头设备。';
        } else if (error.name === 'NotReadableError') {
            message = '摄像头被其他应用占用，请关闭其他使用摄像头的应用。';
        }

        this.updateStatus(message, 'error');
        showToast(message, 'error');
    },

    /**
     * 更新状态提示
     * @param {string} message - 提示信息
     * @param {string} type - 类型 (normal/error)
     */
    updateStatus(message, type = 'normal') {
        const statusElement = document.getElementById('camera-scan-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = type === 'error' ? 'text-danger mt-4' : 'text-gray-dark mt-4';
        }
    }
};

// ============================================
// QuickInboundManager - 快速入库管理器
// ============================================
const QuickInboundManager = {
    currentItem: null,
    modalElement: null,

    /**
     * 显示快速入库弹窗
     * @param {object} item - 物品信息
     */
    show(item) {
        this.currentItem = item;
        this.modalElement = document.getElementById('quick-inbound-modal');
        
        if (!this.modalElement) {
            console.error('Quick inbound modal not found');
            return;
        }

        // 填充物品信息
        const imageContainer = document.getElementById('quick-inbound-image-container');
        const nameElement = document.getElementById('quick-inbound-item-name');
        const codeElement = document.getElementById('quick-inbound-item-code');
        const stockElement = document.getElementById('quick-inbound-item-stock');
        const quantityInput = document.getElementById('quick-inbound-quantity');
        const notesInput = document.getElementById('quick-inbound-notes');

        // 处理图片显示
        if (imageContainer) {
            const firstChar = (item.name || '?').charAt(0).toUpperCase();
            // 使用Utils.getImageUrl处理图片URL（如果存在）
            let imageUrl = item.image || '';
            if (imageUrl && typeof Utils !== 'undefined' && Utils.getImageUrl) {
                imageUrl = Utils.getImageUrl(imageUrl);
            } else if (imageUrl) {
                // 备用处理：确保以/开头
                if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                    try {
                        const url = new URL(imageUrl);
                        imageUrl = url.pathname;
                    } catch (e) {}
                } else if (!imageUrl.startsWith('/')) {
                    imageUrl = '/' + imageUrl;
                }
            }
            
            if (imageUrl) {
                // 有图片时显示图片，加载失败显示占位符
                imageContainer.innerHTML = `
                    <img src="${imageUrl}" alt="${item.name}" 
                         class="w-20 h-20 rounded-apple object-cover" 
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
                    <div class="w-20 h-20 rounded-apple bg-primary/10 items-center justify-center text-primary text-2xl font-bold hidden">${firstChar}</div>
                `;
            } else {
                // 没有图片时显示首字母占位符
                imageContainer.innerHTML = `
                    <div class="w-20 h-20 rounded-apple bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">${firstChar}</div>
                `;
            }
        }
        
        if (nameElement) nameElement.textContent = item.name;
        if (codeElement) codeElement.textContent = item.code;
        if (stockElement) stockElement.textContent = item.stock + ' 件';
        if (quantityInput) {
            quantityInput.value = '';
        }
        if (notesInput) notesInput.value = '';

        // 清除错误状态
        this.clearError();

        // 加载仓库和供应商选项
        this.loadWarehouseOptions(item.warehouse);
        this.loadSupplierOptions(item.supplier);
        
        // 绑定仓库容量验证
        this.bindCapacityValidation();

        // 显示弹窗
        this.modalElement.classList.remove('hidden');
        this.modalElement.style.display = 'flex';  // 强制显示
        
        // 延迟聚焦，确保弹窗已显示
        setTimeout(() => {
            if (quantityInput) quantityInput.focus();
        }, 100);
    },
    
    /**
     * 加载仓库选项
     */
    async loadWarehouseOptions(selectedId) {
        const select = document.getElementById('quick-inbound-warehouse');
        if (!select) return;
        
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;
            
            const response = await fetch('/api/warehouses/?page_size=100', { headers });
            const data = await response.json();
            const warehouses = data.data?.results || data.results || [];
            
            select.innerHTML = '<option value="">请选择仓库</option>';
            warehouses.filter(w => w.is_active !== false).forEach(w => {
                const capacity = w.capacity || 0;
                const usage = w.current_usage || 0;
                const available = capacity - usage;
                const usageInfo = capacity > 0 ? ` (可用: ${available}/${capacity})` : '';
                const option = document.createElement('option');
                option.value = w.id;
                option.textContent = `${w.name}${usageInfo}`;
                option.dataset.capacity = capacity;
                option.dataset.currentUsage = usage;
                if (w.id == selectedId) option.selected = true;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('加载仓库失败:', error);
        }
    },
    
    /**
     * 加载供应商选项
     */
    async loadSupplierOptions(selectedId) {
        const select = document.getElementById('quick-inbound-supplier');
        if (!select) return;
        
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;
            
            const response = await fetch('/api/suppliers/?page_size=100', { headers });
            const data = await response.json();
            const suppliers = data.data?.results || data.results || [];
            
            select.innerHTML = '<option value="">请选择供应商</option>';
            suppliers.filter(s => s.status === 'active').forEach(s => {
                const option = document.createElement('option');
                option.value = s.id;
                option.textContent = s.name;
                if (s.id == selectedId) option.selected = true;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('加载供应商失败:', error);
        }
    },
    
    /**
     * 绑定仓库容量验证
     */
    bindCapacityValidation() {
        const warehouseSelect = document.getElementById('quick-inbound-warehouse');
        const quantityInput = document.getElementById('quick-inbound-quantity');
        const hint = document.getElementById('quick-inbound-warehouse-hint');
        
        const validate = () => {
            if (!warehouseSelect || !quantityInput || !hint) return;
            
            const selectedOption = warehouseSelect.options[warehouseSelect.selectedIndex];
            if (!selectedOption || !selectedOption.value) {
                hint.textContent = '';
                return;
            }
            
            const capacity = parseInt(selectedOption.dataset.capacity) || 0;
            const usage = parseInt(selectedOption.dataset.currentUsage) || 0;
            const available = capacity - usage;
            const quantity = parseInt(quantityInput.value) || 0;
            
            if (capacity > 0) {
                if (quantity > available) {
                    hint.textContent = `⚠️ 容量不足！可用: ${available}，需要: ${quantity}`;
                    hint.className = 'text-xs text-danger mt-1';
                } else {
                    hint.textContent = `可用容量: ${available}`;
                    hint.className = 'text-xs text-gray-dark mt-1';
                }
            } else {
                hint.textContent = '';
            }
        };
        
        warehouseSelect?.addEventListener('change', validate);
        quantityInput?.addEventListener('input', validate);
    },

    /**
     * 关闭弹窗
     */
    close() {
        this.currentItem = null;
        
        // 获取模态框元素（每次都重新获取，确保正确）
        const modal = document.getElementById('quick-inbound-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';  // 强制隐藏
        }
        
        // 清理弹窗内容，避免下次打开时显示旧数据
        const imageContainer = document.getElementById('quick-inbound-image-container');
        const nameElement = document.getElementById('quick-inbound-item-name');
        const codeElement = document.getElementById('quick-inbound-item-code');
        const stockElement = document.getElementById('quick-inbound-item-stock');
        const quantityInput = document.getElementById('quick-inbound-quantity');
        const notesInput = document.getElementById('quick-inbound-notes');
        
        if (imageContainer) imageContainer.innerHTML = '';
        if (nameElement) nameElement.textContent = '';
        if (codeElement) codeElement.textContent = '';
        if (stockElement) stockElement.textContent = '';
        if (quantityInput) quantityInput.value = '';
        if (notesInput) notesInput.value = '';
        
        this.modalElement = null;
    },

    /**
     * 验证数量
     * @param {number} quantity - 入库数量
     * @returns {boolean} 是否有效
     */
    validateQuantity(quantity) {
        if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
            this.showError('请输入有效的入库数量（大于0的整数）');
            return false;
        }
        return true;
    },

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
     */
    showError(message) {
        const errorElement = document.getElementById('quick-inbound-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    },

    /**
     * 清除错误信息
     */
    clearError() {
        const errorElement = document.getElementById('quick-inbound-error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.add('hidden');
        }
    },

    /**
     * 执行入库操作
     */
    async submitInbound() {
        if (!this.currentItem) {
            showToast('物品信息丢失，请重新扫描', 'error');
            return;
        }

        const quantityInput = document.getElementById('quick-inbound-quantity');
        const notesInput = document.getElementById('quick-inbound-notes');
        const warehouseSelect = document.getElementById('quick-inbound-warehouse');
        const supplierSelect = document.getElementById('quick-inbound-supplier');
        
        const quantity = parseInt(quantityInput?.value, 10);
        const notes = notesInput?.value || '';
        const warehouseId = warehouseSelect?.value || this.currentItem.warehouse;
        const supplierId = supplierSelect?.value || this.currentItem.supplier;

        // 验证数量
        if (!this.validateQuantity(quantity)) {
            return;
        }
        
        // 验证仓库
        if (!warehouseId) {
            this.showError('请选择入库仓库');
            showToast('请选择入库仓库', 'error');
            return;
        }
        
        // 验证供应商
        if (!supplierId) {
            this.showError('请选择供应商');
            showToast('请选择供应商', 'error');
            return;
        }

        // 显示加载状态
        const submitBtn = document.getElementById('quick-inbound-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>处理中...';
        }

        try {
            // 获取token
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            };
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }
            
            console.log('📤 提交入库:', {
                item: this.currentItem.id,
                quantity: quantity,
                warehouse: parseInt(warehouseId),
                supplier: parseInt(supplierId),
                notes: notes
            });
            
            const response = await fetch('/api/operations/inbound/', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    item: this.currentItem.id,
                    quantity: quantity,
                    warehouse: parseInt(warehouseId),
                    supplier: parseInt(supplierId),
                    notes: notes
                })
            });

            if (response.ok) {
                const result = await response.json();
                const itemName = this.currentItem.name;
                this.close();
                
                // 显示成功提示
                if (typeof showToast === 'function') {
                    showToast(`入库成功！${itemName} +${quantity}件`, 'success');
                } else {
                    alert(`入库成功！${itemName} +${quantity}件`);
                }
                
                // 入库成功后重新打开扫描页面，方便继续扫描
                setTimeout(() => {
                    CameraScannerManager.open();
                }, 300);
            } else {
                const error = await response.json();
                showToast(error.detail || '入库失败，请重试', 'error');
            }
        } catch (error) {
            console.error('Inbound error:', error);
            showToast('网络错误，请重试', 'error');
        } finally {
            // 恢复按钮状态
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '确认入库';
            }
        }
    }
};

// ============================================
// 辅助函数
// ============================================

/**
 * 获取CSRF Token
 */
function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}

/**
 * 打开扫码入库功能
 */
function openScanInbound() {
    CameraScannerManager.open();
}

/**
 * 关闭扫码模态框
 */
function closeCameraScan() {
    CameraScannerManager.close();
}

/**
 * 关闭快速入库弹窗
 */
function closeQuickInbound() {
    QuickInboundManager.close();
}

/**
 * 提交快速入库
 */
function submitQuickInbound() {
    QuickInboundManager.submitInbound();
}


// ============================================
// 物品二维码显示功能
// ============================================

/**
 * 显示物品二维码弹窗
 * @param {number} itemId - 物品ID
 * @param {string} itemCode - 物品编码
 * @param {string} itemName - 物品名称
 */
function showItemQRCode(itemId, itemCode, itemName) {
    const modal = document.getElementById('item-qrcode-modal');
    if (!modal) {
        console.error('QR code modal not found');
        return;
    }

    // 设置物品信息
    const nameElement = document.getElementById('qrcode-item-name');
    const codeElement = document.getElementById('qrcode-item-code');
    
    if (nameElement) nameElement.textContent = itemName;
    if (codeElement) codeElement.textContent = itemCode;

    // 生成二维码
    const qrcodeContainer = document.getElementById('item-qrcode-display');
    if (qrcodeContainer) {
        QRCodeManager.generate('item-qrcode-display', itemCode, {
            width: 180,
            height: 180
        });
    }

    // 存储当前物品信息用于打印和下载
    modal.dataset.itemId = itemId;
    modal.dataset.itemCode = itemCode;
    modal.dataset.itemName = itemName;

    // 显示弹窗
    modal.classList.remove('hidden');
    modal.classList.add('modal-active');
}

/**
 * 关闭二维码弹窗
 */
function closeItemQRCode() {
    const modal = document.getElementById('item-qrcode-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('modal-active');
    }
}

/**
 * 下载当前物品的二维码
 */
function downloadItemQRCode() {
    const modal = document.getElementById('item-qrcode-modal');
    if (!modal) return;

    const itemCode = modal.dataset.itemCode;
    const itemName = modal.dataset.itemName;
    
    QRCodeManager.download('item-qrcode-display', `${itemCode}-qrcode.png`);
}

/**
 * 打印当前物品的标签
 */
function printItemLabel() {
    const modal = document.getElementById('item-qrcode-modal');
    if (!modal) return;

    const item = {
        id: modal.dataset.itemId,
        code: modal.dataset.itemCode,
        name: modal.dataset.itemName
    };
    
    QRCodeManager.printLabel(item);
}
