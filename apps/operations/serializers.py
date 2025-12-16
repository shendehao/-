"""
出入库操作序列化器
"""
from rest_framework import serializers
from django.db import transaction
from .models import InventoryOperation
from apps.inventory.models import Item


class InventoryOperationSerializer(serializers.ModelSerializer):
    """库存操作序列化器"""
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_code = serializers.CharField(source='item.code', read_only=True)
    item_image = serializers.SerializerMethodField()
    item_warehouse_name = serializers.CharField(source='item.warehouse.name', read_only=True)
    item_warehouse_location = serializers.CharField(source='item.warehouse_location', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    operator_name = serializers.CharField(source='operator.get_full_name', read_only=True)
    operation_type_display = serializers.CharField(source='get_operation_type_display', read_only=True)
    
    class Meta:
        model = InventoryOperation
        fields = [
            'id', 'item', 'item_name', 'item_code', 'item_image', 'item_warehouse_name',
            'item_warehouse_location', 'operation_type', 'operation_type_display',
            'quantity', 'before_stock', 'after_stock', 'supplier', 'supplier_name',
            'recipient', 'department', 'purpose', 'from_warehouse', 'to_warehouse',
            'notes', 'operator', 'operator_name', 'created_at'
        ]
        read_only_fields = ['before_stock', 'after_stock', 'operator', 'created_at']
    
    def get_item_image(self, obj):
        """获取物品图片URL"""
        if obj.item and obj.item.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.item.image.url)
            return obj.item.image.url
        return None
    
    def validate_quantity(self, value):
        """验证数量"""
        if value <= 0:
            raise serializers.ValidationError("数量必须大于0")
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        """创建操作记录并更新库存"""
        request = self.context.get('request')
        item = validated_data['item']
        operation_type = validated_data['operation_type']
        quantity = validated_data['quantity']
        
        # 设置操作人
        if request and hasattr(request, 'user'):
            validated_data['operator'] = request.user
        
        # 记录操作前库存
        validated_data['before_stock'] = item.stock
        
        # 根据操作类型更新库存
        if operation_type == 'in':
            item.stock += quantity
        elif operation_type == 'out':
            if item.stock < quantity:
                raise serializers.ValidationError("库存不足")
            item.stock -= quantity
        elif operation_type == 'adjust':
            # 调整为直接设置库存
            item.stock = quantity
        
        # 记录操作后库存
        validated_data['after_stock'] = item.stock
        
        # 保存物品和操作记录
        item.save()
        operation = super().create(validated_data)
        
        return operation


class InboundSerializer(serializers.Serializer):
    """入库操作序列化器"""
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    warehouse = serializers.IntegerField(required=True)  # 入库仓库必选
    supplier = serializers.IntegerField(required=True)  # 供应商必选
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_supplier(self, value):
        """验证供应商"""
        if not value:
            raise serializers.ValidationError("请选择供应商")
        from apps.suppliers.models import Supplier
        if not Supplier.objects.filter(id=value, status='active').exists():
            raise serializers.ValidationError("供应商不存在或未启用")
        return value
    
    def validate_warehouse(self, value):
        """验证仓库"""
        if not value:
            raise serializers.ValidationError("请选择入库仓库")
        from apps.warehouses.models import Warehouse
        if not Warehouse.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("仓库不存在或未启用")
        return value
    
    def validate(self, attrs):
        """验证仓库容量"""
        from apps.warehouses.models import Warehouse
        quantity = attrs['quantity']
        warehouse_id = attrs['warehouse']
        
        # 获取目标仓库
        warehouse = Warehouse.objects.get(id=warehouse_id)
        
        # 检查仓库容量
        if warehouse.capacity > 0:
            new_usage = warehouse.current_usage + quantity
            if new_usage > warehouse.capacity:
                available = warehouse.capacity - warehouse.current_usage
                raise serializers.ValidationError(
                    f"仓库容量不足！\n"
                    f"仓库：{warehouse.name}\n"
                    f"容量：{warehouse.capacity}\n"
                    f"当前使用：{warehouse.current_usage}\n"
                    f"可用空间：{max(0, available)}\n"
                    f"入库数量：{quantity}"
                )
        
        # 保存仓库对象供后续使用
        attrs['warehouse_obj'] = warehouse
        
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        """执行入库操作"""
        from apps.suppliers.models import Supplier
        request = self.context.get('request')
        item = validated_data['item']
        quantity = validated_data['quantity']
        supplier_id = validated_data.get('supplier')
        warehouse = validated_data.get('warehouse_obj')
        
        supplier = None
        if supplier_id:
            supplier = Supplier.objects.filter(id=supplier_id).first()
        
        # 获取操作人（如果已登录）
        operator = None
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            operator = request.user
        
        # 记录原仓库名称（如果有变更）
        old_warehouse_name = item.warehouse.name if item.warehouse else None
        notes = validated_data.get('notes', '')
        if old_warehouse_name and item.warehouse_id != warehouse.id:
            notes = f"[仓库变更: {old_warehouse_name} → {warehouse.name}] {notes}"
        
        operation = InventoryOperation.objects.create(
            item=item,
            operation_type='in',
            quantity=quantity,
            before_stock=item.stock,
            after_stock=item.stock + quantity,
            supplier=supplier,
            notes=notes,
            operator=operator
        )
        
        # 更新物品库存和仓库
        item.stock += quantity
        item.warehouse = warehouse  # 更新物品所在仓库
        item.save()
        
        return operation


