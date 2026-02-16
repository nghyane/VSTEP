import asyncio

from redis.asyncio import Redis

from app import db
from app.config import settings
from app.grading import grade
from app.logger import logger
from app.models import PermanentError, Task


async def process(data: bytes, redis: Redis):
    try:
        task = Task.model_validate_json(data)
    except Exception as e:
        logger.error("invalid_task", error=str(e))
        return

    for attempt in range(settings.max_retries):
        try:
            result = await grade(task, redis)
            await db.save(task, result)
            logger.info("graded", submission_id=task.submission_id, score=result.overall_score)
            return
        except PermanentError:
            await db.fail(task.submission_id)
            logger.error("permanent_failure", submission_id=task.submission_id)
            return
        except Exception as e:
            if attempt == settings.max_retries - 1:
                await db.fail(task.submission_id)
                await redis.lpush(settings.dead_letter_queue, data)
                logger.error("exhausted_retries", submission_id=task.submission_id, error=str(e))
                return
            await asyncio.sleep(2**attempt)


async def run():
    redis = Redis.from_url(settings.redis_url, decode_responses=False)
    logger.info("worker_started", queue=settings.grading_queue)

    try:
        while True:
            result = await redis.brpop(settings.grading_queue, timeout=5)
            if not result:
                continue
            _, data = result
            await process(data, redis)
    finally:
        await redis.aclose()
