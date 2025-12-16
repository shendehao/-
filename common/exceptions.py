"""
自定义异常处理
"""
from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException, ValidationError
from .responses import APIResponse


def custom_exception_handler(exc, context):
    """自定义异常处理"""
    response = exception_handler(exc, context)
    
    if response is not None:
        if isinstance(exc, ValidationError):
            return APIResponse.error(
                message='数据验证失败',
                code='VALIDATION_ERROR',
                details=response.data,
                status_code=response.status_code
            )
        elif isinstance(exc, APIException):
            return APIResponse.error(
                message=str(exc.detail) if hasattr(exc, 'detail') else str(exc),
                code=exc.default_code.upper() if hasattr(exc, 'default_code') else 'ERROR',
                status_code=response.status_code
            )
    
    return response


class BusinessException(APIException):
    """业务异常"""
    status_code = 400
    default_detail = '业务处理失败'
    default_code = 'business_error'
    
    def __init__(self, detail=None, code=None):
        if detail is not None:
            self.detail = detail
        if code is not None:
            self.default_code = code
        super().__init__(detail, code)
