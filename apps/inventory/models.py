"""
库存管理模型
"""
from django.db import models
from django.conf import settings


class Category(models.Model):
    """物品类别"""
    name = models.CharField('类别名称', max_length=100, unique=True)
    code = models.CharField('类别编码', max_length=50, unique=True)
    description = models.TextField('描述', blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='父类别'
    )
    is_active = models.BooleanField('是否启用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name = '类别'
        verbose_name_plural = '类别'
        ordering = ['code']
    
    def __str__(self):
        return self.name
    
    @property
    def item_count(self):
        """物品数量"""
        return self.items.count()


class Item(models.Model):
    """库存物品"""
    STATUS_CHOICES = [
        ('normal', '正常'),
        ('low_stock', '低库存'),
        ('out_of_stock', '缺货'),
        ('discontinued', '停产'),
    ]
    
    name = models.CharField('物品名称', max_length=200)
    code = models.CharField('物品编码', max_length=100, unique=True)
    barcode = models.CharField('条形码', max_length=100, blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='items',
        verbose_name='类别'
    )
    supplier = models.ForeignKey(
        'suppliers.Supplier',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items',
        verbose_name='供应商'
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.PROTECT,
        related_name='items',
        verbose_name='仓库'
    )
    price = models.DecimalField('单价', max_digits=10, decimal_places=2)
    stock = models.IntegerField('库存数量', default=0)
    min_stock = models.IntegerField('最低库存', default=0)
    
    def clean(self):
        """数据验证"""
        from django.core.exceptions import ValidationError
        if self.stock < 0:
            raise ValidationError({'stock': '库存数量不能为负数'})
    
    warehouse_location = models.CharField('仓位', max_length=100, blank=True)
    description = models.TextField('描述', blank=True)
    image = models.ImageField(
        '图片',
        upload_to='items/%Y/%m/',
        null=True,
        blank=True
    )
    status = models.CharField(
        '状态',
        max_length=20,
        choices=STATUS_CHOICES,
        default='normal'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_items',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'items'
        verbose_name = '物品'
        verbose_name_plural = '物品'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['barcode']),
            models.Index(fields=['status']),
            models.Index(fields=['name']),  # 搜索优化
            models.Index(fields=['category']),  # 外键查询优化
            models.Index(fields=['warehouse']),  # 外键查询优化
            models.Index(fields=['created_at']),  # 排序优化
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    def save(self, *args, **kwargs):
        """保存时自动更新状态"""
        if self.stock <= 0:
            self.status = 'out_of_stock'
        elif self.stock <= self.min_stock:
            self.status = 'low_stock'
        else:
            self.status = 'normal'
        super().save(*args, **kwargs)
    
    @property
    def total_value(self):
        """库存总价值"""
        return self.stock * self.price
