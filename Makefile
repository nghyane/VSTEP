# Makefile cho VSTEP Orchestrator

.PHONY: setup dev build test sync clean help

# Default target
help:
	@echo "VSTEP Orchestrator Commands:"
	@echo "  make setup    - Setup tất cả apps"
	@echo "  make dev      - Chạy tất cả services (yêu cầu tmux hoặc chạy riêng)"
	@echo "  make build    - Build tất cả apps"
	@echo "  make test     - Chạy tất cả tests"
	@echo "  make sync     - Sync tất cả submodules"
	@echo "  make status   - Check status tất cả repos"
	@echo "  make clean    - Clean build artifacts"

# Setup tất cả apps
setup:
	@echo "🔧 Setting up all apps..."
	@echo ""
	@echo "📦 Backend..."
	cd apps/backend && bun install 2>/dev/null || npm install
	@echo ""
	@echo "📦 Frontend..."
	cd apps/frontend && npm install
	@echo ""
	@echo "📦 Grading..."
	cd apps/grading && pip install -r requirements.txt 2>/dev/null || echo "No requirements.txt"
	@echo ""
	@echo "📦 E2E..."
	cd apps/e2e && npm install
	@echo ""
	@echo "✅ Setup complete!"

# Chạy development (cần chạy riêng từng tab)
dev:
	@echo "🚀 Start development servers:"
	@echo ""
	@echo "Tab 1 - Backend:"
	@echo "  cd apps/backend && bun run dev"
	@echo ""
	@echo "Tab 2 - Frontend:"
	@echo "  cd apps/frontend && npm run dev"
	@echo ""
	@echo "Tab 3 - Grading:"
	@echo "  cd apps/grading && python main.py"
	@echo ""

# Build tất cả
build:
	@echo "🔨 Building all apps..."
	cd apps/backend && bun run build
	cd apps/frontend && npm run build
	@echo "✅ Build complete!"

# Test tất cả
test:
	@echo "🧪 Running tests..."
	cd apps/backend && bun test
	cd apps/frontend && npm test
	cd apps/e2e && npx playwright test
	@echo "✅ Tests complete!"

# Sync tất cả submodules
sync:
	@echo "🔄 Syncing submodules..."
	git submodule update --init --recursive
	@echo ""
	@echo "📦 Building shared packages..."
	cd apps/backend && bun run build 2>/dev/null || true
	@echo "✅ Sync complete!"

# Check status
status:
	@echo "📊 Repository Status:"
	@echo ""
	@echo "Main repo:"
	@git status -s
	@echo ""
	@echo "Backend:"
	@cd apps/backend && git status -s
	@echo ""
	@echo "Frontend:"
	@cd apps/frontend && git status -s
	@echo ""
	@echo "Grading:"
	@cd apps/grading && git status -s
	@echo ""
	@echo "E2E:"
	@cd apps/e2e && git status -s

# Clean
clean:
	@echo "🧹 Cleaning..."
	cd apps/backend && rm -rf node_modules dist
	cd apps/frontend && rm -rf node_modules dist
	cd apps/e2e && rm -rf node_modules
	@echo "✅ Clean complete!"
