# Progress Tracking & Learning Path Specification

> **Phiên bản**: 1.0 · SP26SE145

## 1. Purpose

Định nghĩa cách hệ thống theo dõi tiến độ học tập và tạo lộ trình học tập (learning path) dựa trên dữ liệu bài làm. Spec này tập trung vào **quy tắc, dữ liệu, và tiêu chí chấp nhận** (không mô tả code/implementation).

## 2. Scope

- Áp dụng cho 4 skills: Listening, Reading, Writing, Speaking.
- Tính toán cho user đã đăng nhập (learner).
- Dữ liệu đầu vào đến từ submissions (practice) và exam sessions.
- Hỗ trợ mục tiêu theo level/band: A1, A2, B1, B2, C1.

## 3. Definitions

- **Valid attempt**: submission có kết quả hợp lệ và được phép dùng để tính progress.
- **Window N**: cửa sổ trượt gồm N attempts gần nhất theo từng skill.
- **Band**: A1/A2/B1/B2/C1.
- **Score scale**: thang 0-10 (một số view có thể normalize về 0-100 cho visualization).

## 4. Data Inputs

### 4.1 Per-attempt inputs (per submission)

Một attempt hợp lệ phải có:
- `skill` (listening/reading/writing/speaking)
- `score` (0-10)
- `band` (A1-C1)
- `createdAt`
- `status = COMPLETED`

### 4.2 Exclusions

Không đưa vào tính toán progress nếu:
- submission `status != COMPLETED`
- submission ở trạng thái `REVIEW_PENDING` (chưa có kết quả cuối cùng)
- `is_late = true` (late callback sau SLA)
- submission bị đánh dấu invalid (fraud/suspicious/manual exclude)

## 5. Score Normalization Rules

### 5.1 Canonical score

- Canonical internal score cho progress là **0-10**.
- Visualization có thể dùng `scoreNormalized = score * 10` (0-100).

### 5.2 Listening/Reading auto-grade

- Listening/Reading dùng auto-grade theo answer_key.
- Mapping từ `accuracy%` sang `score 0-10` là configurable.
- Minimum requirement: mapping phải **đơn điệu tăng** (accuracy cao hơn không được ra score thấp hơn).

## 6. Sliding Window (N=10)

### 6.1 Window selection

- Theo từng skill, lấy tối đa **10 attempts gần nhất** (mới nhất trước).
- Nếu < 3 attempts hợp lệ: trả về `insufficient_data` cho phần trend/ETA.

### 6.2 Metrics

Với mỗi skill:
- `windowAvg`: trung bình điểm (0-10)
- `windowStdDev`: độ lệch chuẩn (0-10)
- `trend`: improving/stable/declining/inconsistent

### 6.3 Trend classification

- Compute `delta = avg(last 3) - avg(previous 3)` nếu đủ dữ liệu.
- Rules:
  - `inconsistent` nếu `windowStdDev >= 1.5`
  - `improving` nếu `delta >= +0.5`
  - `declining` nếu `delta <= -0.5`
  - `stable` trong các trường hợp còn lại

## 7. Spider Chart (Visualization Contract)

Dữ liệu spider chart phải gồm:
- `skills`: 4 skill keys theo thứ tự cố định
- `current`: 4 giá trị normalized 0-100 từ `windowAvg`
- `previous`: baseline 7 ngày trước (nếu có) theo cùng cách tính
- `target`: 4 giá trị normalized theo goal (nếu user set goal)
- `trend`: nhãn trend per skill
- `confidence`: high/medium/low theo độ đầy đủ dữ liệu (>=10 attempts: high, 6-9: medium, 3-5: low)

Spec không bắt buộc JSON schema cố định; chỉ yêu cầu các trường logic này tồn tại.

## 8. Overall Level Derivation

### 8.1 Per-skill band

Per-skill band ưu tiên lấy từ kết quả grading gần nhất (writing/speaking) hoặc mapping score→band (listening/reading).

### 8.2 Overall band

Quy tắc tổng quát:
- `overallBand = min(bandListening, bandReading, bandWriting, bandSpeaking)`
- Nếu thiếu dữ liệu của skill nào đó, overall band phải giảm về mức thấp nhất trong các skill còn lại và đánh dấu `low_confidence`.

Mục tiêu của rule này là tránh hiển thị overall band "ảo" khi có một kỹ năng yếu rõ rệt.

## 9. ETA (Time-to-Goal) Heuristic

ETA chỉ là heuristic và phải trả về `unknown` nếu dữ liệu không đủ.

### 9.1 When ETA is available

- User có goal (`targetLevel` hoặc `targetBand`).
- Mỗi skill có >= 6 attempts hợp lệ.

### 9.2 ETA computation

- Tính `rate` theo từng skill: thay đổi `windowAvg` theo tuần (so sánh tuần hiện tại vs tuần trước).
- Ước tính số tuần cần để mỗi skill đạt `targetBand`.
- ETA cuối cùng là **max(ETA per skill)** (kỹ năng chậm nhất quyết định).

## 10. Learning Path Generation

### 10.1 Prioritization

- Xác định `weakestSkill` = skill có `windowAvg` thấp nhất.
- Nếu có 2 skill gần nhau (chênh <= 0.3 điểm), phân bổ ưu tiên cho cả hai.

### 10.2 Allocation rules (weekly plan)

- Tối thiểu 1 session/tuần cho mỗi skill để tránh "bỏ quên".
- Phần còn lại phân bổ theo `gapToTarget` của từng skill.

### 10.3 Content selection rules

- Dựa trên metadata của questions (topic/level/type).
- Writing/Speaking: ưu tiên theo criteria yếu nhất (từ feedback/criteria scores).
- Listening/Reading: ưu tiên theo dạng câu hỏi user sai nhiều (mcq/matching/fill).

## 11. Update Triggers

- On submission `completed`: recompute skill window + trend.
- On exam session `completed`: recompute cả 4 skills.
- Nightly job: recompute ETA + learning path.

## 12. Failure Modes

- **Insufficient data**: trả về progress tối giản (latest score/band), không có trend/ETA.
- **Outlier scores**: nếu điểm chênh quá lớn giữa 2 attempts liên tiếp, đánh dấu `inconsistent` và không đổi learning path ngay.
- **Goal missing**: không tính ETA, vẫn tạo learning path dựa trên weakest skill.

## 13. Acceptance Criteria

- Progress chỉ tính từ attempts hợp lệ (COMPLETED, không late, không excluded).
- Trend classification đúng theo rule delta/stddev.
- Spider chart có đủ trường logic: current/previous/target/trend/confidence.
- Overall band không vượt quá band thấp nhất trong 4 skills.
- ETA trả về `unknown` khi không đủ dữ liệu; khi đủ dữ liệu, ETA phản ánh skill chậm nhất.
- Learning path luôn có tối thiểu 1 session/skill/tuần.

## 14. Cross-references

- Submission states và exclusions (late result) → `submission-lifecycle.md`
- Data entities → `../30-data/database-schema.md` (`submissions`, `user_progress`, `user_goals`)
- Spider chart & progress concept → `docs/capstone/diagrams/flow-diagrams.vi.md` Section 9
