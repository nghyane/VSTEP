# Reliability & Error Handling

## 1. Outbox Pattern

### 1.1 Why Outbox Pattern?

```
┌─────────────────────────────────────────────────────────────────┐
│              Without Outbox (Potential Data Loss)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Bun App                          RabbitMQ                      │
│       │                               │                           │
│       │  1. BEGIN TRANSACTION          │                           │
│       │──────┐                         │                           │
│       │      │                         │                           │
│       │◄─────┘                         │                           │
│       │                                │                           │
│       │  2. INSERT submission          │                           │
│       │       (MainDB)                 │                           │
│       │──────┐                         │                           │
│       │      │                         │                           │
│       │◄─────┘                         │                           │
│       │                                │                           │
│       │  3. Publish to RabbitMQ ──────►│                           │
│       │                                │                           │
│       │  4. COMMIT                     │                           │
│       │──────┐                         │                           │
│       │      │                         │                           │
│       │◄─────┘                         │                           │
│       │                                │                           │
│       │           ⚠️ NETWORK FAILURE    │                           │
│       │           ⚠️ Message not sent   │                           │
│       │           ⚠️ Job lost!          │                           │
│       │                                │                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              With Outbox Pattern (Reliable)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Bun App                          RabbitMQ                      │
│       │                               │                           │
│       │  1. BEGIN TRANSACTION          │                           │
│       │──────┐                         │                           │
│       │      │                         │                           │
│       │◄─────┘                         │                           │
│       │                                │                           │
│       │  2. INSERT submission          │                           │
│       │  3. INSERT outbox message      │                           │
│       │       (same transaction)       │                           │
│       │──────┐                         │                           │
│       │      │                         │                           │
│       │◄─────┘                         │                           │
│       │                                │                           │
│       │  4. COMMIT                     │                           │
│       │       (atomic: submission +    │                           │
│       │        outbox message)         │                           │
│       │──────┐                         │                           │
│       │      │                         │                           │
│       │◄─────┘                         │                           │
│       │                                │                           │
│       │  5. Message Relay Worker       │                           │
│       │       reads outbox             │                           │
│       │       publishes to RabbitMQ    │                           │
│       │───────────────────────────────►│                           │
│       │                                │                           │
│       │  6. UPDATE outbox              │                           │
│       │       SET processed = true     │                           │
│       │                                │                           │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Outbox Table Schema

```sql
-- MainDB: outbox table
CREATE TABLE outbox_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id VARCHAR(64) NOT NULL,    -- submissionId
    aggregate_type VARCHAR(64) NOT NULL,  -- 'Submission'
    message_type VARCHAR(64) NOT NULL,    -- 'grading.request'
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    retry_count INT DEFAULT 0,
    error_message TEXT
);

CREATE INDEX idx_outbox_status ON outbox_messages(status, created_at);
CREATE INDEX idx_outbox_aggregate ON outbox_messages(aggregate_id, aggregate_type);
```

### 1.3 Message Relay Worker

```python
# message_relay.py
import asyncio
from datetime import datetime

async def relay_outbox_messages():
    """Continuously reads from outbox and publishes to RabbitMQ."""
    
    while True:
        # Get pending messages (oldest first)
        messages = await db.fetch_all("""
            SELECT * FROM outbox_messages
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT 100
        """)
        
        for msg in messages:
            try:
                # Publish to RabbitMQ
                await rabbitmq.publish(
                    exchange='vstep.exchange',
                    routing_key='grading.request',
                    body=msg['payload']
                )
                
                # Mark as processed
                await db.execute("""
                    UPDATE outbox_messages
                    SET status = 'published', processed_at = NOW()
                    WHERE id = :id
                """, {'id': msg['id']})
                
            except Exception as e:
                # Update retry count
                await db.execute("""
                    UPDATE outbox_messages
                    SET retry_count = retry_count + 1,
                        error_message = :error
                    WHERE id = :id
                """, {'id': msg['id'], 'error': str(e)})
        
        await asyncio.sleep(1)  # Poll interval
```

## 2. Retry & Backoff Policy

### 2.1 Celery Retry Configuration

```python
# tasks/grading.py
from celery import shared_task
from celery.exceptions import Retry

@shared_task(bind=True, max_retries=3)
def process_grading(self, request_id: str):
    try:
        # Grading logic here
        result = grade_submission(request_id)
        return result
        
    except TemporaryError as e:
        # Retry with exponential backoff + jitter (cap 5 minutes)
        # Note: If upstream returns Retry-After (429), prefer that value.
        import random

        base = 2 ** self.request.retries  # 2s, 4s, 8s
        retry_delay = min(base, 300)
        retry_delay = int(retry_delay * random.uniform(0.8, 1.2))
        raise self.retry(exc=e, countdown=retry_delay)
        
    except PermanentError as e:
        # Don't retry, send to DLQ
        await send_to_dlq(request_id, str(e))
        raise
