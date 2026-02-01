# Chốt Phương Án Kiến Trúc

## Purpose

Tài liệu này chốt các quyết định kiến trúc/boundary để backend implement nhanh, ít vênh giữa Bun Main App và Python Grading Service.

## Architecture Overview

```mermaid
flowchart TB
    subgraph Client["Client"]
        Web["Web App"]
        Mobile["Mobile App"]
    end

    subgraph MainApp["Bun Main Application"]
        API["Elysia API"]
        Auth["JWT Auth"]
        QueueClient["Queue Client<br/>RabbitMQ Publisher"]
    end

    subgraph MessageQueue["Message Queue"]
        Exchange["vstep.exchange"]
        ReqQueue["grading.request"]
        CbQueue["grading.callback"]
        DLQ["grading.dlq"]
    end

    subgraph GradingService["Python Grading Service"]
        Celery["Celery Workers"]
        AI["AI Grading<br/>LLM + STT"]
    end

    subgraph Data["Data Layer"]
        MainDB["PostgreSQL<br/>MainDB"]
        GradingDB["PostgreSQL<br/>GradingDB"]
        Redis["Redis<br/>Cache + Rate Limit"]
    end

    Web --> API
    Mobile --> API
    API --> Auth
    API --> QueueClient
    QueueClient --> Exchange
    Exchange --> ReqQueue
    Exchange --> CbQueue
    Exchange --> DLQ
    ReqQueue --> Celery
    Celery --> AI
    AI --> CbQueue
    API --> MainDB
    API --> Redis
    Celery --> GradingDB

    classDef client fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef main fill:#e65100,stroke:#bf360c,color:#fff
    classDef queue fill:#ff8f00,stroke:#ff6f00,color:#fff
    classDef grading fill:#6a1b9a,stroke:#4a148c,color:#fff
    classDef data fill:#37474f,stroke:#263238,color:#fff

    class Web,Mobile client
    class API,Auth,QueueClient main
    class Exchange,ReqQueue,CbQueue,DLQ queue
    class Celery,AI grading
    class MainDB,GradingDB,Redis data
```

## Scope

- Main App: Bun + Elysia (TypeScript)
- Grading Service: Python + Celery
- Queue cross-service: RabbitMQ
- DB: PostgreSQL tách MainDB/GradingDB
- Cache/rate limit: Redis
- Real-time: SSE (default)
- Auth: JWT access/refresh (baseline)

## Decisions

### Tech stack (final)

| Component | Decision | Alternatives |
|----------|----------|--------------|
| Main App | Bun + Elysia | Node.js + Express, Deno |
| Grading Service | Python + Celery | Rust, Go |
| Message Queue | RabbitMQ (AMQP) | Redis Streams, Kafka |
| Database | PostgreSQL (MainDB + GradingDB) | MySQL, CockroachDB |
| Cache/Rate limit | Redis | Postgres-only |
| Real-time | SSE | WebSocket |
| Auth | JWT access + refresh | Server session |

### Rationale (ngắn)

- RabbitMQ + Celery: mature, có DLQ/retry tốt, dễ scale worker.
- JWT access/refresh: dùng được cho web/mobile, không cần session state server.
- Tách DB: giảm coupling, dễ audit.

## Contracts

- Message contracts: `docs/capstone/specs/queue-contracts.vi.md`
- Reliability rules: `docs/capstone/specs/reliability.vi.md`
- Auth rules: `docs/capstone/specs/authentication.vi.md`
- Deployment env: `docs/capstone/specs/deployment.vi.md`

## Failure modes

| Area | Risk | Mitigation |
|------|------|------------|
| Queue | duplicate deliveries | `requestId` idempotency |
| Provider | 429/timeout | retry/backoff + cap + DLQ |
| Outbox | publish fail | relay + retry |
| Provider | cascading failure | circuit breaker (open at >50% failure rate, cooldown 30s) |
| Auth | refresh token theft | rotation + revoke store |

## Acceptance criteria

- Tất cả service boundary (Main/Grading) giao tiếp qua queue contracts.
- Quy tắc retry/timeout/late-result áp dụng nhất quán.
- Auth baseline là JWT access/refresh, không còn session cookie baseline.

## Business rules defaults (Chốt)

- Grading SLA: Writing 20 phút; Speaking 60 phút.
- Timeout: quá `deadlineAt` → `FAILED(TIMEOUT)`; callback muộn lưu `isLate=true`, giữ `FAILED`.
- Retry/backoff: `max_retries=3`, exponential + jitter, cap 5 phút, tôn trọng `Retry-After`.

---

*Document version: 1.2 - Last updated: SP26SE145*
