# 📦 库存管理系统 (Inventory Management System)

一个基于 Django + Django REST Framework 构建的现代化库存管理系统，提供完整的库存管理、出入库操作、仓库管理、供应商管理等功能。

## ✨ 功能特性

### 核心功能
- 🏠 **仪表盘** - 实时库存概览、趋势图表、类别分布、低库存预警
- 📦 **库存管理** - 物品CRUD、库存查询、批量操作、条形码支持
- 🏷️ **类别管理** - 商品分类管理、启用/停用状态控制
- 📥 **入库管理** - 入库记录、供应商关联、批量入库
- 📤 **出库管理** - 出库记录、领用人管理、批量出库
- 🔄 **库存调拨** - 仓库间调拨、调拨记录追踪
- 🏭 **仓库管理** - 多仓库支持、容量管理、使用率统计
- 👥 **供应商管理** - 供应商信息、联系方式、状态管理
- 📊 **报表分析** - 库存报表、出入库统计、趋势分析
- ⚙️ **系统设置** - 用户管理、权限控制、系统配置

### 技术特性
- 🔐 JWT Token 认证，支持"记住我"功能
- 📱 响应式设计，支持移动端访问
- 🔍 全局搜索功能
- 📷 扫码入库支持
- 🌙 现代化 UI 设计（Apple 风格）
- 📄 Swagger API 文档

## 🛠️ 技术栈

### 后端
- Python 3.10+
- Django 4.2
- Django REST Framework 3.14
- Django Simple JWT（认证）
- PostgreSQL / SQLite（数据库）
- Redis（缓存）
- Swagger/ReDoc（API文档）

### 前端
- HTML5 + CSS3
- Tailwind CSS
- JavaScript (ES6+)
- ECharts（图表）
- Font Awesome（图标）

## 📁 项目结构

```
inventory-system/
├── apps/                       # Django 应用模块
│   ├── authentication/         # 用户认证
│   ├── inventory/              # 库存管理
│   ├── operations/             # 出入库操作
│   ├── dashboard/              # 仪表盘
│   ├── suppliers/              # 供应商管理
│   ├── warehouses/             # 仓库管理
│   └── reports/                # 报表分析
├── common/                     # 公共模块
│   ├── exceptions.py           # 异常处理
│   ├── pagination.py           # 分页配置
│   └── responses.py            # 响应格式
├── config/                     # 项目配置
│   ├── settings.py             # Django 设置
│   ├── urls.py                 # URL 路由
│   └── wsgi.py                 # WSGI 配置
├── static/                     # 静态文件
│   ├── css/                    # 样式文件
│   ├── js/                     # JavaScript 文件
│   └── images/                 # 图片资源
├── templates/                  # HTML 模板
├── media/                      # 上传文件
├── requirements.txt            # Python 依赖
├── docker-compose.yml          # Docker 配置
├── Dockerfile                  # Docker 镜像
└── manage.py                   # Django 管理脚本
```

## 🚀 快速开始

### 环境要求
- Python 3.10+
- pip
- Git

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/yourusername/inventory-system.git
cd inventory-system
```

#### 2. 创建虚拟环境
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

#### 3. 安装依赖
```bash
pip install -r requirements.txt
```

#### 4. 配置环境变量
```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，配置数据库等信息
```

#### 5. 数据库迁移
```bash
python manage.py migrate
```

#### 6. 创建超级管理员
```bash
python manage.py createsuperuser
```

#### 7. 初始化示例数据（可选）
```bash
python init_project.py
```

#### 8. 启动开发服务器
```bash
python manage.py runserver
```

访问 http://127.0.0.1:8000 即可使用系统。


## 📖 使用指南

### 登录系统
1. 访问 http://127.0.0.1:8000/login/
2. 使用创建的管理员账号登录
3. 勾选"记住我"可保持7天登录状态

### 默认账号（如果运行了 init_project.py）
- 用户名：`admin`
- 密码：`admin123`

### 功能模块使用

#### 仪表盘
- 查看库存总览统计
- 查看库存趋势图表
- 查看类别分布饼图
- 查看最近活动记录
- 查看低库存预警物品

#### 库存物品
- 点击"添加物品"创建新物品
- 支持按类别筛选
- 支持搜索物品名称/编码
- 点击编辑/删除按钮管理物品

#### 类别管理
- 添加/编辑/删除商品类别
- 启用/停用类别状态
- 停用的类别不会出现在添加物品的选项中

#### 入库管理
- 点击"新增入库"记录入库
- 选择物品、仓库、供应商
- 输入入库数量和备注

#### 出库管理
- 点击"新增出库"记录出库
- 选择物品、输入数量
- 填写领用人信息

#### 仓库管理
- 添加/编辑/删除仓库
- 查看仓库容量和使用率
- 管理仓库状态

#### 供应商管理
- 添加/编辑/删除供应商
- 管理供应商联系信息
- 设置供应商状态

## 🔧 Django Admin 后台管理

Django Admin 是系统的后台管理界面，用于管理用户、数据和系统配置。

### 访问地址
```
http://127.0.0.1:8000/admin/
```

### 首次使用 - 创建超级管理员

首次部署系统后，需要创建一个超级管理员账号：

```bash
python manage.py createsuperuser
```

按提示输入：
- **用户名**：管理员登录名（如：admin）
- **邮箱**：管理员邮箱（可选，直接回车跳过）
- **密码**：管理员密码（输入时不显示，需输入两次确认）

示例：
```
用户名: admin
电子邮件地址: admin@example.com
Password: ********
Password (again): ********
Superuser created successfully.
```

### 用户管理详细操作

#### 1. 添加新用户

1. 登录 Admin 后台：http://127.0.0.1:8000/admin/
2. 点击左侧菜单 **"用户"** 或 **"Users"**
3. 点击右上角 **"添加用户"** 按钮
4. 填写用户信息：
   - **用户名**：登录用户名（必填）
   - **密码**：用户密码（必填，需输入两次）
5. 点击 **"保存并继续编辑"**
6. 在详细信息页面可以设置：
   - **名字/姓氏**：用户真实姓名
   - **电子邮件**：用户邮箱
   - **职员状态**：勾选后用户可以登录 Admin 后台
   - **超级用户状态**：勾选后拥有所有权限
   - **用户权限**：分配具体权限
   - **组**：将用户加入权限组
7. 点击 **"保存"** 完成创建

#### 2. 编辑用户

1. 在用户列表中点击要编辑的用户名
2. 修改需要更改的信息
3. 点击 **"保存"**

#### 3. 修改用户密码

1. 在用户编辑页面，点击密码字段旁的 **"此表单"** 链接
2. 输入新密码（两次）
3. 点击 **"更改密码"**

#### 4. 删除用户

1. 在用户列表中勾选要删除的用户
2. 在 **"动作"** 下拉框选择 **"删除所选的用户"**
3. 点击 **"执行"**
4. 确认删除

#### 5. 批量操作

- 勾选多个用户后，可以批量删除或修改状态
- 使用搜索框可以快速查找用户

### 数据管理

Admin 后台可以管理以下数据：

| 模块 | 功能 |
|------|------|
| **物品 (Items)** | 添加/编辑/删除库存物品 |
| **类别 (Categories)** | 管理商品分类 |
| **仓库 (Warehouses)** | 管理仓库信息 |
| **供应商 (Suppliers)** | 管理供应商信息 |
| **操作记录 (Operations)** | 查看出入库记录 |

### 权限说明

| 权限类型 | 说明 |
|----------|------|
| **超级用户** | 拥有所有权限，可以管理其他用户 |
| **职员** | 可以登录 Admin 后台，权限由分配决定 |
| **普通用户** | 只能使用前台系统，无法访问 Admin |

### 常用操作快捷方式

```bash
# 创建超级管理员
python manage.py createsuperuser

