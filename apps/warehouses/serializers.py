"""
仓库管理序列化器
"""
import uuid
from rest_framework import serializers
from .models import Warehouse

class WarehouseSerializer(serializers.ModelSerializer):
    """仓库序列化器"""
    current_usage = serializers.ReadOnlyField()
    usage_rate = serializers.ReadOnlyField()
    code = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True, default='')
    manager = serializers.CharField(required=False, allow_blank=True, default='')
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    capacity = serializers.IntegerField(required=False, default=0)
    
    class Meta:
        model = Warehouse
        fields = [
            'id', 'name', 'code', 'location', 'capacity',
            'manager', 'phone', 'is_active', 'current_usage',
            'usage_rate', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_code(self, value):
        """验证仓库编码唯一性"""
        if not value:
            return value
        if self.instance:
            if Warehouse.objects.exclude(id=self.instance.id).filter(code=value).exists():
                raise serializers.ValidationError("仓库编码已存在")
        else:
            if Warehouse.objects.filter(code=value).exists():
                raise serializers.ValidationError("仓库编码已存在")
        return value
    
    def create(self, validated_data):
        """创建仓库，自动生成编码"""
        if not validated_data.get('code'):
            validated_data['code'] = f"WH{uuid.uuid4().hex[:8].upper()}"
        return super().create(validated_data)


class WarehouseListSerializer(serializers.ModelSerializer):
    """仓库列表序列化器"""
    current_usage = serializers.ReadOnlyField()
    usage_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'code', 'location', 'capacity', 'current_usage', 'usage_rate', 'is_active', 'manager', 'phone']
