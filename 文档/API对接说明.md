# 📡 API对接说明

## 🎯 当前状态

你看到的数据是**模拟数据**，这是正常的！系统已经准备好API对接，只需要配置后端地址即可。

## 🔄 数据模式

### 模拟数据模式（当前）
- ✅ 无需后端即可运行
- ✅ 展示完整UI和交互
- ✅ 用于前端开发和演示
- ⚠️ 数据不会保存

### 真实API模式
- ✅ 连接真实后端
- ✅ 数据持久化
- ✅ 完整业务逻辑
- ⚠️ 需要后端服务运行

## 🚀 快速切换到真实API

### 方法1：修改配置文件（推荐）

打开 `js/api-config.js`，修改第11行：

```javascript
// 改为 false 使用真实API
USE_MOCK_DATA: false,
```

### 方法2：浏览器控制台切换

按 **F12** 打开控制台，输入：

```javascript
// 切换到真实API
ApiConfig.useMockData(false);

// 切换回模拟数据
ApiConfig.useMockData(true);

// 然后刷新页面
location.reload();
```

### 方法3：修改 dashboard-loader.js

打开 `js/dashboard-loader.js`，修改第8行：

```javascript
const USE_MOCK_DATA = false; // 改为 false
```

## ⚙️ 配置后端地址

### 1. 修改API基础URL

打开 `js/api-config.js`，修改第9行：

```javascript
// 修改为你的后端地址
API_BASE_URL: 'http://your-backend-server.com/api',
```

常见配置示例：

```javascript
// 本地开发
API_BASE_URL: 'http://localhost:8000/api',

// 测试服务器
API_BASE_URL: 'http://192.168.1.100:8000/api',

// 生产服务器
API_BASE_URL: 'https://api.yourdomain.com/api',
```

### 2. 配置Token（如果需要）

如果后端需要认证，在浏览器控制台设置Token：

```javascript
// 设置Token
ApiConfig.setToken('your-jwt-token-here');

// 查看Token
ApiConfig.getToken();

// 清除Token
ApiConfig.clearToken();
```

## 📋 后端API接口要求

根据 `API文档.md`，后端需要提供以下接口：

### 仪表盘接口

#### 1. 获取统计数据
```
GET /api/dashboard/stats/
```

响应格式：
```json
{
  "success": true,
  "data": {
    "total_items": {
      "count": 1284,
      "change_percent": 12,
      "trend": "up"
    },
    "low_stock_items": {
      "count": 36,
      "change_percent": 8,
      "trend": "up"
    },
    "total_value": {
      "amount": 286450.00,
      "change_percent": 5,
      "trend": "up"
    },
    "turnover_rate": {
      "rate": 12.8,
      "change_percent": -2,
      "trend": "down"
    }
  }
}
```

#### 2. 获取趋势数据
```
GET /api/dashboard/trend/
```

响应格式：
```json
{
  "success": true,
  "data": {
    "labels": ["1月", "2月", "3月", "4月", "5月", "6月"],
    "datasets": [
      {
        "label": "入库",
        "data": [120, 190, 130, 240, 180, 210],
        "color": "#34C759"
      },
      {
        "label": "出库",
        "data": [90, 160, 110, 200, 150, 180],
        "color": "#FF3B30"
      }
    ]
  }
}
```

#### 3. 获取类别分布
```
GET /api/dashboard/categories/
```

响应格式：
```json
{
  "success": true,
  "data": [
    {
      "name": "电子设备",
      "value": 450,
      "color": "#007AFF"
    },
    {
      "name": "办公用品",
      "value": 320,
      "color": "#5AC8FA"
    }
  ]
}
```

#### 4. 获取最近活动
```
GET /api/dashboard/activities/
```

响应格式：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "inbound",
      "item_name": "笔记本电脑包",
      "quantity": 50,
      "operator": "王芳",
      "time": "2小时前"
    }
  ]
}
```

#### 5. 获取低库存物品
```
GET /api/dashboard/low-stock/
```

响应格式：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "USB数据线",
      "code": "USB-100",
      "stock": 8,
      "min_stock": 20,
      "warehouse": "主仓库"
    }
  ]
}
```

