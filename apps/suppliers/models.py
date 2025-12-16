"""
供应商管理模型
"""
from django.db import models


class Supplier(models.Model):
    """供应商"""
    STATUS_CHOICES = [
        ('active', '启用'),
        ('inactive', '停用'),
    ]
    
    name = models.CharField('供应商名称', max_length=200)
    code = models.CharField('供应商编码', max_length=50, unique=True)
    contact = models.CharField('联系人', max_length=100, blank=True)
    phone = models.CharField('联系电话', max_length=20, blank=True)
    email = models.EmailField('邮箱', blank=True)
    address = models.TextField('地址', blank=True)
    status = models.CharField(
        '状态',
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    notes = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'suppliers'
        verbose_name = '供应商'
        verbose_name_plural = '供应商'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),  # 筛选启用供应商
            models.Index(fields=['code']),  # 编码查询
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def item_count(self):
        """供货物品数量"""
        return self.items.count()
