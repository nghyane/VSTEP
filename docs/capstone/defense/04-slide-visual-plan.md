# 04. Slide deck visual plan

File này giúp team thiết kế slide nhanh: **mỗi slide nên hiện gì**, **nên dùng visual/screenshot nào**, và **không nên nhồi gì lên slide**.

## Nguyên tắc thiết kế

- Không nhồi chữ. Mỗi slide tối đa 3–5 ý chính.
- Slide workflow nên dùng flow 3–5 bước hoặc screenshot thật.
- Slide công thức chỉ đưa bảng chỉ số ngắn; công thức dài để Q&A.
- Slide architecture dùng sơ đồ tầng, không đưa class/database chi tiết.
- Slide technology chia theo vai trò, không chỉ dán logo.

## Phase 1 — Mở đầu và đặt vấn đề

### Slide 1 — Title

**On slide**

- Tên đề tài.
- Mã nhóm / supervisor / team.
- Tagline: `4 skills · feedback · learning path`.

**Visual**

- Cover sạch, logo FPT nếu cần.

### Slide 2 — Outline

**On slide**

- Context
- Problems
- Features
- Architecture/Technology
- Demo
- Results

**Visual**

- Timeline ngang hoặc stepper 6 bước.

### Slide 3 — Team

**On slide**

- Thành viên.
- Vai trò chính.

**Visual**

- 4 card role: Backend/API, Web/Admin, Mobile, QA/Docs.

### Slide 4 — VSTEP Context

**On slide**

- VSTEP phổ biến.
- 4 kỹ năng.
- Listening/Reading objective; Writing/Speaking criteria-based.

**Visual**

- 4 skill cards: Listening, Reading, Writing, Speaking.

### Slide 5 — Problems

**On slide**

- Many resources.
- Fragmented practice.
- Limited feedback.
- Hard to identify weaknesses.

**Visual**

- Split layout: `resources everywhere` vs `no learning loop`.

### Slide 6 — Problem Analysis

**On slide**

- Current: files, notes, static mock tests.
- Needed: feedback, progress, gamification, learning path.

**Visual**

- Before/After: `File đề luyện` → `Learning loop`.

## Phase 2 — Users and features

### Slide 7 — Actors

**On slide**

- Learner
- Admin/Staff
- Teacher
- Mobile learner

**Visual**

- Actor map, learner ở trung tâm.

### Slide 8 — Learner Features

**On slide**

- Practice/mock test.
- Feedback and skill gaps.
- Progress, coin/streak, vocabulary.

**Visual**

- Screenshot: `docs/report6-screenshots/02-learner-dashboard/01-dashboard-overview.png`.

### Slide 9 — Admin/Staff Features

**On slide**

- Content/exam management.
- Criteria management.
- User/course/booking management.

**Visual**

- Screenshot option 1: `docs/report6-screenshots/09-admin-exam-management/01-exam-management.png`.
- Screenshot option 2: `docs/report6-screenshots/10-admin-user-management/01-user-management.png`.

### Slide 10 — Teacher/Mobile Features

**On slide**

- Teacher schedule/booking/leave.
- Mobile companion app.

**Visual**

- Screenshot: `docs/report6-screenshots/13-teacher-flow/02-teacher-dashboard.png`.

## Phase 3 — Architecture, technology, scoring

### Slide 11 — System Architecture

**On slide**

- Clients: Learner Web, Mobile, Admin.
- Backend: Laravel API.
- Data/processing: PostgreSQL, Redis/Horizon, Object Storage.
- External: AI/Speech services.

**Visual**

```text
[Learner Web]   [Mobile App]   [Admin Portal]
       \             |             /
             [Laravel Backend API]
          /        |        |        \
[PostgreSQL] [Redis/Horizon] [Object Storage] [External AI/Speech]
                                      |
                         transcript / pronunciation signals
```

**Do not show**

- Class names.
- Database ERD.
- Full scoring formula.

### Slide 12 — Technology

**On slide**

- Backend API: Laravel/PHP.
- Database: PostgreSQL.
- Background jobs: Redis/Horizon.
- Clients: React, Expo/React Native.
- Speech/audio: Web Speech API, Azure Speech.
- Storage/deployment: R2/S3, Docker, GitHub Actions.

**Visual**

- 3-column cards: `Layer / Technology / Role`.

### Slide 13 — Deployment & Quality

**On slide**

- Docker.
- GitHub Actions.
- Redis queue.
- Tests / isolated external services.

**Visual**

- 4 cards or pipeline: Build → Test → Deploy → Queue jobs.

