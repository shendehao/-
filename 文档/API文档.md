# 库存管理系统 API 文档

## 📌 基本信息

- **Base URL**: `http://localhost:8000/api`
- **认证方式**: JWT Token
- **数据格式**: JSON
- **字符编码**: UTF-8

---

## 🔐 认证接口

### 1. 用户登录

**接口地址**: `POST /auth/login/`

**请求参数**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "name": "管理员"
    }
  }
}
```

### 2. 用户登出

**接口地址**: `POST /auth/logout/`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 3. 刷新Token

**接口地址**: `POST /auth/refresh/`

**请求参数**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📊 仪表盘接口

### 1. 获取统计数据

**接口地址**: `GET /dashboard/stats/`

**响应示例**:
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

### 2. 获取库存趋势

**接口地址**: `GET /dashboard/trend/`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| period | string | 否 | 时间周期: monthly(默认)/quarterly/yearly |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "labels": ["1月", "2月", "3月", "4月", "5月", "6月"],
    "datasets": [
      {
        "name": "入库",
        "data": [120, 190, 130, 240, 180, 210]
      },
      {
        "name": "出库",
        "data": [90, 160, 110, 200, 150, 180]
      }
    ]
  }
}
```

### 3. 获取类别分布

**接口地址**: `GET /dashboard/category-distribution/`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "name": "电子设备",
      "value": 350,
      "percentage": 27.3
    },
    {
      "name": "办公用品",
      "value": 280,
      "percentage": 21.8
    },
    {
      "name": "原材料",
      "value": 220,
      "percentage": 17.1
    },
    {
      "name": "成品",
      "value": 200,
      "percentage": 15.6
    },
    {
      "name": "包装材料",
      "value": 150,
      "percentage": 11.7
    },
    {
      "name": "其他",
      "value": 84,
      "percentage": 6.5
    }
  ]
}
```

### 4. 获取最近活动

**接口地址**: `GET /dashboard/recent-activity/`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | integer | 否 | 返回数量，默认10 |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "item": {
        "name": "无线鼠标",
        "code": "WM-200",
        "image": "https://example.com/images/mouse.jpg"
      },
      "operation_type": "in",
      "operation_type_display": "入库",
      "quantity": 50,
      "operator": "张明",
      "created_at": "2024-12-05T09:45:00Z",
      "created_at_display": "今天 09:45"
    },
    {
      "id": 2,
      "item": {
        "name": "机械键盘",
        "code": "KB-500",
        "image": "https://example.com/images/keyboard.jpg"
      },
      "operation_type": "out",
      "operation_type_display": "出库",
      "quantity": 15,
      "operator": "李华",
      "created_at": "2024-12-04T14:20:00Z",
      "created_at_display": "昨天 14:20"
    }
  ]
}
```

### 5. 获取低库存物品

**接口地址**: `GET /dashboard/low-stock/`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "笔记本电脑包",
      "code": "BAG-001",
      "image": "https://example.com/images/bag.jpg",
      "current_stock": 5,
      "min_stock": 10,
      "shortage": 5
    },
    {
      "id": 2,
      "name": "HDMI线缆",
      "code": "HDMI-002",
      "image": "https://example.com/images/hdmi.jpg",
      "current_stock": 8,
      "min_stock": 15,
      "shortage": 7
    }
  ]
}
```

---

## 📦 物品管理接口

### 1. 获取物品列表

**接口地址**: `GET /items/`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认20 |
| search | string | 否 | 搜索关键词（物品名称、编码） |
| category | integer | 否 | 类别ID |
| supplier | integer | 否 | 供应商ID |
| low_stock | boolean | 否 | 仅显示低库存物品 |
| sort_by | string | 否 | 排序字段: name/code/stock/price |
| order | string | 否 | 排序方向: asc/desc |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "count": 1284,
    "next": "http://localhost:8000/api/items/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "无线鼠标",
        "code": "WM-200",
        "category": {
          "id": 1,
          "name": "电子设备"
        },
        "supplier": {
          "id": 1,
          "name": "科技配件供应商"
        },
        "price": 89.00,
        "stock": 150,
        "min_stock": 20,
        "warehouse_location": "A区-01-05",
        "description": "罗技无线鼠标，2.4G连接",
        "image": "https://example.com/media/items/mouse.jpg",
        "status": "normal",
        "created_at": "2024-11-01T10:00:00Z",
        "updated_at": "2024-12-05T09:45:00Z"
      }
    ]
  }
}
```

### 2. 添加物品

