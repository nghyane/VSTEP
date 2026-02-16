# VSTEP Grading Service

Python microservice for AI-powered grading of VSTEP writing and speaking submissions. Uses LLM-based scoring with confidence-driven routing to human review.

- All commands run from `apps/grading/`.
- Python 3.11+. Use `pip` or `uv` for dependency management.

## Commands

- **Install:** `pip install -r requirements.txt`
- **Dev server:** `uvicorn app.main:app --reload --port 8001`
- **Tests:** `pytest` (or `pytest tests/test_file.py` for single file)
- **Single test:** `pytest tests/test_file.py::test_function_name -v`

## Stack

FastAPI . Uvicorn . LiteLLM (provider-agnostic LLM + STT) . psycopg3 (async PostgreSQL) . Redis (BRPOP queue) . Pydantic + Pydantic Settings . structlog (JSON logging)

Default provider: Groq free tier (Whisper large-v3-turbo for STT, Llama 3.3 70B for grading). Switch providers by changing `LLM_MODEL` / `STT_MODEL` env vars -- LiteLLM handles the rest.

## Architecture

```
app/
  config.py      # Pydantic Settings (.env)
  logger.py      # structlog JSON
  models.py      # GradingTask, AIGradeResult, WritingGrade, SpeakingGrade
  scoring.py     # score_to_band(), round_score()
  health.py      # GET /health
  prompts.py     # VSTEP rubric prompt templates
  llm.py         # LiteLLM Router (primary + fallback)
  stt.py         # Speech-to-text via litellm.atranscription() + Redis cache
  writing.py     # Writing grading pipeline
  speaking.py    # Speaking grading pipeline (STT → LLM)
  grading.py     # Routes task.skill → writing/speaking
  worker.py      # Redis BRPOP loop with retry + DLQ
  db.py          # psycopg3 async pool, save_result/mark_failed
  main.py        # FastAPI app + worker lifecycle
tests/
  test_scoring.py  # Band mapping, round_score
  test_models.py   # Pydantic validation
```

No Celery. Worker runs as an asyncio task inside the FastAPI process, polling Redis via BRPOP.

## Config

All config via `.env` (see `.env.example`). Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_MODEL` | `groq/llama-3.3-70b-versatile` | LiteLLM model identifier |
| `STT_MODEL` | `groq/whisper-large-v3-turbo` | LiteLLM STT model |
| `DATABASE_URL` | (required) | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis for queue + STT cache |
| `LLM_FALLBACK_MODEL` | (none) | Optional fallback model |
| `LOG_LEVEL` | `INFO` | structlog level |

## Grading Flow

1. Backend pushes task JSON (camelCase) to `grading:tasks` Redis list
2. Worker pops task via BRPOP, routes to writing or speaking pipeline
3. Speaking: download audio → STT (cached) → LLM grade transcript
4. Writing: LLM grade text directly
5. LLM returns structured JSON (WritingGrade/SpeakingGrade)
6. Result mapped to AIGradeResult, written to PostgreSQL (submissions + submission_details)
7. Confidence determines status: high→completed, medium/low→review_pending
8. On failure after retries: mark submission failed, push to DLQ

## Naming

- **snake_case:** functions, variables, modules, file names
- **PascalCase:** classes, Pydantic models, exceptions
- **UPPER_SNAKE_CASE:** constants

## Style Rules

- Type hints on all function signatures
- `async def` for I/O-bound functions
- Structured JSON logging via structlog. Never `print()`
- No secrets in code or logs. Use `.env` + Pydantic Settings
- Guard → compute → write → side-effects
- 1 file = 1 concern
- Comments: short WHY only. No section dividers, no numbered steps
