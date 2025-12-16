"""
库存管理序列化器
"""
import uuid
from datetime import datetime
from rest_framework import serializers
from .models import Category, Item
from apps.suppliers.serializers import SupplierListSerializer
from apps.warehouses.serializers import WarehouseListSerializer


class CategorySerializer(serializers.ModelSerializer):
    """类别序列化器"""
    item_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'code', 'description', 'parent', 'is_active', 'item_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ItemSerializer(serializers.ModelSerializer):
    """物品序列化器"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_value = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    # 允许code为空，创建时自动生成
    code = serializers.CharField(required=False, allow_blank=True)
    barcode = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'barcode', 'category', 'category_name',
            'supplier', 'supplier_name', 'warehouse', 'warehouse_name',
            'price', 'stock', 'min_stock', 'warehouse_location',
            'description', 'image', 'status', 'status_display',
            'total_value', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'created_by', 'created_at', 'updated_at']
    
    def validate_code(self, value):
        """验证物品编码唯一性"""
        # 如果code为空，跳过验证（create方法会自动生成）
        if not value:
            return value
        if self.instance:
            if Item.objects.exclude(id=self.instance.id).filter(code=value).exists():
                raise serializers.ValidationError("物品编码已存在")
        else:
            if Item.objects.filter(code=value).exists():
                raise serializers.ValidationError("物品编码已存在")
        return value
    
    def validate(self, attrs):
        """验证物品数据，包括仓库容量"""
        from apps.warehouses.models import Warehouse
        
        warehouse = attrs.get('warehouse')
        stock = attrs.get('stock', 0)
        
        # 验证仓库容量
        if warehouse and stock > 0 and warehouse.capacity > 0:
            # 计算当前仓库使用量
            current_usage = warehouse.current_usage
            
            # 如果是更新操作且物品在同一仓库，需要排除当前物品的库存
            if self.instance and self.instance.warehouse_id == warehouse.id:
                current_usage -= self.instance.stock
            
            # 计算添加后的使用量
            new_usage = current_usage + stock
            available = warehouse.capacity - current_usage
            
            if new_usage > warehouse.capacity:
                raise serializers.ValidationError({
                    'stock': f"仓库容量不足！仓库「{warehouse.name}」容量：{warehouse.capacity}，已使用：{current_usage}，可用：{max(0, available)}，需要：{stock}"
                })
        
        return attrs
    
    def create(self, validated_data):
        """创建物品时设置创建人并自动生成编码"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        
        # 如果没有提供code，自动生成唯一编码
        if not validated_data.get('code'):
            validated_data['code'] = self.generate_unique_code()
        
        # 如果没有提供barcode，使用code作为barcode
        if not validated_data.get('barcode'):
            validated_data['barcode'] = validated_data['code']
        
        return super().create(validated_data)
    
    def generate_unique_code(self):
        """生成唯一物品编码: ITEM-YYYYMMDD-XXXX"""
        date_str = datetime.now().strftime('%Y%m%d')
        # 使用UUID的前8位确保唯一性
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"ITEM-{date_str}-{unique_id}"


class ItemListSerializer(serializers.ModelSerializer):
    """物品列表序列化器（简化版）"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_value = serializers.ReadOnlyField()
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'category_name', 'supplier_name',
            'warehouse', 'warehouse_name', 'price', 'stock', 'min_stock',
            'warehouse_location', 'image', 'status', 'status_display', 'total_value'
        ]
    
    def get_image(self, obj):
        """获取物品图片完整URL"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ItemDetailSerializer(serializers.ModelSerializer):
    """物品详情序列化器"""
    category = CategorySerializer(read_only=True)
    supplier = SupplierListSerializer(read_only=True)
    warehouse = WarehouseListSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_value = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'barcode', 'category', 'supplier',
            'warehouse', 'price', 'stock', 'min_stock', 'warehouse_location',
            'description', 'image', 'status', 'status_display',
            'total_value', 'created_by_name', 'created_at', 'updated_at'
        ]
