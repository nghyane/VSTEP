# Question & Submission Content Schemas

> **Phiên bản**: 1.1 · SP26SE145

## Purpose

Chuẩn hóa schema cho các trường JSONB chính:

- `questions.content` (delivery)
- `questions.answer_key` (auto-grade)
- `submissions.answer` (user input)
- `submissions.result` (grading output)

Mục tiêu: thống nhất shape JSONB tối thiểu cho implementation; tài liệu trong `docs/` chỉ để tham khảo format (không phải chuẩn dữ liệu cho data design).

## References

- Exam format mapping: `../20-domain/vstep-exam-format.md`
- Scoring: `../../../00-overview/scoring-system.md`

## Conventions

- All IDs are strings.
- All timestamps ISO 8601 UTC.
- Không versioning trong JSON payload (capstone update đồng bộ).

## questions (minimum columns)

`questions` nên có các fields để index/search:

- `skill`: `listening|reading|writing|speaking`
- `level`: `A1|A2|B1|B2|C1`
- `format`: enum theo skill (bên dưới)
- `content` (JSONB): payload delivery
- `answer_key` (JSONB, nullable): chỉ áp dụng cho listening/reading

## 1) Writing

### 1.1 question.format

- `writing_task_1`
- `writing_task_2`

### 1.2 questions.content (writing)

```json
{
  "taskNumber": 1,
  "prompt": "...",
  "instructions": "...",
  "imageUrls": [],
  "wordLimit": 120,
  "criteria": ["taskFulfillment", "organization", "vocabulary", "grammar"]
}
```

### 1.3 submissions.answer (writing)

```json
{
  "text": "..."
}
```

## 2) Speaking

### 2.1 question.format

- `speaking_part_1`
- `speaking_part_2`
- `speaking_part_3`

### 2.2 questions.content (speaking)

```json
{
  "partNumber": 1,
  "instructions": "...",
  "topic": "",
  "mindMapNodes": [],
  "followUpQuestions": [],
  "preparationSeconds": 60,
  "speakingSeconds": 180,
  "sampleAudioUrl": null
}
```

### 2.3 submissions.answer (speaking)

```json
{
  "audioUrl": "https://...",
  "durationSeconds": 123,
  "transcript": null
}
```

## 3) Reading

### 3.1 question.format

- `reading_passage`

### 3.2 questions.content (reading)

```json
{
  "passageNumber": 1,
  "title": "",
  "passage": "...",
  "questions": [
    {
      "number": 1,
      "prompt": "...",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."}
    }
  ]
}
```

### 3.3 questions.answer_key (reading)

```json
{
  "correctAnswers": {"1": "A", "2": "D"}
}
```

### 3.4 submissions.answer (reading)

```json
{
  "answers": {"1": "A", "2": "B"}
}
```

## 4) Listening

### 4.1 question.format

- `listening_part`

### 4.2 questions.content (listening)

```json
{
  "partNumber": 1,
  "audioUrl": "https://...",
  "transcript": null,
  "questions": [
    {
      "number": 1,
      "prompt": "...",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."}
    }
  ]
}
```

### 4.3 questions.answer_key (listening)

```json
{
  "correctAnswers": {"1": "D", "2": "A"}
}
```

### 4.4 submissions.answer (listening)

```json
{
  "answers": {"1": "D", "2": "A"}
}
```

## 5) submissions.result (common)

### 5.1 Auto-graded (listening/reading)

```json
{
  "correctCount": 32,
  "total": 40,
  "score": 8.0,
  "band": "B2"
}
```

### 5.2 AI-graded (writing/speaking)

```json
{
  "overallScore": 6.5,
  "band": "B2",
  "criteriaScores": {"taskFulfillment": 6.0, "organization": 6.5, "vocabulary": 6.5, "grammar": 7.0},
  "feedback": "...",
  "confidenceScore": 88,
  "reviewRequired": false
}
```
