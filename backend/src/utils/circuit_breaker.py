"""
Circuit breaker utility for external API resilience.

Uses pybreaker to implement circuit breaker pattern:
- CLOSED: Normal operation, requests go through
- OPEN: Too many failures, requests fail fast
- HALF-OPEN: Testing if service recovered

Configuration via environment variables:
- CIRCUIT_FAIL_MAX: Failures before opening (default: 5)
- CIRCUIT_RESET_TIMEOUT: Seconds before half-open (default: 30)
"""

import os
from pybreaker import CircuitBreaker, CircuitBreakerError
from src.utils.logger import get_logger

logger = get_logger(__name__)

# Configuration
FAIL_MAX = int(os.getenv("CIRCUIT_FAIL_MAX", "5"))
RESET_TIMEOUT = int(os.getenv("CIRCUIT_RESET_TIMEOUT", "30"))


def _on_state_change(cb, old_state, new_state):
    """Log circuit breaker state changes"""
    logger.warning(
        "circuit_breaker_state_change",
        breaker_name=cb.name,
        old_state=str(old_state),
        new_state=str(new_state)
    )


# Circuit breakers for each external service
opensanctions_breaker = CircuitBreaker(
    name="opensanctions",
    fail_max=FAIL_MAX,
    reset_timeout=RESET_TIMEOUT,
    listeners=[_on_state_change]
)

sanctions_io_breaker = CircuitBreaker(
    name="sanctions_io",
    fail_max=FAIL_MAX,
    reset_timeout=RESET_TIMEOUT,
    listeners=[_on_state_change]
)

neo4j_breaker = CircuitBreaker(
    name="neo4j",
    fail_max=FAIL_MAX,
    reset_timeout=RESET_TIMEOUT * 2,  # Longer timeout for database
    listeners=[_on_state_change]
)


def get_breaker(service_name: str) -> CircuitBreaker:
    """Get circuit breaker for a service"""
    breakers = {
        "opensanctions": opensanctions_breaker,
        "sanctions_io": sanctions_io_breaker,
        "neo4j": neo4j_breaker
    }
    return breakers.get(service_name, opensanctions_breaker)


def is_circuit_open(service_name: str) -> bool:
    """Check if circuit breaker is open for a service"""
    breaker = get_breaker(service_name)
    return breaker.current_state == "open"


# Re-export for convenient imports
__all__ = [
    "CircuitBreakerError",
    "opensanctions_breaker",
    "sanctions_io_breaker", 
    "neo4j_breaker",
    "get_breaker",
    "is_circuit_open"
]
