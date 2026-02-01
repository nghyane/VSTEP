# Backend Context - VSTEP API

## 📋 Current Status

### ✅ Implemented
- [x] Basic Elysia server setup
- [x] OpenAPI/Swagger documentation
- [x] Health check endpoint
- [x] Submission schemas (Zod)
- [x] Basic submission routes (POST/GET) - **Mock only**

### 🚧 TODO (Priority Order)

#### Phase 1: Foundation (Week 1)
- [ ] Database setup (PostgreSQL + Drizzle ORM)
- [ ] Environment configuration (.env)
- [ ] Database schema & migrations
- [ ] Replace mock Map() with real DB queries

#### Phase 2: Auth (Week 1-2)
- [ ] JWT authentication
- [ ] User registration/login
- [ ] Password hashing (bcrypt)
- [ ] Auth middleware

#### Phase 3: Core API (Week 2-3)
- [ ] Complete submission CRUD
- [ ] File upload (audio for speaking)
- [ ] Redis queue integration (BullMQ)
- [ ] Real-time updates (WebSocket)

#### Phase 4: Advanced (Week 3-4)
- [ ] Progress tracking endpoints
- [ ] Mock test flow
- [ ] Admin endpoints
- [ ] Rate limiting

---

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Cache/Queue**: Redis (BullMQ)
- **Validation**: Zod
- **Auth**: JWT

### Folder Structure (Target)
```
backend/
├── src/
│   ├── config/          # Environment, database config
│   ├── db/
│   │   ├── schema/      # Drizzle schemas
│   │   ├── migrations/  # Migration files
│   │   └── index.ts     # DB connection
│   ├── schemas/         # Zod validation schemas (current)
│   ├── models/          # TypeScript types/interfaces
│   ├── routes/          # API routes (current)
│   ├── services/        # Business logic
│   ├── middleware/      # Auth, validation, error handling
│   ├── utils/           # Helpers
│   └── index.ts         # Entry point (current)
├── tests/
└── package.json
```

---

## 🗄️ Database Schema (Suggested)

### Users Table
```typescript
users: {
  id: uuid (PK)
  email: varchar (unique)
  passwordHash: varchar
  role: enum ('learner', 'instructor', 'admin')
  profile: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Submissions Table
```typescript
submissions: {
  id: uuid (PK)
  userId: uuid (FK → users.id)
  type: enum ('writing', 'speaking')
  taskType: varchar
  content: text
  audioUrl: varchar (nullable)
  status: enum ('pending', 'queued', 'processing', 'completed', 'error')
  scaffoldLevel: enum ('template', 'keywords', 'free')
  metadata: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Grading Results Table
```typescript
gradingResults: {
  id: uuid (PK)
  submissionId: uuid (FK → submissions.id)
  aiScore: decimal(3,1)
  aiFeedback: text
  confidenceScore: decimal(5,2)
  confidenceFactors: jsonb
  routingDecision: enum ('auto', 'human_review')
  humanScore: decimal(3,1) (nullable)
  finalScore: decimal(3,1)
  createdAt: timestamp
}
```

---

## 🔌 API Endpoints (To Implement)

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### Submissions
```
POST   /api/submissions/writing    ✅ (mock)
POST   /api/submissions/speaking   🚧 (needs audio upload)
GET    /api/submissions/:id        ✅ (mock)
GET    /api/submissions            🚧 (list with pagination)
PATCH  /api/submissions/:id        🚧 (update status)
DELETE /api/submissions/:id        🚧 (soft delete)
```

### Progress
```
GET /api/progress                 🚧 (spider chart data)
GET /api/progress/history         🚧 (sliding window)
GET /api/progress/recommendations 🚧 (learning path)
```

### Mock Test
```
POST /api/mock-tests              🚧 (start test)
GET  /api/mock-tests/:id          🚧 (get test)
POST /api/mock-tests/:id/submit   🚧 (submit answers)
GET  /api/mock-tests/:id/results  🚧 (get results)
```

---

## 📝 Key Decisions Needed

1. **Database**: PostgreSQL (confirmed) - need to choose between:
   - Option A: Drizzle ORM (recommended - type-safe)
   - Option B: Raw SQL with `postgres.js`

2. **Redis**: For queue + cache
   - BullMQ for job queue (to grading service)
   - ioredis hoặc Bun.redis (check Bun.redis stability)

3. **File Upload**: For speaking audio
   - Option A: Direct to S3 (presigned URL)
   - Option B: Save locally + upload to cloud

4. **Real-time**: WebSocket for grading status
   - Elysia has built-in WebSocket support
   - Or use Server-Sent Events (SSE) - simpler

---

## 🔗 Integration Points

### With Frontend
- OpenAPI spec at `/swagger/json` → Frontend generates types
- CORS config needed
- WebSocket for real-time updates

### With Grading Service
- Redis Streams: `grading.request` (enqueue)
- Redis Streams: `grading.callback` (receive results)
- Queue job when submission created

---

## ⚡ Quick Start Commands

```bash
# Development
cd apps/backend
bun run dev              # http://localhost:3000

# Database (need to setup)
bunx drizzle-kit generate  # Generate migrations
bunx drizzle-kit migrate   # Run migrations
bunx drizzle-kit studio    # GUI viewer

# Tests
bun test                 # Run tests
```

---

## 📚 Reference

- Flow Diagrams: `../../docs/capstone/diagrams/flow-diagrams.vi.md`
- Current Schemas: `./src/schemas/`
- Elysia Docs: https://elysiajs.com/
- Drizzle Docs: https://orm.drizzle.team/

---

## 🎯 Next Immediate Tasks

1. **Setup PostgreSQL** (Docker or local)
2. **Install Drizzle ORM**: `bun add drizzle-orm pg` + `bun add -d drizzle-kit`
3. **Create .env file** with DB connection string
4. **Define DB schema** in `./src/db/schema.ts`
5. **Replace mock Map()** with real DB queries

Ready to start? Pick Phase 1 task above!