### Slide 14 — Writing/Speaking Score Formula

**On slide**

```text
Input metric           Extracted by          Used for
Word count             Text analyzer         Length cap
Spelling errors        Text analyzer         Spelling penalty
Topic relevance        AI-assisted analysis  Relevance score / off-topic penalty
Pause count            Speech analyzer       Fluency penalty
Pronunciation signals  Speech service        Pronunciation score

Writing/Speaking score = fixed formula(input metrics) + caps / penalties
```

**Visual**

- Bảng chỉ số bắt buộc.
- Highlight: `AI/external tools only extract input metrics`.

**Do not show**

- Full Writing/Speaking formula dài.

### Slide 15 — Writing Practice Evaluation

**On slide**

- Word count.
- Spelling.
- Relevance.
- Organization.
- Grammar/Vocabulary.

**Visual**

- Screenshot option 1: `docs/report6-screenshots/03-learner-practice/04-writing-practice.png`.
- Screenshot option 2: `docs/report6-screenshots/03-learner-practice/12-WritingTemplate.png`.

### Slide 16 — Speaking Practice Evaluation

**On slide**

- Record audio.
- Transcript/signals.
- Backend formula.
- Feedback.

**Visual**

- Screenshot option 1: `docs/report6-screenshots/03-learner-practice/05-speaking-practice.png`.
- Screenshot option 2: `docs/report6-screenshots/03-learner-practice/13-shadowing.png`.
- Screenshot option 3: `docs/report6-screenshots/03-learner-practice/15-shadowingFeedback.png`.

### Slide 17 — Abnormal Answer Handling

**On slide**

- Too short.
- Off-topic.
- Copied prompt.
- Spam / non-English.
- Cap / penalty.

**Visual**

- Warning/cap diagram.
- No screenshot needed.

## Phase 4 — Demo workflow preview

### Slide 18 — Demo Overview

**On slide**

- Workflow 1: Learner practice.
- Workflow 2: Mock test/result.
- Workflow 3: Admin management.

**Visual**

- 3-column overview.

### Slide 19 — Demo Workflow 1

**On slide**

- Login.
- Practice hub.
- Choose skill.
- Submit.
- Feedback.

**Visual**

- Screenshot: `docs/report6-screenshots/03-learner-practice/01-practice-hub.png`.
- Optional feedback screenshot: `docs/report6-screenshots/03-learner-practice/15-shadowingFeedback.png`.

### Slide 20 — Demo Workflow 2

**On slide**

- Start mock test.
- Complete 4 skills.
- Submit.
- Result.
- Skill gaps.

**Visual**

- Screenshot: `docs/report6-screenshots/04-learner-exam/exam-room-flow/01-exam-detail-current-session.png`.
- Screenshot: `docs/report6-screenshots/04-learner-exam/exam-room-flow/15-result.png`.
- Screenshot: `docs/report6-screenshots/04-learner-exam/exam-room-flow/16-result-detail.png`.

### Slide 21 — Demo Workflow 3

**On slide**

- Admin login.
- Content/exam management.
- Criteria management.
- User/course/booking.

**Visual**

- Screenshot: `docs/report6-screenshots/09-admin-exam-management/27-grading-rubric-list.png`.
- Screenshot: `docs/report6-screenshots/09-admin-exam-management/29-grading-rubric-detail.png`.
- Optional course screenshot: `docs/report6-screenshots/admin-course-management/02-courses-list.png`.

## Phase 5 — Tổng kết

### Slide 22 — Different Points

**On slide**

- 4-skill learning loop.
- Fixed-formula Writing/Speaking score.
- Gamification / coins / streak.
- Recommendation.
- SRS/Anki `See detail`.
- Admin-managed content.

**Visual**

- 5–6 cards; keep text short.

### Slide 23 — Achievements

**On slide**

- Backend.
- Learner web.
- Mobile app.
- Admin portal.
- Assessment support module.
- Tests/docs/source.

**Visual**

- Grid deliverables with icons.

### Slide 24 — Limitations

**On slide**

- Reference score for practice/mock tests.
- Need examiner-scored dataset.
- Audio/speech signal quality risk.
- Future calibration/adaptive learning.

**Visual**

- Split: limitations / future work.

### Slide 25 — Conclusion

**On slide**

- 4-skill practice.
- Feedback and progress.
- Fixed-formula Writing/Speaking score.
- Learning path.

**Visual**

- 3 takeaway cards.

### Slide 26 — Thank You

**On slide**

- Thank you.
- Q&A.

**Visual**

- Clean ending slide.
