"""
Celery Application Configuration
"""
import os
from celery import Celery

# Create Celery app
celery_app = Celery(
    'vstep_grading',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    include=['app.tasks']
)

# Celery Configuration
celery_app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task execution
    task_always_eager=False,  # Set True for testing without worker
    task_store_eager_result=True,
    
    # Result backend
    result_expires=3600,  # 1 hour
    result_backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    
    # Worker settings
    worker_prefetch_multiplier=1,  # Process one task at a time
    worker_max_tasks_per_child=1000,
    
    # Retry settings
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,
    
    # Queue configuration
    task_default_queue='grading',
    task_routes={
        'app.tasks.grade_essay': {'queue': 'essay'},
        'app.tasks.grade_speech': {'queue': 'speech'},
    },
    
    # Redis-specific
    redis_max_connections=20,
    redis_socket_keepalive=True,
    
    # Visibility timeout (must be > longest task)
    visibility_timeout=43200,  # 12 hours
)

# Auto-discover tasks
celery_app.autodiscover_tasks()
