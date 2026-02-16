from datetime import datetime, timezone

from app.llm import router
from app.models import AIGradeResult, GradingTask, WritingGrade
from app.prompts import build_writing_prompt
from app.scoring import round_score, score_to_band

WRITING_CRITERIA = {
    "taskAchievement": "task_achievement",
    "coherenceCohesion": "coherence_cohesion",
    "lexicalResource": "lexical_resource",
    "grammaticalRange": "grammatical_range",
}


def to_result(grade: WritingGrade) -> AIGradeResult:
    criteria = {
        name: getattr(grade, attr) for name, attr in WRITING_CRITERIA.items()
    }
    average = sum(criteria.values()) / len(criteria)
    score = round_score(average)

    return AIGradeResult(
        overallScore=score,
        band=score_to_band(score),
        criteriaScores=criteria,
        feedback=grade.feedback,
        confidence=grade.confidence,
        gradedAt=datetime.now(timezone.utc).isoformat(),
    )


async def grade_writing(task: GradingTask) -> AIGradeResult:
    answer = task.writing_answer()
    text = answer.text
    task_type = answer.task_type

    prompt = build_writing_prompt(text, task_type)
    response = await router.acompletion(
        model="grader",
        messages=[{"role": "user", "content": prompt}],
        response_format=WritingGrade,
        temperature=0.3,
    )

    grade = WritingGrade.model_validate_json(response.choices[0].message.content)
    return to_result(grade)
