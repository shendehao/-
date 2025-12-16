"""
统一API响应格式
"""
from rest_framework.response import Response
from rest_framework import status


class APIResponse:
    """统一API响应格式"""
    
    @staticmethod
    def success(data=None, message='操作成功', status_code=status.HTTP_200_OK):
        """成功响应"""
        response_data = {
            'success': True,
            'message': message,
        }
        if data is not None:
            response_data['data'] = data
        return Response(response_data, status=status_code)
    
    @staticmethod
    def error(message='操作失败', code='ERROR', details=None, status_code=status.HTTP_400_BAD_REQUEST):
        """错误响应"""
        error_data = {
            'code': code,
            'message': message,
        }
        if details:
            error_data['details'] = details
        
        return Response({
            'success': False,
            'error': error_data
        }, status=status_code)
    
    @staticmethod
    def paginated(queryset, serializer_class, request, message='获取成功'):
        """分页响应"""
        from .pagination import StandardPagination
        
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = serializer_class(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        serializer = serializer_class(queryset, many=True, context={'request': request})
        return APIResponse.success(serializer.data, message)
