# Queue Contracts & Message Schemas

## 1. RabbitMQ Topology

```
                    ┌─────────────────────────────────────────┐
                    │         vstep.exchange (direct)          │
                    └─────────────────┬───────────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
   ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
   │ grading.request   │      │ grading.callback  │      │   grading.dlq     │
   │    (durable)      │      │    (durable)      │      │    (durable)      │
   └──────────────────┘      └──────────────────┘      └──────────────────┘
           │                          │                          │
           ▼                          ▼                          │
    ┌─────────────┐            ┌─────────────┐                  │
    │ Celery App  │            │   Bun App   │                  │
    │ (Consumer)  │            │  (Consumer) │                  │
    └─────────────┘            └─────────────┘                  │
                                                              ▼
                                                    ┌─────────────────┐
                                                    │ Manual Recovery │
                                                    │ / Alert Admin   │
                                                    └─────────────────┘
```

### 1.1 Exchange & Queue Configuration

```json
{
  "exchange": {
    "name": "vstep.exchange",
    "type": "direct",
    "durable": true
  },
  "queues": [
    {
      "name": "grading.request",
      "durable": true,
      "arguments": {
        "x-queue-type": "classic",
        "x-dead-letter-exchange": "vstep.exchange",
        "x-dead-letter-routing-key": "grading.dlq"
      }
    },
    {
      "name": "grading.callback",
      "durable": true,
      "arguments": {
        "x-queue-type": "classic"
      }
    },
    {
      "name": "grading.dlq",
      "durable": true,
      "arguments": {}
    }
  ]
}
```

## 2. Message Schemas

### 2.1 grading.request Message

**Purpose**: Request AI grading for a submission

```json
{
  "requestId": "req_abc123xyz",
  "submissionId": "sub_456def789",
  "userId": "usr_111222333",
  "skill": "writing",
  "attempt": 3,
  "deadlineAt": "2026-02-01T10:50:00Z",
  "payload": {
    "type": "essay",
    "content": "The essay content here...",
    "taskType": "task1",
    "wordCount": 180,
    "timeSpent": 2400
  },
  "metadata": {
    "traceId": "trace_789abc123",
    "spanId": "span_456def789",
    "timestamp": "2026-02-01T10:30:00Z",
    "priority": "normal",
    "retryCount": 0
  },
  "callback": {
    "queue": "grading.callback",
    "routingKey": "grading.callback"
  }
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requestId` | string | Yes | Unique identifier (UUID v4), used for idempotency |
| `submissionId` | string | Yes | Reference to submission in MainDB |
| `userId` | string | Yes | User who submitted |
| `skill` | enum | Yes | `writing` or `speaking` |
| `attempt` | int | Yes | Attempt number (1-indexed) |
| `deadlineAt` | string | Yes | ISO 8601 UTC. Computed by Main App using SLA per skill |
| `payload.type` | string | Yes | `essay`, `email`, `cue_card`, etc. |
| `payload.content` | string | Yes | The actual content to grade |
| `payload.wordCount` | int | Yes | For validation |
| `metadata.traceId` | string | Yes | OpenTelemetry trace ID |
| `metadata.timestamp` | string | Yes | ISO 8601 UTC |
| `metadata.retryCount` | int | No | Default 0 |

### 2.3 Timeout Semantics (SLA)

- Main App sets `deadlineAt` when creating the attempt:
  - `writing`: 20 minutes
  - `speaking`: 60 minutes
- Timeout and late-result behavior is defined in `docs/capstone/specs/reliability.vi.md`.

### 2.2 grading.callback Message

**Purpose**: Return grading results to Main App

