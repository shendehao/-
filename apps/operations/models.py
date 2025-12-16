"""
出入库操作模型
"""
from django.db import models
from django.conf import settings


class InventoryOperation(models.Model):
    """库存操作记录"""
    OPERATION_TYPES = [
        ('in', '入库'),
        ('out', '出库'),
        ('transfer', '调拨'),
        ('adjust', '调整'),
        ('check', '盘点'),
    ]
    
    item = models.ForeignKey(
        'inventory.Item',
        on_delete=models.PROTECT,
        related_name='operations',
        verbose_name='物品'
    )
    operation_type = models.CharField(
        '操作类型',
        max_length=20,
        choices=OPERATION_TYPES
    )
    quantity = models.IntegerField('数量')
    before_stock = models.IntegerField('操作前库存')
    after_stock = models.IntegerField('操作后库存')
    
    # 入库相关
    supplier = models.ForeignKey(
        'suppliers.Supplier',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='供应商'
    )
    
    # 出库相关
    recipient = models.CharField('领用人', max_length=100, blank=True)
    department = models.CharField('领用部门', max_length=100, blank=True)
    purpose = models.CharField('用途', max_length=200, blank=True)
    
    # 调拨相关
    from_warehouse = models.CharField('源仓库', max_length=100, blank=True)
    to_warehouse = models.CharField('目标仓库', max_length=100, blank=True)
    
    # 通用字段
    notes = models.TextField('备注', blank=True)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='operations',
        verbose_name='操作人'
    )
    created_at = models.DateTimeField('操作时间', auto_now_add=True)
    
    # 软删除字段（防止做假账，删除记录不影响报表统计）
    is_deleted = models.BooleanField('是否已删除', default=False, db_index=True)
    deleted_at = models.DateTimeField('删除时间', null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deleted_operations',
        verbose_name='删除人'
    )
    
    class Meta:
        db_table = 'inventory_operations'
        verbose_name = '库存操作'
        verbose_name_plural = '库存操作'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['operation_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['item']),  # 物品操作记录查询
            models.Index(fields=['operation_type', 'created_at']),  # 复合索引：按类型和时间查询
        ]
    
    def __str__(self):
        return f"{self.get_operation_type_display()} - {self.item.name} - {self.quantity}"
