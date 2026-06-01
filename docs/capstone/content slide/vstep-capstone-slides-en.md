# VSTEP Capstone Presentation Content — English

## Slide 1 — Title

**Section:** Opening

**Content:**

**An Adaptive VSTEP Preparation System with Comprehensive Skill Assessment and Personalized Learning Support**

- Project Code: SP26SE146
- Group: GSP26SE63
- Software Type: Web Application + Mobile App + Admin Portal
- Academic Supervisor: Lam Huu Khanh Phuong
- Industry Supervisor: Tran Trong Huynh

---

## Slide 2 — Team Members

**Section:** Opening

**Content:**

**Team Members**

- Hoang Van Anh Nghia — SE172605 — Team Leader / Backend Developer
- Nguyen Minh Khoi — SE172625 — Mobile Developer
- Nguyen Nhat Phat — SE172607 — Frontend Developer
- Nguyen Tran Tan Phat — SE173198 — Frontend Developer

---

## Slide 3 — Table of Contents

**Section:** Opening

**Content:**

**Table of Contents**

1. Context
2. Problems
3. Actors
4. Main Features by Actors
5. System Architecture
6. Technology
7. Demo Workflow 1, 2, 3
8. Differentiation
9. Achievements
10. Limitations
11. Conclusion
12. Thank You

---

## Slide 4 — Context

**Section:** Context

**Content:**

**Context**

This section introduces why VSTEP preparation is important and why learners need a digital preparation platform.

---

## Slide 5 — Why VSTEP Matters

**Section:** Context

**Content:**

**Why VSTEP Matters**

- VSTEP is an important English proficiency requirement in Vietnam.
- It is used for university graduation requirements.
- It is required for postgraduate programs and career certification.
- The exam covers four skills: Listening, Reading, Writing, and Speaking.
- Learners need targeted preparation instead of only static materials.
- Writing and Speaking require detailed criterion-based feedback.

---

## Slide 6 — VSTEP Test Structure

**Section:** Context

**Content:**

**VSTEP Test Structure**

- Listening: 3 parts, 35 questions.
- Reading: 4 passages, 40 questions.
- Writing: Task 1 letter/email (minimum 120 words, ~20 minutes); Task 2 essay (minimum 250 words, ~40 minutes).
- Speaking: 3 parts assessed by rubric and speech-related signals.
- Listening and Reading can be marked by answer keys.
- Writing and Speaking need rubric-based assessment and detailed feedback.
- Internal band mapping: under 4.0 = below B1; 4.0-5.5 = B1; 6.0-8.0 = B2; 8.5-10.0 = C1.

---

## Slide 7 — Problems

**Section:** Problems

**Content:**

**Current Learner Problems**

- Scattered materials across PDFs, Word files, Facebook groups, Google Drive, and websites.
- Many mock tests are available, but learners receive limited guidance for improvement.
- Writing and Speaking feedback is often generic, slow, or not rubric-based.
- Learners do not clearly know their weak skills and weak criteria.
- Long-term progress tracking across skills is difficult.

---

## Slide 8 — Actors

**Section:** Actors

**Content:**

**System Actors**

- Learner: practices skills, takes mock exams, receives feedback, follows recommendations, and reviews vocabulary.
- Teacher: supports learners, follows bookings and schedules, and provides guidance when needed.
- Staff: manages courses, schedules, content, exams, and daily operations.
- Admin: manages users, roles, configuration, payments, promotions, exams, and analytics.

---

## Slide 9 — Main Features by Actors

**Section:** Main Features by Actors

**Content:**

**Main Features by Actors**

**Learner**

- Practice four skills and take mock tests.
- View scores, feedback, progress, and recommendations.
- Review vocabulary with spaced repetition.

**Teacher**

- View teaching schedule and learner bookings.
- Support learner progress and provide learning guidance.

**Staff**

- Manage courses, schedules, content, exams, and operations.

**Admin**

- Manage users, roles, system settings, payments, promotions, and analytics.

---

## Slide 10 — Learner Flow

**Section:** Main Features by Actors

**Content:**

**Learner Flow**

The learner flow follows this sequence:

1. Login
2. Practice / Mock Test
3. Assessment
4. Feedback
5. Recommendation
6. Review
7. Progress Tracking

This flow shows how the system connects practice, assessment, feedback, and continuous improvement.

---

## Slide 11 — System Architecture

**Section:** System Architecture

**Content:**

**System Architecture**

This section explains the main technical structure of the platform, including client applications, backend services, domain modules, external integrations, and data processing.

---

## Slide 12 — System Overview

**Section:** System Architecture

**Content:**

**System Overview**

