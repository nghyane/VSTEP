# VSTEP Adaptive Learning System

Hệ thống luyện thi VSTEP với AI grading và adaptive learning.

## 📁 Structure

```
VSTEP/
├── apps/
│   ├── backend/     - Bun + Elysia API (Dev 1)
│   └── frontend/    - Bun + Vite + React (Dev 2)
├── docs/            - Documentation & flow diagrams
├── designs/         - UI/UX designs (Pencil)
├── sample/          - Sample exam data
└── scripts/         - Build scripts
```

## 🚀 Development

```bash
# Backend
cd apps/backend
bun run dev
# API: http://localhost:3000
# OpenAPI: http://localhost:3000/swagger/json

# Frontend
cd apps/frontend
bun run dev
# App: http://localhost:5173

# Sync types from backend
cd apps/frontend
bun run sync-types
```

## 📚 Documentation

- [Flow Diagrams](./docs/capstone/diagrams/flow-diagrams.vi.md) - System architecture & flows
- [Exam Format](./docs/) - VSTEP exam analysis

## 👥 Team

| Dev | Repo | Responsibility |
|-----|------|---------------|
| Dev 1 | backend | Backend - API & Database |
| Dev 2 | frontend | Frontend - Web UI |
| Dev 3 | - | AI Grading Service (pending) |
| Dev 4 | - | QA & DevOps |

---

*Capstone Project - SP26SE145*
