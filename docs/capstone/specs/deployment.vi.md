# Deployment Plan

## 1. Docker Compose Architecture

### 1.1 Service Overview

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ==================== DATA LAYER ====================
  
  postgres-main:
    image: postgres:15-alpine
    container_name: vstep-postgres-main
    environment:
      POSTGRES_DB: ${POSTGRES_MAIN_DB:-vstep_main}
      POSTGRES_USER: ${POSTGRES_USER:-vstep}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
    ports:
      - "5432:5432"
    volumes:
      - postgres_main_data:/var/lib/postgresql/data
      - ./schema/main.sql:/docker-entrypoint-initdb.d/01-schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-vstep}"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres-grading:
    image: postgres:15-alpine
    container_name: vstep-postgres-grading
    environment:
      POSTGRES_DB: ${POSTGRES_GRADING_DB:-vstep_grading}
      POSTGRES_USER: ${POSTGRES_USER:-vstep}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
    ports:
      - "5433:5432"
    volumes:
      - postgres_grading_data:/var/lib/postgresql/data
      - ./schema/grading.sql:/docker-entrypoint-initdb.d/01-schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-vstep}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: vstep-redis
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: vstep-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-vstep}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-changeme}
    ports:
      - "5672:5672"     # AMQP
      - "15672:15672"   # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 30s
      timeout: 10s
      retries: 5

  # ==================== APPLICATION LAYER ====================

  bun-app:
    build:
      context: ./apps/main
      dockerfile: Dockerfile
    container_name: vstep-bun-app
    environment:
      # App Config
      NODE_ENV: ${NODE_ENV:-development}
      PORT: ${APP_PORT:-3000}
      
      # Database
      DATABASE_URL_MAIN: postgresql://${POSTGRES_USER:-vstep}:${POSTGRES_PASSWORD:-changeme}@postgres-main:5432/${POSTGRES_MAIN_DB:-vstep_main}
      DATABASE_URL_GRADING: postgresql://${POSTGRES_USER:-vstep}:${POSTGRES_PASSWORD:-changeme}@postgres-grading:5432/${POSTGRES_GRADING_DB:-vstep_grading}
      
      # Redis
      REDIS_URL: redis://redis:6379
      
      # RabbitMQ
      RABBITMQ_URL: amqp://${RABBITMQ_USER:-vstep}:${RABBITMQ_PASSWORD:-changeme}@rabbitmq:5672
      
      # Session
      SESSION_SECRET: ${SESSION_SECRET:-change-this-in-production}

      # Business rules (SLA / retry)
      GRADING_SLA_WRITING_SECONDS: ${GRADING_SLA_WRITING_SECONDS:-1200}
      GRADING_SLA_SPEAKING_SECONDS: ${GRADING_SLA_SPEAKING_SECONDS:-3600}
      GRADING_MAX_RETRIES: ${GRADING_MAX_RETRIES:-3}
      GRADING_RETRY_BACKOFF_CAP_SECONDS: ${GRADING_RETRY_BACKOFF_CAP_SECONDS:-300}
      
      # External APIs (placeholders)
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      STT_API_KEY: ${STT_API_KEY}
      
      # Observability
      OTEL_SERVICE_NAME: vstep-main-app
      OTEL_EXPORTER_OTLP_ENDPOINT: ${OTEL_EXPORTER_OTLP_ENDPOINT}
    ports:
      - "3000:3000"
    depends_on:
      postgres-main:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - ./apps/main:/app
      - bun_cache:/app/.bun-cache

  python-grading-api:
    build:
      context: ./apps/grading-api
      dockerfile: Dockerfile
    container_name: vstep-grading-api
    environment:
      # App Config
      ENVIRONMENT: ${ENVIRONMENT:-development}
      PORT: ${GRADING_PORT:-8000}
      
      # Database
      DATABASE_URL: postgresql://${POSTGRES_USER:-vstep}:${POSTGRES_PASSWORD:-changeme}@postgres-grading:5432/${POSTGRES_GRADING_DB:-vstep_grading}
      
      # RabbitMQ
      RABBITMQ_URL: amqp://${RABBITMQ_USER:-vstep}:${RABBITMQ_PASSWORD:-changeme}@rabbitmq:5672
      
      # External APIs
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      STT_API_KEY: ${STT_API_KEY}
      
      # Celery
      CELERY_BROKER_URL: amqp://${RABBITMQ_USER:-vstep}:${RABBITMQ_PASSWORD:-changeme}@rabbitmq:5672

      # Business rules (SLA / retry)
      GRADING_SLA_WRITING_SECONDS: ${GRADING_SLA_WRITING_SECONDS:-1200}
      GRADING_SLA_SPEAKING_SECONDS: ${GRADING_SLA_SPEAKING_SECONDS:-3600}
      GRADING_MAX_RETRIES: ${GRADING_MAX_RETRIES:-3}
      GRADING_RETRY_BACKOFF_CAP_SECONDS: ${GRADING_RETRY_BACKOFF_CAP_SECONDS:-300}
      
      # Observability
      OTEL_SERVICE_NAME: vstep-grading-api
      OTEL_EXPORTER_OTLP_ENDPOINT: ${OTEL_EXPORTER_OTLP_ENDPOINT}
    ports:
      - "8000:8000"
    depends_on:
      postgres-grading:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - ./apps/grading-api:/app

  python-celery-worker:
    build:
      context: ./apps/grading-api
      dockerfile: Dockerfile
    container_name: vstep-celery-worker
    command: celery -A grading worker --loglevel=info --concurrency=4
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-vstep}:${POSTGRES_PASSWORD:-changeme}@postgres-grading:5432/${POSTGRES_GRADING_DB:-vstep_grading}
      RABBITMQ_URL: amqp://${RABBITMQ_USER:-vstep}:${RABBITMQ_PASSWORD:-changeme}@rabbitmq:5672
      CELERY_BROKER_URL: amqp://${RABBITMQ_USER:-vstep}:${RABBITMQ_PASSWORD:-changeme}@rabbitmq:5672
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      STT_API_KEY: ${STT_API_KEY}

      # Business rules (SLA / retry)
      GRADING_SLA_WRITING_SECONDS: ${GRADING_SLA_WRITING_SECONDS:-1200}
      GRADING_SLA_SPEAKING_SECONDS: ${GRADING_SLA_SPEAKING_SECONDS:-3600}
      GRADING_MAX_RETRIES: ${GRADING_MAX_RETRIES:-3}
      GRADING_RETRY_BACKOFF_CAP_SECONDS: ${GRADING_RETRY_BACKOFF_CAP_SECONDS:-300}
    depends_on:
      postgres-grading:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    volumes:
      - ./apps/grading-api:/app

  # ==================== MONITORING ====================

  prometheus:
    image: prom/prometheus:latest
    container_name: vstep-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    container_name: vstep-grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-changeme}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus

  # ==================== VOLUMES ====================

