"""
仓库管理管理后台
"""
from django.contrib import admin
from .models import Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    """仓库管理"""
    list_display = ['name', 'code', 'location', 'manager', 'phone', 'capacity', 'current_usage', 'usage_rate', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code', 'location', 'manager']
    ordering = ['-created_at']
    list_editable = ['is_active']
    readonly_fields = ['created_at', 'updated_at', 'current_usage', 'usage_rate']
    
    fieldsets = (
        ('基本信息', {'fields': ('name', 'code', 'location')}),
        ('联系信息', {'fields': ('manager', 'phone')}),
        ('容量信息', {'fields': ('capacity', 'current_usage', 'usage_rate')}),
        ('状态', {'fields': ('is_active',)}),
        ('时间信息', {'fields': ('created_at', 'updated_at')}),
    )
    
    def current_usage(self, obj):
        return obj.current_usage
    current_usage.short_description = '当前使用量'
    
    def usage_rate(self, obj):
        return f"{obj.usage_rate}%"
    usage_rate.short_description = '使用率'
