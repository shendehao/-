# 📡 Swagger API测试指南

## 🚀 快速开始

### 1. 启动服务器

```bash
# 运行快速启动脚本
start.bat
```

### 2. 访问Swagger文档

打开浏览器访问：**http://localhost:8000/swagger/**

---

## 🔐 第一步：获取认证Token

### 登录接口测试

1. 在Swagger页面找到 **`/api/auth/login/`** 接口
2. 点击 **"Try it out"**
3. 输入测试账号：

```json
{
  "username": "admin",
  "password": "admin123"
}
```

4. 点击 **"Execute"**
5. 在Response中复制 `access_token`

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

### 设置全局认证

1. 点击页面右上角的 **"Authorize"** 按钮
2. 在弹出框中输入：`Bearer YOUR_ACCESS_TOKEN`
3. 点击 **"Authorize"**
4. 点击 **"Close"**

现在所有需要认证的接口都会自动带上Token！

---

## 📦 测试库存物品API

### 1. 获取物品列表

**接口**: `GET /api/inventory/items/`

1. 找到该接口，点击 **"Try it out"**
2. 可选参数：
   - `page`: 页码（默认1）
   - `page_size`: 每页数量（默认10）
   - `search`: 搜索关键词
   - `category`: 类别ID
   - `status`: 状态（normal/low_stock/out_of_stock）
3. 点击 **"Execute"**

**预期响应：**
```json
{
  "success": true,
  "data": {
    "count": 7,
    "results": [
      {
        "id": 1,
        "name": "无线鼠标",
        "code": "WM-200",
        "stock": 150,
        "price": "89.00",
        "status": "normal"
      }
    ]
  }
}
```

### 2. 创建物品

**接口**: `POST /api/inventory/items/`

1. 点击 **"Try it out"**
2. 输入请求体：

```json
{
  "name": "测试物品",
  "code": "TEST-999",
  "category": 1,
  "warehouse": 1,
  "price": "99.00",
  "stock": 100,
  "min_stock": 20,
  "warehouse_location": "A区-01-01",
  "description": "这是一个测试物品"
}
```

3. 点击 **"Execute"**

**预期响应：**
```json
{
  "success": true,
  "message": "物品创建成功",
  "data": {
    "id": 8,
    "name": "测试物品",
    "code": "TEST-999",
    "stock": 100,
    "status": "normal"
  }
}
```

### 3. 获取低库存物品

**接口**: `GET /api/inventory/items/low_stock/`

直接点击 **"Execute"**，查看所有低库存物品。

### 4. 获取物品统计

**接口**: `GET /api/inventory/items/statistics/`

直接点击 **"Execute"**，查看统计数据。

---

## 📥 测试出入库操作API

### 1. 入库操作

**接口**: `POST /api/operations/inbound/`

1. 点击 **"Try it out"**
2. 输入请求体：

```json
{
  "item": 1,
  "quantity": 50,
  "supplier": 1,
  "notes": "采购入库"
}
```

3. 点击 **"Execute"**

**预期响应：**
```json
{
  "success": true,
  "message": "入库成功",
  "data": {
    "id": 10,
    "item_name": "无线鼠标",
    "quantity": 50,
    "before_stock": 150,
    "after_stock": 200,
    "operation_type": "in"
  }
}
```

### 2. 出库操作

**接口**: `POST /api/operations/outbound/`

1. 点击 **"Try it out"**
2. 输入请求体：

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

3. 点击 **"Execute"**

**注意**: 如果库存不足会返回错误！

### 3. 获取操作记录

**接口**: `GET /api/operations/`

可选参数：
- `operation_type`: in/out/transfer
- `page`: 页码
- `page_size`: 每页数量

### 4. 获取操作统计

**接口**: `GET /api/operations/statistics/`

参数：
- `days`: 统计天数（默认7天）

---

## 📊 测试仪表盘API

### 1. 获取概览数据

**接口**: `GET /api/dashboard/overview/`

直接点击 **"Execute"**

