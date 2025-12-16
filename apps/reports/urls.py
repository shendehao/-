"""
报表分析路由
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'reports'

router = DefaultRouter()
# router.register(r'', YourViewSet, basename='your-model')

urlpatterns = [
    path('', include(router.urls)),
]
