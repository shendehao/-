"""
用户认证序列化器 - 企业级安全
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.utils import timezone
from .models import User

# 安全配置
MAX_LOGIN_ATTEMPTS = 5  # 最大登录尝试次数
LOCKOUT_DURATION = 300  # 锁定时间（秒）= 5分钟


class UserSerializer(serializers.ModelSerializer):
    """用户序列化器"""
    role_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'avatar', 'department', 'role', 'role_display',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LoginSerializer(serializers.Serializer):
    """登录序列化器 - 带安全防护"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def _get_client_ip(self):
        """获取客户端IP"""
        request = self.context.get('request')
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                return x_forwarded_for.split(',')[0].strip()
            return request.META.get('REMOTE_ADDR', 'unknown')
        return 'unknown'
    
    def _get_lockout_key(self):
        """获取锁定缓存键 - 只基于IP，不绑定用户名"""
        ip = self._get_client_ip()
        return f'login_attempts:{ip}'
    
    def _check_lockout(self):
        """检查IP是否被锁定"""
        try:
            key = self._get_lockout_key()
            attempts = cache.get(key, 0)
            if attempts >= MAX_LOGIN_ATTEMPTS:
                return True
        except Exception:
            pass  # 缓存不可用时跳过锁定检查
        return False
    
    def _record_failed_attempt(self):
        """记录失败尝试 - 只记录IP"""
        try:
            key = self._get_lockout_key()
            attempts = cache.get(key, 0) + 1
            cache.set(key, attempts, LOCKOUT_DURATION)
            
            # 如果达到锁定阈值，添加到黑名单键列表
            if attempts >= MAX_LOGIN_ATTEMPTS:
                blacklist_keys = cache.get('blacklist_keys', [])
                if key not in blacklist_keys:
                    blacklist_keys.append(key)
                    cache.set('blacklist_keys', blacklist_keys, None)
            
            return MAX_LOGIN_ATTEMPTS - attempts
        except Exception:
            return MAX_LOGIN_ATTEMPTS - 1  # 缓存不可用时返回默认值
    
    def _clear_failed_attempts(self):
        """清除失败记录"""
        try:
            key = self._get_lockout_key()
            cache.delete(key)
        except Exception:
            pass  # 缓存不可用时忽略
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if not username or not password:
            raise serializers.ValidationError('必须提供用户名和密码')
        
        # 检查IP是否被锁定
        if self._check_lockout():
            raise serializers.ValidationError(
                f'当前IP已被锁定，请{LOCKOUT_DURATION // 60}分钟后重试'
            )
        
        # 验证用户
        user = authenticate(
            request=self.context.get('request'),
            username=username,
            password=password
        )
        
        if not user:
            remaining = self._record_failed_attempt()
            if remaining > 0:
                raise serializers.ValidationError(
                    f'用户名或密码错误，还剩{remaining}次尝试机会'
                )
            else:
                raise serializers.ValidationError(
                    f'当前IP已被锁定，请{LOCKOUT_DURATION // 60}分钟后重试'
                )
        
        if not user.is_active:
            raise serializers.ValidationError('用户已被禁用，请联系管理员')
        
        # 登录成功，清除该IP的失败记录
        self._clear_failed_attempts()
        
        # 更新最后登录时间
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        attrs['user'] = user
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    """注册序列化器"""
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'department'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': '两次密码不一致'})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """修改密码序列化器"""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=6)
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('原密码错误')
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': '两次密码不一致'})
        return attrs
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
