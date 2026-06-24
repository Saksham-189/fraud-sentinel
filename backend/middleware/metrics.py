import time
from services.system_metrics import metrics_store
import logging

logger = logging.getLogger(__name__)

class MetricsMiddleware:
    """Pure ASGI middleware — does NOT consume request body (unlike BaseHTTPMiddleware)."""
    
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()
        metrics_store.total_requests += 1
        status_code = 200

        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 200)
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as e:
            metrics_store.log_error(f"Exception on {scope.get('path', '?')}: {str(e)}")
            raise
        finally:
            process_time_ms = (time.time() - start_time) * 1000
            metrics_store.record_latency(process_time_ms)
            if status_code >= 500:
                metrics_store.log_error(f"HTTP {status_code} on {scope.get('path', '?')}")
