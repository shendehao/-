"""
用户认证视图
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from common.responses import APIResponse
from .serializers import (
    LoginSerializer, RegisterSerializer,
    UserSerializer, ChangePasswordSerializer,
    LOCKOUT_DURATION
)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """用户登录"""
    serializer = LoginSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return APIResponse.success(
            data={
                'token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            },
            message='登录成功'
        )
    
    return APIResponse.error(
        message='登录失败',
        details=serializer.errors,
        status_code=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """用户注册"""
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        return APIResponse.success(
            data={
                'token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            },
            message='注册成功',
            status_code=status.HTTP_201_CREATED
        )
    
    return APIResponse.error(
        message='注册失败',
        details=serializer.errors,
        status_code=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """用户登出"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return APIResponse.success(message='登出成功')
    except Exception as e:
        return APIResponse.error(message=f'登出失败: {str(e)}')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """获取当前用户信息"""
    serializer = UserSerializer(request.user)
    return APIResponse.success(data=serializer.data, message='获取用户信息成功')


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """更新当前用户信息"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return APIResponse.success(data=serializer.data, message='更新成功')
    
    return APIResponse.error(
        message='更新失败',
        details=serializer.errors,
        status_code=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """修改密码"""
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        serializer.save()
        return APIResponse.success(message='密码修改成功')
    
    return APIResponse.error(
        message='密码修改失败',
        details=serializer.errors,
        status_code=status.HTTP_400_BAD_REQUEST
    )


# ==================== 黑名单管理 ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def blacklist_list(request):
    """获取登录黑名单列表"""
    try:
        # 从缓存中获取所有登录尝试记录
        blacklist_keys = cache.get('blacklist_keys', [])
        blacklist_items = []
        
        for key in blacklist_keys:
            attempts = cache.get(key, 0)
            if attempts >= 5:  # MAX_LOGIN_ATTEMPTS
                # 解析键名: login_attempts:ip (只有IP，不再有用户名)
                parts = key.split(':')
                ip = parts[1] if len(parts) >= 2 else 'unknown'
                blacklist_items.append({
                    'key': key,
                    'ip': ip,
                    'attempts': attempts,
                    'locked': True
                })
        
        return APIResponse.success(data=blacklist_items, message='获取黑名单成功')
    except Exception as e:
        return APIResponse.error(message=f'获取黑名单失败: {str(e)}')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blacklist_add(request):
    """手动添加IP到黑名单"""
    try:
        target = request.data.get('target', '').strip()
        if not target:
            return APIResponse.error(message='请输入IP地址')
        
        # 创建黑名单键 - 只基于IP
        key = f'login_attempts:{target}'
        cache.set(key, 999, LOCKOUT_DURATION * 4)  # 设置为超过最大尝试次数，锁定更长时间
        
        # 更新黑名单键列表
        blacklist_keys = cache.get('blacklist_keys', [])
        if key not in blacklist_keys:
            blacklist_keys.append(key)
            cache.set('blacklist_keys', blacklist_keys, None)  # 永久保存
        
        return APIResponse.success(message=f'已将IP {target} 添加到黑名单')
    except Exception as e:
        return APIResponse.error(message=f'添加失败: {str(e)}')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blacklist_remove(request):
    """从黑名单移除"""
    try:
        key = request.data.get('key', '').strip()
        if not key:
            return APIResponse.error(message='无效的黑名单项')
        
        # 删除缓存
        cache.delete(key)
        
        # 从黑名单键列表中移除
        blacklist_keys = cache.get('blacklist_keys', [])
        if key in blacklist_keys:
            blacklist_keys.remove(key)
            cache.set('blacklist_keys', blacklist_keys, None)
        
        return APIResponse.success(message='已从黑名单移除')
    except Exception as e:
        return APIResponse.error(message=f'移除失败: {str(e)}')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blacklist_clear(request):
    """清空所有黑名单"""
    try:
        blacklist_keys = cache.get('blacklist_keys', [])
        
        # 删除所有黑名单缓存
        for key in blacklist_keys:
            cache.delete(key)
        
        # 清空黑名单键列表
        cache.set('blacklist_keys', [], None)
        
        return APIResponse.success(message='已清空所有黑名单')
    except Exception as e:
        return APIResponse.error(message=f'清空失败: {str(e)}')
