"""
仪表盘URL配置
"""
from django.urls import path
from .views import (
    DashboardOverviewView,
    DashboardChartsView,
    DashboardRecentActivitiesView,
    DashboardLowStockView,
    DashboardTrendView,
    DashboardDistributionView,
    SystemInfoView
)

app_name = 'dashboard'

urlpatterns = [
    path('overview/', DashboardOverviewView.as_view(), name='overview'),
    path('charts/', DashboardChartsView.as_view(), name='charts'),
    path('trend/', DashboardTrendView.as_view(), name='trend'),
    path('distribution/', DashboardDistributionView.as_view(), name='distribution'),
    path('activities/', DashboardRecentActivitiesView.as_view(), name='activities'),
    path('low-stock/', DashboardLowStockView.as_view(), name='low-stock'),
    path('system-info/', SystemInfoView.as_view(), name='system-info'),
]
