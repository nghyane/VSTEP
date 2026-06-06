# Phase 3 Slides (11–13) — Kiến trúc, Công nghệ, Công thức

---

## Slide 11 — System Architecture

**Header:** System Architecture

**Body (sơ đồ tầng 3 lớp):**

```
┌─────────────────────────────────────────────────┐
│                  CLIENT LAYER                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Learner  │  │  Mobile  │  │  Admin   │      │
│  │ Web App  │  │   App    │  │  Portal  │      │
│  │  React   │  │  Expo    │  │  React   │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
└───────┼─────────────┼─────────────┼─────────────┘
        │   HTTPS     │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────┐
│              BACKEND LAYER                       │
│  ┌──────────────────────────────────────────┐   │
│  │          Laravel API Server               │   │
│  │   Controllers → Services → Repositories   │   │
│  └──────┬───────┬───────┬───────────────────┘   │
│         │       │       │                       │
│    ┌────▼──┐ ┌──▼───┐ ┌─▼─────────────┐        │
│    │ Redis │ │Queue │ │Assessment      │        │
│    │ Cache │ │Worker│ │Engine          │        │
│    │       │ │Horizon│ │Rubrics+Formula│        │
│    └───────┘ └──────┘ └───────────────┘        │
└───────┬───────────────┬─────────────────────────┘
        │               │
        ▼               ▼
┌────────────┐  ┌─────────────────────────────────┐
│ PostgreSQL │  │     EXTERNAL SERVICES            │
│            │  │  ┌─────────┐  ┌──────────────┐  │
│ • Users    │  │  │Speech   │  │  LLM/Text    │  │
│ • Exams    │  │  │Audio →  │  │  Analyzer    │  │
│ • Results  │  │  │Transcript│  │  (feedback)  │  │
│ • Content  │  │  │+ Signals │  │              │  │
│ • Finance  │  │  └─────────┘  └──────────────┘  │
└────────────┘  │  ┌─────────┐  ┌──────────────┐  │
                │  │Grammar  │  │Object Storage │  │
                │  │Signals  │  │  R2/S3        │  │
                │  └─────────┘  │  audio/files  │  │
                │               └──────────────┘  │
                └─────────────────────────────────┘
```

**Key points (bullet dưới sơ đồ):**

- Backend là trung tâm điều phối — lưu kết quả, tính điểm Writing/Speaking
- Speaking audio pipeline: record (client) → storage → queue job → speech signals → backend formula
- AI/công cụ ngoài chỉ trích xuất chỉ số — **backend tính điểm**

**Visual source:** `docs/capstone/diagrams/report4-system-architecture-diagram.png`

**Speaker notes:** Web, mobile và admin gọi về Laravel Backend API. Backend kết nối PostgreSQL để lưu dữ liệu, Redis/Horizon để xử lý tác vụ nền và storage để lưu file/audio. Với Speaking, audio được ghi ở client, lưu lại, đưa vào job xử lý nền, rồi speech service hỗ trợ transcript hoặc tín hiệu phát âm. Backend là nơi điều phối và dùng các tín hiệu này cho công thức tính điểm Speaking trong hệ thống.

---

## Slide 12 — Technology

**Header:** Technology Stack

**Body (grid 3 cột):**

| Layer | Technology | Role |
|-------|-----------|------|
| Backend API | Laravel / PHP | Routing, business logic, scoring formulas |
| Database | PostgreSQL | Users, exams, results, content, finance |
| Cache & Queue | Redis / Laravel Horizon | Session state, background assessment jobs |
| Learner Web | React + TanStack Router | Practice, mock test, progress tracking |
| Admin Portal | React | Content/exam/criteria/user/course management |
| Mobile App | Expo / React Native | Companion learning on the go |
| Speech / Audio | Web Speech API, Azure Speech | Transcript, pronunciation signals |
| Text Analysis | Grammar API + LLM | Spelling, structure, topic relevance, feedback |
| Object Storage | Cloudflare R2 / S3 | Audio recordings, images, exports |
| Infrastructure | Docker, GitHub Actions | Containerized deployment, CI/CD |

**Footer highlight:**

