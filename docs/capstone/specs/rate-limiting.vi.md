# Rate Limiting

## Purpose

Chốt quy tắc rate limiting để bảo vệ API khỏi abuse, brute-force attacks, và đảm bảo fair usage giữa các users.

## Rate Limiting Flow

```mermaid
flowchart TB
    subgraph Request["Incoming Request"]
        Client["Client"]
        Identify["Identify Client<br/>IP or User ID"]
        CheckAuth{"Authenticated?"}
    end

    subgraph Tiers["Rate Limit Tiers"]
        Anonymous["Anonymous<br/>30 req/min"]
        Learner["Learner<br/>100 req/min"]
        Premium["Premium<br/>300 req/min"]
        Admin["Admin<br/>500 req/min"]
    end

    subgraph TokenBucket["Token Bucket Algorithm"]
        CheckBucket{"Tokens<br/>Available?"}
        Consume["Consume 1 Token"]
        Reject["Reject Request<br/>429 Too Many Requests"]
        AddHeaders["Add Rate Limit Headers"]
    end

    subgraph Redis["Redis Storage"]
        Key["Key:<br/>ratelimit:{scope}:{id}"]
        TTL["TTL: 1 minute"]
    end

    Client --> Identify
    Identify --> CheckAuth
    CheckAuth -->|No| Anonymous
    CheckAuth -->|Yes| CheckRole{"Check Role"}
    CheckRole -->|Learner| Learner
    CheckRole -->|Premium| Premium
    CheckRole -->|Admin| Admin

    Anonymous --> CheckBucket
    Learner --> CheckBucket
    Premium --> CheckBucket
    Admin --> CheckBucket

    CheckBucket -->|Yes| Consume
    CheckBucket -->|No| Reject
    Consume --> Key
    Key --> TTL
    TTL --> AddHeaders
    AddHeaders -->|X-RateLimit-*| Process["Process Request"]
    Reject -->|Retry-After| ClientError["Return 429"]

    classDef client fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef tier fill:#388e3c,stroke:#1b5e20,color:#fff
    classDef bucket fill:#ff8f00,stroke:#ff6f00,color:#fff
    classDef reject fill:#c62828,stroke:#b71c1c,color:#fff
    classDef success fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef redis fill:#37474f,stroke:#263238,color:#fff

    class Client,Identify,CheckAuth,CheckRole client
    class Anonymous,Learner,Premium,Admin tier
    class CheckBucket,Consume,AddHeaders bucket
    class Reject,ClientError reject
    class Process success
    class Key,TTL redis
```

## Scope

- Rate limiting cho Bun Main App (Elysia).
- Storage: Redis (cho distributed rate limiting).
- Các tier: anonymous, authenticated, premium.
- Endpoint-specific rules cho auth và grading.

## Decisions

| Area | Decision |
|------|----------|
| Storage | Redis (distributed, fast, TTL support) |
| Algorithm | Token bucket (cho burst flexibility) |
| Key strategy | IP cho anonymous; `userId` cho authenticated |
| Headers | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After` khi 429 |
| Response | 429 Too Many Requests với JSON error body |

### Rate Limits by Tier

| Tier | Limit | Window | Burst |
|------|-------|--------|-------|
| Anonymous | 30 requests | 1 minute | 5 |
| Authenticated (Learner) | 100 requests | 1 minute | 20 |
| Premium | 300 requests | 1 minute | 50 |
| Admin/Instructor | 500 requests | 1 minute | 100 |

### Endpoint-Specific Rules

| Endpoint Pattern | Limit | Window | Notes |
|------------------|-------|--------|-------|
| `POST /auth/*` | 5 requests | 1 minute | Chống brute-force login/register |
| `POST /api/submissions` | 10 requests | 1 minute | Tạo submission mới |
| `POST /api/grading/*` | 5 requests | 1 minute | Trigger grading |
| `GET /api/*` (read) | Tier default | Tier window | Standard read operations |

## Contracts

### Rate Limit Headers

Tất cả responses (cả thành công và 429) phải include:

| Header | Value |
|--------|-------|
| `X-RateLimit-Limit` | Maximum requests allowed trong window |
| `X-RateLimit-Remaining` | Số requests còn lại trong current window |
| `X-RateLimit-Reset` | Unix timestamp khi window reset |

Khi 429, thêm:

| Header | Value |
|--------|-------|
| `Retry-After` | Seconds to wait before retry |

### Error Response (429)

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please slow down.",
  "retryAfter": 60,
  "limit": 100,
  "window": "1m"
}
```

### Redis Key Structure

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `ratelimit:ip:{ip}` | Anonymous limiting | 1m |
| `ratelimit:user:{userId}` | Authenticated limiting | 1m |
| `ratelimit:endpoint:{userId}:{endpoint}` | Endpoint-specific | 1m |

### Whitelist/Exceptions

- Health endpoints (`/health`, `/ready`) không rate limit.
- Internal service-to-service calls (nếu có) bypass rate limit.

## Failure modes

| Failure | Expected behavior |
|---------|-------------------|
| Redis down | Graceful degradation: cho phép requests (log warning) hoặc fallback to local memory limit |
| Clock skew | Use Redis server time hoặc allow small leeway (5s) |
| Burst abuse | Token bucket cho phép burst nhỏ nhưng sustained rate vẫn bị giới hạn |
| Key collision | Include scope trong key (ip vs user vs endpoint) |

## Acceptance criteria

- 429 responses có đầy đủ headers và JSON body.
- Rate limits khác nhau cho anonymous vs authenticated vs premium.
- Auth endpoints (`/auth/*`) có limit riêng biệt thấp hơn.
- Redis key có TTL để tự động cleanup.
- Health endpoints không bị rate limit.

---

*Document version: 1.0 - Last updated: SP26SE145*
