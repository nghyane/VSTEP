SERVER := root@5.223.87.142
APP_DIR := /opt/vstep/apps/backend-v2
FE_DIR := /opt/vstep/apps/frontend
LOCAL_BE := apps/backend-v2
TUNNEL_SESSION := vstep-tunnel
FE_PORT := 8080
API_PORT := 3000

.PHONY: dev deploy deploy-backend deploy-frontend setup-frontend-service logs ssh tunnel tunnel-stop generate-vocab generate-sentences generate-all seed db-status

dev: tunnel
	cd $(LOCAL_BE) && npx concurrently -c "#22c55e,#93c5fd,#c4b5fd,#fb7185" "php artisan serve --host=127.0.0.1 --port=8010" "php artisan horizon" "php artisan pail --timeout=0" "printf 'E2E demo: http://127.0.0.1:8010/internal/e2e-demo\n' && while true; do sleep 3600; done" --names=server,horizon,logs,demo --kill-others


deploy: deploy-backend deploy-frontend

deploy-backend:
	ssh $(SERVER) 'cd /opt/vstep && git pull && docker compose --env-file .env up -d --build backend horizon && docker compose exec backend php artisan migrate --force && (docker compose exec backend php artisan storage:link 2>/dev/null || true)'

deploy-frontend:
	ssh $(SERVER) 'cd /opt/vstep && git pull && cd $(FE_DIR) && printf "%s\n%s\n" "VITE_API_URL=https://api.vstepgo.com/api/v1" "VITE_STORAGE_URL=$${VITE_STORAGE_URL:-}" > .env.production && export BUN_INSTALL="$$HOME/.bun" && export PATH="$$BUN_INSTALL/bin:$$PATH" && bun install --frozen-lockfile && bun run build && systemctl restart vstep-frontend'

setup-frontend-service:
	ssh $(SERVER) 'curl -fsSL https://bun.sh/install | bash && printf "%s\n" "[Unit]" "Description=VSTEP Frontend Static Server" "After=network.target" "" "[Service]" "Type=simple" "WorkingDirectory=$(FE_DIR)" "Environment=BUN_INSTALL=/root/.bun" "Environment=PATH=/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" "ExecStart=/root/.bun/bin/bunx --bun serve -s dist -l $(FE_PORT)" "Restart=always" "RestartSec=3" "" "[Install]" "WantedBy=multi-user.target" > /etc/systemd/system/vstep-frontend.service && systemctl daemon-reload && systemctl enable --now vstep-frontend'

logs:
	ssh $(SERVER) 'tail -f $(APP_DIR)/storage/logs/laravel.log'

ssh:
	ssh $(SERVER)

# SSH tunnel to production DB — required for local dev
tunnel:
	@tmux has-session -t $(TUNNEL_SESSION) 2>/dev/null && echo "Tunnel already running" || \
		(tmux new-session -d -s $(TUNNEL_SESSION) 'ssh -N -L 15432:localhost:5432 $(SERVER)' && echo "Tunnel started on :15432")

tunnel-stop:
	@tmux kill-session -t $(TUNNEL_SESSION) 2>/dev/null && echo "Tunnel stopped" || echo "No tunnel running"

# AI content generation (requires tunnel)
generate-vocab: tunnel
	cd $(LOCAL_BE) && php artisan vocabulary:generate

generate-sentences: tunnel
	cd $(LOCAL_BE) && php artisan sentences:generate

generate-all: tunnel
	cd $(LOCAL_BE) && php artisan vocabulary:generate && php artisan sentences:generate

generate-audio: tunnel
	uv run scripts/generate-audio.py

# Re-seed local docker DB (idempotent — chạy bất cứ lúc nào nghi data bị wipe).
# Tất cả seeder dùng updateOrCreate/guard → an toàn re-run nhiều lần.
seed:
	docker compose exec -T backend php artisan db:seed --force --no-interaction

# Check seed status (đếm rows các bảng quan trọng).
db-status:
	@docker compose exec -T postgres psql -U user -d vstep -c "SELECT 'exams' AS t, count(*) FROM exams UNION ALL SELECT 'exam_versions', count(*) FROM exam_versions UNION ALL SELECT 'system_configs', count(*) FROM system_configs UNION ALL SELECT 'wallet_topup_packages', count(*) FROM wallet_topup_packages UNION ALL SELECT 'vocab_topics', count(*) FROM vocab_topics UNION ALL SELECT 'users', count(*) FROM users;"