# 修改用户密码（命令行方式）
python manage.py changepassword <用户名>

# 查看所有用户（Django Shell）
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.all()
```

## 📡 API 文档

### Swagger UI
访问 http://127.0.0.1:8000/swagger/ 查看交互式 API 文档

### ReDoc
访问 http://127.0.0.1:8000/redoc/ 查看 API 文档

### 主要 API 端点

| 模块 | 端点 | 说明 |
|------|------|------|
| 认证 | `/api/auth/login/` | 用户登录 |
| 认证 | `/api/auth/register/` | 用户注册 |
| 认证 | `/api/auth/profile/` | 用户信息 |
| 库存 | `/api/inventory/items/` | 物品管理 |
| 库存 | `/api/inventory/categories/` | 类别管理 |
| 操作 | `/api/operations/` | 出入库记录 |
| 操作 | `/api/operations/inbound/` | 入库操作 |
| 操作 | `/api/operations/outbound/` | 出库操作 |
| 仪表盘 | `/api/dashboard/overview/` | 概览数据 |
| 仪表盘 | `/api/dashboard/trend/` | 趋势数据 |
| 仓库 | `/api/warehouses/` | 仓库管理 |
| 供应商 | `/api/suppliers/` | 供应商管理 |
| 报表 | `/api/reports/` | 报表数据 |

### API 认证
所有 API 请求需要在 Header 中携带 JWT Token：
```
Authorization: Bearer <your_token>
```

### 环境变量配置
在 `docker-compose.yml` 中配置：
- `SECRET_KEY` - Django 密钥
- `DEBUG` - 调试模式
- `DB_*` - 数据库配置
- `REDIS_URL` - Redis 地址

## ⚙️ 配置说明

### 环境变量 (.env)

```env
# Django 配置
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 数据库配置（SQLite）
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# 数据库配置（PostgreSQL）
# DB_ENGINE=django.db.backends.postgresql
# DB_NAME=inventory_db
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432

# Redis 缓存
REDIS_URL=redis://localhost:6379/0
```

### 用户角色权限

| 角色 | 权限说明 |
|------|----------|
| admin | 管理员，拥有所有权限 |
| manager | 仓库管理员，可管理库存和操作 |
| operator | 操作员，可执行出入库操作 |
| viewer | 查看者，只能查看数据 |

## 🔒 安全建议

### 生产环境部署
1. 设置 `DEBUG=False`
2. 更换 `SECRET_KEY`
3. 配置 `ALLOWED_HOSTS`
4. 使用 HTTPS
5. 配置防火墙
6. 定期备份数据库

### 密码策略
- 建议使用强密码
- 定期更换密码
- 启用登录失败锁定

## 📝 开发说明

### 代码规范
- 遵循 PEP 8 Python 代码规范
- 使用 ESLint 检查 JavaScript 代码
- 提交前运行测试

### 运行测试
```bash
# 运行所有测试
python manage.py test

# 使用 pytest
pytest
```

### 数据库迁移
```bash
# 创建迁移文件
python manage.py makemigrations

# 执行迁移
python manage.py migrate
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请提交 Issue 或联系开发者。

---

⭐ 如果这个项目对你有帮助，请给一个 Star！
