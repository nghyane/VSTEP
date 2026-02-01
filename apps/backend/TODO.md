# Backend TODO

## 🔴 Phase 1: Foundation (Priority: HIGH)

### Database Setup
- [ ] Install Drizzle ORM: `bun add drizzle-orm pg` + `bun add -d drizzle-kit`
- [ ] Create `.env` with DATABASE_URL
- [ ] Setup Docker Compose for PostgreSQL + Redis
- [ ] Create `./src/db/schema.ts` with tables
- [ ] Generate and run first migration
- [ ] Create `./src/db/index.ts` connection

### Replace Mock Data
- [ ] Replace `submissions Map()` with DB queries in `./src/routes/submissions.ts`
- [ ] Add error handling for DB operations
- [ ] Add pagination for list endpoints

## 🟡 Phase 2: Authentication (Priority: HIGH)

### Auth Setup
- [ ] Install deps: `bun add @elysiajs/jwt bcryptjs`
- [ ] Create `./src/schemas/auth.ts` with login/register schemas
- [ ] Create `./src/routes/auth.ts` with endpoints
- [ ] Create `./src/middleware/auth.ts` JWT middleware
- [ ] Hash passwords with bcrypt
- [ ] Add protected route decorator

### User Management
- [ ] Create user table in DB schema
- [ ] Register endpoint
- [ ] Login endpoint (returns JWT)
- [ ] Get current user endpoint
- [ ] Update profile endpoint

## 🟢 Phase 3: Core Features (Priority: MEDIUM)

### Submissions
- [ ] File upload for speaking (audio)
- [ ] Speaking submission endpoint
- [ ] List submissions with filters
- [ ] Delete submission (soft delete)

### Queue Integration
- [ ] Install BullMQ: `bun add bullmq`
- [ ] Create queue service
- [ ] Enqueue job when submission created
- [ ] Handle grading results callback
- [ ] Update submission status

### Real-time
- [ ] WebSocket setup for status updates
- [ ] Broadcast status changes
- [ ] Frontend subscription endpoint

## 🔵 Phase 4: Advanced (Priority: LOW)

### Progress Tracking
- [ ] Progress calculation endpoints
- [ ] Spider chart data
- [ ] Sliding window analytics
- [ ] Learning path recommendations

### Mock Test
- [ ] Mock test session management
- [ ] Timer enforcement
- [ ] Auto-save answers
- [ ] Results calculation

### Admin
- [ ] User management endpoints
- [ ] Content management
- [ ] Grading review queue
- [ ] Analytics dashboard

## 🛠️ DevOps

### Testing
- [ ] Setup test environment
- [ ] Unit tests for services
- [ ] Integration tests for API
- [ ] E2E tests with frontend

### Deployment
- [ ] Dockerfile
- [ ] Docker Compose production
- [ ] CI/CD pipeline
- [ ] Environment configs (dev/staging/prod)

---

## 📊 Progress

**Phase 1**: 0/5 tasks  
**Phase 2**: 0/7 tasks  
**Phase 3**: 0/9 tasks  
**Phase 4**: 0/8 tasks  
**DevOps**: 0/4 tasks  

**Total**: 0/33 tasks completed
