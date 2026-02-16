import pytest
from pydantic import ValidationError

from app.models import Result, Task, WritingScore


def test_task_from_camel_case():
    data = {
        "submissionId": "abc-123",
        "questionId": "q-456",
        "skill": "writing",
        "answer": {"text": "Some essay text"},
        "dispatchedAt": "2026-01-01T00:00:00Z",
    }
    task = Task.model_validate(data)
    assert task.submission_id == "abc-123"
    assert task.question_id == "q-456"
    assert task.skill == "writing"


def test_task_from_snake_case():
    data = {
        "submission_id": "abc-123",
        "question_id": "q-456",
        "skill": "speaking",
        "answer": {"audioUrl": "https://example.com/audio.mp3"},
        "dispatched_at": "2026-01-01T00:00:00Z",
    }
    task = Task.model_validate(data)
    assert task.submission_id == "abc-123"
    assert task.skill == "speaking"


def test_task_invalid_skill():
    data = {
        "submissionId": "abc-123",
        "questionId": "q-456",
        "skill": "reading",
        "answer": {},
        "dispatchedAt": "2026-01-01T00:00:00Z",
    }
    with pytest.raises(ValidationError):
        Task.model_validate(data)


def test_result_serializes_camel_case():
    result = Result(
        overallScore=7.5,
        band="B2",
        criteriaScores={"taskAchievement": 7.0, "coherenceCohesion": 8.0},
        feedback="Good work",
        confidence="high",
        gradedAt="2026-01-01T00:00:00Z",
    )
    dumped = result.model_dump(by_alias=True)
    assert "overallScore" in dumped
    assert "criteriaScores" in dumped
    assert "gradedAt" in dumped
    assert dumped["overallScore"] == 7.5


def test_result_score_bounds():
    with pytest.raises(ValidationError):
        Result(
            overallScore=11.0,
            criteriaScores={},
            feedback="",
            confidence="high",
        )

    with pytest.raises(ValidationError):
        Result(
            overallScore=-1.0,
            criteriaScores={},
            feedback="",
            confidence="high",
        )


def test_writing_score_bounds():
    with pytest.raises(ValidationError):
        WritingScore(
            task_achievement=11.0,
            coherence_cohesion=7.0,
            lexical_resource=7.0,
            grammatical_range=7.0,
            feedback="OK",
            confidence="high",
        )

    score = WritingScore(
        task_achievement=8.5,
        coherence_cohesion=7.0,
        lexical_resource=6.5,
        grammatical_range=7.5,
        feedback="Solid essay",
        confidence="medium",
    )
    assert score.task_achievement == 8.5
    assert score.confidence == "medium"
