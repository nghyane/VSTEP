import httpx
from pydantic import ValidationError
from redis.asyncio import Redis

from app import speaking, writing
from app.models import PermanentError, Result, Task


async def grade(task: Task, redis: Redis) -> Result:
    try:
        if task.skill == "writing":
            return await writing.grade(task)
        return await speaking.grade(task, redis)
    except (KeyError, ValidationError) as e:
        raise PermanentError(f"invalid answer payload: {e}") from e
    except httpx.HTTPStatusError as e:
        if e.response.status_code < 500:
            raise PermanentError(f"audio download failed: {e}") from e
        raise
