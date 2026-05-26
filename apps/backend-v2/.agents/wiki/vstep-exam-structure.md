# VSTEP Exam Structure

Cấu trúc đề thi, model relationships, và cách tính thời gian.

## Mô hình dữ liệu

```
Exam
 ├── ExamVersion[] (versioned)
 │    ├── ExamVersionListeningSection[] → ExamVersionListeningItem[]
 │    ├── ExamVersionReadingPassage[]   → ExamVersionReadingItem[]
 │    ├── ExamVersionWritingTask[]
 │    └── ExamVersionSpeakingPart[]
 ├── ExamSession[] (user attempts)
 │    ├── ExamMcqAnswer[] (listening + reading answers)
 │    ├── ExamWritingSubmission → WritingGradingResult[]
 │    └── ExamSpeakingSubmission → SpeakingGradingResult[]
 └── GradingJob[] (async grading queue)
```

## Cấu trúc 4 kỹ năng

### Listening (3 phần)

- **Part 1**: Nghe hội thoại ngắn → MCQ
- **Part 2**: Nghe bài nói dài → MCQ
- **Part 3**: Nghe bài giảng → MCQ
- **Tổng**: ~35 câu, ~40 phút
- **Model**: `ExamVersionListeningSection` chứa `duration_minutes`, `audio_url`, `transcript`, `items[]`

### Reading (4 passages)
- **Part 1-4**: Đọc passages → MCQ
- **Tổng**: 40 câu, 60 phút
- **Model**: `ExamVersionReadingPassage` chứa `duration_minutes`, `passage` text, `items[]`

### Writing (2 tasks)
- **Task 1**: Thư/Email (≥120 từ), 20 phút
- **Task 2**: Essay (≥250 từ), 40 phút
- **Tổng**: 60 phút
- **Model**: `ExamVersionWritingTask` chứa `part`, `prompt`, `duration_minutes`, `requirements` (jsonb, required), `instructions`
- **Scoring requirements**: `requirements[]` array configured by admin per task

### Speaking (3 phần)

- **Part 1**: Phỏng vấn (giới thiệu bản thân)
- **Part 2**: Thảo luận chủ đề
- **Part 3**: Trình bày quan điểm
- **Tổng**: 12 phút
- **Model**: `ExamVersionSpeakingPart` chứa `part`, `part_title`, `prompt`, `duration_minutes`

## Versioning

Mỗi `Exam` có nhiều `ExamVersion`. Một version active tại một thời điểm:

```php
Exam::activeVersion()  // where is_active = true, first()
```

Exam có `slug`, `title`, `source_school` (trường cung cấp đề), `tags[]`, `is_published`.

## Tính thời gian thi

`Exam::totalDurationMinutes` là computed accessor — tổng từ các sections, không từ DB column:

```php
Σ ExamVersionListeningSection.duration_minutes
+ Σ ExamVersionReadingPassage.duration_minutes
+ Σ ExamVersionWritingTask.duration_minutes
+ Σ ExamVersionSpeakingPart.duration_minutes
```

## MCQ scoring (Listening + Reading)

`ExamMcqAnswer` lưu câu trả lời của từng câu MCQ:
- `session_id` → session nào
- `item_ref_type` → `listening` hoặc `reading`
- `is_correct` → boolean (backend check đáp án)

Tính điểm MCQ:
```php
// ProgressService line 364-369
$results = DB::table('exam_mcq_answers')
    ->where('session_id', $sessionIds)
    ->where('item_ref_type', $itemRefType)
    ->selectRaw('count(*) as total, sum(case when is_correct then 1 else 0 end) as correct')
    ->groupBy('session_id');
```

## Practice vs Exam

| Loại | Model | Grading |
|------|-------|---------|
| Practice Writing | `PracticeWritingSubmission` | `WritingGradingStrategy` (practice_writing) |
| Practice Speaking | `PracticeSpeakingSubmission` | `SpeakingGradingStrategy` (practice_speaking) |
| Exam Writing | `ExamWritingSubmission` | `WritingGradingStrategy` (exam_writing) |
| Exam Speaking | `ExamSpeakingSubmission` | `SpeakingGradingStrategy` (exam_speaking) |

- Practice submissions có `prompt` relation (PracticeWritingSubmission → prompt).
- Exam submissions có `task` relation (ExamWritingSubmission → task).
- Grading flow giống hệt nhau giữa practice và exam (cùng strategy, khác submission_type).

## Data rules (frontend)

Từ `frontend-v3/AGENTS.md`:

- Chart/spider = **chỉ exam** (graded). Drill score không vào chart.
- Study time + streak = **chỉ drill**. Exam không cộng.
- FSRS adaptive **chỉ vocab**. Exam = đề cố định.
- Spider chart ẩn nếu < 5 bài thi.
- 1 User → nhiều Profile. 1 Profile = 1 Target (level + deadline).

---

See also: [[grading-architecture]] · [[scoring-formulas]]
