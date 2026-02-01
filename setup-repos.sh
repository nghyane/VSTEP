#!/bin/bash
# setup-repos.sh - Chạy trong thư mục VSTEP hiện tại

set -e

ORG="nghyane"
MAIN_REPO="VSTEP"

echo "🚀 Setting up VSTEP multi-repo structure..."

# 1. Tạo thư mục apps/
mkdir -p apps
cd apps

# 2. Clone/create 4 repos như submodules
echo "📦 Setting up backend..."
git submodule add https://github.com/$ORG/vstep-backend.git backend 2>/dev/null || {
  echo "  Creating local repo for backend..."
  mkdir backend
cd backend
  git init
  git remote add origin https://github.com/$ORG/vstep-backend.git 2>/dev/null || true
  cd ..
}

echo "📦 Setting up frontend..."
git submodule add https://github.com/$ORG/vstep-frontend.git frontend 2>/dev/null || {
  echo "  Creating local repo for frontend..."
  mkdir frontend
  cd frontend
  git init
  git remote add origin https://github.com/$ORG/vstep-frontend.git 2>/dev/null || true
  cd ..
}

echo "📦 Setting up grading..."
git submodule add https://github.com/$ORG/vstep-grading.git grading 2>/dev/null || {
  echo "  Creating local repo for grading..."
  mkdir grading
  cd grading
  git init
  git remote add origin https://github.com/$ORG/vstep-grading.git 2>/dev/null || true
  cd ..
}

echo "📦 Setting up e2e..."
git submodule add https://github.com/$ORG/vstep-e2e.git e2e 2>/dev/null || {
  echo "  Creating local repo for e2e..."
  mkdir e2e
  cd e2e
  git init
  git remote add origin https://github.com/$ORG/vstep-e2e.git 2>/dev/null || true
  cd ..
}

cd ..

echo "✅ Structure created!"
echo ""
echo "📋 Next steps:"
echo "  1. cd apps/backend && bun init -y"
echo "  2. cd apps/frontend && npm create vite@latest . -- --template react-ts"
echo "  3. cd apps/grading && touch README.md"
echo "  4. cd apps/e2e && npm init -y && npm install @playwright/test"
echo ""
echo "🔗 Commit submodules to main repo:"
echo "  git add apps/"
echo "  git commit -m 'chore: add app submodules'"
