# Chốt Phương Án Kiến Trúc

## 1. Tổng Quan Quyết Định

| Thành phần | Phương án chọn | Phương án thay thế |
|------------|----------------|---------------------|
| Main App | Bun + Elysia (TypeScript) | Node.js + Express, Deno |
| Grading Service | Python + FastAPI + Celery | Rust, Go |
| Message Queue | RabbitMQ (AMQP) | Redis Streams, Kafka |
| Session Store | Redis | PostgreSQL, MySQL |
| Real-time | SSE (Server-Sent Events) | WebSocket |
| Database | PostgreSQL (separate MainDB/GradingDB) | MySQL, CockroachDB |

## 2. Lý Do Chọn

### 2.1 Bun + Elysia
- **Hiệu năng**: Bun nhanh hơn Node.js 2-3x, startup < 50ms
- **TypeScript native**: Không cần build step, hot reload tức thì
- **Elysia**: Decorator pattern tự nhiên, type-safe routing
- **Phù hợp I/O-bound**: Assessment, Progress, Content APIs không cần compute nặng

### 2.2 Python Grading Service
- **AI/ML ecosystem**: OpenAI, Whisper, LangChain libraries
- **FastAPI**: Async native, OpenAPI auto-gen, type validation
- **Celery**: Task queue mature, retry/backoff built-in
- **NumPy/Pandas**: Xử lý scoring metrics hiệu quả

### 2.3 RabbitMQ (thay vì Redis Streams)
- **Reliability**: Persistent messages, acknowledgements, publisher confirms
- **Dead Letter Queue**: Native support, không cần workaround
- **Delayed retry**: TTL + DLX hoặc Celery countdown
- **Scalability**: Fan-out, routing patterns cho nhiều consumers
- **Production-ready**: 10+ năm production usage, enterprise support

### 2.4 Redis cho Session (không phải Queue)
- **Session storage**: Fast read/write, TTL tự động
- **Cache**: Assessment results, progress metrics
- **Pub/Sub**: SSE fan-out cho real-time updates
- **Quyết định rõ ràng**: Redis = ephemeral, RabbitMQ = persistent

### 2.5 SSE (thay vì WebSocket)
- **Đơn giản**: HTTP-based, không cần upgrade handshake
- **Firewall-friendly**: Port 80/443, proxy-friendly
- **Auto-reconnect**: Browser native, không cần client library
- **Use case phù hợp**: Server → Client updates, không cần bidirectional

## 3. Non-Goals (Phạm vi loại trừ)

- **OAuth2 provider**: Không tự build IdP, dùng Google/Facebook SDK
- **WebSocket**: Chỉ SSE, WebSocket optional nếu cần bidirectional
- **GraphQL**: REST đủ cho resource-oriented APIs
- **Microservices**: Monorepo với bounded contexts
- **Multi-region**: Single region deployment ban đầu
- **Kubernetes**: Docker Compose cho development, có thể mở rộng sau

## 4. Scope Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    VSTEP Adaptive Learning                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │  Bun Main App    │    │ Python Grading   │               │
│  │  (Port 3000)     │◄──►│ Service (8000)   │               │
│  │                  │    │ + Celery Worker  │               │
│  └────────┬─────────┘    └────────┬─────────┘               │
│           │                       │                          │
│           ▼                       ▼                          │
│  ┌─────────────────────────────────────┐                     │
│  │         PostgreSQL                  │                     │
│  │  ┌─────────┐  ┌─────────────────┐  │                     │
│  │  │ MainDB  │  │   GradingDB     │  │                     │
│  │  │ (5432)  │  │     (5433)      │  │                     │
│  │  └─────────┘  └─────────────────┘  │                     │
│  └─────────────────────────────────────┘                     │
│           │                       │                          │
│           ▼                       ▼                          │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │     Redis        │    │     RabbitMQ     │               │
│  │  (Session/Cache) │    │  (Port 5672)     │               │
│  └──────────────────┘    └──────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 5. Out-of-Scope (Future Considerations)

- **OAuth 2.0 flows**: Có thể thêm sau, session cookie đủ cho baseline
- **WebSocket**: Nếu cần real-time collaboration
- **Kubernetes**: Terraform/Ansible cho production deployment
- **Multi-tenant**: Single organization ban đầu
- **GraphQL**: Nếu frontend cần flexible queries
- **CDN**: Static assets có thể tách ra sau

## 6. Business Rules Defaults (Chốt)

- **Grading SLA**:
  - Writing: 20 phút
  - Speaking: 60 phút
- **Timeout handling (Decision: keep FAILED)**:
  - Main App set `deadlineAt = createdAt + SLA(skill)`.
  - Quá `deadlineAt` mà chưa có kết quả: `FAILED(TIMEOUT)`.
  - Callback đến muộn: lưu kết quả (`isLate=true`), giữ nguyên `FAILED`, không cập nhật progress/analytics tự động.
- **Retry/backoff**:
  - `max_retries = 3`
  - Exponential + jitter, cap 5 phút
  - Tôn trọng `Retry-After` khi gặp 429 từ provider

---

*Document version: 1.0 - Last updated: SP26SE145*
