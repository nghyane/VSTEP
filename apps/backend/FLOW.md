# Backend Flow & Content Guide

## 🔄 System Flows

### 1. User Registration Flow

```
User (Browser)
    ↓ POST /api/auth/register
Backend (Elysia)
    ↓ Validate (Zod)
    ↓ Check email exists (DB)
    ↓ Hash password (bcrypt)
    ↓ Insert user (DB)
    ↓ Generate JWT
User (Token stored)
```

**Content:**
- Input: `{ email, password, displayName, targetLevel }`
- Validation: Email format, password 8+ chars, targetLevel enum
- Output: `{ user, accessToken, refreshToken }`
- Error cases: Email exists, invalid format, weak password

---

### 2. Submission Creation Flow

```
User (Frontend)
    ↓ POST /api/submissions/writing
Backend
    ↓ Auth middleware (JWT verify)
    ↓ Validate body (Zod)
    ↓ Save to DB (submissions table)
    ↓ Enqueue to Redis (grading.request)
    ↓ Return submission with status=PENDING
User (See "Đang chờ chấm...")
    ↓ WebSocket/SSE connection
Backend
    ↓ Listen grading.callback
    ↓ Update submission status
    ↓ Broadcast to user
User (See "Hoàn thành!" + results)
```

**Content:**
- Task types: `TASK_1_EMAIL` (150-180 words), `TASK_2_ESSAY` (300-350 words)
- Scaffold levels: `TEMPLATE` → `KEYWORDS` → `FREE`
- Status flow: `PENDING` → `QUEUED` → `PROCESSING` → `COMPLETED/ERROR`
- Queue payload: `{ requestId, submissionId, userId, type, content, scaffoldLevel }`

---

### 3. Grading Result Flow

```
Grading Service (Python)
    ↓ Process job
    ↓ Call GPT-4 / Whisper
    ↓ Calculate confidence
    ↓ Publish to Redis (grading.callback)
Backend (Bun)
    ↓ Consume from stream
    ↓ Parse result
    ↓ Update DB (submissions + grading_results)
    ↓ Check confidence threshold
    ↓ Route: Auto-grade OR Human review
    ↓ Notify user (WebSocket)
```

**Content:**
- Confidence threshold: 85%
- Factors: Model consistency (30%), Rule validation (25%), Content similarity (25%), Length heuristic (20%)
- Routing: `AUTO_GRADE` (≥85%), `HUMAN_REVIEW` (<85%)
- Result storage: AI score, feedback, confidence, final score

---

### 4. Mock Test Flow

```
User
    ↓ POST /api/mock-tests (start)
Backend
    ↓ Create test session
    ↓ Return testId + questions
User (Taking test)
    ↓ WebSocket connection for timer
    ↓ Auto-save answers every 30s
    ↓ Section navigation (Listening → Reading → Writing → Speaking)
User (Submit)
    ↓ POST /api/mock-tests/:id/submit
Backend
    ↓ Validate all sections completed
    ↓ Grade Listening/Reading (auto)
    ↓ Enqueue Writing/Speaking (AI grading)
    ↓ Calculate total score (4-skill average)
    ↓ Generate report
User (View results)
    ↓ GET /api/mock-tests/:id/results
```

**Content:**
- Sections: Listening (40min), Reading (60min), Writing (60min), Speaking (12min)
- Auto-graded: Listening (MCQ), Reading (MCQ)
- AI-graded: Writing (essay), Speaking (audio)
- Scoring: Each skill 0-10, total average
- Report: Spider chart, skill breakdown, recommendations

---

### 5. Progress Tracking Flow

```
User
    ↓ GET /api/progress
Backend
    ↓ Query all submissions
    ↓ Calculate 4-skill scores
    ↓ Generate spider chart data
    ↓ Calculate sliding window (last 10 attempts)
    ↓ Detect trends (improving/stable/declining)
    ↓ Generate learning path
User (Dashboard)
    ↓ View spider chart
    ↓ View trend analysis
    ↓ View recommended exercises
```

**Content:**
- Spider chart: 4 skills (Listening, Reading, Writing, Speaking)
- Sliding window: Moving average of last 10 attempts per skill
- Trend detection: Compare current window vs previous
- Learning path: Prioritize lowest skill, suggest exercises

---

## 📊 API Content Map

### Auth Module

| Endpoint | Method | Content In | Content Out | Business Logic |
|----------|--------|------------|-------------|----------------|
| `/api/auth/register` | POST | `{email, password, profile}` | `{user, tokens}` | Validate, hash, insert, generate JWT |
| `/api/auth/login` | POST | `{email, password}` | `{user, tokens}` | Verify, generate JWT |
| `/api/auth/refresh` | POST | `{refreshToken}` | `{accessToken}` | Verify refresh, issue new |
| `/api/auth/me` | GET | - | `User` | Decode JWT, fetch user |

### Submissions Module

| Endpoint | Method | Content In | Content Out | Business Logic |
|----------|--------|------------|-------------|----------------|
| `/api/submissions/writing` | POST | `{taskType, content, scaffoldLevel}` | `Submission` | Validate, save, enqueue |
| `/api/submissions/speaking` | POST | `{audioFile}` | `Submission` | Upload, save, enqueue |
| `/api/submissions/:id` | GET | `id` | `Submission + Result` | Fetch with result |
| `/api/submissions` | GET | `{page, limit, status}` | `Submission[]` | List with filters |

