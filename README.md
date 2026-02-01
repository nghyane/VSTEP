# VSTEP Adaptive Learning System

Hệ thống luyện thi VSTEP với AI grading và adaptive learning.

## 📁 Structure

```
VSTEP/
├── apps/
│   ├── backend/     - Bun + Elysia API (Dev 1)
│   ├── frontend/    - Bun + Vite + React (Dev 2)
│   └── grading/     - Python + FastAPI + Celery + OpenAI (Dev 3)
├── docs/            - Documentation, designs, samples
│   ├── capstone/    - Project docs & flow diagrams
│   ├── designs/     - UI/UX designs, styles, assets
│   └── sample/      - Sample exam data
└── scripts/         - Build scripts
```

## 🚀 Development

```bash
# Backend (Dev 1)
cd apps/backend
bun run dev
# API: http://localhost:3000

# Frontend (Dev 2)
cd apps/frontend
bun run dev
# App: http://localhost:5173

# Sync types from backend
cd apps/frontend
bun run sync-types

# Grading Service (Dev 3)
cd apps/grading
docker run -d -p 6379:6379 redis:7-alpine  # Start Redis
celery -A app.celery_app worker --loglevel=info  # Start worker
uvicorn app.main:app --reload  # Optional: API for health checks
```

## 📚 Documentation

- [Flow Diagrams](./docs/capstone/diagrams/flow-diagrams.vi.md) - System architecture & flows
- [Exam Format](./docs/) - VSTEP exam analysis

## 👥 Team

| Dev | Repo | Stack | Responsibility |
|-----|------|-------|---------------|
| Dev 1 | backend | Bun + Elysia | API & Database |
| Dev 2 | frontend | Bun + Vite + React | Web UI |
| Dev 3 | grading | Python + FastAPI + Celery | AI Grading Service |
| Dev 4 | - | - | QA & DevOps |

---

*Capstone Project - SP26SE145*
