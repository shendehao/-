"""
供应商管理管理后台
"""
from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    """供应商管理"""
    list_display = ['name', 'code', 'contact', 'phone', 'email', 'status', 'item_count', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'code', 'contact', 'phone', 'email', 'address']
    ordering = ['-created_at']
    list_editable = ['status']
    readonly_fields = ['created_at', 'updated_at', 'item_count']
    
    fieldsets = (
        ('基本信息', {'fields': ('name', 'code')}),
        ('联系信息', {'fields': ('contact', 'phone', 'email', 'address')}),
        ('状态', {'fields': ('status', 'notes')}),
        ('统计信息', {'fields': ('item_count',)}),
        ('时间信息', {'fields': ('created_at', 'updated_at')}),
    )
    
    def item_count(self, obj):
        return obj.item_count
    item_count.short_description = '供货物品数'
