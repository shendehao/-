/**
 * 库存管理系统 - API客户端
 * 提供所有API接口的封装
 */

// API基础配置
const API_CONFIG = {
    baseURL: 'http://localhost:8000/api',
    timeout: 30000,
};

// Token管理
const TokenManager = {
    getToken() {
        return localStorage.getItem('access_token');
    },
    
    setToken(token) {
        localStorage.setItem('access_token', token);
    },
    
    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    },
    
    setRefreshToken(token) {
        localStorage.setItem('refresh_token', token);
    },
    
    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
    },
    
    getUserInfo() {
        const userInfo = localStorage.getItem('user_info');
        return userInfo ? JSON.parse(userInfo) : null;
    },
    
    setUserInfo(user) {
        localStorage.setItem('user_info', JSON.stringify(user));
    }
};

// HTTP请求封装
class HttpClient {
    constructor(config) {
        this.baseURL = config.baseURL;
        this.timeout = config.timeout;
    }
    
    async request(url, options = {}) {
        const token = TokenManager.getToken();
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        
        if (token && !options.skipAuth) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            method: options.method || 'GET',
            headers,
            ...options,
        };
        
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }
        
        try {
            const response = await fetch(`${this.baseURL}${url}`, config);
            
            // Token过期，尝试刷新
            if (response.status === 401 && !options.skipAuth) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    return this.request(url, options);
                } else {
                    TokenManager.clearTokens();
                    window.location.href = '/login';
                    throw new Error('认证失败，请重新登录');
                }
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || '请求失败');
            }
            
            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }
    
    async refreshToken() {
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) return false;
        
        try {
            const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            });
            
            if (response.ok) {
                const data = await response.json();
                TokenManager.setToken(data.access);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }
    
    get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    }
    
    post(url, data, options = {}) {
        return this.request(url, { method: 'POST', body: data, ...options });
    }
    
    put(url, data) {
        return this.request(url, { method: 'PUT', body: data });
    }
    
    patch(url, data) {
        return this.request(url, { method: 'PATCH', body: data });
    }
    
    delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
}

const http = new HttpClient(API_CONFIG);

// 认证API
const AuthAPI = {
    // 登录
    login(username, password) {
        return http.post('/auth/login/', { username, password }, { skipAuth: true });
    },
    
    // 注册
    register(data) {
        return http.post('/auth/register/', data, { skipAuth: true });
    },
    
    // 登出
    logout() {
        return http.post('/auth/logout/');
    },
    
    // 获取用户信息
    getProfile() {
        return http.get('/auth/profile/');
    },
    
    // 更新用户信息
    updateProfile(data) {
        return http.put('/auth/profile/', data);
    },
    
    // 修改密码
    changePassword(oldPassword, newPassword) {
        return http.post('/auth/change-password/', {
            old_password: oldPassword,
            new_password: newPassword,
        });
    },
};

// 库存物品API
const InventoryAPI = {
    // 获取物品列表
    getItems(params = {}) {
        return http.get('/inventory/items/', params);
    },
    
    // 获取物品详情
    getItem(id) {
        return http.get(`/inventory/items/${id}/`);
    },
    
    // 创建物品
    createItem(data) {
        return http.post('/inventory/items/', data);
    },
    
    // 更新物品
    updateItem(id, data) {
        return http.put(`/inventory/items/${id}/`, data);
    },
    
    // 删除物品
    deleteItem(id) {
        return http.delete(`/inventory/items/${id}/`);
    },
    
    // 获取低库存物品
    getLowStockItems() {
        return http.get('/inventory/items/low_stock/');
    },
    
    // 获取物品统计
    getStatistics() {
        return http.get('/inventory/items/statistics/');
    },
    
    // 获取类别列表
    getCategories() {
        return http.get('/inventory/categories/');
    },
    
    // 创建类别
    createCategory(data) {
        return http.post('/inventory/categories/', data);
    },
};

// 出入库操作API
const OperationAPI = {
    // 获取操作记录列表
    getOperations(params = {}) {
        return http.get('/operations/', params);
    },
    
    // 获取操作详情
    getOperation(id) {
        return http.get(`/operations/${id}/`);
    },
    
    // 入库操作
    inbound(data) {
        return http.post('/operations/inbound/', data);
    },
    
    // 出库操作
    outbound(data) {
        return http.post('/operations/outbound/', data);
    },
    
    // 获取操作统计
    getStatistics(days = 7) {
        return http.get('/operations/statistics/', { days });
    },
    
    // 获取最近操作
    getRecent(limit = 10) {
        return http.get('/operations/recent/', { limit });
    },
};

// 供应商API
const SupplierAPI = {
    // 获取供应商列表
    getSuppliers(params = {}) {
        return http.get('/suppliers/', params);
    },
    
    // 获取供应商详情
    getSupplier(id) {
        return http.get(`/suppliers/${id}/`);
    },
    
    // 创建供应商
    createSupplier(data) {
        return http.post('/suppliers/', data);
    },
    
    // 更新供应商
    updateSupplier(id, data) {
        return http.put(`/suppliers/${id}/`, data);
    },
    
    // 删除供应商
    deleteSupplier(id) {
        return http.delete(`/suppliers/${id}/`);
    },
    
    // 获取启用的供应商
    getActiveSuppliers() {
        return http.get('/suppliers/active/');
    },
};

// 仓库API
const WarehouseAPI = {
    // 获取仓库列表
    getWarehouses(params = {}) {
        return http.get('/warehouses/', params);
    },
    
    // 获取仓库详情
    getWarehouse(id) {
        return http.get(`/warehouses/${id}/`);
    },
    
    // 创建仓库
    createWarehouse(data) {
        return http.post('/warehouses/', data);
    },
    
    // 更新仓库
    updateWarehouse(id, data) {
        return http.put(`/warehouses/${id}/`, data);
    },
    
    // 删除仓库
    deleteWarehouse(id) {
        return http.delete(`/warehouses/${id}/`);
    },
    
    // 获取启用的仓库
    getActiveWarehouses() {
        return http.get('/warehouses/active/');
    },
};

// 仪表盘API
const DashboardAPI = {
    // 获取概览数据
    getOverview() {
        return http.get('/dashboard/overview/');
    },
    
    // 获取图表数据
    getCharts(days = 7) {
        return http.get('/dashboard/charts/', { days });
    },
    
    // 获取趋势数据
    getTrend(period = 'month') {
        return http.get('/dashboard/trend/', { period });
    },
    
    // 获取分布数据
    getDistribution() {
        return http.get('/dashboard/distribution/');
    },
    
    // 获取最近活动
    getActivities(limit = 10) {
        return http.get('/dashboard/activities/', { limit });
    },
    
    // 获取低库存物品
    getLowStock() {
        return http.get('/dashboard/low-stock/');
    },
};

// 导出API
window.API = {
    Auth: AuthAPI,
    Inventory: InventoryAPI,
    Operation: OperationAPI,
    Supplier: SupplierAPI,
    Warehouse: WarehouseAPI,
    Dashboard: DashboardAPI,
    TokenManager,
};

console.log('✅ API客户端已加载');