- Client applications include Learner Web App, Mobile App, and Admin App.
- Backend API handles authentication, authorization, validation, business rules, and service workflows.
- Domain services include Practice & Exam, Assessment Engine, Learning, and Course & Payment.
- External integrations include AI Service, Speech Service, and PayOS.
- The backend connects client applications with domain services and external providers.

---

## Slide 13 — Backend and Data Processing

**Section:** System Architecture

**Content:**

**Backend and Data Processing**

- Backend follows the pattern: Controller -> FormRequest -> Service -> Model -> Resource.
- Business logic is handled in the service layer.
- Writing and Speaking assessment jobs are processed asynchronously.
- PostgreSQL stores users, profiles, practice sessions, exams, submissions, and assessment results.
- Redis and Horizon support background processing.
- Object storage keeps speaking audio and media files.

---

## Slide 14 — Technology Stack

**Section:** Technology

**Content:**

**Technology Stack**

- Backend: PHP 8.3, Laravel 13, Laravel Octane + FrankenPHP, Laravel Horizon, JWT Auth (php-open-source-saver/jwt-auth), Laravel AI 0.4.
- Database and Queue: PostgreSQL and Redis.
- Learner Web (frontend-v3): React 19.2, TypeScript 5.8, Vite 8, TanStack Query 5.99, TanStack Router 1.168, Tailwind CSS 4, Recharts 3.8.
- Admin Portal: React 19.2, TypeScript 5.8, Vite 8, TanStack Query 5.99, TanStack Router 1.168, Ant Design 6, Recharts 3.8.
- Mobile: Expo SDK 54, React Native 0.81, Expo Router 6, TanStack Query 5.62, Expo SecureStore, Expo Speech Recognition.
- External integrations: AI services, speech services, PayOS payment gateway, Google Sign-In, S3-compatible object storage.

---

## Slide 15 — CI/CD and Deployment

**Section:** Technology

**Content:**

**CI/CD and Deployment**

- GitHub Actions runs the deployment workflow.
- Application images are pushed to GitHub Container Registry.
- The system is deployed to a VPS.
- Traefik is used as the reverse proxy.
- Runtime services include Backend API, PostgreSQL, Redis/Horizon, and LanguageTool.

---

## Slide 16 — Demo Workflow 1: Practice Submission

**Section:** Demo Workflow 1, 2, 3

**Content:**

**Demo Workflow 1 — Practice Submission**

1. Learner logs in.
2. Learner selects a Writing or Speaking practice task.
3. Learner submits writing text or speaking audio.
4. Backend validates the submission and creates an assessment attempt.
5. Heavy assessment work is queued as a background job.

**Demo goal:** show how learner practice becomes structured assessment input.

---

## Slide 17 — Demo Workflow 2: Assessment Result / Mock Test Result

**Section:** Demo Workflow 1, 2, 3

**Content:**

**Demo Workflow 2 — Assessment Result / Mock Test Result**

- Learner views the overall band score (0-10 scale).
- Learner views per-criterion scores.
- Learner views rubric-driven strengths and improvement suggestions.
- Listening and Reading are scored synchronously by answer keys.
- Writing and Speaking are graded asynchronously by assessment jobs using layered scoring:
  1. Criterion sub-scores (Writing: 4 criteria; Speaking: 5 criteria) on a 0-10 scale.
  2. Writing equal-weight reference formula: TF 25% + Organization 25% + Grammar 25% + Vocabulary 25% (display only).
  3. Task-Fulfillment cap (TF <= avg(Grammar, Vocabulary, Organization) x tf_cap_ratio) to prevent content dominance.
  4. Content cap for abnormal cases: off-topic, too-short, copy-prompt, repeated/spam, non-English.
  5. Per-criterion sub-signals (punctuation under grammar, spelling under vocabulary, tone/register under task fulfillment).
- The result explains how the score was produced through rubric formulas, weights, and evidence.

**Speaking note:** the Speaking band uses deterministic scoring for Grammar, Vocabulary, Fluency, and Pronunciation, with Discourse Management modulated by an LLM content factor.

---

## Slide 18 — Writing Scoring Formula

**Section:** Demo Workflow 1, 2, 3

**Content:**

**Writing Scoring Formula**

**Equal-weight reference formula (display only):**
- Task Fulfillment: 25%
- Organization: 25%
- Grammar: 25%
- Vocabulary: 25%

**Layered scoring (code in apps/backend-v2/app/Services/Grading/):**
- Step 1: Per-criterion sub-scores (0-10 each) via WritingScoringFormula.
- Step 2: Task-Fulfillment cap - TF <= avg(grammar, vocabulary, organization) x tf_cap_ratio.
- Step 3: Weighted overall band from DB rubric criteria weights (GradingRubric::computeOverallBand).
- Step 4: Content cap for abnormal cases (off-topic, too-short, copy, spam, non-English) via ContentCapPolicy.

