
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
from src.utils.logger import get_logger

logger = get_logger(__name__)

class RateLimiter:
    """
    Simple rate limiter for API endpoints
    
    For production, consider using Redis-based rate limiting
    """
    
    def __init__(
        self, 
        max_requests: int = 100, 
        window_seconds: int = 60
    ):
        """
        Initialize rate limiter
        
        Args:
            max_requests: Maximum requests per window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window = timedelta(seconds=window_seconds)
        self.requests: Dict[str, list] = {}
    
    def is_allowed(self, identifier: str) -> Tuple[bool, int]:
        """
        Check if request is allowed
        
        Args:
            identifier: Unique identifier (IP, user ID, etc.)
            
        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        now = datetime.utcnow()
        
        # Get request history
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        history = self.requests[identifier]
        
        # Remove old requests
        cutoff = now - self.window
        history = [req_time for req_time in history if req_time > cutoff]
        self.requests[identifier] = history
        
        # Check limit
        if len(history) >= self.max_requests:
            logger.warning(
                "rate_limit_exceeded",
                identifier=identifier,
                requests=len(history)
            )
            return (False, 0)
        
        # Add current request
        history.append(now)
        remaining = self.max_requests - len(history)
            
        return (True, remaining)
    
    def cleanup(self):
        """Remove expired request histories"""
        now = datetime.utcnow()
        cutoff = now - self.window
        
        for identifier in list(self.requests.keys()):
            history = self.requests[identifier]
            history = [req_time for req_time in history if req_time > cutoff]
            
            if not history:
                del self.requests[identifier]
            else:
                self.requests[identifier] = history

# Global rate limiter
_rate_limiter: Optional[RateLimiter] = None

def get_rate_limiter() -> RateLimiter:
    """Get singleton rate limiter"""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter(
            max_requests=100,  # 100 requests
            window_seconds=60   # per minute
        )
    return _rate_limiter
