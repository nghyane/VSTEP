def writing(text: str, task_type: str) -> str:
    return f"""You are a VSTEP writing examiner. Grade the following {task_type} using the VSTEP writing rubric.

## Rubric (each criterion 0-10, use 0.5 increments)

- **Task Achievement**: How well the response addresses the task requirements. Relevance, completeness, and development of ideas.
- **Coherence & Cohesion**: Logical organization, paragraphing, use of cohesive devices, and overall flow.
- **Lexical Resource**: Range and accuracy of vocabulary. Appropriateness of word choice and collocations.
- **Grammatical Range & Accuracy**: Variety and correctness of grammatical structures. Control of complex sentences.

## Student Response

{text}

## Instructions

Evaluate the response against each criterion. Provide constructive feedback highlighting strengths and areas for improvement. Assess your own confidence in the grading accuracy.

Respond with ONLY valid JSON matching this schema:
{{
  "task_achievement": <float 0-10>,
  "coherence_cohesion": <float 0-10>,
  "lexical_resource": <float 0-10>,
  "grammatical_range": <float 0-10>,
  "feedback": "<constructive feedback as a single string>",
  "confidence": "<high|medium|low>"
}}"""


SPEAKING_PART_CONTEXT = {
    1: "This is Part 1 (Social Interaction): The candidate answers questions about familiar topics and personal experiences.",
    2: "This is Part 2 (Solution Discussion): The candidate discusses a problem or situation and proposes solutions.",
    3: "This is Part 3 (Topic Development): The candidate develops and supports opinions on an abstract or complex topic.",
}


def speaking(transcript: str, part_number: int) -> str:
    context = SPEAKING_PART_CONTEXT.get(part_number, SPEAKING_PART_CONTEXT[1])

    return f"""You are a VSTEP speaking examiner. Grade the following spoken response transcript using the VSTEP speaking rubric.

{context}

## Rubric (each criterion 0-10, use 0.5 increments)

- **Fluency**: Natural pace, minimal hesitation, self-correction ability. Sustained speech without unnatural pauses.
- **Pronunciation**: Clarity of individual sounds, word stress, intonation patterns, and overall intelligibility.
- **Content**: Relevance and depth of ideas. Task completion, argument development, and supporting details.
- **Vocabulary**: Range and precision of vocabulary. Use of topic-specific and academic language.

## Transcript

{transcript}

## Instructions

Evaluate the transcript against each criterion. Account for the fact this is spoken language transcribed to text. Provide constructive feedback. Assess your own confidence in the grading accuracy.

Respond with ONLY valid JSON matching this schema:
{{
  "fluency": <float 0-10>,
  "pronunciation": <float 0-10>,
  "content": <float 0-10>,
  "vocabulary": <float 0-10>,
  "feedback": "<constructive feedback as a single string>",
  "confidence": "<high|medium|low>"
}}"""
