"""
仓库视图
"""
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Warehouse
from .serializers import WarehouseSerializer, WarehouseListSerializer
from common.responses import APIResponse
from common.pagination import StandardPagination


class WarehouseViewSet(viewsets.ModelViewSet):
    """仓库视图集"""
    permission_classes = [IsAuthenticated]  # 需要登录
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'location', 'manager']
    ordering_fields = ['created_at', 'name', 'code']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """优化查询，预计算current_usage避免N+1问题"""
        from django.db.models import Sum, Value
        from django.db.models.functions import Coalesce
        
        return Warehouse.objects.annotate(
            _current_usage=Coalesce(Sum('items__stock'), Value(0))
        )
    
    def get_serializer_class(self):
        if self.action == 'list':
            return WarehouseListSerializer
        return WarehouseSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(data=serializer.data)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return APIResponse.success(data=serializer.data, message="仓库创建成功")
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(data=serializer.data)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return APIResponse.success(data=serializer.data, message="仓库更新成功")
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.items.exists():
            return APIResponse.error(message="该仓库下有库存物品，无法删除")
        self.perform_destroy(instance)
        return APIResponse.success(message="仓库删除成功")
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """获取启用的仓库列表"""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = WarehouseListSerializer(queryset, many=True)
        return APIResponse.success(data=serializer.data)

# 在这里定义你的视图