```json
{
  "requestId": "req_abc123xyz",
  "submissionId": "sub_456def789",
  "status": "completed",
  "result": {
    "overallScore": 7.5,
    "band": "B2",
    "criteria": {
      "task_achievement": 7.0,
      "coherence_cohesion": 8.0,
      "lexical_resource": 7.5,
      "grammatical_range": 7.0
    },
    "confidence": 0.92,
    "feedback": {
      "strengths": ["Good vocabulary range", "Clear paragraphing"],
      "improvements": ["Avoid repetition", "More complex sentences"]
    },
    "processingTimeMs": 4500,
    "modelUsed": "gpt-4-turbo"
  },
  "error": null,
  "metadata": {
    "traceId": "trace_789abc123",
    "completedAt": "2026-02-01T10:30:45Z"
  }
}
```

#### Callback Status Values

| Status | Meaning |
|--------|---------|
| `completed` | Grading finished successfully |
| `error` | Processing failed (see error object) |
| `retrying` | Temporary failure, will retry |

## 3. Idempotency Rules

### 3.1 Request Idempotency

```
┌──────────────────────────────────────────────────────────────┐
│                  Idempotency Check Flow                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   Bun App                    Grading Service                  │
│       │                           │                            │
│       │  1. Generate requestId    │                            │
│       │  (UUID v4)                │                            │
│       │──────┐                    │                            │
│       │      │                    │                            │
│       │◄─────┘                    │                            │
│       │                           │                            │
│       │  2. Check MainDB          │                            │
│       │  (outbox table)           │                            │
│       │──────┐                    │                            │
│       │      │                    │                            │
│       │◄─────┘                    │                            │
│       │                           │                            │
│       │  3. Publish to RabbitMQ   │                            │
│       │  with requestId           │                            │
│       │───────────────────────────►│                            │
│       │                           │                            │
│       │                    4. Check GradingDB                 │
│       │                    (unique constraint)                │
│       │                    on requestId                       │
│       │                           │                            │
│       │                    5. If exists:                      │
│       │                    → Skip processing                  │
│       │                    → Send callback with cached result │
│       │                           │                            │
│       │                    6. If new:                         │
│       │                    → Process grading                  │
│       │                           │                            │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Idempotency Key Storage

**GradingDB Table: `grading_jobs`**

```sql
CREATE TABLE grading_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(64) UNIQUE NOT NULL,
    submission_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grading_jobs_request_id ON grading_jobs(request_id);
CREATE INDEX idx_grading_jobs_submission_id ON grading_jobs(submission_id);
CREATE INDEX idx_grading_jobs_status ON grading_jobs(status);
```

### 3.3 Celery Task Idempotency

```python
from celery import shared_task
from sqlalchemy import select

@shared_task(bind=True, max_retries=3)
def process_grading_request(self, request_id: str):
    # Task automatically has idempotency via Celery's task_id
    # Use requestId as Celery task name for deduplication
    
    existing = db.execute(
        select(GradingJob).where(GradingJob.request_id == request_id)
    ).first()
    
    if existing and existing.status == 'completed':
        # Already processed, return cached result
        return existing.result
    
    if existing and existing.status == 'processing':
        # Duplicate request, reject
        raise ValueError(f"Request {request_id} already processing")
    
    # Continue processing...
```

## 4. Consumer Configuration

### 4.1 Celery Worker

```python
# celery_config.py
broker_url = "amqp://rabbitmq:5672//"
task_serializer = "json"
result_serializer = "json"
accept_content = ["json"]
timezone = "UTC"
task_acks_late = True  # Acknowledge after completion
task_reject_on_worker_lost = True  # Requeue if worker dies
worker_prefetch_multiplier = 1  # Process one task at a time

# Retry policy
task_acks_on_failure_or_timeout = False
task_default_retry_delay = 2  # seconds (fallback if countdown not provided)
task_max_retries = 3
```

### 4.2 Celery Beat (Scheduled Tasks)

```python
# Periodic tasks for cleanup and monitoring
beat_schedule = {
    'cleanup-stale-jobs': {
        'task': 'tasks.cleanup_stale_jobs',
        'schedule': 300.0,  # Every 5 minutes
    },
    'retry-failed-jobs': {
        'task': 'tasks.retry_failed_jobs',
        'schedule': 600.0,  # Every 10 minutes
    },
}
```

---

*Document version: 1.0 - Last updated: SP26SE145*
