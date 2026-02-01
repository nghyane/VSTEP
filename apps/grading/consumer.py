"""
Redis Streams Consumer
Alternative to Celery for direct queue consumption
"""
import os
import json
import redis
from datetime import datetime

from app.models import GradingJob, TaskType
from app.tasks import grade_essay, grade_speech


def create_redis_client():
    """Create Redis connection"""
    return redis.Redis.from_url(
        os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
        decode_responses=True
    )


def process_message(message_id: str, fields: dict):
    """Process a single message from Redis Stream"""
    try:
        data = json.loads(fields.get('data', '{}'))
        job = GradingJob(**data)
        
        print(f"[{datetime.now()}] Processing job: {job.submission_id}")
        
        # Route to appropriate task
        if job.type == TaskType.WRITING:
            result = grade_essay.delay(job.dict())
        elif job.type == TaskType.SPEAKING:
            result = grade_speech.delay(job.dict())
        else:
            print(f"Unknown task type: {job.type}")
            return False
        
        print(f"  → Task queued: {result.id}")
        return True
        
    except Exception as e:
        print(f"Error processing message {message_id}: {e}")
        return False


def consume_stream(
    stream_name: str = "grading.request",
    group_name: str = "graders",
    consumer_name: str = "worker-1",
    block_ms: int = 5000
):
    """
    Consume from Redis Stream using consumer groups
    """
    r = create_redis_client()
    
    # Create consumer group if not exists
    try:
        r.xgroup_create(stream_name, group_name, id='0', mkstream=True)
        print(f"Created consumer group: {group_name}")
    except redis.exceptions.ResponseError as e:
        if "already exists" in str(e):
            print(f"Consumer group {group_name} already exists")
        else:
            raise
    
    print(f"🚀 Starting consumer: {consumer_name}")
    print(f"📡 Listening on stream: {stream_name}")
    print(f"👥 Group: {group_name}")
    
    while True:
        try:
            # Read from stream
            messages = r.xreadgroup(
                groupname=group_name,
                consumername=consumer_name,
                streams={stream_name: '>'},  # Only new messages
                count=1,
                block=block_ms
            )
            
            if not messages:
                continue
            
            # Process messages
            for stream, msgs in messages:
                for msg_id, fields in msgs:
                    success = process_message(msg_id, fields)
                    
                    if success:
                        # Acknowledge message
                        r.xack(stream_name, group_name, msg_id)
                    else:
                        print(f"  ⚠️ Failed to process, not acknowledging: {msg_id}")
                        
        except KeyboardInterrupt:
            print("\n👋 Shutting down consumer...")
            break
        except Exception as e:
            print(f"Error in consumer loop: {e}")
            continue


if __name__ == "__main__":
    import sys
    
    # Allow custom consumer name
    consumer_name = sys.argv[1] if len(sys.argv) > 1 else "worker-1"
    
    consume_stream(consumer_name=consumer_name)
