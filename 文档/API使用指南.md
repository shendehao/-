# 📡 API使用指南

## 🎯 API已实现功能

### ✅ 完整实现的API模块

1. **用户认证API** ✅
2. **供应商管理API** ✅
3. **仓库管理API** ✅
4. **库存物品API** ✅
5. **出入库操作API** ✅
6. **仪表盘统计API** ✅

---

## 🚀 快速开始

### 1. 启动服务器

```bash
# 运行快速启动脚本
start.bat

# 或手动启动
python manage.py runserver
```

### 2. 访问API文档

- **Swagger文档**: http://localhost:8000/swagger/
- **ReDoc文档**: http://localhost:8000/redoc/

---

## 🔐 认证流程

### 登录获取Token

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**响应示例：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### 使用Token访问API

在后续请求中添加Authorization头：

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📦 库存物品API

### 获取物品列表

```bash
GET /api/inventory/items/
```

**查询参数：**
- `page`: 页码
- `page_size`: 每页数量
- `search`: 搜索关键词（物品名称、编码、条形码）
- `category`: 类别ID
- `supplier`: 供应商ID
- `warehouse`: 仓库ID
- `status`: 状态（normal/low_stock/out_of_stock）

**示例：**
```bash
curl -X GET "http://localhost:8000/api/inventory/items/?page=1&page_size=10&status=low_stock" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 创建物品

```bash
POST /api/inventory/items/
```

**请求体：**
```json
{
  "name": "无线鼠标",
  "code": "WM-001",
  "barcode": "1234567890",
  "category": 1,
  "supplier": 1,
  "warehouse": 1,
  "price": "89.00",
  "stock": 100,
  "min_stock": 20,
  "warehouse_location": "A区-01-05",
  "description": "罗技无线鼠标"
}
```

### 获取物品详情

```bash
GET /api/inventory/items/{id}/
```

### 更新物品

```bash
PUT /api/inventory/items/{id}/
PATCH /api/inventory/items/{id}/  # 部分更新
```

### 删除物品

```bash
DELETE /api/inventory/items/{id}/
```

### 获取低库存物品

```bash
GET /api/inventory/items/low_stock/
```

### 获取物品统计

```bash
GET /api/inventory/items/statistics/
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "total_items": 7,
    "total_stock": 500,
    "total_value": 125000.00,
    "low_stock_count": 3,
    "avg_price": 250.00,
    "category_distribution": [
      {"category__name": "电子设备", "count": 5},
      {"category__name": "办公用品", "count": 2}
    ]
  }
}
```

---

## 📥 出入库操作API

### 入库操作

```bash
POST /api/operations/inbound/
```

**请求体：**
```json
{
  "item": 1,
  "quantity": 50,
  "supplier": 1,
  "notes": "采购入库"
}
```

**响应：**
```json
{
  "success": true,
  "message": "入库成功",
  "data": {
    "id": 10,
    "item": 1,
    "item_name": "无线鼠标",
    "operation_type": "in",
    "quantity": 50,
    "before_stock": 100,
    "after_stock": 150,
    "created_at": "2025-12-05T22:30:00Z"
  }
}
```

### 出库操作

```bash
POST /api/operations/outbound/
```

**请求体：**
```json
{
  "item": 1,
  "quantity": 10,
  "recipient": "张三",
  "department": "技术部",
  "purpose": "办公使用",
  "notes": "领用出库"
}
```

### 获取操作记录列表

```bash
GET /api/operations/
```

**查询参数：**
- `operation_type`: 操作类型（in/out/transfer/adjust）
- `item`: 物品ID
- `supplier`: 供应商ID

### 获取操作统计

```bash
GET /api/operations/statistics/?days=7
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "total_operations": 15,
    "inbound_count": 8,
    "outbound_count": 7,
    "transfer_count": 0,
    "inbound_quantity": 400,
    "outbound_quantity": 150
  }
}
```

### 获取最近操作

```bash
GET /api/operations/recent/?limit=10
```

---

## 📊 仪表盘API

### 获取概览数据

```bash
GET /api/dashboard/overview/
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_items": 7,
      "total_stock": 500,
      "total_value": 125000.00,
      "low_stock_items": 3,
      "total_categories": 6,
      "total_suppliers": 3
    },
    "today": {
      "inbound": 156,
      "outbound": 128,
      "operations": 25
    },
    "week": {
      "inbound": 892,
      "outbound": 745,
      "operations": 150
    },
    "month": {
      "inbound": 3245,
      "outbound": 2890,
      "operations": 580
    }
  }
}
```

### 获取图表数据

```bash
GET /api/dashboard/charts/?days=7
```

**响应包含：**
- 出入库趋势数据
- 类别分布
- 仓库使用情况
- 供应商供货排行

### 获取最近活动

```bash
GET /api/dashboard/activities/?limit=10
```

### 获取低库存物品

```bash
GET /api/dashboard/low-stock/
```

---

## 🏢 供应商API

### 获取供应商列表

```bash
GET /api/suppliers/
```

### 创建供应商

```bash
POST /api/suppliers/
```

**请求体：**
```json
{
  "name": "科技配件供应商",
  "code": "SUP-001",
  "contact": "张经理",
  "phone": "13800138000",
  "email": "zhang@supplier.com",
  "address": "深圳市南山区",
  "status": "active"
}
```

### 获取启用的供应商

```bash
GET /api/suppliers/active/
```

---

## 🏭 仓库API

### 获取仓库列表

```bash
GET /api/warehouses/
```

### 创建仓库

```bash
POST /api/warehouses/
```

**请求体：**
```json
{
  "name": "主仓库",
  "code": "WH-001",
  "location": "深圳市宝安区",
  "capacity": 10000,
  "manager": "王经理",
  "phone": "13900139000",
  "is_active": true
}
```

### 获取启用的仓库

```bash
GET /api/warehouses/active/
```

---

## 🔖 类别API

### 获取类别列表

```bash
GET /api/inventory/categories/
```

### 创建类别

```bash
POST /api/inventory/categories/
```

**请求体：**
```json
{
  "name": "电子设备",
  "code": "electronics",
  "description": "电子产品及配件",
  "is_active": true
}
```

---

## 📝 统一响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "count": 100,
    "next": "http://localhost:8000/api/items/?page=2",
    "previous": null,
    "results": [ ... ]
  }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误信息",
  "code": 400
}
```

