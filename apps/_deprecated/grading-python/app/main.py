from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis.asyncio import Redis

from app.ai_routes import ai_router
from app.config import settings
from app.grading import grade_router
from app.health import health_router
from app.logger import logger

_redis: Redis | None = None


async def get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _redis
    _redis = Redis.from_url(settings.redis_url, decode_responses=True)
    logger.info("started")
    yield
    if _redis:
        await _redis.aclose()


app = FastAPI(title="VSTEP Grading Service", lifespan=lifespan)
app.include_router(health_router)
app.include_router(ai_router)
app.include_router(grade_router)
