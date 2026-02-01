# Question & Submission Content Shapes

> **Phiên bản**: 1.1 · SP26SE145

## Purpose

Chốt shape tối thiểu cho các trường JSONB chính:

- `questions.content` (delivery)
- `questions.answer_key` (auto-grade)
- `submissions.answer` (user input)
- `submissions.result` (grading output)

Mục tiêu: đủ rõ để backend implement MVP thống nhất; tài liệu trong `docs/` chỉ để tham khảo format/rubric (không phải chuẩn dữ liệu cho data design).

## References

- Exam format mapping: `../20-domain/vstep-exam-format.md`
- Scoring: `../../../00-overview/scoring-system.md`

## Conventions

- Không versioning trong JSON payload (capstone update đồng bộ).
- Các keys trong JSONB ưu tiên camelCase.

## questions (minimum columns)

`questions` nên có các fields để index/search:

- `skill`: `listening|reading|writing|speaking`
- `level`: `A1|A2|B1|B2|C1`
- `format`: enum theo skill (bên dưới)
- `content` (JSONB): payload delivery
- `answer_key` (JSONB, nullable): chỉ áp dụng cho listening/reading
- `searchable_text` (TEXT, generated): denormalized text từ content cho Full Text Search
- `tags` (TEXT[]): array keywords cho quick filtering

## 6) Search & Index Strategy

### 6.1 Full Text Search (Postgres)

Tạo column `searchable_text` được generated từ content:

| Skill | Nội dung denormalize vào searchable_text |
|-------|-------------------------------------------|
| Writing | prompt, instructions |
| Speaking | prompt, instructions, options |
| Reading | passage, title, items.prompt |
| Listening | transcript, items.prompt |

Tạo GIN index:
```sql
CREATE INDEX idx_questions_searchable ON questions USING GIN (to_tsvector('english', searchable_text));
```

### 6.2 Tags Array

- Thêm column `tags TEXT[]` cho các keywords như: `["environment", "education", "technology"]`.
- B-tree index cho exact match và containment queries.

## 1) Writing

### 1.1 question.format

- `writing_task_1` (Letter/Chart)
- `writing_task_2` (Essay)

### 1.2 questions.content (writing)

Fields tối thiểu:

| Field | Type | Required | Notes |
|------|------|----------|------|
| `taskNumber` | int | Yes | `1` hoặc `2` |
| `prompt` | string | Yes | đề bài |
| `instructions` | string | No | hướng dẫn làm bài |
| `minWords` | int | No | default theo task (1:120, 2:250) |
| `imageUrls` | string[] | No | nếu có hình (biểu đồ, thư mẫu) |
| `scaffolding` | object | No | **New**: Hỗ trợ Adaptive Learning |

**Scaffolding Shape:**
```json
{
  "template": "Dear [Name],\nI am writing to...", // Level 1 support
  "keywords": ["complain", "refund", "service"],   // Level 2 support
  "modelEssay": "Sample full response..."          // Review/Reference
}
```

### 1.3 submissions.answer (writing)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `text` | string | Yes | bài viết |

## 2) Speaking

### 2.1 question.format

- `speaking_part_1`
- `speaking_part_2`
- `speaking_part_3`

### 2.2 questions.content (speaking)

Fields tối thiểu:

| Field | Type | Required | Notes |
|------|------|----------|------|
| `partNumber` | int | Yes | `1`/`2`/`3` |
| `prompt` | string | Yes | nội dung chính (topic/câu hỏi) |
| `instructions` | string | No | |
| `options` | string[] | No | Part 2: 3 lựa chọn |
| `mindMapNodes` | string[] | No | Part 3 (optional) |
| `followUpQuestions` | string[] | No | Part 3 (optional) |
| `preparationSeconds` | int | No | default 60 |
| `speakingSeconds` | int | No | default theo part |
| `sampleAudioUrl` | string | No | |

### 2.3 submissions.answer (speaking)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `audioUrl` | string | Yes | URL tải audio |
| `durationSeconds` | int | Yes | |
| `transcript` | string | No | nếu có STT |

## 3) Reading

### 3.1 question.format

- `reading_mcq` (Multiple Choice - Default)
- `reading_tng` (True/False/Not Given)
- `reading_matching_headings`
- `reading_gap_fill`

### 3.2 questions.content (reading)

**Common Fields:**
- `passage`: string (HTML/Markdown)
- `title`: string

**Type-Specific Shapes:**

#### A. Multiple Choice / True-False-Not Given
- `items`: array of objects
  - `number`: int (global index in test)
  - `prompt`: string (question text)
  - `options`: object (`{ "A": "...", "B": "..." }`)

#### B. Matching Headings
- `paragraphs`: array (`[{ "label": "A", "text": "..." }, ...]`)
- `headings`: array (`["Heading 1", "Heading 2", ...]`)
- `items`: array (mapping slots)
  - `number`: int
  - `targetParagraph`: string ("A")

#### C. Gap Fill
- `textWithGaps`: string ("... is a [1] of ...")
- `items`: array
  - `number`: int
  - `options`: object (if MCQ fill) OR null (if direct entry)

### 3.3 questions.answer_key (reading)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `correctAnswers` | object | Yes | map `number -> value` |

- MCQ/TNG: `number -> "A"`
- Matching: `number -> index` (of heading)
- Gap Fill: `number -> "exact word"` OR `number -> "A"`

### 3.4 submissions.answer (reading)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `answers` | object | Yes | map `number -> user_value` |

## 4) Listening

### 4.1 question.format

- `listening_mcq` (Part 1, 2, 3)
- `listening_dictation` (Practice Mode)

### 4.2 questions.content (listening)

**Common Fields:**
- `audioUrl`: string
- `transcript`: string (Full text)
- `scaffolding`: object (Adaptive Support)
  - `keywords`: string[] (Highlight mode)
  - `slowAudioUrl`: string (Optional for lower levels)

**Type-Specific Shapes:**

#### A. Multiple Choice
- `items`: array
  - `number`: int
  - `prompt`: string
  - `options`: object (`{ "A": "...", "B": "..." }`)

#### B. Dictation (Gap Fill)
- `transcriptWithGaps`: string ("... [1] ...")
- `items`: array
  - `number`: int
  - `correctText`: string (for validation hint)

### 4.3 questions.answer_key (listening)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `correctAnswers` | object | Yes | map `number -> value` |

### 4.4 submissions.answer (listening)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `answers` | object | Yes | map `number -> value` |

## 5) submissions.result (common)

### 5.1 Auto-graded (listening/reading)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `correctCount` | int | Yes | |
| `total` | int | Yes | 35 (listening) / 40 (reading) |
| `score` | number | Yes | 0..10 (round 0.5) |
| `band` | enum | No | optional; có thể derive từ score |

### 5.2 AI-graded (writing/speaking)

| Field | Type | Required | Notes |
|------|------|----------|------|
| `overallScore` | number | Yes | 0..10 (round 0.5) |
| `band` | enum | Yes | A1/A2/B1/B2/C1 |
| `criteriaScores` | object | No | per-rubric; shape tùy skill |
| `feedback` | string | No | |
| `confidenceScore` | int | Yes | 0..100 |
| `reviewRequired` | boolean | Yes | `confidenceScore < 85` |
