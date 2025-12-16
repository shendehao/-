"""
出入库操作视图
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from datetime import datetime, timedelta

from .models import InventoryOperation
from .serializers import (
    InventoryOperationSerializer,
    InboundSerializer,
    OutboundSerializer,
    TransferSerializer
)
from common.responses import APIResponse
from common.pagination import StandardPagination


class InventoryOperationViewSet(viewsets.ModelViewSet):
    """库存操作视图集"""
    queryset = InventoryOperation.objects.select_related(
        'item', 'item__warehouse', 'item__category', 'supplier', 'operator'
    ).filter(is_deleted=False)  # 默认只显示未删除的记录
    serializer_class = InventoryOperationSerializer
    permission_classes = [IsAuthenticated]  # 需要登录
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['operation_type', 'item', 'supplier']
    search_fields = ['item__name', 'item__code', 'recipient', 'department']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(data=serializer.data)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return APIResponse.success(data=serializer.data, message="操作记录创建成功")
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(data=serializer.data)
    
    def _clear_dashboard_cache(self):
        """清除仪表盘相关缓存"""
        from django.core.cache import cache
        cache_keys = [
            'dashboard_overview',
            'dashboard_low_stock',
            'dashboard_distribution',
            'dashboard_charts_7',
            'dashboard_charts_30',
            'dashboard_trend_month',
            'dashboard_trend_quarter',
            'dashboard_trend_year',
            'dashboard_activities_10',
        ]
        for key in cache_keys:
            cache.delete(key)
    
    @action(detail=False, methods=['post'])
    def inbound(self, request):
        """入库操作"""
        serializer = InboundSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        operation = serializer.save()
        self._clear_dashboard_cache()  # 清除仪表盘缓存
        result = InventoryOperationSerializer(operation).data
        return APIResponse.success(data=result, message="入库成功")
    
    @action(detail=False, methods=['post'])
    def outbound(self, request):
        """出库操作"""
        serializer = OutboundSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        operation = serializer.save()
        self._clear_dashboard_cache()  # 清除仪表盘缓存
        result = InventoryOperationSerializer(operation).data
        return APIResponse.success(data=result, message="出库成功")
    
    @action(detail=False, methods=['post'])
    def transfer(self, request):
        """调拨操作"""
        serializer = TransferSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        operation = serializer.save()
        self._clear_dashboard_cache()  # 清除仪表盘缓存
        result = InventoryOperationSerializer(operation).data
        return APIResponse.success(data=result, message="调拨成功")
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """获取操作统计
        
        注意：报表统计包含所有记录（包括已删除的），防止通过删除记录做假账
        """
        # 获取时间范围参数
        days = int(request.query_params.get('days', 7))
        start_date = datetime.now() - timedelta(days=days)
        
        # 报表统计包含所有记录（包括已删除的），防止做假账
        queryset = InventoryOperation.objects.filter(
            created_at__gte=start_date,
            # 不过滤 is_deleted，报表包含所有历史记录
        )
        
        # 统计各类型操作数量
        stats = {
            'total_operations': queryset.count(),
            'inbound_count': queryset.filter(operation_type='in').count(),
            'outbound_count': queryset.filter(operation_type='out').count(),
            'transfer_count': queryset.filter(operation_type='transfer').count(),
            'inbound_quantity': queryset.filter(operation_type='in').aggregate(
                total=Sum('quantity')
            )['total'] or 0,
            'outbound_quantity': queryset.filter(operation_type='out').aggregate(
                total=Sum('quantity')
            )['total'] or 0,
        }
        
        return APIResponse.success(data=stats)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """获取最近操作记录"""
        limit = int(request.query_params.get('limit', 10))
        queryset = self.get_queryset()[:limit]
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(data=serializer.data)
    
    @action(detail=True, methods=['post'])
    def delete_with_password(self, request, pk=None):
        """删除操作记录（需要验证密码）- 软删除
        
        重要说明：采用软删除机制，记录标记为已删除但不真正删除。
        这样可以防止做假账，删除的记录仍然保留在数据库中用于审计，
        但不会在列表和报表统计中显示。
        """
        from django.contrib.auth import authenticate
        
        # 获取密码
        password = request.data.get('password')
        if not password:
            return APIResponse.error(message="请输入密码", code=400)
        
        # 验证密码
        user = authenticate(username=request.user.username, password=password)
        if not user:
            return APIResponse.error(message="密码错误", code=401)
        
        # 获取操作记录（使用all()查询，包括已删除的记录，以便可以检查状态）
        try:
            # 从URL路径参数获取pk
            pk = pk or self.kwargs.get('pk')
            # 使用all()而不是get_queryset()，因为get_queryset()会过滤掉已删除的记录
            operation = InventoryOperation.objects.all().get(pk=pk)
        except InventoryOperation.DoesNotExist:
            return APIResponse.error(message="操作记录不存在", code=404)
        
        # 如果已经删除，提示用户
        if operation.is_deleted:
            return APIResponse.error(message="该记录已被删除", code=400)
        
        # 保存操作信息用于日志
        item = operation.item
        operation_type = operation.operation_type
        quantity = operation.quantity
        operation_info = f"{operation.get_operation_type_display()} - {item.name} - {quantity}"
        
        # 软删除：标记为已删除，但不真正删除记录
        # 这样可以防止做假账，删除的记录仍然保留在数据库中，但不影响报表统计
        try:
            from django.utils import timezone
            operation.is_deleted = True
            operation.deleted_at = timezone.now()
            operation.deleted_by = request.user
            operation.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])
            
            return APIResponse.success(
                message=f"操作记录已标记为删除: {operation_info}\n注意：记录已隐藏，但数据仍保留用于审计。库存不受影响，当前库存仍为 {item.stock}",
                data={
                    'current_stock': item.stock,
                    'operation_type': operation_type,
                    'deleted_quantity': quantity,
                    'is_deleted': True
                }
            )
        except Exception as e:
            return APIResponse.error(message=f"删除失败: {str(e)}", code=500)
    
    @action(detail=False, methods=['post'])
    def batch_delete_with_password(self, request):
        """批量删除操作记录（需要验证密码）
        
        重要说明：操作记录只是历史日志，删除记录不会影响当前库存！
        库存的实际变化已经在入库/出库时完成，删除记录只是删除历史记录。
        """
        from django.contrib.auth import authenticate
        
        # 获取密码和ID列表
        password = request.data.get('password')
        ids = request.data.get('ids', [])
        
        if not password:
            return APIResponse.error(message="请输入密码", code=400)
        
        if not ids or not isinstance(ids, list):
            return APIResponse.error(message="请选择要删除的记录", code=400)
        
        # 验证密码
        user = authenticate(username=request.user.username, password=password)
        if not user:
            return APIResponse.error(message="密码错误", code=401)
        
        # 软删除：标记为已删除，但不真正删除记录
        from django.utils import timezone
        success_count = 0
        failed_count = 0
        errors = []
        
        for operation_id in ids:
            try:
                # 使用 all() 查询，包括已删除的记录，以便可以"恢复"删除
                operation = InventoryOperation.objects.all().get(id=operation_id)
                
                # 如果已经删除，跳过
                if operation.is_deleted:
                    failed_count += 1
                    errors.append(f"记录ID {operation_id} 已被删除")
                    continue
                
                # 软删除：标记为已删除
                operation.is_deleted = True
                operation.deleted_at = timezone.now()
                operation.deleted_by = request.user
                operation.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])
                success_count += 1
            except InventoryOperation.DoesNotExist:
                failed_count += 1
                errors.append(f"记录ID {operation_id} 不存在")
            except Exception as e:
                failed_count += 1
                errors.append(f"删除记录ID {operation_id} 失败: {str(e)}")
        
        message = f"✅ 成功标记删除 {success_count} 条操作记录"
        if failed_count > 0:
            message += f"，失败 {failed_count} 条"
        message += "\n注意：记录已隐藏但数据仍保留用于审计，不影响报表统计和库存"
        
        return APIResponse.success(
            message=message,
            data={
                'success_count': success_count,
                'failed_count': failed_count,
                'errors': errors
            }
        )

# 在这里定义你的视图
