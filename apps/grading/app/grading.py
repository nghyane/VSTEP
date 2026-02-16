import httpx
from pydantic import ValidationError
from redis.asyncio import Redis

from app.models import AIGradeResult, GradingTask, PermanentError
from app.speaking import grade_speaking
from app.writing import grade_writing


async def grade(task: GradingTask, redis: Redis) -> AIGradeResult:
    try:
        if task.skill == "writing":
            return await grade_writing(task)
        return await grade_speaking(task, redis)
    except (KeyError, ValidationError) as e:
        raise PermanentError(f"invalid answer payload: {e}") from e
    except httpx.HTTPStatusError as e:
        if e.response.status_code < 500:
            raise PermanentError(f"audio download failed: {e}") from e
        raise
