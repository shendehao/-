# 库存管理系统 - 前后端API对接规范文档

## 目录
1. [概述](#概述)
2. [API基础规范](#api基础规范)
3. [认证模块](#认证模块)
4. [仪表盘模块](#仪表盘模块)
5. [库存管理模块](#库存管理模块)
6. [出入库操作模块](#出入库操作模块)
7. [仓库管理模块](#仓库管理模块)
8. [供应商管理模块](#供应商管理模块)
9. [前端页面对接指南](#前端页面对接指南)

---

## 概述

### 基础信息
- **API基础路径**: `/api/`
- **API文档**: `/swagger/` (Swagger UI) 或 `/redoc/` (ReDoc)
- **认证方式**: JWT Token (Bearer Token)
- **数据格式**: JSON

### 服务器地址
```
开发环境: http://localhost:8000
生产环境: 根据部署配置
```

---

## API基础规范

### 统一响应格式

#### 成功响应
```json
{
    "success": true,
    "message": "操作成功",
    "data": { ... }
}
```

#### 错误响应
```json
{
    "success": false,
    "error": {
        "code": "ERROR",
        "message": "错误信息",
        "details": { ... }
    }
}
```

#### 分页响应
```json
{
    "success": true,
    "message": "获取成功",
    "data": {
        "count": 100,
        "next": "http://api/xxx?page=2",
        "previous": null,
        "results": [ ... ]
    }
}
```

### HTTP状态码
| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证/Token无效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

### 请求头规范
```javascript
// 所有需要认证的请求必须携带
headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <access_token>'
}
```

---

## 认证模块

**基础路径**: `/api/auth/`

### 1. 用户登录
- **URL**: `POST /api/auth/login/`
- **认证**: 不需要
- **请求体**:
```json
{
    "username": "admin",
    "password": "password123"
}
```
- **成功响应**:
```json
{
    "success": true,
    "message": "登录成功",
    "data": {
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "user": {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "first_name": "管理员",
            "last_name": "",
            "avatar": null,
            "phone": "",
            "department": ""
        }
    }
}
```

### 2. 用户注册
- **URL**: `POST /api/auth/register/`
- **认证**: 不需要
- **请求体**:
```json
{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123",
    "password2": "password123",
    "first_name": "新用户"
}
```

### 3. 用户登出
- **URL**: `POST /api/auth/logout/`
- **认证**: 需要
- **请求体**:
```json
{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 4. 刷新Token
- **URL**: `POST /api/auth/refresh/`
- **认证**: 不需要
- **请求体**:
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```
- **响应**:
```json
{
    "access": "新的access_token"
}
```

### 5. 获取用户信息
- **URL**: `GET /api/auth/profile/`
- **认证**: 需要

### 6. 更新用户信息
- **URL**: `PUT /api/auth/profile/update/`
- **认证**: 需要
- **请求体**:
```json
{
    "first_name": "新名字",
    "email": "newemail@example.com",
    "phone": "13800138000",
    "department": "技术部"
}
```

### 7. 修改密码
- **URL**: `POST /api/auth/change-password/`
- **认证**: 需要
- **请求体**:
```json
{
    "old_password": "oldpassword",
    "new_password": "newpassword",
    "new_password2": "newpassword"
}
```

---

## 仪表盘模块

**基础路径**: `/api/dashboard/`

### 1. 获取概览数据
- **URL**: `GET /api/dashboard/overview/`
- **认证**: 需要
- **响应数据结构**:
```json
{
    "success": true,
    "data": {
        "overview": {
            "total_items": 150,
            "total_stock": 5000,
            "total_value": 250000.00,
            "low_stock_items": 12,
            "total_categories": 8,
            "total_suppliers": 15,
            "turnover_rate": 25.5
        },
        "changes": {
            "items_change": 5.2,
            "low_stock_change": -10.0,
            "value_change": 8.5,
            "turnover_change": 2.3
        },
        "today": {
            "inbound": 100,
            "outbound": 80,
            "operations": 15
        },
        "week": {
            "inbound": 500,
            "outbound": 400,
            "operations": 85
        },
        "month": {
            "inbound": 2000,
            "outbound": 1800,
            "operations": 350
        }
    }
}
```

### 2. 获取图表数据
- **URL**: `GET /api/dashboard/charts/`
- **认证**: 需要
- **查询参数**: `?days=7` (默认7天)
- **响应**:
```json
{
    "success": true,
    "data": {
        "trend": [
            {"date": "2025-12-01", "inbound": 50, "outbound": 40},
            {"date": "2025-12-02", "inbound": 60, "outbound": 55}
        ],
        "category_distribution": [
            {"category__name": "电子设备", "count": 30, "total_stock": 500}
        ],
        "warehouse_usage": [
            {"name": "主仓库", "code": "WH001", "capacity": 1000, "current_usage": 750, "usage_rate": 75.0}
        ],
        "supplier_ranking": [
            {"supplier__name": "供应商A", "item_count": 25}
        ]
    }
}
```

### 3. 获取趋势数据
- **URL**: `GET /api/dashboard/trend/`
- **认证**: 不需要
- **查询参数**: `?period=month` (可选: month, quarter, year)
- **响应**:
```json
{
    "success": true,
    "data": {
        "labels": ["7月", "8月", "9月", "10月", "11月", "12月"],
        "inbound": [100, 150, 200, 180, 220, 250],
        "outbound": [80, 120, 180, 160, 200, 230]
    }
}
```

### 4. 获取类别分布
- **URL**: `GET /api/dashboard/distribution/`
- **认证**: 不需要
- **响应**:
```json
{
    "success": true,
    "data": {
        "labels": ["电子设备", "办公用品", "原材料", "成品"],
        "values": [30, 20, 15, 35]
    }
}
```

### 5. 获取最近活动
- **URL**: `GET /api/dashboard/activities/`
- **认证**: 需要
- **查询参数**: `?limit=10`
- **响应**:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "type": "in",
            "type_display": "入库",
            "item_name": "笔记本电脑",
            "item_code": "ITEM-001",
            "quantity": 10,
            "operator": "张三",
            "created_at": "2025-12-06T10:30:00Z"
        }
    ]
}
```

### 6. 获取低库存物品
- **URL**: `GET /api/dashboard/low-stock/`
- **认证**: 需要
- **响应**:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "打印纸",
            "code": "ITEM-002",
            "category": "办公用品",
            "warehouse": "主仓库",
            "stock": 5,
            "min_stock": 20,
            "status": "low_stock",
            "status_display": "库存不足"
        }
    ]
}
```

---

## 库存管理模块

**基础路径**: `/api/inventory/`

### 类别管理

#### 1. 获取类别列表
- **URL**: `GET /api/inventory/categories/`
- **认证**: 需要
- **查询参数**: `?search=关键词&ordering=code`

#### 2. 创建类别
- **URL**: `POST /api/inventory/categories/`
- **认证**: 需要
- **请求体**:
```json
{
    "name": "电子设备",
    "code": "CAT001",
    "description": "电子类产品",
    "parent": null,
    "is_active": true
}
```

#### 3. 获取类别详情
- **URL**: `GET /api/inventory/categories/{id}/`
- **认证**: 需要

#### 4. 更新类别
- **URL**: `PUT /api/inventory/categories/{id}/`
- **认证**: 需要

#### 5. 删除类别
- **URL**: `DELETE /api/inventory/categories/{id}/`
- **认证**: 需要
- **注意**: 类别下有物品时无法删除

### 物品管理

#### 1. 获取物品列表
- **URL**: `GET /api/inventory/items/`
- **认证**: 需要
- **查询参数**:
  - `?page=1` - 分页
  - `?search=关键词` - 搜索(名称/编码/条码)
  - `?category=1` - 按类别筛选
  - `?supplier=1` - 按供应商筛选
  - `?warehouse=1` - 按仓库筛选
  - `?status=normal` - 按状态筛选 (normal/low_stock/out_of_stock)
  - `?ordering=-created_at` - 排序

#### 2. 创建物品
- **URL**: `POST /api/inventory/items/`
- **认证**: 需要
- **请求体**:
```json
{
    "name": "笔记本电脑",
    "code": "ITEM-20251206-XXXX",
    "barcode": "6901234567890",
    "category": 1,
    "supplier": 1,
    "warehouse": 1,
    "price": 5999.00,
    "stock": 100,
    "min_stock": 10,
    "warehouse_location": "A-01-01",
    "description": "商品描述"
}
```
- **注意**: `code`和`barcode`可不传，系统自动生成

#### 3. 获取物品详情
- **URL**: `GET /api/inventory/items/{id}/`
- **认证**: 需要

#### 4. 更新物品
- **URL**: `PUT /api/inventory/items/{id}/`
- **认证**: 需要

#### 5. 部分更新物品
- **URL**: `PATCH /api/inventory/items/{id}/`
- **认证**: 需要

#### 6. 删除物品
- **URL**: `DELETE /api/inventory/items/{id}/`
- **认证**: 需要
- **注意**: 有操作记录的物品无法删除

#### 7. 获取低库存物品
- **URL**: `GET /api/inventory/items/low_stock/`
- **认证**: 需要

#### 8. 获取物品统计
- **URL**: `GET /api/inventory/items/statistics/`
- **认证**: 需要
- **响应**:
```json
{
    "success": true,
    "data": {
        "total_items": 150,
        "total_stock": 5000,
        "total_value": 250000.00,
        "low_stock_count": 12,
        "avg_price": 166.67,
        "category_distribution": [
            {"category__name": "电子设备", "count": 30}
        ]
    }
}
```

---

## 出入库操作模块

**基础路径**: `/api/operations/`

### 1. 获取操作记录列表
- **URL**: `GET /api/operations/`
- **认证**: 需要
- **查询参数**:
  - `?operation_type=in` - 筛选类型 (in/out/transfer)
  - `?item=1` - 按物品筛选
  - `?supplier=1` - 按供应商筛选
  - `?search=关键词` - 搜索

### 2. 入库操作
- **URL**: `POST /api/operations/inbound/`
- **认证**: 需要
- **请求体**:
```json
{
    "item": 1,
    "quantity": 100,
    "supplier": 1,
    "unit_price": 50.00,
    "remark": "采购入库"
}
```

### 3. 出库操作
- **URL**: `POST /api/operations/outbound/`
- **认证**: 需要
- **请求体**:
```json
{
    "item": 1,
    "quantity": 50,
    "recipient": "张三",
    "department": "技术部",
    "remark": "领用出库"
}
```

### 4. 获取操作统计
- **URL**: `GET /api/operations/statistics/`
- **认证**: 需要
- **查询参数**: `?days=7`
- **响应**:
```json
{
    "success": true,
    "data": {
        "total_operations": 100,
        "inbound_count": 60,
        "outbound_count": 35,
        "transfer_count": 5,
        "inbound_quantity": 1000,
        "outbound_quantity": 800
    }
}
```

### 5. 获取最近操作
- **URL**: `GET /api/operations/recent/`
- **认证**: 需要
- **查询参数**: `?limit=10`

---

## 仓库管理模块

**基础路径**: `/api/warehouses/`

### 1. 获取仓库列表
- **URL**: `GET /api/warehouses/`
- **认证**: 需要

### 2. 创建仓库
- **URL**: `POST /api/warehouses/`
- **认证**: 需要
- **请求体**:
```json
{
    "name": "主仓库",
    "code": "WH001",
    "address": "北京市朝阳区xxx",
    "capacity": 1000,
    "manager": "张三",
    "phone": "13800138000",
    "is_active": true
}
```

### 3. 获取仓库详情
- **URL**: `GET /api/warehouses/{id}/`

### 4. 更新仓库
- **URL**: `PUT /api/warehouses/{id}/`

### 5. 删除仓库
- **URL**: `DELETE /api/warehouses/{id}/`

---

## 供应商管理模块

**基础路径**: `/api/suppliers/`

### 1. 获取供应商列表
- **URL**: `GET /api/suppliers/`
- **认证**: 需要

### 2. 创建供应商
- **URL**: `POST /api/suppliers/`
- **认证**: 需要
- **请求体**:
```json
{
    "name": "供应商A",
    "code": "SUP001",
    "contact": "李四",
    "phone": "13900139000",
    "email": "supplier@example.com",
    "address": "上海市浦东新区xxx",
    "status": "active"
}
```

### 3. 获取供应商详情
- **URL**: `GET /api/suppliers/{id}/`

### 4. 更新供应商
- **URL**: `PUT /api/suppliers/{id}/`

### 5. 删除供应商
- **URL**: `DELETE /api/suppliers/{id}/`

---

## 前端页面对接指南

### 页面与API对应关系

| 页面文件 | 对应API模块 | 主要接口 |
|----------|-------------|----------|
| `login.html` | 认证模块 | `/api/auth/login/` |
| `dashboard.html` | 仪表盘模块 | `/api/dashboard/overview/`, `/api/dashboard/charts/` |
| `items.html` | 库存管理 | `/api/inventory/items/`, `/api/inventory/categories/` |
| `inbound.html` | 出入库操作 | `/api/operations/inbound/` |
| `outbound.html` | 出入库操作 | `/api/operations/outbound/` |
| `warehouse.html` | 仓库管理 | `/api/warehouses/` |
| `supplier.html` | 供应商管理 | `/api/suppliers/` |
| `transfer.html` | 出入库操作 | `/api/operations/` |
| `reports.html` | 报表模块 | `/api/reports/` |
| `settings.html` | 认证模块 | `/api/auth/profile/` |

### 前端调用示例

#### 1. 登录示例
```javascript
async function login(username, password) {
    try {
        const response = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 保存token
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('refresh_token', data.data.refresh_token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            // 跳转到首页
            window.location.href = '/';
        } else {
            alert(data.error.message);
        }
    } catch (error) {
        console.error('登录失败:', error);
    }
}
```

#### 2. 带认证的请求示例
```javascript
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // Token过期处理
    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            return fetchWithAuth(url, options);
        } else {
            window.location.href = '/login/';
            return null;
        }
    }
    
    return response.json();
}

async function refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    try {
        const response = await fetch('/api/auth/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access);
            return true;
        }
    } catch (error) {
        console.error('刷新token失败:', error);
    }
    return false;
}
```

#### 3. 获取物品列表示例
```javascript
async function getItems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `/api/inventory/items/${queryString ? '?' + queryString : ''}`;
    
    const data = await fetchWithAuth(url);
    
    if (data && data.success) {
        return data.data;
    }
    return null;
}

// 使用示例
const items = await getItems({
    page: 1,
    search: '笔记本',
    category: 1,
    ordering: '-created_at'
});
```

#### 4. 入库操作示例
```javascript
async function inbound(itemId, quantity, supplierId, unitPrice, remark) {
    const data = await fetchWithAuth('/api/operations/inbound/', {
        method: 'POST',
        body: JSON.stringify({
            item: itemId,
            quantity: quantity,
            supplier: supplierId,
            unit_price: unitPrice,
            remark: remark
        })
    });
    
    if (data && data.success) {
        alert('入库成功');
        return data.data;
    } else {
        alert(data?.error?.message || '入库失败');
        return null;
    }
}
```

#### 5. 仪表盘数据加载示例
```javascript
async function loadDashboard() {
    // 并行加载多个数据
    const [overview, charts, activities, lowStock] = await Promise.all([
        fetchWithAuth('/api/dashboard/overview/'),
        fetchWithAuth('/api/dashboard/charts/?days=7'),
        fetchWithAuth('/api/dashboard/activities/?limit=10'),
        fetchWithAuth('/api/dashboard/low-stock/')
    ]);
    
    // 更新概览卡片
    if (overview?.success) {
        document.getElementById('total-items').textContent = overview.data.overview.total_items;
        document.getElementById('total-stock').textContent = overview.data.overview.total_stock;
        document.getElementById('total-value').textContent = overview.data.overview.total_value.toFixed(2);
        document.getElementById('low-stock-count').textContent = overview.data.overview.low_stock_items;
    }
    
    // 更新图表
    if (charts?.success) {
        updateTrendChart(charts.data.trend);
        updateCategoryChart(charts.data.category_distribution);
    }
    
    // 更新活动列表
    if (activities?.success) {
        renderActivities(activities.data);
    }
    
    // 更新低库存列表
    if (lowStock?.success) {
        renderLowStockItems(lowStock.data);
    }
}
```

### 错误处理规范

```javascript
function handleApiError(response) {
    if (!response.success) {
        const error = response.error;
        
        // 显示错误信息
        if (error.details) {
            // 表单验证错误
            Object.keys(error.details).forEach(field => {
                const messages = error.details[field];
                showFieldError(field, messages.join(', '));
            });
        } else {
            // 通用错误
            showToast(error.message, 'error');
        }
        
        return false;
    }
    return true;
}
```

### 分页处理规范

```javascript
class Pagination {
    constructor(containerId, onPageChange) {
        this.container = document.getElementById(containerId);
        this.onPageChange = onPageChange;
        this.currentPage = 1;
        this.totalPages = 1;
    }
    
    update(data) {
        this.totalPages = Math.ceil(data.count / 10); // 假设每页10条
        this.render();
    }
    
    render() {
        let html = '';
        for (let i = 1; i <= this.totalPages; i++) {
            html += `<button class="${i === this.currentPage ? 'active' : ''}" 
                            onclick="pagination.goTo(${i})">${i}</button>`;
        }
        this.container.innerHTML = html;
    }
    
    goTo(page) {
        this.currentPage = page;
        this.onPageChange(page);
    }
}
```

---

## 附录

### 物品状态枚举
| 值 | 显示名称 |
|----|----------|
| `normal` | 正常 |
| `low_stock` | 库存不足 |
| `out_of_stock` | 缺货 |

### 操作类型枚举
| 值 | 显示名称 |
|----|----------|
| `in` | 入库 |
| `out` | 出库 |
| `transfer` | 调拨 |

### 供应商状态枚举
| 值 | 显示名称 |
|----|----------|
| `active` | 活跃 |
| `inactive` | 停用 |

---

## 对接状态

### 已完成对接的页面

| 页面 | 状态 | 说明 |
|------|------|------|
| login.html | ✅ 已对接 | 登录/注册/Token管理 |
| dashboard.html | ✅ 已对接 | 概览数据/图表/活动/低库存 |
| index.html | ✅ 已对接 | 主页仪表盘 |
| items.html | ✅ 已对接 | 物品列表/搜索/筛选/分页 |
| inbound.html | ✅ 已对接 | 入库记录列表 |
| outbound.html | ✅ 已对接 | 出库记录列表 |
| transfer.html | ✅ 已对接 | 调拨记录列表 |
| warehouse.html | ✅ 已对接 | 仓库列表/使用率 |
| supplier.html | ✅ 已对接 | 供应商列表 |
| reports.html | ✅ 已对接 | 报表图表 |
| settings.html | ✅ 已对接 | 用户信息 |

### API服务文件

核心API服务文件: `/js/api-service.js`

包含功能:
- Token管理 (TokenManager)
- 统一请求方法 (request)
- Token自动刷新
- 各模块API封装 (auth, dashboard, items, categories, operations, warehouses, suppliers)
- 页面数据加载函数
- 图表初始化
- 登录状态检查

---

*文档版本: v1.1*  
*更新日期: 2025-12-06*
