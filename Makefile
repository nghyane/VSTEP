SERVER := root@5.223.87.142
APP_DIR := /opt/vstep/apps/backend-v2
LOCAL_BE := apps/backend-v2
TUNNEL_SESSION := vstep-tunnel

.PHONY: deploy logs ssh tunnel tunnel-stop generate-vocab generate-sentences generate-all

deploy:
	ssh $(SERVER) 'cd /opt/vstep && git pull && cd $(APP_DIR) && composer install --no-dev --optimize-autoloader --no-interaction && php artisan migrate --force && systemctl restart vstep-api vstep-horizon'

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
