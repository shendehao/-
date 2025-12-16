@echo off
REM 设置代码页为UTF-8
chcp 65001 >nul

cls
echo ========================================
echo    库存管理系统 - 快速启动
echo ========================================
echo.

REM 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)

REM 检查虚拟环境
if not exist "venv" (
    echo [1/8] 正在创建虚拟环境...
    python -m venv venv
    if errorlevel 1 (
        echo [错误] 创建虚拟环境失败
        pause
        exit /b 1
    )
    echo [完成] 虚拟环境创建成功
) else (
    echo [1/8] 虚拟环境已存在
)

REM 激活虚拟环境
echo [2/8] 正在激活虚拟环境...
call venv\Scripts\activate
if errorlevel 1 (
    echo [错误] 激活虚拟环境失败
    pause
    exit /b 1
)

REM 安装依赖
echo [3/8] 正在安装依赖包（这可能需要几分钟）...
pip install -r requirements.txt -q
if errorlevel 1 (
    echo [警告] 部分依赖安装失败，尝试继续...
)

REM 初始化项目结构
echo [4/8] 正在初始化项目结构...
python init_project.py
if errorlevel 1 (
    echo [警告] 项目结构初始化失败，尝试继续...
)

REM 创建.env文件
if not exist ".env" (
    echo [5/8] 正在创建环境配置文件...
    copy .env.example .env >nul
    echo [完成] 环境配置文件创建成功
) else (
    echo [5/8] 环境配置文件已存在
)

REM 数据库迁移
echo [6/8] 正在执行数据库迁移...
python manage.py makemigrations
python manage.py migrate
if errorlevel 1 (
    echo [错误] 数据库迁移失败
    pause
    exit /b 1
)

REM 初始化测试数据
echo [7/8] 正在初始化测试数据...
python setup_database.py
if errorlevel 1 (
    echo [警告] 测试数据初始化失败（可能已存在）
)

REM 启动服务器
echo [8/8] 正在启动开发服务器...
echo.
echo ========================================
echo   服务器启动成功！
echo ========================================
echo.
echo   访问地址:
echo   - 前端界面: http://localhost:8000
echo   - API文档:  http://localhost:8000/swagger/
echo   - 管理后台: http://localhost:8000/admin/
echo.
echo   测试账号:
echo   - 用户名: admin
echo   - 密码:   admin123
echo.
echo ========================================
echo   按 Ctrl+C 停止服务器
echo ========================================
echo.

python manage.py runserver
