"""
仓库URL配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet

app_name = 'warehouses'

router = DefaultRouter()
router.register(r'', WarehouseViewSet, basename='warehouse')

urlpatterns = [
    path('', include(router.urls)),
]
