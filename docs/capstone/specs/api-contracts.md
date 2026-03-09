# API Contracts

All endpoints under `/api`. Auth via JWT Bearer token (`Authorization: Bearer <token>`).

## Conventions

- Pagination: `?page=1&limit=20` → response `meta: { total, page, limit, totalPages }`
- Response wrapper: `{ data, meta? }`
- Error wrapper: `{ error: { code, message, requestId } }`
- Dates: ISO 8601 UTC
- IDs: UUID v7

## Endpoints

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /login | No | Email/password → access + refresh tokens |
| POST | /register | No | Create learner account → user + message |
| POST | /refresh | No | Rotate refresh token → new token pair |
| POST | /logout | Yes | Revoke refresh token |
| GET | /me | Yes | Current user profile |

- Max 3 active refresh tokens per user (FIFO eviction)
- Reuse detection: rotated token reused → revoke all user tokens

### Users (`/api/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Admin | List users (search, role filter) |
| GET | /:id | Yes | Get user by ID (admin: any, non-admin: self only) |
| POST | / | Admin | Create user with specified role |
| PATCH | /:id | Yes | Update user profile (name, email) |
| DELETE | /:id | Admin | Delete user |
| POST | /:id/password | Yes | Change password (requires current password) |
| POST | /:id/avatar | Yes | Upload avatar image (max 5MB) |

### Submissions (`/api/submissions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | List submissions (filter: skill, status) |
| GET | /:id | Yes | Submission detail with result |
| POST | / | Yes | Submit answer → enters grading pipeline |
| PATCH | /:id | Yes | Update pending submission answer |
| DELETE | /:id | Yes | Delete submission |
| POST | /:id/grade | Instructor+ | Manual grade with score and feedback |
| POST | /:id/auto-grade | Admin | Auto-grade L/R against answer keys |
| GET | /queue | Instructor+ | Review queue (review_pending submissions) |
| POST | /:id/claim | Instructor+ | Claim submission for review |
| POST | /:id/release | Instructor+ | Release claim |
| PUT | /:id/review | Instructor+ | Submit human review |
| POST | /:id/assign | Admin | Assign reviewer to submission |

### Questions (`/api/questions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | List questions (filter: skill, level) |
| GET | /:id | Yes | Question detail |
| POST | / | Admin | Create question |
| PATCH | /:id | Yes | Update question |
| DELETE | /:id | Admin | Delete question |

### Knowledge Points (`/api/knowledge-points`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /topics | Yes | List topics (filter: skill) |
| GET | / | Yes | List knowledge points (filter: category, search) |
| GET | /:id | Yes | Get knowledge point by ID |
| POST | / | Admin | Create knowledge point |
| PATCH | /:id | Admin | Update knowledge point |
| DELETE | /:id | Admin | Delete knowledge point |

### Progress (`/api/progress`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | 4-skill overview summary |
| GET | /spider-chart | Yes | Radar/spider chart data points |
| GET | /activity | Yes | Activity streak + active days |
| GET | /learning-path | Yes | Personalized weekly learning plan |
| GET | /:skill | Yes | Skill detail: scores, trend, scaffold level |
| POST | /goals | Yes | Create learning goal (targetBand, deadline) |
| PATCH | /goals/:id | Yes | Update goal |
| DELETE | /goals/:id | Yes | Delete goal |

### Exams (`/api/exams`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | List exams (filter: level, active status) |
| GET | /:id | Yes | Exam detail (blueprint, sections) |
| POST | / | Admin | Create exam |
| PATCH | /:id | Admin | Update exam |
| POST | /:id/start | Yes | Start or resume exam session |
| GET | /sessions | Yes | List own exam sessions (filter: status) |
| GET | /sessions/:sessionId | Yes | Session detail with questions and answers |
| PUT | /sessions/:sessionId | Yes | Auto-save session answers (bulk upsert) |
| POST | /sessions/:sessionId/answer | Yes | Submit single answer for a question |
| POST | /sessions/:sessionId/submit | Yes | Submit exam for grading |

### Classes (`/api/classes`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | List own classes |
| GET | /:id | Yes | Class detail with members |
| POST | / | Instructor+ | Create class |
| PATCH | /:id | Instructor+ | Update class |
| DELETE | /:id | Instructor+ | Delete class |
| POST | /:id/rotate-code | Instructor+ | Rotate invite code |
| POST | /join | Yes | Join class by invite code |
| POST | /:id/leave | Yes | Leave class |
| DELETE | /:id/members/:userId | Instructor+ | Remove member |
| GET | /:id/dashboard | Instructor+ | Class dashboard (averages, at-risk) |
| GET | /:id/members/:userId/progress | Instructor+ | View member progress |
| POST | /:id/feedback | Instructor+ | Send feedback to learner |
| GET | /:id/feedback | Yes | List feedback |

### Onboarding (`/api/onboarding`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /status | Yes | Check onboarding completion status |
| POST | /self-assess | Yes | Declare proficiency levels (one-time) |
| POST | /placement | Yes | Start dynamic placement test (L/R only) |
| POST | /skip | Yes | Skip placement with optional survey |

### Practice (`/api/practice`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /next | Yes | Get next adaptive practice question |

### Vocabulary (`/api/vocabulary`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /topics | Yes | List vocabulary topics with word counts |
| GET | /topics/:id | Yes | Topic detail with all words |
| POST | /topics | Admin | Create topic |
| PUT | /topics/:id | Admin | Update topic |
| DELETE | /topics/:id | Admin | Delete topic and words |
| GET | /topics/:id/words | Yes | List words in topic |
| POST | /topics/:id/words | Admin | Add word to topic |
| PUT | /words/:wordId | Admin | Update word |
| DELETE | /words/:wordId | Admin | Delete word |
| GET | /topics/:id/progress | Yes | User's progress for topic |
| PUT | /words/:wordId/known | Yes | Toggle word known/unknown status |

### Notifications (`/api/notifications`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | List notifications (paginated, newest first) |
| GET | /unread-count | Yes | Unread notification count |
| POST | /:id/read | Yes | Mark notification as read |
| POST | /read-all | Yes | Mark all as read |

### Devices (`/api/devices`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | / | Yes | Register device token for push notifications |
| DELETE | /:id | Yes | Remove device token |

### AI (`/api/ai`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /paraphrase | Yes | Analyze text for paraphrase suggestions |
| POST | /explain | Yes | Grammar/vocabulary/strategy analysis with explanations |

### Other

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check (DB + Redis) — mounted at root, not under /api |
| POST | /uploads/audio | Yes | Upload audio file to MinIO (max 10MB) |

## Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 401 | TOKEN_EXPIRED | Access token expired |
| 403 | FORBIDDEN | Insufficient role or not owner |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate or invalid state transition |
| 500 | INTERNAL_ERROR | Unexpected server error |

---

*Reflects implemented API as of March 2026.*
