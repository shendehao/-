# 库存管理系统

一个功能完整的库存管理系统，支持Web端和移动端（Flutter）。

## 技术栈

### 后端
- **框架**: Django 4.2 + Django REST Framework
- **认证**: JWT Token
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **缓存**: Redis
- **部署**: Docker + Gunicorn + Nginx

### 前端
- **Web端**: HTML + TailwindCSS + Vue.js + ECharts
- **移动端**: Flutter (iOS + Android)

## 功能特性

- ✅ 用户认证和权限管理
- ✅ 物品管理（增删改查）
- ✅ 出入库管理
- ✅ 库存调拨
- ✅ 低库存预警
- ✅ 数据统计和可视化
- ✅ 供应商管理
- ✅ 仓库管理
- ✅ 报表导出

## 快速开始

### 1. 环境要求

- Python 3.11+
- PostgreSQL 15+ (可选，开发环境可用SQLite)
- Redis 7+ (可选)

### 2. 安装依赖

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
copy .env.example .env

# 编辑.env文件，修改配置
```

### 4. 初始化数据库

```bash
# 创建数据库迁移
python manage.py makemigrations

# 执行迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 加载测试数据（可选）
python manage.py loaddata fixtures/initial_data.json
```

### 5. 启动开发服务器

```bash
python manage.py runserver
```

访问：
- 前端界面: http://localhost:8000/
- API文档: http://localhost:8000/swagger/
- 管理后台: http://localhost:8000/admin/

## Docker部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## API文档

详细的API文档请查看：
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/
- 文档文件: [API文档.md](./API文档.md)

## 项目结构

```
inventory_system/
├── config/              # 项目配置
├── apps/                # 应用模块
│   ├── authentication/  # 用户认证
│   ├── inventory/       # 库存管理
│   ├── operations/      # 出入库操作
│   ├── dashboard/       # 仪表盘
│   ├── suppliers/       # 供应商
│   ├── warehouses/      # 仓库
│   └── reports/         # 报表
├── common/              # 公共模块
├── static/              # 静态文件
├── media/               # 媒体文件
└── templates/           # 模板文件
```

## 开发指南

详细的开发文档请查看：[后端开发文档.md](./后端开发文档.md)

## 测试

```bash
# 运行所有测试
python manage.py test

# 使用pytest
pytest

# 生成覆盖率报告
pytest --cov=apps
```

## 许可证

MIT License

## 技术支持

如有问题，请提交Issue或联系开发团队。
