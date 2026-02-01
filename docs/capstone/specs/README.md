# Technical Specifications Index

## VSTEP Adaptive Learning System - Technical Design Documents

This folder contains detailed technical specifications for the VSTEP Adaptive Learning System implementation.

## 📁 Specifications

| File | Description |
|------|-------------|
| [solution-decisions.vi.md](./solution-decisions.vi.md) | Architectural decisions, chosen technologies, rationale, and scope boundaries |
| [queue-contracts.vi.md](./queue-contracts.vi.md) | RabbitMQ topology, message schemas, and idempotency rules |
| [reliability.vi.md](./reliability.vi.md) | Outbox pattern, retry policies, DLQ handling, and circuit breakers |
| [authentication.vi.md](./authentication.vi.md) | Session management, RBAC, rate limiting, and optional OAuth |
| [deployment.vi.md](./deployment.vi.md) | Docker Compose configuration, environment variables, and deployment commands |

## 📖 Related Documentation

- **Flow Diagrams**: [../diagrams/flow-diagrams.vi.md](../diagrams/flow-diagrams.vi.md) - System architecture and process flows
- **Flow Diagrams (English)**: [../diagrams/flow-diagrams.md](../diagrams/flow-diagrams.md) - English version of flow diagrams
- **Reports**: [../reports/VI/report1-project-introduction.md](../reports/VI/report1-project-introduction.md) - Project introduction and requirements

## 🔗 Quick Reference

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VSTEP Adaptive Learning                   │
├─────────────────────────────────────────────────────────────┤
│  Bun + Elysia (Port 3000) ───┐                              │
│                             RabbitMQ (5672)                  │
│  Python + FastAPI + Celery ──┘                              │
│  (Port 8000)                                                 │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (5432/5433) │ Redis (6379)                      │
├─────────────────────────────────────────────────────────────┤
│  External: OpenAI GPT-4, Whisper STT                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Technologies

| Component | Technology |
|-----------|------------|
| Main App | Bun + Elysia (TypeScript) |
| Grading Service | Python + FastAPI + Celery |
| Message Queue | RabbitMQ (AMQP) |
| Session Store | Redis |
| Database | PostgreSQL (separate MainDB/GradingDB) |
| Real-time | SSE (Server-Sent Events) |
| Auth | Session Cookie + Redis |

---

*Document version: 1.0 - Last updated: SP26SE145*
