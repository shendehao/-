"""
库存管理视图
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Category, Item
from .serializers import (
    CategorySerializer, ItemSerializer,
    ItemListSerializer, ItemDetailSerializer
)
from common.responses import APIResponse
from common.pagination import StandardPagination


class CategoryViewSet(viewsets.ModelViewSet):
    """类别视图集"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]  # 需要登录
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering = ['code']
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(data=serializer.data)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return APIResponse.success(data=serializer.data, message="类别创建成功")
    
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
        return APIResponse.success(data=serializer.data, message="类别更新成功")
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.items.exists():
            return APIResponse.error(message="该类别下有物品，无法删除")
        self.perform_destroy(instance)
        return APIResponse.success(message="类别删除成功")


class ItemViewSet(viewsets.ModelViewSet):
    """物品视图集"""
    queryset = Item.objects.select_related('category', 'supplier', 'warehouse', 'created_by').all()
    permission_classes = [IsAuthenticated]  # 需要登录
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'supplier', 'warehouse', 'status', 'code', 'barcode']
    search_fields = ['name', 'code', 'barcode']
    ordering_fields = ['created_at', 'name', 'code', 'stock', 'price']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ItemListSerializer
        elif self.action == 'retrieve':
            return ItemDetailSerializer
        return ItemSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return APIResponse.success(data=serializer.data)
    
    def _clear_dashboard_cache(self):
        """清除仪表盘相关缓存"""
        from django.core.cache import cache
        cache_keys = [
            'dashboard_overview',
            'dashboard_low_stock',
            'dashboard_distribution',
        ]
        for key in cache_keys:
            cache.delete(key)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        self._clear_dashboard_cache()  # 清除仪表盘缓存
        return APIResponse.success(data=serializer.data, message="物品创建成功")
    
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
        self._clear_dashboard_cache()  # 清除仪表盘缓存
        return APIResponse.success(data=serializer.data, message="物品更新成功")
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # 先删除关联的操作记录，再删除物品
        if hasattr(instance, 'operations'):
            instance.operations.all().delete()
        self.perform_destroy(instance)
        self._clear_dashboard_cache()  # 清除仪表盘缓存
        return APIResponse.success(message="物品删除成功")
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """获取低库存物品"""
        queryset = self.get_queryset().filter(
            Q(status='low_stock') | Q(status='out_of_stock')
        )
        serializer = ItemListSerializer(queryset, many=True, context={'request': request})
        return APIResponse.success(data=serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """获取物品统计信息"""
        from django.db.models import Sum, Count, Avg
        
        queryset = self.get_queryset()
        stats = {
            'total_items': queryset.count(),
            'total_stock': queryset.aggregate(total=Sum('stock'))['total'] or 0,
            'total_value': sum(item.total_value for item in queryset),
            'low_stock_count': queryset.filter(Q(status='low_stock') | Q(status='out_of_stock')).count(),
            'avg_price': queryset.aggregate(avg=Avg('price'))['avg'] or 0,
            'category_distribution': list(
                queryset.values('category__name')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            )
        }
        return APIResponse.success(data=stats)

# 在这里定义你的视图
