import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import db, worker
from app.health import health_router
from app.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init()
    task = asyncio.create_task(worker.run())
    logger.info("started")
    yield
    task.cancel()
    await db.close()


app = FastAPI(title="VSTEP Grading Service", lifespan=lifespan)
app.include_router(health_router)
