# Hybrid Grading & Confidence Score Specification

> **Phiên bản**: 1.0 · SP26SE145

## 1. Mục đích

Định nghĩa cơ chế **chấm điểm lai (AI + Human)** cho Writing/Speaking và cách tính **Confidence Score (0-100)** để quyết định:

- Auto-grade và trả kết quả ngay
- Hay đưa vào hàng chờ human review với mức độ ưu tiên

Spec này tập trung vào **quy tắc, contracts, và tiêu chí chấp nhận**, không mô tả code/implementation.

---

## 2. Phạm vi

- Skills: **Writing** và **Speaking**.
- Listening/Reading: auto-grade theo answer_key, không thuộc phạm vi spec này.
- Confidence Score dùng cho:
  - Routing auto vs human
  - Audit flagging
  - Analytics về reliability của AI

---

## 3. Định nghĩa

- **AI result**: kết quả chấm từ pipeline AI (LLM/STT + rubric scorer).
- **Human result**: kết quả chấm từ instructor theo rubric.
- **Final result**: kết quả cuối cùng hiển thị cho learner.
- **Confidence Score**: số nguyên 0-100 thể hiện mức tin cậy vào AI result.

---

## 4. Output Contracts (Result Shape)

Kết quả grading (dù AI hay human) phải có tối thiểu:

- `overallScore`: 0-10
- `band`: A1/A2/B1/B2/C1
- `criteriaScores`: map tiêu chí → điểm + nhận xét
- `feedback`: strengths/weaknesses/suggestions
- `confidenceScore`: 0-100
- `reviewRequired`: boolean
- `reviewPriority`: `Low` | `Medium` | `High` | `Critical` (chỉ khi reviewRequired=true)
- `gradingMode`: `auto` | `human` | `hybrid`
- `auditFlag`: boolean (đánh dấu cần audit)

Nếu có human review, Final result phải lưu cả:

- `ai`: AI result (snapshot)
- `human`: Human result (snapshot)
- `final`: Final result (derived)

---

## 5. Inputs & Rubric Requirements

### 5.1 Writing

Input tối thiểu: `text`, `taskNumber` (1/2), `questionId`.

AI/Human đều chấm theo rubric VSTEP tối thiểu gồm 4 tiêu chí:

- Task Achievement
- Coherence & Cohesion
- Lexical Resource
- Grammatical Range & Accuracy

### 5.2 Speaking

Input tối thiểu: `audioUrl`, `durationSeconds`, `questionId` (và `partNumber` nếu có).

Yêu cầu tối thiểu: tạo transcript (để instructor review), và chấm theo rubric tương đương (fluency/pronunciation/content/vocabulary).

---

## 6. Confidence Score

### 6.1 Công thức tổng quát

ConfidenceScore = clamp(0, 100, sum(Factor_i * Weight_i))

Default weights:

- Model Consistency: 30%
- Rule Validation: 25%
- Content Similarity: 25%
- Length Heuristic: 20%

**Missing factors**: nếu một factor không khả dụng, bỏ factor đó và **redistribute weight theo tỷ lệ** giữa các factor còn lại.

### 6.2 Factor definitions

#### A. Model Consistency (30%)

Mục tiêu: đo độ ổn định của AI grading.

- Chạy grading bằng LLM **N lần** (default N=3).
- Lấy `overallScore` của mỗi lần.
- Tính `stdDev` trên thang 0-10.
- Convert sang score 0-100 theo rule:
  - `score = 100 - (stdDev * 20)`
  - Clamp vào 0-100

#### B. Rule Validation (25%)

Mục tiêu: đảm bảo input tuân thủ constraints để AI grading có ý nghĩa.

Chấm theo checklist 0-100, chia thành 4 tiêu chí mỗi tiêu chí 25 điểm:

- Word count trong range hợp lệ theo task/level
- Format compliance (email/essay structure, required parts)
- Rubric coverage (đủ nội dung trả lời yêu cầu)
- Time limit compliance (nếu có tracking)

#### C. Content Similarity (25%)

Mục tiêu: phát hiện template/copy.

- Tính cosine similarity giữa bài làm và tập template/known patterns.
- Convert: `score = (1 - similarity) * 100` (similarity càng thấp → score càng cao)

#### D. Length Heuristic (20%)

