from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


class PermanentError(Exception):
    """Non-retryable: bad input, unknown skill, invalid payload"""


class WritingAnswer(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str
    word_count: int | None = Field(None, alias="wordCount")
    task_type: str = Field("essay", alias="taskType")


class SpeakingAnswer(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    audio_url: str = Field(alias="audioUrl")
    duration_seconds: float = Field(alias="durationSeconds")
    part_number: int = Field(1, alias="partNumber")


class GradingTask(BaseModel):
    """Matches backend LPUSH payload to grading:tasks"""

    model_config = ConfigDict(populate_by_name=True)

    submission_id: str = Field(alias="submissionId")
    question_id: str = Field(alias="questionId")
    skill: Literal["writing", "speaking"]
    answer: dict
    dispatched_at: str = Field(alias="dispatchedAt")

    def writing_answer(self) -> WritingAnswer:
        return WritingAnswer.model_validate(self.answer)

    def speaking_answer(self) -> SpeakingAnswer:
        return SpeakingAnswer.model_validate(self.answer)


class GrammarError(BaseModel):
    offset: int
    length: int
    message: str
    suggestion: str | None = None


class AIGradeResult(BaseModel):
    """Matches backend src/db/types/grading.ts AIGradeResult exactly.
    Serialized as camelCase JSONB in submission_details.result"""

    model_config = ConfigDict(populate_by_name=True)

    overall_score: float = Field(alias="overallScore", ge=0, le=10)
    band: str | None = None
    criteria_scores: dict[str, float] = Field(alias="criteriaScores")
    feedback: str
    grammar_errors: list[GrammarError] | None = Field(None, alias="grammarErrors")
    confidence: Literal["high", "medium", "low"]
    graded_at: str | None = Field(None, alias="gradedAt")


class WritingGrade(BaseModel):
    """Structured output from LLM for writing grading"""

    task_achievement: float = Field(ge=0, le=10)
    coherence_cohesion: float = Field(ge=0, le=10)
    lexical_resource: float = Field(ge=0, le=10)
    grammatical_range: float = Field(ge=0, le=10)
    feedback: str
    confidence: Literal["high", "medium", "low"]


class SpeakingGrade(BaseModel):
    """Structured output from LLM for speaking grading"""

    fluency: float = Field(ge=0, le=10)
    pronunciation: float = Field(ge=0, le=10)
    content: float = Field(ge=0, le=10)
    vocabulary: float = Field(ge=0, le=10)
    feedback: str
    confidence: Literal["high", "medium", "low"]