volumes:
  postgres_main_data:
  postgres_grading_data:
  redis_data:
  rabbitmq_data:
  bun_cache:
  prometheus_data:
  grafana_data:

networks:
  default:
    name: vstep-network
```

## 2. Environment Variables

### 2.1 Required Variables

```bash
# =============================================
# APPLICATION SETTINGS
# =============================================
NODE_ENV=development
APP_PORT=3000
SESSION_SECRET=your-super-secret-session-key-change-in-production

# =============================================
# BUSINESS RULES (SLA / RETRY)
# =============================================
GRADING_SLA_WRITING_SECONDS=1200
GRADING_SLA_SPEAKING_SECONDS=3600
GRADING_MAX_RETRIES=3
GRADING_RETRY_BACKOFF_CAP_SECONDS=300

# =============================================
# DATABASE
# =============================================
POSTGRES_USER=vstep
POSTGRES_PASSWORD=changeme-in-production
POSTGRES_MAIN_DB=vstep_main
POSTGRES_GRADING_DB=vstep_grading

# =============================================
# REDIS
# =============================================
REDIS_PASSWORD=

# =============================================
# RABBITMQ
# =============================================
RABBITMQ_USER=vstep
RABBITMQ_PASSWORD=changeme-in-production

# =============================================
# EXTERNAL APIs (Get from providers)
# =============================================
OPENAI_API_KEY=sk-your-openai-key
STT_API_KEY=your-stt-service-key

# =============================================
# MONITORING (Optional)
# =============================================
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
GRAFANA_USER=admin
GRAFANA_PASSWORD=changeme-in-production
```

### 2.2 Development .env.example

```bash
# Copy this to .env for local development
NODE_ENV=development
APP_PORT=3000
SESSION_SECRET=dev-session-secret-do-not-use-in-prod

GRADING_SLA_WRITING_SECONDS=1200
GRADING_SLA_SPEAKING_SECONDS=3600
GRADING_MAX_RETRIES=3
GRADING_RETRY_BACKOFF_CAP_SECONDS=300

POSTGRES_USER=vstep
POSTGRES_PASSWORD=vstep123
POSTGRES_MAIN_DB=vstep_main
POSTGRES_GRADING_DB=vstep_grading

REDIS_PASSWORD=

RABBITMQ_USER=vstep
RABBITMQ_PASSWORD=vstep123

OPENAI_API_KEY=
STT_API_KEY=

OTEL_EXPORTER_OTLP_ENDPOINT=
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin123
```

## 3. Service Ports

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Bun App | 3000 | HTTP | Main API |
| Grading API | 8000 | HTTP | Grading Service API |
| PostgreSQL (Main) | 5432 | TCP | Main database |
| PostgreSQL (Grading) | 5433 | TCP | Grading database |
| Redis | 6379 | TCP | Session & Cache |
| RabbitMQ (AMQP) | 5672 | AMQP | Message queue |
| RabbitMQ (Management) | 15672 | HTTP | RabbitMQ UI |
| Prometheus | 9090 | HTTP | Metrics |
| Grafana | 3001 | HTTP | Dashboards |

## 4. Deployment Commands

### 4.1 Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Reset database
docker-compose down -v
docker-compose up -d
```

### 4.2 Production (Suggested)

```bash
# Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Health check
curl http://localhost:3000/health
```

### 4.3 Scaling

```bash
# Scale Celery workers
docker-compose scale python-celery-worker=4

# Add more instances (requires load balancer)
docker-compose up -d --scale bun-app=2
```

## 5. Health Endpoints

```typescript
// Bun App health check
app.get('/health', async () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkPostgres(),
      redis: await checkRedis(),
      rabbitmq: await checkRabbitMQ()
    }
  };
});

// Grading API health check
app.get('/health', async () => {
  return {
    status: 'healthy',
    celeryWorkers: await checkCeleryWorkers(),
    database: await checkPostgres()
  };
});
```

---

*Document version: 1.0 - Last updated: SP26SE145*
