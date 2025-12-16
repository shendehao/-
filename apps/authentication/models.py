"""
用户认证模型
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """自定义用户模型"""
    
    ROLE_CHOICES = [
        ('admin', '管理员'),
        ('manager', '仓库管理员'),
        ('operator', '操作员'),
        ('viewer', '查看者'),
    ]
    
    phone = models.CharField('电话', max_length=20, blank=True)
    avatar = models.ImageField('头像', upload_to='avatars/', null=True, blank=True)
    department = models.CharField('部门', max_length=100, blank=True)
    role = models.CharField(
        '角色',
        max_length=20,
        choices=ROLE_CHOICES,
        default='operator'
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = '用户'
        verbose_name_plural = '用户'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.username
    
    @property
    def role_display(self):
        """获取角色显示名称"""
        return dict(self.ROLE_CHOICES).get(self.role, self.role)
