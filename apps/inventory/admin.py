"""
库存管理管理后台
"""
from django.contrib import admin
from .models import Category, Item


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """类别管理"""
    list_display = ['name', 'code', 'parent', 'is_active', 'item_count', 'created_at']
    list_filter = ['is_active', 'parent', 'created_at']
    search_fields = ['name', 'code', 'description']
    ordering = ['code']
    list_editable = ['is_active']
    
    fieldsets = (
        ('基本信息', {'fields': ('name', 'code', 'description')}),
        ('层级关系', {'fields': ('parent',)}),
        ('状态', {'fields': ('is_active',)}),
    )


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    """物品管理"""
    list_display = ['name', 'code', 'category', 'warehouse', 'stock', 'min_stock', 'price', 'status', 'created_at']
    list_filter = ['status', 'category', 'warehouse', 'supplier', 'created_at']
    search_fields = ['name', 'code', 'barcode', 'description']
    ordering = ['-created_at']
    list_editable = ['stock', 'min_stock', 'price']
    raw_id_fields = ['category', 'supplier', 'warehouse', 'created_by']
    readonly_fields = ['created_at', 'updated_at', 'total_value']
    
    fieldsets = (
        ('基本信息', {'fields': ('name', 'code', 'barcode', 'description', 'image')}),
        ('分类与位置', {'fields': ('category', 'warehouse', 'warehouse_location', 'supplier')}),
        ('库存信息', {'fields': ('stock', 'min_stock', 'price', 'total_value', 'status')}),
        ('其他信息', {'fields': ('created_by', 'created_at', 'updated_at')}),
    )
    
    def total_value(self, obj):
        return f"¥{obj.total_value:,.2f}"
    total_value.short_description = '库存总价值'