```

### 2.2 Retry Strategy Table

| Failure Type | Retry Count | Backoff | Action After Max |
|--------------|-------------|---------|------------------|
| LLM API Timeout | 3 | Exponential + jitter, cap 300s | DLQ → Manual Review |
| STT API Fail | 3 | Exponential + jitter, cap 300s | DLQ → Retry w/ backup |
| Network Error | 3 | Exponential + jitter, cap 300s | DLQ → Alert Admin |
| Validation Error | 0 | N/A | Immediate DLQ |
| Circuit Breaker Open | Until closed | 30s cooldown | Queue pause |

### 2.3 RabbitMQ DLX Configuration

```json
{
  "queues": {
    "grading.dlq": {
      "arguments": {}
    }
  },
  "exchanges": {
    "vstep.dlx": {
      "type": "direct",
      "durable": true
    }
  },
  "bindings": {
    "grading.request": {
      "dead_letter_exchange": "vstep.dlx",
      "dead_letter_routing_key": "grading.dlq"
    }
  }
}
```

## 3. DLQ Policy

### 3.1 DLQ Processing

```python
# dlq_handler.py
async def process_dlq():
    """Process messages from Dead Letter Queue."""
    
    while True:
        msg = await rabbitmq.consume('grading.dlq')
        
        # Extract failure reason (best-effort)
        reason = msg.get('headers', {}).get('x-first-death-reason', 'unknown')
        
        # Log for analysis
        logger.error(f"DLQ: {msg['requestId']} - Reason: {reason}")
        
        # Default action: manual review and optional requeue via admin tooling
        await create_manual_review_ticket(msg)
```

### 3.2 DLQ Retention

| Policy | Value |
|--------|-------|
| Max age in DLQ | 7 days |
| Max size | 10,000 messages |
| Archive before delete | S3/Cloud Storage |
| Alert threshold | 100 messages/day |

## 4. Timeout & Late Callback Handling

### 4.1 SLA Defaults (Business Rules)

| Skill | `grading_sla` | Seconds | Notes |
|------|----------------|---------|------|
| writing | 20 minutes | 1200 | Includes queue wait + retries + processing |
| speaking | 60 minutes | 3600 | Audio/STT can take longer |

### 4.2 Timeout Rule (Main App = Source of Truth)

- At attempt creation time `createdAt`, compute `deadlineAt = createdAt + grading_sla(skill)`.
- If `now > deadlineAt` and attempt is not `COMPLETED`, Main App marks it as:
  - `status = FAILED`
  - `failureReason = TIMEOUT`
  - `timedOutAt = now`
- Grading Service may still finish and publish `grading.callback`. Main App will store it as a late result.

### 4.3 Late Callback Rule (Chosen: Keep FAILED)

When `grading.callback` arrives:
- If attempt already `FAILED(TIMEOUT)` AND `callbackReceivedAt > deadlineAt`:
  - Store the grading result with `isLate = true` (audit).
  - DO NOT change attempt status.
  - DO NOT update progress/analytics automatically.
  - UI may show a "late result" banner and allow view-only access.
- Optional (future): Admin/Instructor action "Accept late result" to recompute progress.

### 4.4 Example Pseudocode (Main App)

```typescript
// callback_handler.ts (conceptual)
const isTimedOut =
  attempt.status === 'FAILED' && attempt.failureReason === 'TIMEOUT'

if (isTimedOut && callback.status === 'completed') {
  await saveGradingResult({
    requestId: callback.requestId,
    submissionId: callback.submissionId,
    isLate: true,
    receivedAt: callbackReceivedAt
  })
  return { accepted: true, late: true }
}

// Normal path (not timed out)
await applyCompletion(attempt, callback)
return { accepted: true, late: false }
```

## 5. Circuit Breaker (LLM/STT)

### 5.1 Circuit Breaker States

```
        ┌─────────────────────────────────────────────────────────┐
        │                   CLOSED (Normal)                       │
        │   Requests pass through, failures counted               │
        └────────────────────────┬────────────────────────────────┘
                                 │
                                 │ Failure rate > 50%
                                 ▼
        ┌─────────────────────────────────────────────────────────┐
        │                    OPEN (Blocked)                       │
        │   Requests rejected immediately, fast-fail              │
        │   Wait 30 seconds then transition to HALF_OPEN          │
        └────────────────────────┬────────────────────────────────┘
                                 │
                                 │ 30s cooldown
                                 ▼
        ┌─────────────────────────────────────────────────────────┐
        │                 HALF_OPEN (Testing)                     │
        │   Allow limited requests to test recovery               │
        │   - Success > 80%: CLOSED                               │
        │   - Any failure: OPEN                                   │
        └─────────────────────────────────────────────────────────┘
```

### 5.2 Circuit Breaker Implementation

```python
# circuit_breaker.py
from enum import Enum
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = 'closed'
    OPEN = 'open'
    HALF_OPEN = 'half_open'


class CircuitBreaker:
    def __init__(self, failure_threshold=0.5, recovery_timeout=30):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.total_requests = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = timedelta(seconds=recovery_timeout)
        self.last_failure = None
    
    async def call(self, func, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if datetime.now() - self.last_failure > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitOpenError("Circuit breaker is open")
        
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _on_success(self):
        self.total_requests += 1
        self.success_count += 1
        
        if self.state == CircuitState.HALF_OPEN:
            if self.success_count / self.total_requests > 0.8:
                self.state = CircuitState.CLOSED
                self._reset()
    
    def _on_failure(self):
        self.total_requests += 1
        self.failure_count += 1
        self.last_failure = datetime.now()
        
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.OPEN
        elif self.total_requests >= 10:
            # Check failure rate
            if self.failure_count / self.total_requests > self.failure_threshold:
                self.state = CircuitState.OPEN
    
    def _reset(self):
        self.failure_count = 0
        self.success_count = 0
        self.total_requests = 0
```

---

*Document version: 1.0 - Last updated: SP26SE145*
