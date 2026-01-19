"""Custom exception classes"""


class APIError(Exception):
    """Base exception for API errors"""
    
    def __init__(self, message: str, status_code: int = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class APITimeoutError(APIError):
    """Exception for API timeout errors"""
    
    def __init__(self, message: str):
        super().__init__(message, status_code=504)


class ValidationError(APIError):
    """Exception for validation errors"""
    
    def __init__(self, message: str):
        super().__init__(message, status_code=400)
