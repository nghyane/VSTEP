from datetime import datetime, timezone

from app.llm import router
from app.models import Result, Task, WritingScore
from app.prompts import writing as writing_prompt
from app.scoring import snap, to_band

WRITING_CRITERIA = {
    "taskAchievement": "task_achievement",
    "coherenceCohesion": "coherence_cohesion",
    "lexicalResource": "lexical_resource",
    "grammaticalRange": "grammatical_range",
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
    response = await router.acompletion(
        model="grader",
        messages=[{"role": "user", "content": prompt}],
        response_format=WritingScore,
        temperature=0.3,
    )

    score = WritingScore.model_validate_json(response.choices[0].message.content)
    return to_result(score)