**预期响应：**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_items": 7,
      "total_stock": 500,
      "total_value": 125000.00,
      "low_stock_items": 3
    },
    "today": {
      "inbound": 156,
      "outbound": 128
    },
    "week": {
      "inbound": 892,
      "outbound": 745
    }
  }
}
```

### 2. 获取图表数据

**接口**: `GET /api/dashboard/charts/`

参数：
- `days`: 天数（默认7天）

### 3. 获取最近活动

**接口**: `GET /api/dashboard/activities/`

参数：
- `limit`: 数量（默认10条）

### 4. 获取低库存物品

**接口**: `GET /api/dashboard/low-stock/`

---

## 🏢 测试供应商API

### 1. 获取供应商列表

**接口**: `GET /api/suppliers/`

### 2. 创建供应商

**接口**: `POST /api/suppliers/`

```json
{
  "name": "测试供应商",
  "code": "SUP-999",
  "contact": "李经理",
  "phone": "13800138999",
  "email": "test@supplier.com",
  "address": "深圳市南山区",
  "status": "active"
}
```

### 3. 获取启用的供应商

**接口**: `GET /api/suppliers/active/`

---

## 🏭 测试仓库API

### 1. 获取仓库列表

**接口**: `GET /api/warehouses/`

### 2. 创建仓库

**接口**: `POST /api/warehouses/`

```json
{
  "name": "测试仓库",
  "code": "WH-999",
  "location": "深圳市龙岗区",
  "capacity": 5000,
  "manager": "赵经理",
  "phone": "13900139999",
  "is_active": true
}
```

---

## ✅ 完整测试流程

### 推荐测试顺序

1. **登录认证** ✅
   - 登录获取Token
   - 设置全局认证

2. **查看数据** ✅
   - 获取物品列表
   - 获取供应商列表
   - 获取仓库列表
   - 查看仪表盘概览

3. **创建数据** ✅
   - 创建新物品
   - 创建新供应商
   - 创建新仓库

4. **操作测试** ✅
   - 执行入库操作
   - 执行出库操作
   - 查看操作记录

5. **统计查询** ✅
   - 查看低库存物品
   - 查看物品统计
   - 查看操作统计
   - 查看最近活动

6. **更新删除** ✅
   - 更新物品信息
   - 删除测试数据

---

## 🔍 常见测试场景

### 场景1：完整的入库流程

```bash
1. 查看物品列表 -> GET /api/inventory/items/
2. 选择一个物品，记住ID
3. 执行入库操作 -> POST /api/operations/inbound/
4. 再次查看物品列表，确认库存增加
5. 查看操作记录 -> GET /api/operations/
```

### 场景2：低库存预警

```bash
1. 查看低库存物品 -> GET /api/inventory/items/low_stock/
2. 选择一个低库存物品
3. 执行入库操作补充库存
4. 再次查看低库存列表，确认已移除
```

### 场景3：出库验证

```bash
1. 查看某个物品的库存
2. 尝试出库超过库存数量 -> 应该失败
3. 出库正常数量 -> 成功
4. 确认库存减少
```

---

## 📝 测试检查清单

### 认证模块
- [ ] 登录成功
- [ ] 登录失败（错误密码）
- [ ] Token认证有效
- [ ] 获取用户信息
- [ ] 修改密码

### 库存模块
- [ ] 获取物品列表
- [ ] 搜索物品
- [ ] 过滤物品（按类别、状态）
- [ ] 创建物品
- [ ] 更新物品
- [ ] 删除物品
- [ ] 获取低库存物品
- [ ] 获取物品统计

### 操作模块
- [ ] 入库操作成功
- [ ] 出库操作成功
- [ ] 出库库存不足验证
- [ ] 获取操作记录
- [ ] 过滤操作记录
- [ ] 获取操作统计
- [ ] 获取最近操作

### 仪表盘模块
- [ ] 获取概览数据
- [ ] 获取图表数据
- [ ] 获取最近活动
- [ ] 获取低库存预警

### 供应商模块
- [ ] 获取供应商列表
- [ ] 创建供应商
- [ ] 更新供应商
- [ ] 删除供应商
- [ ] 获取启用供应商

### 仓库模块
- [ ] 获取仓库列表
- [ ] 创建仓库
- [ ] 更新仓库
- [ ] 删除仓库
- [ ] 获取启用仓库

---

## 🐛 常见问题

### 1. 401 Unauthorized

**原因**: Token未设置或已过期

**解决**: 
1. 重新登录获取Token
2. 点击"Authorize"设置Token

### 2. 400 Bad Request

**原因**: 请求参数错误

**解决**: 检查请求体格式和必填字段

### 3. 404 Not Found

**原因**: 接口路径错误或资源不存在

**解决**: 检查URL路径和资源ID

### 4. 500 Internal Server Error

**原因**: 服务器错误

**解决**: 
1. 检查服务器日志
2. 确认数据库已迁移
3. 确认测试数据已生成

---

## 💡 测试技巧

### 1. 使用Swagger的"Schemas"查看数据结构

页面底部有所有数据模型的定义，可以参考。

### 2. 保存常用请求

可以复制Swagger生成的curl命令，保存到文件中。

### 3. 批量测试

使用Postman或其他工具导入Swagger JSON进行批量测试。

### 4. 查看Response Headers

可以看到Content-Type、认证信息等。

---

## 🎯 下一步

测试完成后：

1. ✅ 确认所有API正常工作
2. ✅ 开始前端JavaScript对接
3. ✅ 实现前端数据展示
4. ✅ 添加用户交互功能

---

**现在就打开 http://localhost:8000/swagger/ 开始测试吧！** 🚀
