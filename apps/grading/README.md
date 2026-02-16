# VSTEP Grading Service

Python + FastAPI + Celery AI Grading Service for VSTEP Adaptive Learning System.

## 🚀 Quick Start

```bash
# Start Redis (required for Celery)
docker run -d -p 6379:6379 redis:7-alpine

# Install dependencies
pip install -r requirements.txt

# Start Celery worker
celery -A app.celery_app worker --loglevel=info

# Start FastAPI (optional, for health checks)
uvicorn app.main:app --reload
```

## 📁 Project Structure

```
app/
├── routes/          # FastAPI endpoints
├── tasks/           # Celery tasks
├── services/        # Grading services
└── celery_app.py    # Celery configuration
```

## 🔧 Tech Stack

- **API**: FastAPI
- **Task Queue**: Celery
- **Broker**: Redis
- **AI**: OpenAI GPT
- **Language**: Python 3.11+

## 📝 Environment Variables

```env
OPENAI_API_KEY=
REDIS_URL=redis://localhost:6379
DATABASE_URL=
```

## 🧪 Testing

```bash
pytest
```

---

*Part of VSTEP Adaptive Learning System*
