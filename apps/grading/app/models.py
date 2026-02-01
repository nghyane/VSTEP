"""
Pydantic Models for Grading Service
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
from enum import Enum


class TaskType(str, Enum):
    WRITING = "WRITING"
    SPEAKING = "SPEAKING"


class ScaffoldLevel(str, Enum):
    TEMPLATE = "TEMPLATE"
    KEYWORDS = "KEYWORDS"
    FREE = "FREE"


class SubmissionStatus(str, Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"


class ConfidenceFactors(BaseModel):
    """Confidence score components (from flow diagrams)"""
    model_consistency: float = Field(..., ge=0, le=100, description="30% weight")
    rule_validation: float = Field(..., ge=0, le=100, description="25% weight")
    content_similarity: float = Field(..., ge=0, le=100, description="25% weight")
    length_heuristic: float = Field(..., ge=0, le=100, description="20% weight")


class GradingJob(BaseModel):
    """Incoming grading job from Redis queue"""
    request_id: str
    submission_id: str
    user_id: str
    type: TaskType
    task_type: Optional[str] = None  # TASK_1_EMAIL, TASK_2_ESSAY, etc.
    content: Optional[str] = None
    audio_url: Optional[str] = None
    scaffold_level: Optional[ScaffoldLevel] = None
    priority: int = 0
    created_at: datetime


class GradingResult(BaseModel):
    """Grading result to be published back"""
    request_id: str
    submission_id: str
    
    # AI Grading
    ai_score: float = Field(..., ge=0, le=10)
    ai_feedback: str
    
    # Confidence Score
    confidence_score: float = Field(..., ge=0, le=100)
    confidence_factors: ConfidenceFactors
    routing_decision: Literal["AUTO_GRADE", "HUMAN_REVIEW"]
    
    # Human Review (if applicable)
    human_score: Optional[float] = Field(None, ge=0, le=10)
    final_score: float = Field(..., ge=0, le=10)
    
    # Metadata
    graded_at: datetime
    grading_duration_ms: int
    model_used: str
    error_message: Optional[str] = None
