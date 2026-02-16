from datetime import datetime, timezone

from redis.asyncio import Redis

from app.llm import router
from app.models import AIGradeResult, GradingTask, SpeakingGrade
from app.prompts import build_speaking_prompt
from app.scoring import round_score, score_to_band
from app.stt import transcribe

SPEAKING_CRITERIA = {
    "fluency": "fluency",
    "pronunciation": "pronunciation",
    "content": "content",
    "vocabulary": "vocabulary",
}


def to_result(grade: SpeakingGrade) -> AIGradeResult:
    criteria = {
        name: getattr(grade, attr) for name, attr in SPEAKING_CRITERIA.items()
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


async def grade_speaking(task: GradingTask, redis: Redis) -> AIGradeResult:
    answer = task.speaking_answer()
    transcript = await transcribe(answer.audio_url, redis)
    part = answer.part_number

    prompt = build_speaking_prompt(transcript, part)
    response = await router.acompletion(
        model="grader",
        messages=[{"role": "user", "content": prompt}],
        response_format=SpeakingGrade,
        temperature=0.3,
    )

    grade = SpeakingGrade.model_validate_json(response.choices[0].message.content)
    return to_result(grade)
