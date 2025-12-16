"""
仓库管理模型
"""
from django.db import models


class Warehouse(models.Model):
    """仓库"""
    name = models.CharField('仓库名称', max_length=200)
    code = models.CharField('仓库编码', max_length=50, unique=True, blank=True)
    location = models.CharField('位置', max_length=500, blank=True, default='')
    capacity = models.IntegerField('容量', default=0)
    manager = models.CharField('负责人', max_length=100, blank=True, default='')
    phone = models.CharField('联系电话', max_length=20, blank=True, default='')
    is_active = models.BooleanField('是否启用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'warehouses'
        verbose_name = '仓库'
        verbose_name_plural = '仓库'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active']),  # 筛选启用仓库
            models.Index(fields=['code']),  # 编码查询
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def current_usage(self):
        """当前使用量 - 优先使用预计算值"""
        # 如果有预计算的值（通过annotate），直接使用
        if hasattr(self, '_current_usage'):
            return self._current_usage
        # 否则执行查询
        from django.db.models import Sum
        total = self.items.aggregate(total=Sum('stock'))['total']
        return total or 0
    
    @property
    def usage_rate(self):
        """使用率"""
        if self.capacity > 0:
            return round(self.current_usage / self.capacity * 100, 2)
        return 0
