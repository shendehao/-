"""
仪表盘视图
"""
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, Avg, Value
from django.db.models.functions import Coalesce, TruncDate
from datetime import datetime, timedelta

from apps.inventory.models import Item, Category
from apps.operations.models import InventoryOperation
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse
from common.responses import APIResponse


class DashboardOverviewView(APIView):
    """仪表盘概览"""
    permission_classes = [IsAuthenticated]  # 需要登录
    
    def get(self, request):
        """获取仪表盘概览数据 - 优化版本，使用缓存"""
        from django.core.cache import cache
        from django.db.models import F
        
        # 尝试从缓存获取数据（缓存30秒）
        cache_key = 'dashboard_overview'
        cached_data = cache.get(cache_key)
        if cached_data:
            return APIResponse.success(data=cached_data)
        
        # 合并物品统计查询 - 一次查询获取多个统计值
        item_stats = Item.objects.aggregate(
            total_items=Count('id'),
            total_stock=Sum('stock'),
            total_value=Sum(F('price') * F('stock')),
            low_stock_count=Count('id', filter=Q(status__in=['low_stock', 'out_of_stock']))
        )
        
        total_items = item_stats['total_items'] or 0
        total_stock = item_stats['total_stock'] or 0
        # 确保 total_value 是数值类型
        raw_total_value = item_stats['total_value']
        total_value = float(raw_total_value) if raw_total_value else 0
        low_stock_items = item_stats['low_stock_count'] or 0
        
        # 合并其他基础统计
        total_categories = Category.objects.filter(is_active=True).count()
        total_suppliers = Supplier.objects.filter(status='active').count()
        
        # 时间范围
        today = datetime.now().date()
        week_start = datetime.now() - timedelta(days=7)
        month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        last_month_end = month_start
        
        # 合并操作统计查询 - 一次查询获取所有时间段的统计
        # 报表数据包含所有记录（包括已删除的），防止通过删除记录做假账
        ops_stats = InventoryOperation.objects.filter(
            created_at__gte=last_month_start,
            # 不过滤 is_deleted，报表包含所有历史记录
        ).aggregate(
            # 今日
            today_in=Sum('quantity', filter=Q(created_at__date=today, operation_type='in')),
            today_out=Sum('quantity', filter=Q(created_at__date=today, operation_type='out')),
            today_count=Count('id', filter=Q(created_at__date=today)),
            today_in_count=Count('id', filter=Q(created_at__date=today, operation_type='in')),
            today_out_count=Count('id', filter=Q(created_at__date=today, operation_type='out')),
            # 本周
            week_in=Sum('quantity', filter=Q(created_at__gte=week_start, operation_type='in')),
            week_out=Sum('quantity', filter=Q(created_at__gte=week_start, operation_type='out')),
            week_count=Count('id', filter=Q(created_at__gte=week_start)),
            week_in_count=Count('id', filter=Q(created_at__gte=week_start, operation_type='in')),
            week_out_count=Count('id', filter=Q(created_at__gte=week_start, operation_type='out')),
            # 本月
            month_in=Sum('quantity', filter=Q(created_at__gte=month_start, operation_type='in')),
            month_out=Sum('quantity', filter=Q(created_at__gte=month_start, operation_type='out')),
            month_count=Count('id', filter=Q(created_at__gte=month_start)),
            month_in_count=Count('id', filter=Q(created_at__gte=month_start, operation_type='in')),
            month_out_count=Count('id', filter=Q(created_at__gte=month_start, operation_type='out')),
            # 上月入库
            last_month_in=Sum('quantity', filter=Q(
                created_at__gte=last_month_start,
                created_at__lt=last_month_end,
                operation_type='in'
            )),
            # 上月出库
            last_month_out=Sum('quantity', filter=Q(
                created_at__gte=last_month_start,
                created_at__lt=last_month_end,
                operation_type='out'
            ))
        )
        
        today_inbound = ops_stats['today_in'] or 0
        today_outbound = ops_stats['today_out'] or 0
        week_inbound = ops_stats['week_in'] or 0
        week_outbound = ops_stats['week_out'] or 0
        month_inbound = ops_stats['month_in'] or 0
        month_outbound = ops_stats['month_out'] or 0
        last_month_inbound = ops_stats['last_month_in'] or 0
        last_month_outbound = ops_stats['last_month_out'] or 0
        
        # 计算环比变化（限制在合理范围内 -99% 到 +999%）
        # 环比公式：(本月 - 上月) / 上月 * 100%
        def calc_change(current, previous):
            if previous > 0:
                change = ((current - previous) / previous) * 100
                return max(-99.0, min(999.0, round(change, 1)))
            elif current > 0:
                return 100.0  # 上月为0，本月有数据，显示+100%
            else:
                return 0.0  # 都为0，显示0%
        
        # 入库环比变化
        inbound_change = calc_change(month_inbound, last_month_inbound)
        
        # 出库环比变化
        outbound_change = calc_change(month_outbound, last_month_outbound)
        
        # 库存变化：本月净入库量占总库存的比例
        if total_stock > 0:
            net_change = month_inbound - month_outbound
            stock_change = round((net_change / total_stock) * 100, 1)
            stock_change = max(-99.0, min(99.0, stock_change))
        else:
            stock_change = 0.0
        
        # 周转率计算（本月出库量/总库存）
        avg_stock = max(total_stock, 1)
        turnover_rate = min(round((month_outbound / avg_stock) * 100, 1), 100)
        
        # 周转率环比
        if last_month_outbound > 0:
            last_turnover = round((last_month_outbound / avg_stock) * 100, 1)
            turnover_change = calc_change(turnover_rate, last_turnover)
        else:
            turnover_change = 100.0 if turnover_rate > 0 else 0.0
        
        data = {
            'overview': {
                'total_items': total_items,
                'total_stock': total_stock,
                'total_value': float(total_value),
                'low_stock_items': low_stock_items,
                'total_categories': total_categories,
                'total_suppliers': total_suppliers,
                'turnover_rate': turnover_rate,
            },
            'changes': {
                'items_change': inbound_change,      # 入库环比
                'low_stock_change': outbound_change, # 出库环比
                'value_change': stock_change,        # 库存变化
                'turnover_change': turnover_change,  # 周转率环比
            },
            'today': {
                'inbound': today_inbound,
                'outbound': today_outbound,
                'operations': ops_stats['today_count'] or 0,
                'inbound_count': ops_stats['today_in_count'] or 0,
                'outbound_count': ops_stats['today_out_count'] or 0,
            },
            'week': {
                'inbound': week_inbound,
                'outbound': week_outbound,
                'operations': ops_stats['week_count'] or 0,
                'inbound_count': ops_stats['week_in_count'] or 0,
                'outbound_count': ops_stats['week_out_count'] or 0,
            },
            'month': {
                'inbound': month_inbound,
                'outbound': month_outbound,
                'operations': ops_stats['month_count'] or 0,
                'inbound_count': ops_stats['month_in_count'] or 0,
                'outbound_count': ops_stats['month_out_count'] or 0,
            }
        }
        
        # 缓存数据30秒
        cache.set(cache_key, data, 30)
        
        return APIResponse.success(data=data)