Mục tiêu: phát hiện bài quá ngắn/quá dài hoặc cấu trúc bất thường.

Chấm 0-100, chia thành 4 tiêu chí mỗi tiêu chí 25 điểm:

- Sentence count hợp lý
- Paragraph structure hợp lệ
- Vocabulary density nằm trong range
- Complexity score hợp lý

---

## 7. Confidence Thresholds & Routing

| Confidence | Action | Human Review Priority |
|------------|--------|----------------------|
| 90-100 | Auto-grade | None |
| 85-89 | Auto-grade + auditFlag=true | Low |
| 70-84 | Human review required | Medium |
| 50-69 | Human review required | High |
| < 50 | Human review required + AI warning | Critical |
| **Random Spot Check** | Auto-grade + Force Review (5-10% rate) | N/A |

**Spot Check Rule**:
- Mỗi ngày, hệ thống **ngẫu nhiên chọn 5-10%** các bài có `confidenceScore >= 85` để đẩy vào hàng đợi Human Review (reviewPriority = Medium).
- Mục đích: Đảm bảo chất lượng AI theo thời gian thực và phát hiện model drift.
- Spot check được ghi nhận trong audit log với `auditFlag=SPOT_CHECK`.

**Rule**:

- `confidenceScore >= 85` → có thể publish kết quả ngay (auto).
- `confidenceScore < 85` → `reviewRequired=true`, đưa vào hàng chờ instructor với `reviewPriority` theo bảng.

**Tích hợp với submission status (Main App)**:

- Nếu `reviewRequired=false`: Main App có thể set submission status = `COMPLETED`.
- Nếu `reviewRequired=true`: Main App set submission status = `REVIEW_REQUIRED` và chỉ hiển thị trạng thái “đang chờ chấm thủ công”; không coi đây là kết quả cuối cùng.

---

## 8. Human Review

### 8.1 Input cho instructor

Instructor phải thấy:

- Câu hỏi + rubric
- Bài làm (text hoặc audio + transcript)
- AI result (overall + criteria + feedback) và confidence score
- Các signals (template similarity, rule violations) nếu có

### 8.2 Output của human review

Human result phải theo cùng result shape (overallScore, band, criteriaScores, feedback).

### 8.3 Final score aggregation

Định nghĩa “agree” để quyết định weighted vs override:

- `scoreDiff = abs(ai.overallScore - human.overallScore)`
- `bandStepDiff = abs(bandIndex(ai.band) - bandIndex(human.band))`
  - bandIndex: A1=1, A2=2, B1=3, B2=4, C1=5

Rules:

- Nếu `scoreDiff <= 0.5` **và** `bandStepDiff <= 1`:
  - `final.overallScore = ai*0.4 + human*0.6`
  - `final.band` suy ra từ `final.overallScore` theo mapping hệ thống
  - `gradingMode = hybrid`
- Ngược lại:
  - `final = human` (human overrides)
  - `gradingMode = human`
  - `auditFlag = true` và ghi nhận “discrepancy” cho model analysis

---

## 9. Failure & Safety Rules

- Nếu STT fail (speaking): retry theo policy (xem `../40-platform/reliability.md`); nếu hết retry → ERROR.
- Nếu LLM provider 429/5xx: retry/backoff + circuit breaker (xem `../40-platform/reliability.md`).
- Nếu Content Similarity unavailable: bỏ factor và redistribute weight (không fail job).
- Nếu phát hiện gian lận rõ rệt (high similarity + rule violations nặng):
  - vẫn tạo result nhưng phải `auditFlag=true` và ưu tiên human review (Critical).

---

## 10. Acceptance Criteria

- Confidence score luôn nằm trong 0-100 và stable theo công thức/weights.
- Missing factor không làm job fail; weights được redistribute nhất quán.
- Routing theo đúng bảng threshold.
- Human review tạo ra final result theo rule agree/override.
- Mọi quyết định (routing, override, auditFlag) có thể audit từ dữ liệu lưu trữ.

---

## 11. Cross-references

- Confidence overview diagram → `docs/capstone/diagrams/flow-diagrams.vi.md` Section 5
- Queue events (progress/completed/error) → `../10-contracts/queue-contracts.md`
- Retry/DLQ/circuit breaker → `../40-platform/reliability.md`
- Submission lifecycle (late result exclusion) → `submission-lifecycle.md`
