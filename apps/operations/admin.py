"""
出入库操作管理后台
"""
from django.contrib import admin
from .models import InventoryOperation


@admin.register(InventoryOperation)
class InventoryOperationAdmin(admin.ModelAdmin):
    """库存操作管理"""
    list_display = ['id', 'item', 'operation_type', 'quantity', 'before_stock', 'after_stock', 'operator', 'is_deleted', 'created_at']
    list_filter = ['operation_type', 'is_deleted', 'created_at']
    search_fields = ['item__name', 'item__code', 'recipient', 'department', 'notes']
    ordering = ['-created_at']
    raw_id_fields = ['item', 'supplier', 'operator', 'deleted_by']
    readonly_fields = ['created_at', 'before_stock', 'after_stock']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('基本信息', {'fields': ('item', 'operation_type', 'quantity')}),
        ('库存变化', {'fields': ('before_stock', 'after_stock')}),
        ('入库信息', {'fields': ('supplier',), 'classes': ('collapse',)}),
        ('出库信息', {'fields': ('recipient', 'department', 'purpose'), 'classes': ('collapse',)}),
        ('调拨信息', {'fields': ('from_warehouse', 'to_warehouse'), 'classes': ('collapse',)}),
        ('其他信息', {'fields': ('notes', 'operator')}),
        ('删除信息', {'fields': ('is_deleted', 'deleted_at', 'deleted_by'), 'classes': ('collapse',)}),
        ('时间信息', {'fields': ('created_at',)}),
    )
    
    def get_queryset(self, request):
        """默认显示所有记录，包括已删除的"""
        return super().get_queryset(request)
