from datetime import datetime, timezone

from redis.asyncio import Redis

from app.llm import complete
from app.models import Result, SpeakingScore, Task
from app.prompts import speaking as speaking_prompt
from app.scoring import snap, to_band
from app.stt import transcribe

SPEAKING_CRITERIA = {
    "fluencyOrganization": "fluency_organization",
    "pronunciation": "pronunciation",
    "vocabulary": "vocabulary",
    "grammar": "grammar",
}


def to_result(score: SpeakingScore) -> Result:
    criteria = {
        name: getattr(score, attr) for name, attr in SPEAKING_CRITERIA.items()
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


async def grade(task: Task, redis: Redis) -> Result:
    answer = task.speaking_answer()
    transcript = await transcribe(answer.audio_url, redis)
    part = answer.part_number

    prompt = speaking_prompt(transcript, part)
    content = await complete([{"role": "user", "content": prompt}])
    score = SpeakingScore.model_validate_json(content)
    return to_result(score)
