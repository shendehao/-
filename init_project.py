"""
项目初始化脚本 - 创建所有必要的应用模块文件
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# 定义应用结构
APPS = {
    'inventory': '库存管理',
    'operations': '出入库操作',
    'dashboard': '仪表盘',
    'suppliers': '供应商管理',
    'warehouses': '仓库管理',
    'reports': '报表分析',
}

# 每个应用需要的文件
APP_FILES = [
    '__init__.py',
    'models.py',
    'serializers.py',
    'views.py',
    'urls.py',
    'admin.py',
    'apps.py',
    'tests.py',
]

def create_app_structure():
    """创建应用结构"""
    apps_dir = BASE_DIR / 'apps'
    
    for app_name, app_verbose_name in APPS.items():
        app_dir = apps_dir / app_name
        app_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"创建应用: {app_name} ({app_verbose_name})")
        
        for filename in APP_FILES:
            file_path = app_dir / filename
            
            if not file_path.exists():
                if filename == '__init__.py':
                    file_path.write_text('', encoding='utf-8')
                elif filename == 'apps.py':
                    class_name = ''.join(word.capitalize() for word in app_name.split('_')) + 'Config'
                    content = f'''from django.apps import AppConfig


class {class_name}(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.{app_name}'
    verbose_name = '{app_verbose_name}'
'''
                    file_path.write_text(content, encoding='utf-8')
                elif filename == 'models.py':
                    content = f'''"""
{app_verbose_name}模型
"""
from django.db import models

# 在这里定义你的模型
'''
                    file_path.write_text(content, encoding='utf-8')
                elif filename == 'serializers.py':
                    content = f'''"""
{app_verbose_name}序列化器
"""
from rest_framework import serializers

# 在这里定义你的序列化器
'''
                    file_path.write_text(content, encoding='utf-8')
                elif filename == 'views.py':
                    content = f'''"""
{app_verbose_name}视图
"""
from rest_framework import viewsets
from common.responses import APIResponse

# 在这里定义你的视图
'''
                    file_path.write_text(content, encoding='utf-8')
                elif filename == 'urls.py':
                    content = f'''"""
{app_verbose_name}路由
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = '{app_name}'

router = DefaultRouter()
# router.register(r'', YourViewSet, basename='your-model')

urlpatterns = [
    path('', include(router.urls)),
]
'''
                    file_path.write_text(content, encoding='utf-8')
                elif filename == 'admin.py':
                    content = f'''"""
{app_verbose_name}管理后台
"""
from django.contrib import admin

# 在这里注册你的模型到管理后台
'''
                    file_path.write_text(content, encoding='utf-8')
                elif filename == 'tests.py':
                    content = f'''"""
{app_verbose_name}测试
"""
from django.test import TestCase

# 在这里编写你的测试用例
'''
                    file_path.write_text(content, encoding='utf-8')
                
                print(f"  ✓ 创建文件: {filename}")
        
        print()

def create_directories():
    """创建必要的目录"""
    directories = [
        'static/css',
        'static/js',
        'static/images',
        'media/items',
        'media/avatars',
        'templates',
    ]
    
    for directory in directories:
        dir_path = BASE_DIR / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"✓ 创建目录: {directory}")
    
    print()

def move_index_html():
    """移动index.html到templates目录"""
    source = BASE_DIR / 'index.html'
    target = BASE_DIR / 'templates' / 'index.html'
    
    if source.exists() and not target.exists():
        import shutil
        shutil.copy(source, target)
        print(f"✓ 复制 index.html 到 templates 目录")
    print()

def create_env_file():
    """创建.env文件"""
    env_file = BASE_DIR / '.env'
    env_example = BASE_DIR / '.env.example'
    
    if env_example.exists() and not env_file.exists():
        import shutil
        shutil.copy(env_example, env_file)
        print("✓ 创建 .env 文件")
    print()

if __name__ == '__main__':
    print("=" * 60)
    print("开始初始化项目...")
    print("=" * 60)
    print()
    
    create_app_structure()
    create_directories()
    move_index_html()
    create_env_file()
    
    print("=" * 60)
    print("项目初始化完成！")
    print("=" * 60)
    print()
    print("下一步操作：")
    print("1. 创建虚拟环境: python -m venv venv")
    print("2. 激活虚拟环境: venv\\Scripts\\activate (Windows)")
    print("3. 安装依赖: pip install -r requirements.txt")
    print("4. 运行迁移: python manage.py makemigrations")
    print("5. 应用迁移: python manage.py migrate")
    print("6. 创建超级用户: python manage.py createsuperuser")
    print("7. 启动服务器: python manage.py runserver")
    print()
