# VSTEP Adaptive Learning System

Hệ thống luyện thi VSTEP với AI grading và adaptive learning.

## 📁 Structure

```
VSTEP/
├── apps/
│   ├── backend-v2/    - PHP 8.4 · Laravel 13 (REST API + AI Grading Agent)
│   ├── frontend-v3/   - bun · Vite 8 · React 19 (learner web)
│   ├── admin/         - bun · Vite 8 · React 19 + Ant Design (staff portal)
│   ├── mobile-v2/     - React Native + Expo Router (mobile)
│   └── _deprecated/   - Old apps (frontend, frontend-v2, mobile, mockup,
│                        nlp-sidecar, backend-v1, grading-python)
├── docs/              - Documentation, designs, specs
└── scripts/           - Build scripts
```

## 🚀 Development

```bash
# Backend
cd apps/backend-v2
php artisan serve        # API: http://localhost:8000
php artisan horizon      # Queue worker

# Frontend (learner)
cd apps/frontend-v3
bun run dev              # App: http://localhost:5173

# Admin
cd apps/admin
bun run dev              # App: http://localhost:5174
```

## 📚 Documentation

- [Grading Agent Plan](./docs/grading-agent-plan.md) - AI grading architecture
- [Flow Diagrams](./docs/capstone/diagrams/flow-diagrams.vi.md) - System architecture & flows

## 👥 Team

| Dev | Scope | Stack | Responsibility |
|-----|-------|-------|---------------|
| Dev 1 | backend-v2 | Laravel 13 + laravel/ai | API, AI Grading Agent, Database |
| Dev 2 | frontend-v3 + admin | bun · Vite 8 · React 19 | Web UI |
| Dev 3 | mobile-v2 | React Native + Expo | Mobile app |
| Dev 4 | — | — | QA & DevOps |

---

*Capstone Project - SP26SE145*
