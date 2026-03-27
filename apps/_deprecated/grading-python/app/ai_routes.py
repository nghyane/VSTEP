import json
import re
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from app.llm import complete
from app.logger import logger



def extract_json(text: str) -> dict:
    """Extract JSON object from LLM response, stripping markdown fences if present."""
    match = re.search(r"```(?:json)?\s*({.*?})\s*```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    match = re.search(r"({.*})", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    return json.loads(text)


async def _complete(prompt: str) -> str:
    """Call LLM and collect response."""
    return await complete([{"role": "user", "content": prompt}])

ai_router = APIRouter()


# --- Paraphrase ---

class ParaphraseRequest(BaseModel):
    text: str
    skill: Literal["listening", "reading", "writing", "speaking"]
    context: str | None = None


class HighlightEntry(BaseModel):
    phrase: str
    note: str


class ParaphraseResponse(BaseModel):
    highlights: list[HighlightEntry]


@ai_router.post("/ai/paraphrase", response_model=ParaphraseResponse)
async def paraphrase(req: ParaphraseRequest):
    context_line = f"\nAdditional context: {req.context}" if req.context else ""
    prompt = (
        f"You are a VSTEP English exam tutor. Analyze the following {req.skill} passage "
        f"and identify 5-10 key phrases that can be paraphrased for Vietnamese VSTEP learners.\n"
        f"For each phrase, provide an alternative expression or explanation in Vietnamese.\n"
        f"Return ONLY a JSON object (no markdown, no explanation) with a \"highlights\" array of objects, each with:\n"
        f"- \"phrase\": the original phrase from the text\n"
        f"- \"note\": \"→ alternative expression(s) (Vietnamese explanation)\"\n"
    )
    if req.context:
        prompt += f"\nAdditional context: {req.context}"
    prompt += f"\n\nText:\n{req.text}"

    logger.info("paraphrase request for skill=%s len=%d", req.skill, len(req.text))
    content = await _complete(prompt)

    result = ParaphraseResponse.model_validate(extract_json(content))
    return result


# --- Explain ---

class ExplainRequest(BaseModel):
    text: str
    skill: Literal["listening", "reading", "writing", "speaking"]
    question_numbers: list[int] | None = None
    answers: dict[str, str] | None = None
    correct_answers: dict[str, str] | None = None


class ExplainHighlight(BaseModel):
    phrase: str
    note: str
    category: Literal["grammar", "vocabulary", "strategy", "discourse"]


class QuestionExplanation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question_number: int = Field(alias="questionNumber")
    correct_answer: str = Field(alias="correctAnswer")
    explanation: str
    wrong_answer_note: str | None = Field(None, alias="wrongAnswerNote")


class ExplainResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    highlights: list[ExplainHighlight]
    question_explanations: list[QuestionExplanation] | None = Field(None, alias="questionExplanations")


@ai_router.post("/ai/explain", response_model=ExplainResponse)
async def explain(req: ExplainRequest):
    prompt = (
        f"You are a VSTEP English exam tutor. Analyze the following {req.skill} passage.\n"
        f"Identify important grammar structures, vocabulary, discourse markers, and strategies.\n"
        f"For each highlight, provide a Vietnamese explanation.\n"
        f"Return ONLY a JSON object (no markdown, no explanation) with:\n"
        f"- \"highlights\": array of objects with \"phrase\", \"note\" (Vietnamese explanation), "
        f"and \"category\" (one of: grammar, vocabulary, strategy, discourse)\n"
    )

    if req.answers and req.correct_answers:
        prompt += (
            f"- \"questionExplanations\": array of objects with \"questionNumber\", "
            f"\"correctAnswer\", \"explanation\" (in Vietnamese), and optionally "
            f"\"wrongAnswerNote\" (explain why the student's answer is wrong, in Vietnamese)\n\n"
            f"Student answers: {req.answers}\n"
            f"Correct answers: {req.correct_answers}\n"
        )
        if req.question_numbers:
            prompt += f"Focus on questions: {req.question_numbers}\n"
    else:
        prompt += f"- \"questionExplanations\": null\n"

    prompt += f"\nText:\n{req.text}"

    logger.info("explain request for skill=%s len=%d", req.skill, len(req.text))
    content = await _complete(prompt)

    result = ExplainResponse.model_validate(extract_json(content))
    return result.model_dump(by_alias=True)