class OutboundSerializer(serializers.Serializer):
    """出库操作序列化器"""
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    recipient = serializers.CharField(max_length=100)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    purpose = serializers.CharField(max_length=200, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        """验证库存是否足够"""
        item = attrs['item']
        quantity = attrs['quantity']
        if item.stock < quantity:
            raise serializers.ValidationError(f"库存不足，当前库存：{item.stock}")
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        """执行出库操作"""
        request = self.context.get('request')
        item = validated_data['item']
        quantity = validated_data['quantity']
        
        # 获取操作人（如果已登录）
        operator = None
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            operator = request.user
        
        operation = InventoryOperation.objects.create(
            item=item,
            operation_type='out',
            quantity=quantity,
            before_stock=item.stock,
            after_stock=item.stock - quantity,
            recipient=validated_data['recipient'],
            department=validated_data.get('department', ''),
            purpose=validated_data.get('purpose', ''),
            notes=validated_data.get('notes', ''),
            operator=operator
        )
        
        item.stock -= quantity
        item.save()
        
        return operation


class TransferSerializer(serializers.Serializer):
    """调拨操作序列化器"""
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    from_warehouse = serializers.IntegerField(required=False, allow_null=True)  # 可选，默认使用物品所在仓库
    to_warehouse = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        """验证调拨数据"""
        item = attrs['item']
        quantity = attrs['quantity']
        to_warehouse_id = attrs['to_warehouse']
        
        # 如果没有提供源仓库，使用物品所在仓库
        from_warehouse_id = attrs.get('from_warehouse')
        if not from_warehouse_id and item.warehouse:
            from_warehouse_id = item.warehouse.id
            attrs['from_warehouse'] = from_warehouse_id
        
        if not from_warehouse_id:
            raise serializers.ValidationError("无法确定源仓库，请选择源仓库或确保物品已分配仓库")
        
        # 验证源仓库和目标仓库不能相同
        if from_warehouse_id == to_warehouse_id:
            raise serializers.ValidationError("源仓库和目标仓库不能相同")
        
        # 验证仓库是否存在
        from apps.warehouses.models import Warehouse
        if not Warehouse.objects.filter(id=from_warehouse_id, is_active=True).exists():
            raise serializers.ValidationError("源仓库不存在或未启用")
        
        to_warehouse = Warehouse.objects.filter(id=to_warehouse_id, is_active=True).first()
        if not to_warehouse:
            raise serializers.ValidationError("目标仓库不存在或未启用")
        
        # 验证库存是否足够
        if item.stock < quantity:
            raise serializers.ValidationError(f"库存不足，当前库存：{item.stock}")
        
        # 验证目标仓库容量
        if to_warehouse.capacity > 0:
            current_usage = to_warehouse.current_usage
            new_usage = current_usage + quantity
            available = to_warehouse.capacity - current_usage
            
            if new_usage > to_warehouse.capacity:
                raise serializers.ValidationError(
                    f"目标仓库容量不足！仓库「{to_warehouse.name}」容量：{to_warehouse.capacity}，已使用：{current_usage}，可用：{max(0, available)}，调拨数量：{quantity}"
                )
        
        # 保存目标仓库对象供后续使用
        attrs['to_warehouse_obj'] = to_warehouse
        
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        """执行调拨操作"""
        from apps.warehouses.models import Warehouse
        request = self.context.get('request')
        item = validated_data['item']
        quantity = validated_data['quantity']
        from_warehouse_id = validated_data['from_warehouse']
        to_warehouse_id = validated_data['to_warehouse']
        
        from_warehouse = Warehouse.objects.get(id=from_warehouse_id)
        to_warehouse = Warehouse.objects.get(id=to_warehouse_id)
        
        # 获取操作人（如果已登录）
        operator = None
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            operator = request.user
        
        # 创建调拨记录
        operation = InventoryOperation.objects.create(
            item=item,
            operation_type='transfer',
            quantity=quantity,
            before_stock=item.stock,
            after_stock=item.stock,  # 调拨不改变总库存
            from_warehouse=from_warehouse.name,
            to_warehouse=to_warehouse.name,
            notes=validated_data.get('notes', ''),
            operator=operator
        )
        
        # 真正更新物品的仓库！
        item.warehouse = to_warehouse
        item.save()
        
        return operation
