"""
URL configuration for inventory_system project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Swagger API文档配置
schema_view = get_schema_view(
    openapi.Info(
        title="库存管理系统 API",
        default_version='v1',
        description="库存管理系统后端API文档",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="admin@example.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # 前端页面
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('login/', TemplateView.as_view(template_name='login.html'), name='login'),
    path('test/', TemplateView.as_view(template_name='test.html'), name='test'),
    path('debug/', TemplateView.as_view(template_name='debug.html'), name='debug'),
    path('test-warehouse/', TemplateView.as_view(template_name='test_warehouse.html'), name='test_warehouse'),
    
    # API endpoints
    path('api/auth/', include('apps.authentication.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/operations/', include('apps.operations.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/suppliers/', include('apps.suppliers.urls')),
    path('api/warehouses/', include('apps.warehouses.urls')),
    path('api/reports/', include('apps.reports.urls')),
    
    # API文档
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# 开发环境下提供媒体文件访问
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