class DashboardChartsView(APIView):
    """仪表盘图表数据"""
    permission_classes = [IsAuthenticated]  # 需要登录
    
    def get(self, request):
        """获取图表数据 - 优化版本，使用缓存和批量查询"""
        from django.core.cache import cache
        from django.db.models import Sum, Value
        from django.db.models.functions import Coalesce, TruncDate
        
        days = int(request.query_params.get('days', 7))
        
        # 尝试从缓存获取（缓存60秒）
        cache_key = f'dashboard_charts_{days}'
        cached_data = cache.get(cache_key)
        if cached_data:
            return APIResponse.success(data=cached_data)
        
        start_date = datetime.now() - timedelta(days=days)
        
        # 出入库趋势数据 - 使用单次聚合查询代替循环
        # 报表数据包含所有记录（包括已删除的），防止做假账
        # 统计操作次数（count）而不是数量（sum），与卡片数据保持一致
        daily_stats = InventoryOperation.objects.filter(
            created_at__date__gte=start_date.date(),
            operation_type__in=['in', 'out'],
            # 不过滤 is_deleted，报表包含所有历史记录
        ).annotate(
            date=TruncDate('created_at')
        ).values('date', 'operation_type').annotate(
            total=Count('id')  # 统计次数而不是数量
        ).order_by('date')
        
        # 构建日期数据字典
        date_data = {}
        for stat in daily_stats:
            date_key = stat['date'].strftime('%Y-%m-%d') if stat['date'] else None
            if date_key:
                if date_key not in date_data:
                    date_data[date_key] = {'in': 0, 'out': 0}
                date_data[date_key][stat['operation_type']] = stat['total'] or 0
        
        # 生成趋势数据
        trend_data = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=days-i-1)).date()
            date_key = date.strftime('%Y-%m-%d')
            data_entry = date_data.get(date_key, {'in': 0, 'out': 0})
            trend_data.append({
                'date': date_key,
                'inbound': data_entry['in'],
                'outbound': data_entry['out'],
            })
        
        # 类别分布
        category_distribution = list(
            Item.objects.values('category__name')
            .annotate(
                count=Count('id'),
                total_stock=Sum('stock')
            )
            .order_by('-count')[:10]
        )
        
        # 仓库使用情况 - 使用annotate预计算避免N+1
        warehouses = Warehouse.objects.filter(is_active=True).annotate(
            _current_usage=Coalesce(Sum('items__stock'), Value(0))
        )
        warehouse_usage = []
        for warehouse in warehouses:
            usage = warehouse._current_usage
            usage_rate = round(usage / warehouse.capacity * 100, 2) if warehouse.capacity > 0 else 0
            warehouse_usage.append({
                'name': warehouse.name,
                'code': warehouse.code,
                'capacity': warehouse.capacity,
                'current_usage': usage,
                'usage_rate': usage_rate,
            })
        
        # 供应商供货排行
        supplier_ranking = list(
            Item.objects.values('supplier__name')
            .annotate(item_count=Count('id'))
            .order_by('-item_count')[:10]
        )
        
        data = {
            'trend': trend_data,
            'category_distribution': category_distribution,
            'warehouse_usage': warehouse_usage,
            'supplier_ranking': supplier_ranking,
        }
        
        # 缓存60秒
        cache.set(cache_key, data, 60)
        
        return APIResponse.success(data=data)


