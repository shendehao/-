"""
供应商视图
"""
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Supplier
from .serializers import SupplierSerializer, SupplierListSerializer
from common.responses import APIResponse
from common.pagination import StandardPagination


class SupplierViewSet(viewsets.ModelViewSet):
    """供应商视图集"""
    queryset = Supplier.objects.all()
    permission_classes = [IsAuthenticated]  # 需要登录
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'code', 'contact', 'phone']
    ordering_fields = ['created_at', 'name', 'code']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """根据动作选择序列化器"""
        if self.action == 'list':
            return SupplierListSerializer
        return SupplierSerializer
    
    def list(self, request, *args, **kwargs):
        """获取供应商列表"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(data=serializer.data)
    
    def create(self, request, *args, **kwargs):
        """创建供应商"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return APIResponse.success(data=serializer.data, message="供应商创建成功")
    
    def retrieve(self, request, *args, **kwargs):
        """获取供应商详情"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(data=serializer.data)
    
    def update(self, request, *args, **kwargs):
        """更新供应商"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return APIResponse.success(data=serializer.data, message="供应商更新成功")
    
    def destroy(self, request, *args, **kwargs):
        """删除供应商"""
        instance = self.get_object()
        # 检查是否有关联物品
        if instance.items.exists():
            return APIResponse.error(message="该供应商下有关联物品，无法删除")
        self.perform_destroy(instance)
        return APIResponse.success(message="供应商删除成功")
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """获取启用的供应商列表"""
        queryset = self.get_queryset().filter(status='active')
        serializer = SupplierListSerializer(queryset, many=True)
        return APIResponse.success(data=serializer.data)

# 在这里定义你的视图
