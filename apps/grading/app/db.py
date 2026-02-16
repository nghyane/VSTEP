from datetime import datetime, timezone

from psycopg_pool import AsyncConnectionPool

from app.config import settings
from app.logger import logger
from app.models import Result, Task

pool: AsyncConnectionPool | None = None


async def init():
    global pool
    pool = AsyncConnectionPool(conninfo=settings.database_url, min_size=2, max_size=10)
    await pool.open()
    logger.info("db_pool_opened")


async def close():
    global pool
    if pool:
        await pool.close()
        pool = None
        logger.info("db_pool_closed")


def resolve_status(confidence: str) -> tuple[str, str | None]:
    if confidence == "high":
        return "completed", None
    if confidence == "medium":
        return "review_pending", "medium"
    return "review_pending", "high"


async def save(task: Task, result: Result):
    status, priority = resolve_status(result.confidence)
    now = datetime.now(timezone.utc).isoformat()
    completed = now if status == "completed" else None

    async with pool.connection() as conn:
        async with conn.transaction():
            await conn.execute(
                """
                UPDATE submissions
                SET status = %s, score = %s, band = %s,
                    grading_mode = 'auto', review_priority = %s,
                    completed_at = %s, updated_at = %s
                WHERE id = %s
                """,
                (status, result.overall_score, result.band, priority, completed, now, task.submission_id),
            )
            await conn.execute(
                """
                UPDATE submission_details
                SET result = %s::jsonb, feedback = %s, updated_at = %s
                WHERE submission_id = %s
                """,
                (result.model_dump_json(by_alias=True), result.feedback, now, task.submission_id),
            )


async def fail(submission_id: str):
    now = datetime.now(timezone.utc).isoformat()

    async with pool.connection() as conn:
        await conn.execute(
            """
            UPDATE submissions
            SET status = 'failed', updated_at = %s
            WHERE id = %s
            """,
            (now, submission_id),
        )
