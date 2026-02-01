# Backend Data & Content Dictionary

## 👤 User Domain

### User Roles
| Role | Permissions | Description |
|------|-------------|-------------|
| `learner` | Practice, Mock test, View progress | Default role for students |
| `instructor` | + Grade submissions, View students | Teachers/graders |
| `admin` | + Manage users, Manage content | System administrators |

### CEFR Levels
| Level | Description | VSTEP Equivalent |
|-------|-------------|------------------|
| `A1` | Beginner | - |
| `A2` | Elementary | - |
| `B1` | Intermediate | Level 3-4 |
| `B2` | Upper-Intermediate | Level 5-6 |
| `C1` | Advanced | Level 7-8 |

---

## 📝 Submission Domain

### Task Types

**Writing Tasks:**
| Task | Format | Word Count | Time | Description |
|------|--------|------------|------|-------------|
| `TASK_1_EMAIL` | Email/Letter | 150-180 | 20 min | Formal/informal correspondence |
| `TASK_2_ESSAY` | Argumentative Essay | 300-350 | 40 min | Opinion, discussion, problem-solution |

**Speaking Tasks:**
| Part | Duration | Description |
|------|----------|-------------|
| `PART_1_INTRO` | 2 min | Personal questions (family, work, hobbies) |
| `PART_2_CUE_CARD` | 3-4 min | 1-2 min monologue on topic |
| `PART_3_DISCUSSION` | 5 min | Abstract discussion related to Part 2 |

### Scaffold Levels (Adaptive Learning)

| Level | Support Provided | Target User |
|-------|-----------------|-------------|
| `TEMPLATE` | Full sentence starters, structure guide | A1-A2 beginners |
| `KEYWORDS` | Key phrases, transition words, vocabulary hints | B1 intermediate |
| `FREE` | No scaffolding, independent writing | B2-C1 advanced |

**Progression Rules:**
- Level up: 3 consecutive attempts ≥80% score
- Level down: 2 consecutive attempts <50% score
- Stay: Between 50-80%

---

## 🎯 Grading Domain

### VSTEP Score Bands (0-10)

| Band | Description | CEFR |
|------|-------------|------|
| 0 | Non-user | - |
| 1-2 | Beginner | A1 |
| 3-4 | Elementary | A2 |
| 5-6 | Intermediate | B1 |
| 7-8 | Good User | B2 |
| 9-10 | Expert User | C1 |

### Grading Criteria (Writing)

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Task Achievement | 25% | Address all parts of prompt, appropriate format |
| Coherence & Cohesion | 25% | Logical organization, effective transitions |
| Lexical Resource | 25% | Vocabulary range, accuracy, collocations |
| Grammatical Range & Accuracy | 25% | Sentence variety, error frequency |

### Grading Criteria (Speaking)

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Fluency & Coherence | 25% | Pace, pauses, logical flow |
| Lexical Resource | 25% | Vocabulary range, idiomatic usage |
| Grammatical Range & Accuracy | 25% | Structures used, error impact |
| Pronunciation | 25% | Intelligibility, stress, intonation |

### Confidence Score Factors

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Model Consistency | 30% | Variance across multiple LLM samples |
| Rule Validation | 25% | Word count, format compliance |
| Content Similarity | 25% | 100 - template_similarity (lower is better) |
| Length Heuristic | 25% | Sentence count, paragraph structure, complexity |

**Thresholds:**
- ≥90%: Auto-grade (no review)
- 85-89%: Auto-grade + audit flag
- 70-84%: Human review (medium priority)
- 50-69%: Human review (high priority)
- <50%: Human review (critical) + model warning

---

## 📊 Mock Test Domain

### Test Structure

| Section | Parts | Duration | Questions | Score Weight |
|---------|-------|----------|-----------|--------------|
| Listening | 3 | 40 min | 35 | 25% |
| Reading | 4 | 60 min | 40 | 25% |
| Writing | 2 | 60 min | 2 tasks | 25% |
| Speaking | 3 | 12 min | - | 25% |
| **Total** | - | **172 min** | - | **100%** |

### Listening Parts

| Part | Format | Description |
|------|--------|-------------|
| Part 1 | Picture-based MCQ | 6 questions, short conversations |
| Part 2 | Q&A MCQ | 10 questions, short dialogues |
| Part 3 | Passage MCQ | 19 questions, longer conversations/lectures |

### Reading Parts

| Part | Format | Description |
|------|--------|-------------|
| Part 1 | T/F/NG | 5 statements, identify True/False/Not Given |
| Part 2 | MCQ | 10 questions, reading passages |
| Part 3 | Matching | 5 headings match to paragraphs |
| Part 4 | Gap-fill | 10 blanks to fill |