> **AI/ext. tools only extract indicators. Backend computes scores with fixed formulas.**

**Speaker notes:** Backend dùng Laravel/PHP. Database dùng PostgreSQL. Queue dùng Redis/Horizon. Web và admin dùng React. Mobile dùng Expo/React Native. Storage dùng S3-compatible/R2. Triển khai dùng Docker và GitHub Actions. Riêng phần Speaking có Web Speech API hoặc Azure Speech để hỗ trợ transcript và tín hiệu phát âm. Các công nghệ này đóng vai trò lấy tín hiệu đầu vào cho hệ thống.

---

## Slide 13 — Writing/Speaking Assessment Formula

**Header:** Writing & Speaking Assessment Formula

**Body (bảng chỉ số — bắt buộc):**

| Input metric | Extracted by | Used for |
|---|---|---|
| Word count | Text analyzer | Length cap |
| Spelling errors | Text analyzer | Spelling penalty |
| Grammar signals | Grammar API | Grammar/Vocabulary score |
| Topic relevance | AI-assisted analysis | Relevance score / off-topic penalty |
| Pause count | Speech analyzer | Fluency penalty |
| Pronunciation signals | Speech service | Pronunciation score |

**Công thức tổng:**

```
Writing/Speaking score = fixed formula(input metrics) + caps / penalties
```

**Flow trực quan:**

```
[Input Metrics] ──► [Fixed Formula] ──► [Score + Penalty Caps] ──► [Result]
     ▲                                          │
     │    AI/external tools                     │
     └──── extract ONLY ────────────────────────┘
```

**Example (minh họa):**

```
Bài viết đủ dài (250+ words)
→ Ít lỗi chính tả
→ Bám đề (relevance high)
→ Grammar/Vocabulary đa dạng
─────────────────────────────
→ Công thức → 7.5 (tham khảo, minh họa pipeline)
```

**Footer highlight:**

> Hệ thống không hỏi AI "bài này mấy điểm". AI/công cụ ngoài chỉ đếm hoặc trích xuất chỉ số đầu vào. Điểm Writing/Speaking do backend tính bằng công thức định lượng cố định.

**Speaker notes:** Đây là slide quan trọng nhất về điểm Writing/Speaking. Nhóm không để AI tự chấm điểm. AI hoặc công cụ ngoài chỉ lấy chỉ số đầu vào như word count, spelling errors, transcript, pause count, pronunciation signals và topic relevance. Backend đưa các chỉ số đó vào công thức định lượng cố định để tính điểm Writing/Speaking trong practice và mock test. Ví dụ ngắn trên slide: bài viết đủ độ dài, ít lỗi chính tả, bám đề → các chỉ số đưa vào công thức → kết quả 7.5. Ví dụ này chỉ để minh họa pipeline, không phải điểm chính thức. Nếu hội đồng hỏi sâu về từng tiêu chí Writing/Speaking hoặc bài bất thường, nhóm trả lời ở phần Q&A.

---

## Code evidence để reference khi Q&A

| File | Role |
|---|---|
| `WritingScoringFormula.php` | Công thức tính điểm Writing từ input metrics |
| `SpeakingScoringFormula.php` | Công thức tính điểm Speaking từ transcript + audio |
| `WritingAssessmentStrategy.php` | Pipeline: evidence → scoring → feedback |
| `SpeakingAssessmentStrategy.php` | Pipeline: transcript + audio → scoring → feedback |
| `ExamScoringService.php` | Tổng hợp 4 kỹ năng cho mock test |

**Công thức chi tiết (backup Q&A, không đưa lên slide chính):**

```
Listening/Reading = round(correct / total × 10, 0.1)

WritingTask  = round_0.5((TaskFulfillment + Organization + Grammar + Vocabulary) / 4)
WritingSkill = round_0.5((Task1 + 2×Task2) / 3)

SpeakingPart  = round_0.5((Grammar + Vocabulary + Fluency + Discourse + Pronunciation) / 5)
SpeakingSkill = round(average of 3 parts, 0.1)

OverallMockExam = round_0.5((Listening + Reading + Writing + Speaking) / 4)
```