class DashboardRecentActivitiesView(APIView):
    """最近活动"""
    permission_classes = [IsAuthenticated]  # 需要登录
    
    def get(self, request):
        """获取最近活动记录 - 优化版本"""
        try:
            from django.core.cache import cache
            import traceback
            
            limit = int(request.query_params.get('limit', 10))
            
            # 尝试从缓存获取（缓存15秒，活动数据更新较频繁）
            cache_key = f'dashboard_activities_{limit}'
            cached_data = cache.get(cache_key)
            if cached_data:
                return APIResponse.success(data=cached_data)
            
            # 查询最近的操作记录（排除已删除的记录）
            try:
                # 先尝试简单查询，不使用select_related
                operations = InventoryOperation.objects.filter(
                    is_deleted=False  # 排除已删除的记录，防止做假账
                ).order_by('-created_at')[:limit]
            except Exception as db_error:
                # 如果查询失败，记录错误并返回空数组
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'查询操作记录失败: {str(db_error)}\n{traceback.format_exc()}')
                return APIResponse.success(data=[])
            
            activities = []
            for op in operations:
                try:
                    # 跳过没有物品的记录（数据异常情况）
                    if not op.item:
                        continue
                        
                    # 获取物品图片URL
                    item_image = None
                    if op.item.image:
                        try:
                            item_image = request.build_absolute_uri(op.item.image.url)
                        except Exception as e:
                            item_image = None
                    
                    # 获取操作人姓名
                    operator_name = '系统'
                    if op.operator:
                        try:
                            operator_name = op.operator.get_full_name() or op.operator.username or '系统'
                        except:
                            operator_name = getattr(op.operator, 'username', '系统') or '系统'
                    
                    activities.append({
                        'id': op.id,
                        'type': op.operation_type,
                        'operation_type': op.operation_type,  # 前端使用这个字段
                        'type_display': op.get_operation_type_display(),
                        'item_name': op.item.name if op.item else '未知物品',
                        'item_code': op.item.code if op.item else '',
                        'item_image': item_image,
                        'quantity': op.quantity,
                        'operator_name': operator_name,
                        'created_at': op.created_at.isoformat() if hasattr(op.created_at, 'isoformat') else str(op.created_at),
                    })
                except Exception as e:
                    # 跳过有问题的记录，继续处理其他记录
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f'处理活动记录时出错 (ID: {op.id if hasattr(op, "id") else "unknown"}): {str(e)}')
                    continue
            
            # 缓存15秒
            cache.set(cache_key, activities, 15)
            
            return APIResponse.success(data=activities)
        except Exception as e:
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            logger.error(f'获取最近活动失败: {str(e)}\n{traceback.format_exc()}')
            return APIResponse.error(
                message=f'获取最近活动失败: {str(e)}',
                code='ACTIVITIES_FETCH_ERROR',
                status_code=500
            )


