# VSTEP Grading Service

AI-powered grading service for VSTEP writing and speaking tasks.

## Stack

- **Python** 3.11+
- **FastAPI** - Async API framework
- **Celery** - Distributed task queue (Redis Streams)
- **OpenAI** - GPT-4 for essay grading
- **Google Generative AI** - Gemini Pro alternative
- **OpenAI Whisper** - Speech-to-text (local)
- **Pydantic** - Data validation

## Quick Start

```bash
# Setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy environment config
cp .env.example .env
# Edit .env with your API keys

# Run Redis (required)
docker run -d -p 6379:6379 redis:7-alpine

# Start worker
celery -A app.celery_app worker --loglevel=info

# Start API (optional, for health checks)
uvicorn app.main:app --reload
```

## Architecture

```
Redis Stream (grading.request)
         ↓
    Celery Worker
         ↓
   ┌─────┴─────┐
   ▼           ▼
Essay     Speech
Grading   Grading
(GPT-4)   (Whisper → GPT-4)
   │           │
   └─────┬─────┘
         ▼
Redis Stream (grading.callback)
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection URL |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_API_KEY` | Gemini API key (optional) |
| `WHISPER_MODEL` | Whisper model size (tiny/base/small/medium/large) |

## License

MIT