**接口地址**: `POST /items/`

**请求参数**:
```json
{
  "name": "无线鼠标",
  "code": "WM-200",
  "category_id": 1,
  "supplier_id": 1,
  "price": 89.00,
  "stock": 150,
  "min_stock": 20,
  "warehouse_location": "A区-01-05",
  "description": "罗技无线鼠标，2.4G连接",
  "image": "base64_encoded_image_or_file_upload"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "物品添加成功",
  "data": {
    "id": 1,
    "name": "无线鼠标",
    "code": "WM-200",
    "created_at": "2024-12-05T10:00:00Z"
  }
}
```

### 3. 获取物品详情

**接口地址**: `GET /items/{id}/`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "无线鼠标",
    "code": "WM-200",
    "category": {
      "id": 1,
      "name": "电子设备"
    },
    "supplier": {
      "id": 1,
      "name": "科技配件供应商",
      "contact": "张经理",
      "phone": "13800138000"
    },
    "price": 89.00,
    "stock": 150,
    "min_stock": 20,
    "warehouse_location": "A区-01-05",
    "description": "罗技无线鼠标，2.4G连接",
    "image": "https://example.com/media/items/mouse.jpg",
    "status": "normal",
    "created_at": "2024-11-01T10:00:00Z",
    "updated_at": "2024-12-05T09:45:00Z",
    "inventory_history": [
      {
        "operation_type": "in",
        "quantity": 50,
        "operator": "张明",
        "created_at": "2024-12-05T09:45:00Z"
      }
    ]
  }
}
```

### 4. 更新物品

**接口地址**: `PUT /items/{id}/` 或 `PATCH /items/{id}/`

**请求参数** (PATCH可部分更新):
```json
{
  "name": "无线鼠标 Pro",
  "price": 99.00,
  "stock": 200
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "物品更新成功",
  "data": {
    "id": 1,
    "name": "无线鼠标 Pro",
    "updated_at": "2024-12-05T11:00:00Z"
  }
}
```

### 5. 删除物品

**接口地址**: `DELETE /items/{id}/`

**响应示例**:
```json
{
  "success": true,
  "message": "物品删除成功"
}
```

### 6. 上传物品图片

**接口地址**: `POST /items/upload-image/`

**请求类型**: `multipart/form-data`

**请求参数**:
```
image: [File]
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/media/items/20241205_123456.jpg",
    "filename": "20241205_123456.jpg"
  }
}
```

---

## 📥📤 出入库管理接口

### 1. 入库操作

**接口地址**: `POST /inventory/in/`

**请求参数**:
```json
{
  "item_id": 1,
  "quantity": 50,
  "supplier_id": 1,
  "warehouse_location": "A区-01-05",
  "notes": "新到货批次",
  "operator": "张明"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "入库成功",
  "data": {
    "id": 1,
    "item": {
      "id": 1,
      "name": "无线鼠标",
      "code": "WM-200"
    },
    "quantity": 50,
    "new_stock": 200,
    "created_at": "2024-12-05T10:00:00Z"
  }
}
```

### 2. 出库操作

**接口地址**: `POST /inventory/out/`

**请求参数**:
```json
{
  "item_id": 1,
  "quantity": 15,
  "recipient": "李华",
  "department": "销售部",
  "purpose": "客户订单",
  "notes": "订单号: ORD-20241205-001",
  "operator": "王芳"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "出库成功",
  "data": {
    "id": 2,
    "item": {
      "id": 1,
      "name": "无线鼠标",
      "code": "WM-200"
    },
    "quantity": 15,
    "new_stock": 185,
    "created_at": "2024-12-05T11:00:00Z"
  }
}
```

### 3. 库存调拨

**接口地址**: `POST /inventory/transfer/`

**请求参数**:
```json
{
  "item_id": 1,
  "quantity": 8,
  "from_warehouse": "A区-01-05",
  "to_warehouse": "B区-02-10",
  "reason": "仓库优化",
  "operator": "赵伟"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "调拨成功",
  "data": {
    "id": 3,
    "item": {
      "id": 1,
      "name": "无线鼠标"
    },
    "quantity": 8,
    "from_warehouse": "A区-01-05",
    "to_warehouse": "B区-02-10",
    "created_at": "2024-12-05T12:00:00Z"
  }
}
```

### 4. 获取操作历史

**接口地址**: `GET /inventory/history/`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| item_id | integer | 否 | 物品ID |
| operation_type | string | 否 | 操作类型: in/out/transfer |
| start_date | date | 否 | 开始日期 YYYY-MM-DD |
| end_date | date | 否 | 结束日期 YYYY-MM-DD |
| operator | string | 否 | 操作人员 |
| page | integer | 否 | 页码 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "count": 156,
    "results": [
      {
        "id": 1,
        "item": {
          "id": 1,
          "name": "无线鼠标",
          "code": "WM-200"
        },
        "operation_type": "in",
        "operation_type_display": "入库",
        "quantity": 50,
        "operator": "张明",
        "notes": "新到货批次",
        "created_at": "2024-12-05T10:00:00Z"
      }
    ]
  }
}
```

