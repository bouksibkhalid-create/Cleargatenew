
import sentry_sdk
from sentry_sdk.integrations.logging import LoggingIntegration
import os
from src.utils.logger import get_logger

logger = get_logger(__name__)

def init_sentry():
    """
    Initialize Sentry for error tracking
    
    Only initializes if SENTRY_DSN is set
    """
    sentry_dsn = os.getenv("SENTRY_DSN")
    environment = os.getenv("ENVIRONMENT", "development")
    
    if not sentry_dsn:
        logger.info("sentry_disabled", reason="SENTRY_DSN not set")
        return
    
    # Configure Sentry
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        
        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        # We recommend adjusting this value in production.
        traces_sample_rate=0.1 if environment == "production" else 1.0,
        
        # Integrations
        integrations=[
            LoggingIntegration(
                level=None,  # Capture all levels
                event_level=None  # Send errors as events
            )
        ],
        
        # Release tracking
        release=os.getenv("NETLIFY_BUILD_ID"),
        
        # Send default PII (useful for debugging)
        send_default_pii=False
    )
    
    logger.info(
        "sentry_initialized",
        environment=environment,
        dsn=sentry_dsn[:20] + "..."
    )

def capture_exception(error: Exception, context: dict = None):
    """
    Capture exception in Sentry
    
    Args:
        error: Exception to capture
        context: Additional context
    """
    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_extra(key, value)
            sentry_sdk.capture_exception(error)
    else:
        sentry_sdk.capture_exception(error)
    
    # Also log to standard logger
    logger.error(
        "exception_captured",
        error=str(error),
        error_type=type(error).__name__,
        context=context
    )