### Score Calculation

```
Total Score = (Listening + Reading + Writing + Speaking) / 4

Where:
- Listening & Reading: Auto-graded (correct answers / total × 10)
- Writing & Speaking: AI/Human graded (0-10 scale)
```

---

## 📈 Progress Domain

### Spider Chart Metrics

| Skill | Metric | Calculation |
|-------|--------|-------------|
| Listening | Accuracy rate | Correct answers / Total attempts |
| Reading | Accuracy rate | Correct answers / Total attempts |
| Writing | Average score | Mean of last 10 submissions |
| Speaking | Average score | Mean of last 10 submissions |

### Sliding Window

| Window Size | Purpose |
|-------------|---------|
| Last 5 attempts | Short-term trend |
| Last 10 attempts | Medium-term trend (default) |
| Last 20 attempts | Long-term trend |

### Trend Detection

| Trend | Definition | Action |
|-------|------------|--------|
| Improving | Current window > Previous window by 10% | Continue current path |
| Stable | Difference < 10% | Maintain practice |
| Declining | Current window < Previous window by 10% | Increase scaffolding |

### Learning Path Priorities

| Priority | Condition | Recommendation |
|----------|-----------|----------------|
| 1 (Highest) | Lowest skill score | Focus exercises on weak skill |
| 2 | Below target level | Practice at current level |
| 3 | Near goal | Mock tests, full practice |
| 4 (Lowest) | Exceeding target | Advanced materials |

---

## 🔔 Notification Content

### Milestone Notifications

| Trigger | Message | Channel |
|---------|---------|---------|
| First submission | "Bài làm đầu tiên của bạn đã được gửi!" | In-app |
| Level up | "Chúc mừng! Bạn đã lên cấp [LEVEL]" | In-app + Email |
| Mock test complete | "Kết quả bài thi thử đã sẵn sàng" | In-app + Push |
| Goal achieved | "Xuất sắc! Bạn đã đạt mục tiêu [LEVEL]" | In-app + Email + Push |
| 7-day streak | "7 ngày luyện tập liên tiếp!" | In-app |

### Reminder Notifications

| Trigger | Message | Channel |
|---------|---------|---------|
| 3 days inactive | "Nhớ luyện tập hôm nay nhé!" | Push |
| 7 days inactive | "Bạn đã bỏ lỡ 7 ngày. Bắt đầu lại nào!" | Email + Push |
| Goal deadline approaching | "Còn [X] ngày để đạt mục tiêu" | In-app |

---

## 🌍 Localization (Vietnamese UI)

### Common Labels

| English | Vietnamese | Context |
|---------|------------|---------|
| Submit | Nộp bài | Button |
| Practice | Luyện tập | Navigation |
| Mock Test | Thi thử | Navigation |
| Progress | Tiến độ | Navigation |
| Profile | Hồ sơ | Navigation |
| Dashboard | Tổng quan | Page title |
| Writing | Viết | Skill name |
| Speaking | Nói | Skill name |
| Listening | Nghe | Skill name |
| Reading | Đọc | Skill name |
| Score | Điểm | Metric |
| Feedback | Nhận xét | Section |
| Level | Cấp độ | Classification |
| Goal | Mục tiêu | Target |

### Status Messages

| Status | Vietnamese |
|--------|------------|
| PENDING | Đang chờ... |
| QUEUED | Đang xếp hàng |
| PROCESSING | Đang chấm... |
| COMPLETED | Hoàn thành |
| ERROR | Có lỗi xảy ra |

### Error Messages

| Error | Vietnamese |
|-------|------------|
| Email already exists | Email đã được sử dụng |
| Invalid credentials | Thông tin đăng nhập không đúng |
| Token expired | Phiên đăng nhập đã hết hạn |
| Submission not found | Không tìm thấy bài làm |
| Word count exceeded | Vượt quá số từ cho phép |
| File too large | File quá lớn |

---

## 📋 Content Validation Rules

### Email Validation
- Format: RFC 5322 compliant
- Domain: Must have valid MX record (optional)
- Unique: No duplicate in system

### Password Validation
- Minimum: 8 characters
- Complexity: At least 1 uppercase, 1 lowercase, 1 number
- Forbidden: Common passwords (check against list)

### Content Validation
- Writing Task 1: 150-180 words (warning if <140 or >200)
- Writing Task 2: 300-350 words (warning if <280 or >400)
- Speaking audio: Max 5MB, formats: mp3, wav, m4a
- File upload: Scan for malware, validate MIME type

---

*Document này chứa tất cả business content và rules - không code*