class DashboardLowStockView(APIView):
    """低库存物品"""
    permission_classes = [IsAuthenticated]  # 需要登录
    
    def get(self, request):
        """获取低库存物品列表 - 优化版本"""
        from django.core.cache import cache
        
        # 尝试从缓存获取（缓存30秒）
        cache_key = 'dashboard_low_stock'
        cached_data = cache.get(cache_key)
        if cached_data:
            return APIResponse.success(data=cached_data)
        
        items = Item.objects.filter(
            Q(status='low_stock') | Q(status='out_of_stock')
        ).select_related('category', 'warehouse').only(
            'id', 'name', 'code', 'image', 'stock', 'min_stock', 'status', 'updated_at',
            'category__name', 'warehouse__name'
        ).order_by('stock')[:20]
        
        low_stock_items = []
        for item in items:
            # 获取物品图片URL
            item_image = None
            if item.image:
                item_image = request.build_absolute_uri(item.image.url)
            
            low_stock_items.append({
                'id': item.id,
                'name': item.name,
                'code': item.code,
                'image': item_image,
                'category': item.category.name if item.category else '-',
                'warehouse': item.warehouse.name if item.warehouse else '-',
                'stock': item.stock,
                'min_stock': item.min_stock,
                'status': item.status,
                'status_display': item.get_status_display(),
                'updated_at': item.updated_at.isoformat() if item.updated_at else None,
            })
        
        # 缓存30秒
        cache.set(cache_key, low_stock_items, 30)
        
        return APIResponse.success(data=low_stock_items)


