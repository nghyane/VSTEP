# VSTEP Adaptive Learning System

Hệ thống luyện thi VSTEP với AI grading và adaptive learning.

## 🏗️ Architecture

Monorepo với 4 sub-repos:

```
VSTEP/
├── apps/
│   ├── backend/     - Bun + Elysia API (Dev 1)
│   ├── frontend/    - React + TypeScript (Dev 2)
│   ├── grading/     - Python AI Grading (Dev 3)
│   └── e2e/         - Playwright Tests (Dev 4)
├── docs/            - Documentation
└── designs/         - UI/UX Designs
```

## 🚀 Quick Start

```bash
# 1. Clone với tất cả submodules
git clone --recurse-submodules https://github.com/nghyane/VSTEP.git
cd VSTEP

# 2. Setup tất cả apps
make setup

# 3. Chạy development
make dev
```

## 📋 Commands

| Command | Description |
|---------|-------------|
| `make setup` | Setup tất cả apps |
| `make dev` | Chạy tất cả services |
| `make build` | Build tất cả apps |
| `make test` | Chạy tất cả tests |
| `make sync` | Sync submodules |

## 🔗 Repos

- [vstep-backend](https://github.com/nghyane/vstep-backend) - API & Database
- [vstep-frontend](https://github.com/nghyane/vstep-frontend) - Web UI
- [vstep-grading](https://github.com/nghyane/vstep-grading) - AI Grading Service
- [vstep-e2e](https://github.com/nghyane/vstep-e2e) - E2E Testing

## 👥 Team

| Dev | Repo | Role |
|-----|------|------|
| Dev 1 | backend | Backend Lead - Owns API & Types |
| Dev 2 | frontend | Frontend - Consumes API |
| Dev 3 | grading | AI/ML - Queue Consumer |
| Dev 4 | e2e | QA/DevOps - Testing & Infra |

## 🔄 Workflow

### Backend (Single Source of Truth)

Backend owns tất cả schemas và types. FE generate types từ OpenAPI.

```bash
# Backend thay đổi API
cd apps/backend
# Edit schemas...
git commit -am "feat: add new endpoint"
git push

# Notify team, FE sẽ sync
```

### Frontend Sync Types

```bash
cd apps/frontend
npm run sync-types  # Fetch OpenAPI từ backend
git commit -am "chore: sync types from backend"
```

### Daily Sync

```bash
make sync  # Pull tất cả submodules
```

## 🐳 Docker

```bash
# Chạy tất cả services
docker-compose up

# Hoặc từng service
docker-compose up backend
docker-compose up frontend
docker-compose up grading
```

## 📚 Documentation

- [API Docs](http://localhost:3000/swagger) - OpenAPI docs
- [Flow Diagrams](./docs/capstone/diagrams/flow-diagrams.vi.md)
- [Architecture](./docs/capstone/)

---

*Capstone Project - SP26SE145*
