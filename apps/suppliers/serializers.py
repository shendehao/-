"""
供应商管理序列化器
"""
from rest_framework import serializers
from .models import Supplier

class SupplierSerializer(serializers.ModelSerializer):
    """供应商序列化器"""
    item_count = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    code = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'code', 'contact', 'phone', 'email',
            'address', 'status', 'status_display', 'notes',
            'item_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_code(self, value):
        """验证供应商编码唯一性"""
        if not value:
            return value
        if self.instance:
            # 更新时排除自己
            if Supplier.objects.exclude(id=self.instance.id).filter(code=value).exists():
                raise serializers.ValidationError("供应商编码已存在")
        else:
            # 创建时检查
            if Supplier.objects.filter(code=value).exists():
                raise serializers.ValidationError("供应商编码已存在")
        return value
    
    def create(self, validated_data):
        """创建时自动生成编码"""
        import uuid
        if not validated_data.get('code'):
            validated_data['code'] = f"SUP{uuid.uuid4().hex[:8].upper()}"
        return super().create(validated_data)


class SupplierListSerializer(serializers.ModelSerializer):
    """供应商列表序列化器（简化版）"""
    item_count = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'code', 'contact', 'phone', 'email', 'status', 'status_display', 'item_count']
