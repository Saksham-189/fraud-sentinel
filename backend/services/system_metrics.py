import time
import psutil
from collections import deque
from datetime import datetime

class SystemMetrics:
    def __init__(self):
        self.app_start_time = time.time()
        self.total_requests = 0
        self.failed_requests = 0
        self.total_analyses = 0
        self.fraud_detections = 0
        self.api_latency_ms = 0.0
        self.latency_samples = deque(maxlen=100)
        self.recent_errors = deque(maxlen=50)
        self.recent_activity = deque(maxlen=50)

    def get_uptime(self):
        delta = int(time.time() - self.app_start_time)
        hours = delta // 3600
        minutes = (delta % 3600) // 60
        return f"{hours}h {minutes}m"

    def record_latency(self, latency_ms):
        self.latency_samples.append(latency_ms)
        self.api_latency_ms = sum(self.latency_samples) / len(self.latency_samples)
        
    def log_error(self, error_msg):
        self.failed_requests += 1
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.recent_errors.appendleft({"timestamp": timestamp, "error": error_msg})
        
    def log_activity(self, activity_msg):
        timestamp = datetime.now().strftime("%H:%M")
        self.recent_activity.appendleft(f"[{timestamp}] {activity_msg}")

metrics_store = SystemMetrics()