---

## 🧪 测试示例

### Python测试脚本

```python
import requests

# 基础URL
BASE_URL = "http://localhost:8000/api"

# 1. 登录获取Token
login_data = {
    "username": "admin",
    "password": "admin123"
}
response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
token = response.json()['data']['token']

# 2. 设置请求头
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# 3. 获取物品列表
response = requests.get(f"{BASE_URL}/inventory/items/", headers=headers)
print("物品列表:", response.json())

# 4. 创建物品
item_data = {
    "name": "测试物品",
    "code": "TEST-001",
    "category": 1,
    "warehouse": 1,
    "price": "99.00",
    "stock": 50,
    "min_stock": 10
}
response = requests.post(f"{BASE_URL}/inventory/items/", json=item_data, headers=headers)
print("创建物品:", response.json())

# 5. 入库操作
inbound_data = {
    "item": 1,
    "quantity": 20,
    "supplier": 1,
    "notes": "测试入库"
}
response = requests.post(f"{BASE_URL}/operations/inbound/", json=inbound_data, headers=headers)
print("入库操作:", response.json())

# 6. 获取仪表盘数据
response = requests.get(f"{BASE_URL}/dashboard/overview/", headers=headers)
print("仪表盘数据:", response.json())
```

### JavaScript测试脚本

```javascript
const BASE_URL = 'http://localhost:8000/api';

// 1. 登录
async function login() {
  const response = await fetch(`${BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  const data = await response.json();
  return data.data.token;
}

// 2. 获取物品列表
async function getItems(token) {
  const response = await fetch(`${BASE_URL}/inventory/items/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
}

// 3. 入库操作
async function inbound(token, data) {
  const response = await fetch(`${BASE_URL}/operations/inbound/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return await response.json();
}

// 使用示例
(async () => {
  const token = await login();
  console.log('Token:', token);
  
  const items = await getItems(token);
  console.log('物品列表:', items);
  
  const result = await inbound(token, {
    item: 1,
    quantity: 10,
    supplier: 1,
    notes: '测试入库'
  });
  console.log('入库结果:', result);
})();
```

---

## 🎯 前端对接要点

### 1. Token管理

```javascript
// 保存Token
localStorage.setItem('access_token', token);
localStorage.setItem('refresh_token', refreshToken);

// 获取Token
const token = localStorage.getItem('access_token');

// 请求拦截器
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 2. 错误处理

```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response.status === 401) {
      // Token过期，跳转登录
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3. API封装示例

```javascript
// api/inventory.js
import axios from 'axios';

const BASE_URL = '/api/inventory';

export const inventoryAPI = {
  // 获取物品列表
  getItems: (params) => axios.get(`${BASE_URL}/items/`, { params }),
  
  // 创建物品
  createItem: (data) => axios.post(`${BASE_URL}/items/`, data),
  
  // 更新物品
  updateItem: (id, data) => axios.put(`${BASE_URL}/items/${id}/`, data),
  
  // 删除物品
  deleteItem: (id) => axios.delete(`${BASE_URL}/items/${id}/`),
  
  // 获取低库存物品
  getLowStockItems: () => axios.get(`${BASE_URL}/items/low_stock/`),
};
```

---

## 📚 相关文档

- [API文档.md](./API文档.md) - 完整API规范
- [后端开发文档.md](./后端开发文档.md) - 开发指南
- [使用指南.md](./使用指南.md) - 系统使用说明

---

## ✅ 下一步

1. 启动服务器测试API
2. 在Swagger中测试各个接口
3. 开始前端对接
4. 实现前端数据展示

**所有API已经ready，可以开始对接了！** 🎉
