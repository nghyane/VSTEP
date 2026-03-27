from datetime import datetime, timezone

from app.llm import complete
from app.models import Result, Task, WritingScore
from app.prompts import writing as writing_prompt
from app.scoring import snap, to_band

WRITING_CRITERIA = {
    "taskFulfillment": "task_fulfillment",
    "organization": "organization",
    "vocabulary": "vocabulary",
    "grammar": "grammar",
}


def to_result(score: WritingScore) -> Result:
    criteria = {
        name: getattr(score, attr) for name, attr in WRITING_CRITERIA.items()
    }
    average = sum(criteria.values()) / len(criteria)
    overall = snap(average)

    return Result(
        overallScore=overall,
        band=to_band(overall),
        criteriaScores=criteria,
        feedback=score.feedback,
        confidence=score.confidence,
        gradedAt=datetime.now(timezone.utc).isoformat(),
    )


async def grade(task: Task) -> Result:
    answer = task.writing_answer()
    text = answer.text
    task_type = answer.task_type

    prompt = writing_prompt(text, task_type)
    content = await complete([{"role": "user", "content": prompt}])
    score = WritingScore.model_validate_json(content)
    return to_result(score)