class DashboardTrendView(APIView):
    """库存趋势数据"""
    permission_classes = [IsAuthenticated]  # 需要登录
    
    def get(self, request):
        """获取库存趋势数据 - 优化版本，使用缓存
        
        注意：报表趋势数据包含所有记录（包括已删除的），防止通过删除记录做假账
        """
        from django.core.cache import cache
        from django.db.models.functions import TruncMonth, TruncYear, ExtractQuarter
        
        period = request.GET.get('period', 'month')
        
        # 尝试从缓存获取（缓存60秒）
        cache_key = f'dashboard_trend_{period}'
        cached_data = cache.get(cache_key)
        if cached_data:
            return APIResponse.success(data=cached_data)
        
        labels = []
        inbound_data = []
        outbound_data = []
        
        if period == 'month':
            # 最近6个月 - 只统计入库和出库
            six_months_ago = datetime.now() - timedelta(days=180)
            
            # 报表数据包含所有记录（包括已删除的），防止做假账
            # 统计操作次数（count）而不是数量（sum），与卡片数据保持一致
            monthly_stats = InventoryOperation.objects.filter(
                created_at__gte=six_months_ago,
                operation_type__in=['in', 'out'],  # 只统计入库和出库
                # 不过滤 is_deleted，报表包含所有历史记录
            ).annotate(
                month=TruncMonth('created_at')
            ).values('month', 'operation_type').annotate(
                total=Count('id')  # 统计次数而不是数量
            ).order_by('month')
            
            # 构建月份数据字典
            month_data = {}
            for stat in monthly_stats:
                month_key = stat['month'].strftime('%Y-%m') if stat['month'] else None
                if month_key:
                    if month_key not in month_data:
                        month_data[month_key] = {'in': 0, 'out': 0}
                    op_type = stat['operation_type']
                    if op_type in ['in', 'out']:
                        month_data[month_key][op_type] = stat['total'] or 0
            
            # 生成最近6个月的标签和数据
            current_date = datetime.now()
            for i in range(5, -1, -1):
                # 计算目标月份
                current_month = current_date.month
                current_year = current_date.year
                target_month = current_month - i
                target_year = current_year
                
                # 处理跨年情况
                while target_month <= 0:
                    target_month += 12
                    target_year -= 1
                
                month_date = datetime(target_year, target_month, 1)
                month_key = month_date.strftime('%Y-%m')
                labels.append(f"{target_month}月")
                data_entry = month_data.get(month_key, {'in': 0, 'out': 0})
                inbound_data.append(int(data_entry['in']) if data_entry['in'] else 0)
                outbound_data.append(int(data_entry['out']) if data_entry['out'] else 0)
                
        elif period == 'quarter':
            # 最近4个季度 - 只统计入库和出库
            one_year_ago = datetime.now() - timedelta(days=365)
            
            # 报表数据包含所有记录（包括已删除的），防止做假账
            # 统计操作次数（count）而不是数量（sum），与卡片数据保持一致
            quarterly_stats = InventoryOperation.objects.filter(
                created_at__gte=one_year_ago,
                operation_type__in=['in', 'out'],  # 只统计入库和出库
                # 不过滤 is_deleted，报表包含所有历史记录
            ).annotate(
                quarter=ExtractQuarter('created_at'),
                year=TruncYear('created_at')
            ).values('year', 'quarter', 'operation_type').annotate(
                total=Count('id')  # 统计次数而不是数量
            ).order_by('year', 'quarter')
            
            # 构建季度数据
            quarter_data = {}
            for stat in quarterly_stats:
                year = stat['year'].year if stat['year'] else datetime.now().year
                q_key = f"{year}-Q{stat['quarter']}"
                if q_key not in quarter_data:
                    quarter_data[q_key] = {'in': 0, 'out': 0}
                op_type = stat['operation_type']
                if op_type in ['in', 'out']:
                    quarter_data[q_key][op_type] = stat['total'] or 0
            
            # 生成最近4个季度
            for i in range(3, -1, -1):
                quarter_date = datetime.now() - timedelta(days=90*i)
                quarter_num = ((quarter_date.month - 1) // 3) + 1
                q_key = f"{quarter_date.year}-Q{quarter_num}"
                labels.append(f"Q{quarter_num}")
                data_entry = quarter_data.get(q_key, {'in': 0, 'out': 0})
                inbound_data.append(data_entry['in'])
                outbound_data.append(data_entry['out'])
                
        elif period == 'year':
            # 最近3年 - 只统计入库和出库
            three_years_ago = datetime.now() - timedelta(days=365*3)
            
            # 报表数据包含所有记录（包括已删除的），防止做假账
            # 统计操作次数（count）而不是数量（sum），与卡片数据保持一致
            yearly_stats = InventoryOperation.objects.filter(
                created_at__gte=three_years_ago,
                operation_type__in=['in', 'out'],  # 只统计入库和出库
                # 不过滤 is_deleted，报表包含所有历史记录
            ).annotate(
                year=TruncYear('created_at')
            ).values('year', 'operation_type').annotate(
                total=Count('id')  # 统计次数而不是数量
            ).order_by('year')
            
            # 构建年度数据
            year_data = {}
            for stat in yearly_stats:
                year_key = stat['year'].year if stat['year'] else None
                if year_key:
                    if year_key not in year_data:
                        year_data[year_key] = {'in': 0, 'out': 0}
                    op_type = stat['operation_type']
                    if op_type in ['in', 'out']:
                        year_data[year_key][op_type] = stat['total'] or 0
            
            # 生成最近3年
            current_year = datetime.now().year
            for i in range(2, -1, -1):
                year = current_year - i
                labels.append(f"{year}年")
                data_entry = year_data.get(year, {'in': 0, 'out': 0})
                inbound_data.append(data_entry['in'])
                outbound_data.append(data_entry['out'])
        
        data = {
            'labels': labels,
            'inbound': inbound_data,
            'outbound': outbound_data
        }
        
        # 调试日志（开发环境）
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f'趋势数据 ({period}): labels={len(labels)}, inbound={inbound_data}, outbound={outbound_data}')
        
        # 缓存60秒
        cache.set(cache_key, data, 60)
        
        return APIResponse.success(data=data)


