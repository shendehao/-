"""
出入库URL配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryOperationViewSet

app_name = 'operations'

router = DefaultRouter()
router.register(r'', InventoryOperationViewSet, basename='operation')

urlpatterns = [
    path('', include(router.urls)),
]
