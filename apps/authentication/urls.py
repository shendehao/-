"""
用户认证路由
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'authentication'

urlpatterns = [
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('logout/', views.logout, name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('change-password/', views.change_password, name='change_password'),
    
    # 黑名单管理
    path('blacklist/', views.blacklist_list, name='blacklist_list'),
    path('blacklist/add/', views.blacklist_add, name='blacklist_add'),
    path('blacklist/remove/', views.blacklist_remove, name='blacklist_remove'),
    path('blacklist/clear/', views.blacklist_clear, name='blacklist_clear'),
]