class DashboardDistributionView(APIView):
    """库存类别分布"""
    permission_classes = [IsAuthenticated]  # 需要登录
    
    def get(self, request):
        """获取库存类别分布数据 - 优化版本，使用缓存"""
        from django.core.cache import cache
        
        # 尝试从缓存获取（缓存60秒）
        cache_key = 'dashboard_distribution'
        cached_data = cache.get(cache_key)
        if cached_data:
            return APIResponse.success(data=cached_data)
        
        # 使用单次聚合查询代替循环查询
        category_stats = Item.objects.values('category__name').annotate(
            count=Count('id')
        ).filter(count__gt=0).order_by('-count')
        
        labels = [stat['category__name'] or '未分类' for stat in category_stats]
        values = [stat['count'] for stat in category_stats]
        
        data = {
            'labels': labels,
            'values': values
        }
        
        # 缓存60秒
        cache.set(cache_key, data, 60)
        
        return APIResponse.success(data=data)


class SystemInfoView(APIView):
    """系统信息"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """获取系统信息"""
        import django
        from django.conf import settings
        from django.db import connection
        
        # 获取数据库类型
        db_engine = settings.DATABASES['default']['ENGINE']
        if 'sqlite' in db_engine:
            db_type = 'SQLite'
        elif 'postgresql' in db_engine:
            db_type = 'PostgreSQL'
        elif 'mysql' in db_engine:
            db_type = 'MySQL'
        else:
            db_type = db_engine.split('.')[-1]
        
        # 统计数据
        items_count = Item.objects.count()
        warehouses_count = Warehouse.objects.filter(is_active=True).count()
        suppliers_count = Supplier.objects.filter(status='active').count()
        operations_count = InventoryOperation.objects.count()
        categories_count = Category.objects.filter(is_active=True).count()
        
        # 库存总量和总价值
        stock_stats = Item.objects.aggregate(
            total_stock=Sum('stock'),
            total_value=Sum('price')
        )
        
        data = {
            'system': {
                'name': '库存管理系统',
                'version': 'v1.0.0',
                'backend': f'Django {django.get_version()}',
                'database': db_type,
                'python_version': f'Python {__import__("sys").version.split()[0]}',
            },
            'statistics': {
                'items_count': items_count,
                'warehouses_count': warehouses_count,
                'suppliers_count': suppliers_count,
                'operations_count': operations_count,
                'categories_count': categories_count,
                'total_stock': stock_stats['total_stock'] or 0,
            },
            'server_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
        
        return APIResponse.success(data=data)
