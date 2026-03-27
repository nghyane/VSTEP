# VSTEP Adaptive Learning System

Hệ thống luyện thi VSTEP với AI grading và adaptive learning.

## 📁 Structure

```
VSTEP/
├── apps/
│   ├── backend-v2/  - PHP 8.4 · Laravel 13 (REST API + AI Grading Agent)
│   ├── frontend/    - Vite + React 19 + TypeScript
│   ├── mobile/      - Mobile app
│   └── _deprecated/ - Old backend-v1 & grading-python (replaced)
├── docs/            - Documentation, designs, specs
└── scripts/         - Build scripts
```

## 🚀 Development

```bash
# Backend
cd apps/backend-v2
php artisan serve        # API: http://localhost:8000
php artisan horizon      # Queue worker

# Frontend
cd apps/frontend
bun run dev              # App: http://localhost:5173
```

## 📚 Documentation

- [Grading Agent Plan](./docs/grading-agent-plan.md) - AI grading architecture
- [Flow Diagrams](./docs/capstone/diagrams/flow-diagrams.vi.md) - System architecture & flows

## 👥 Team

| Dev | Scope | Stack | Responsibility |
|-----|-------|-------|---------------|
| Dev 1 | backend-v2 | Laravel 13 + laravel/ai | API, AI Grading Agent, Database |
| Dev 2 | frontend | Vite + React 19 | Web UI |
| Dev 3 | mobile | — | Mobile app |
| Dev 4 | — | — | QA & DevOps |

---

*Capstone Project - SP26SE145*