## 🧪 测试步骤

### 1. 启动后端服务

确保你的Django后端正在运行：

```bash
cd your-backend-directory
python manage.py runserver 0.0.0.0:8000
```

### 2. 配置前端

修改 `js/api-config.js`：

```javascript
API_BASE_URL: 'http://localhost:8000/api',
USE_MOCK_DATA: false,
```

### 3. 启动前端服务

```bash
cd d:\wwwoot\库存管理系统
python -m http.server 8080
```

### 4. 访问测试

打开浏览器访问：
```
http://localhost:8080/templates/index.html
```

### 5. 检查控制台

按 **F12** 打开开发者工具，查看：

- **Console标签**：查看API请求日志
- **Network标签**：查看HTTP请求状态

## 🔍 调试技巧

### 查看API请求日志

控制台会显示详细日志：

```
📘 API请求: GET /dashboard/stats/
✅ API响应成功: {...}
```

或者：

```
❌ API请求失败: HTTP 404: Not Found
⚠️ 使用模拟数据
```

### 手动测试API

在控制台输入：

```javascript
// 测试获取统计数据
ApiConfig.get('/dashboard/stats/').then(console.log);

// 测试获取物品列表
ApiConfig.get('/items/').then(console.log);

// 测试创建物品
ApiConfig.post('/items/', {
  name: '测试物品',
  code: 'TEST-001',
  price: 100
}).then(console.log);
```

### 查看当前配置

```javascript
// 查看完整配置
console.log(ApiConfig.config);

// 查看API地址
console.log(ApiConfig.config.API_BASE_URL);

// 查看是否使用模拟数据
console.log(ApiConfig.config.USE_MOCK_DATA);

// 查看Token
console.log(ApiConfig.getToken());
```

## 🐛 常见问题

### 1. CORS跨域错误

**问题**：控制台显示 `Access-Control-Allow-Origin` 错误

**解决**：在Django后端安装并配置 `django-cors-headers`

```bash
pip install django-cors-headers
```

```python
# settings.py
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",
]
```

### 2. 401未授权错误

**问题**：API返回401状态码

**解决**：设置正确的Token

```javascript
// 先登录获取Token
ApiConfig.post('/auth/login/', {
  username: 'admin',
  password: 'password'
}).then(response => {
  if (response.success) {
    ApiConfig.setToken(response.data.token);
    location.reload();
  }
});
```

### 3. 数据格式不匹配

**问题**：后端返回的数据格式与前端期望不一致

**解决**：修改后端序列化器，确保返回格式符合上面的接口要求

### 4. 请求超时

**问题**：请求时间过长导致超时

**解决**：修改 `js/api-config.js` 中的超时时间

```javascript
REQUEST_TIMEOUT: 30000, // 改为30秒
```

## 📝 开发建议

### 1. 先用模拟数据开发UI

```javascript
USE_MOCK_DATA: true,  // 开发阶段使用模拟数据
```

### 2. 后端就绪后切换真实API

```javascript
USE_MOCK_DATA: false, // 切换到真实API
```

### 3. 生产环境关闭调试日志

```javascript
DEBUG: false, // 生产环境关闭日志
```

## 🎯 下一步

1. ✅ **当前**：使用模拟数据展示UI
2. ⏳ **下一步**：配置后端API地址
3. ⏳ **然后**：切换到真实API模式
4. ⏳ **最后**：测试所有功能

## 📞 需要帮助？

如果遇到问题：

1. 检查控制台错误信息
2. 查看Network标签的请求详情
3. 确认后端服务正在运行
4. 确认API地址配置正确
5. 确认CORS已正确配置

---

**当前状态**: ✅ 模拟数据模式（正常）  
**下一步**: 配置后端地址并切换到真实API  
**文档版本**: v1.0.0  
**更新时间**: 2024-12-06