**Per-criterion sub-signals (configured in rubric DB, no fallback):**
- Grammar: punctuation error count.
- Vocabulary: spelling error count.
- Task Fulfillment: tone/register (Part 2 only).

**Final band:** 0-10, rounded to nearest 0.5. AI only supplies evidence and content relevance; the final band is computed deterministically in code.

---

## Slide 19 — Demo Workflow 3: Learning Path and Vocabulary Review

**Section:** Demo Workflow 1, 2, 3

**Content:**

**Demo Workflow 3 — Learning Path and Vocabulary Review**

- The system analyzes weak skills and weak criteria from assessment results.
- Learning Path covers 6 dimensions: vocabulary, grammar, writing, speaking, listening, reading.
- Weak-skill threshold: any skill band below 5.0 triggers a recommendation.
- Example: low Grammar score leads to grammar practice and related Writing tasks.
- Vocabulary review uses FSRS v6 spaced repetition (fields: difficulty, stability, lapses, due_at, last_review_at).
- States: new -> learning -> review -> (re)learning with Anki-style learning steps.
- Correct answer: stability grows, interval lengthens.
- Wrong answer: lapse counted, relearning steps triggered, interval shortens.

---

## Slide 20 — Demo Scenario

**Section:** Demo Workflow 1, 2, 3

**Content:**

**Demo Scenario**

The planned demo flow is:

1. Login as learner.
2. Submit Writing Task 2.
3. View overall score and criterion scores.
4. View feedback.
5. Check learning path.
6. Review vocabulary.

**Demo goal:** Practice -> Scoring -> Improvement.

---

## Slide 21 — Differentiation

**Section:** Differentiation

**Content:**

**Differentiation**

| Existing Test Websites | Our System |
|---|---|
| Test-focused | Practice + improvement-focused |
| Mostly answer-key scoring | Rubric/formula-based scoring for Writing/Speaking |
| Limited personalization | Skill-gap recommendation |
| Weak progress tracking | Progress dashboard |
| Limited feedback | Criterion scores + actionable feedback |

The system not only tells learners the result, but also explains weak areas and recommends what to practice next.

---

## Slide 22 — Achievements: Product

**Section:** Achievements

**Content:**

**Achievements — Product**

- Implemented a multi-client platform: Learner Web App, Mobile App, Admin App, and Backend API.
- Implemented authentication, profile, practice, mock tests, assessment, and progress tracking.
- Implemented vocabulary review, course support, booking, wallet/payment, notifications, and content management support.
- Implemented rubric-based Writing and Speaking assessment.
  - AI supports evidence extraction and content relevance only.
  - The final band is computed deterministically by the rubric formula in code (no AI scoring).
- Implemented asynchronous grading jobs and Docker-based deployment preparation.

---

## Slide 23 — Achievements: Validation and Delivery

**Section:** Achievements

**Content:**

**Achievements — Validation and Delivery**

- Assessment validation is separated into two independent groups.
- Benchmark (source-attributed Cambridge/FCE): 9/9 matched the expected CEFR band.
- Guardrail (VSTEP-style abnormal cases): 5/5 handled safely.
  - Off-topic.
  - Too-short.
  - Copied-prompt.
  - Repeated/spam.
  - Non-English.
- The two groups are intentionally separate: benchmark measures score-level consistency, guardrail proves the system does not over-score abnormal cases.
- Completed capstone reports, design documentation, testing documentation, user guide, final report, source code, and deployment package.

---

## Slide 24 — Limitations

**Section:** Limitations

**Content:**

**Limitations**

- The current system supports VSTEP B1-C1 format only.
- Automated Writing and Speaking scoring is a practice-support tool, not an official examiner replacement.
- The system depends on external AI and speech-processing services.
- Dynamic adaptive difficulty for all exercises is future work.
- Teacher-assigned individual modules are future work.
- Machine-learning predictive analytics and large-scale official validation are future work.

---

## Slide 25 — Conclusion

**Section:** Conclusion

**Content:**

**Conclusion**

The Adaptive VSTEP Preparation System helps learners answer three important questions:

1. What is my current level?
2. Which skills and criteria are weak?
3. What should I practice next?

The core value of the system is to connect four-skill practice, rubric-based feedback, personalized recommendations, vocabulary review, and progress tracking into one continuous improvement loop.

---

## Slide 26 — Thank You

**Section:** Thank You

**Content:**

**Thanks for listening!**

**Q&A**