---

## 🏷️ 类别管理接口

### 1. 获取类别列表

**接口地址**: `GET /categories/`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "电子设备",
      "code": "electronics",
      "description": "电子产品及配件",
      "item_count": 350
    },
    {
      "id": 2,
      "name": "办公用品",
      "code": "office",
      "description": "办公文具及用品",
      "item_count": 280
    }
  ]
}
```

### 2. 添加类别

**接口地址**: `POST /categories/`

**请求参数**:
```json
{
  "name": "电子设备",
  "code": "electronics",
  "description": "电子产品及配件"
}
```

---

## 👥 供应商管理接口

### 1. 获取供应商列表

**接口地址**: `GET /suppliers/`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "科技配件供应商",
      "code": "SUP-001",
      "contact": "张经理",
      "phone": "13800138000",
      "email": "zhang@supplier.com",
      "address": "深圳市南山区科技园",
      "status": "active",
      "item_count": 45
    }
  ]
}
```

### 2. 添加供应商

**接口地址**: `POST /suppliers/`

**请求参数**:
```json
{
  "name": "科技配件供应商",
  "code": "SUP-001",
  "contact": "张经理",
  "phone": "13800138000",
  "email": "zhang@supplier.com",
  "address": "深圳市南山区科技园"
}
```

---

## 🏭 仓库管理接口

### 1. 获取仓库列表

**接口地址**: `GET /warehouses/`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "主仓库",
      "code": "WH-001",
      "location": "深圳市宝安区",
      "capacity": 10000,
      "current_usage": 6500,
      "usage_rate": 65.0,
      "manager": "王经理",
      "phone": "13900139000"
    }
  ]
}
```

---

## 📈 报表分析接口

### 1. 库存报表

**接口地址**: `GET /reports/inventory/`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | date | 是 | 开始日期 |
| end_date | date | 是 | 结束日期 |
| category_id | integer | 否 | 类别ID |
| format | string | 否 | 导出格式: json/excel/pdf |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_in": 1250,
      "total_out": 980,
      "net_change": 270
    },
    "by_category": [
      {
        "category": "电子设备",
        "in_count": 450,
        "out_count": 320,
        "net_change": 130
      }
    ]
  }
}
```

### 2. 周转率报表

**接口地址**: `GET /reports/turnover/`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "overall_rate": 12.8,
    "by_category": [
      {
        "category": "电子设备",
        "turnover_rate": 15.2,
        "average_days": 24
      }
    ]
  }
}
```

---

## ❌ 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 禁止访问，权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如编码重复） |
| 500 | 服务器内部错误 |

**错误响应格式**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "请求参数错误",
    "details": {
      "name": ["此字段不能为空"],
      "price": ["请输入有效的数字"]
    }
  }
}
```

---

## 📝 请求示例

### JavaScript (Fetch API)

```javascript
// 获取物品列表
fetch('http://localhost:8000/api/items/', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));

// 添加物品
fetch('http://localhost:8000/api/items/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '无线鼠标',
    code: 'WM-200',
    category_id: 1,
    price: 89.00,
    stock: 150
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Python (Requests)

```python
import requests

# 登录
response = requests.post('http://localhost:8000/api/auth/login/', json={
    'username': 'admin',
    'password': 'password123'
})
token = response.json()['data']['token']

# 获取物品列表
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:8000/api/items/', headers=headers)
items = response.json()['data']['results']
```

### Flutter (Dart)

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

// 获取物品列表
Future<List<Item>> fetchItems(String token) async {
  final response = await http.get(
    Uri.parse('http://localhost:8000/api/items/'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return (data['data']['results'] as List)
        .map((item) => Item.fromJson(item))
        .toList();
  } else {
    throw Exception('Failed to load items');
  }
}
```

---

## 🔄 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2024-12-05 | 初始版本 |

---

## 📞 技术支持

如有问题，请联系开发团队。
