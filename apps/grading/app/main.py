import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db import close_pool, init_pool
from app.health import health_router
from app.logger import logger
from app.worker import run_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    task = asyncio.create_task(run_worker())
    logger.info("started")
    yield
    task.cancel()
    await close_pool()


app = FastAPI(title="VSTEP Grading Service", lifespan=lifespan)
app.include_router(health_router)
