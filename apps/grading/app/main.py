"""
Main FastAPI Application
Health checks and monitoring
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime

from app.celery_app import celery_app
from app.models import GradingJob

app = FastAPI(
    title="VSTEP Grading Service",
    description="AI-powered grading for VSTEP writing and speaking tasks",
    version="1.0.0"
)


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str


class SubmitRequest(BaseModel):
    submission_id: str
    content: str
    type: str  # "WRITING" or "SPEAKING"


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )


@app.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes"""
    # TODO: Check Redis connection
    return {"status": "ready"}


@app.post("/submit")
async def submit_grading(request: SubmitRequest):
    """
    Submit a grading job directly (for testing)
    """
    from app.tasks import grade_essay, grade_speech
    
    job_data = {
        "request_id": "direct-" + request.submission_id,
        "submission_id": request.submission_id,
        "user_id": "test-user",
        "type": request.type,
        "content": request.content,
        "created_at": datetime.utcnow()
    }
    
    # Queue task
    if request.type == "WRITING":
        task = grade_essay.delay(job_data)
    else:
        task = grade_speech.delay(job_data)
    
    return {
        "task_id": task.id,
        "status": "queued",
        "submission_id": request.submission_id
    }


@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """Get task status by ID"""
    result = celery_app.AsyncResult(task_id)
    
    return {
        "task_id": task_id,
        "status": result.status,
        "result": result.result if result.ready() else None
    }


@app.get("/")
async def root():
    return {
        "service": "VSTEP Grading Service",
        "version": "1.0.0",
        "docs": "/docs"
    }