### Progress Module

| Endpoint | Method | Content In | Content Out | Business Logic |
|----------|--------|------------|-------------|----------------|
| `/api/progress` | GET | - | `ProgressData` | Calculate all metrics |
| `/api/progress/spider` | GET | - | `SpiderChart` | 4-skill radar data |
| `/api/progress/trend` | GET | `{skill, window}` | `TrendData` | Sliding window analysis |
| `/api/progress/path` | GET | - | `LearningPath` | Recommendations |

### Mock Test Module

| Endpoint | Method | Content In | Content Out | Business Logic |
|----------|--------|------------|-------------|----------------|
| `/api/mock-tests` | POST | - | `TestSession` | Create session |
| `/api/mock-tests/:id` | GET | `id` | `TestSession` | Get with questions |
| `/api/mock-tests/:id/answers` | PATCH | `{section, answers}` | - | Auto-save |
| `/api/mock-tests/:id/submit` | POST | - | `TestResult` | Grade all, calculate |
| `/api/mock-tests/:id/results` | GET | `id` | `DetailedResult` | Full report |

---

## 🗄️ Data Relationships

```
users
├── submissions (1:N)
│   ├── submission_id (PK)
│   ├── user_id (FK)
│   ├── type (writing/speaking)
│   ├── status (pending → completed)
│   └── created_at
│
├── grading_results (1:1 with submission)
│   ├── result_id (PK)
│   ├── submission_id (FK)
│   ├── ai_score (0-10)
│   ├── confidence_score (0-100)
│   └── final_score (0-10)
│
└── mock_test_sessions (1:N)
    ├── session_id (PK)
    ├── user_id (FK)
    ├── status (in_progress → completed)
    ├── answers (JSON)
    └── scores (JSON)
```

---

## 📝 Business Rules

### Submission Rules
1. **Word count validation:**
   - Task 1: 150-180 words (warning if outside)
   - Task 2: 300-350 words (warning if outside)

2. **Scaffold progression:**
   - A1-A2 → TEMPLATE
   - B1 → KEYWORDS
   - B2-C1 → FREE
   - Progression: 3 attempts ≥80% → level up

3. **Queue priority:**
   - Mock test submissions: priority=10
   - Practice submissions: priority=0
   - Retry after error: priority=5

### Grading Rules
1. **Confidence routing:**
   - ≥85%: Auto-grade, publish immediately
   - 70-84%: Auto-grade + flag for audit
   - <70%: Queue for human review

2. **Score calculation:**
   - AI only: final = ai_score
   - AI + Human: final = (ai_score × 0.4) + (human_score × 0.6)
   - Human override if discrepancy > 1 band

### Mock Test Rules
1. **Timer enforcement:**
   - Server-side timer (authoritative)
   - Client-side timer (display only)
   - Auto-submit when time expires

2. **Section sequence:**
   - Must complete in order: Listening → Reading → Writing → Speaking
   - Cannot return to previous section
   - Can review within current section

3. **Auto-save:**
   - Every 30 seconds
   - On every answer change
   - LocalStorage backup + server sync

---

## 🔄 State Machines

### Submission Status
```
[PENDING] ──enqueue──► [QUEUED] ──consume──► [PROCESSING]
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
              [COMPLETED]               [ERROR] ──retry──► [PROCESSING]
                    │                         │
                    ▼                         ▼
              Publish result            Max retries ──► [FAILED]
```

### Mock Test Session
```
[CREATED] ──start──► [IN_PROGRESS]
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   [LISTENING]    [READING]        [WRITING]
        │                │                │
        └────────────────┴────────────────┘
                          ▼
                    [SPEAKING]
                          │
                          ▼
                    [SUBMITTED]
                          │
                          ▼
              ┌───────────┴───────────┐
              ▼                       ▼
        [GRADING] ──complete──► [COMPLETED]
```

---

## 📋 Content Checklist

### Phase 1: Foundation
- [ ] User registration/login flows
- [ ] JWT token lifecycle
- [ ] Password reset flow
- [ ] Email verification flow

### Phase 2: Core
- [ ] Writing submission flow
- [ ] Speaking submission flow (audio upload)
- [ ] Queue integration flow
- [ ] Grading result callback flow
- [ ] Real-time status update flow

### Phase 3: Advanced
- [ ] Mock test full flow
- [ ] Auto-save mechanism
- [ ] Timer enforcement
- [ ] Progress calculation
- [ ] Learning path generation

### Phase 4: Admin
- [ ] Human review queue flow
- [ ] Content management flow
- [ ] User management flow
- [ ] Analytics export flow

---

## 🔗 Integration Points

### Frontend
- **OpenAPI spec:** Auto-generated tại `/swagger/json`
- **Real-time:** WebSocket hoặc SSE cho status updates
- **File upload:** Presigned URL hoặc direct upload

### Grading Service
- **Queue in:** Redis Stream `grading.request`
- **Queue out:** Redis Stream `grading.callback`
- **Message format:** JSON với `requestId`, `payload`

### Database
- **Primary:** PostgreSQL cho persistent data
- **Cache:** Redis cho sessions và rate limiting
- **Queue:** Redis Streams cho grading jobs

---

*Document này mô tả flow và content - không chứa code implementation*
