# Nội dung trình bày Capstone VSTEP — Tiếng Việt

## Slide 1 — Tiêu đề

**Phần:** Mở đầu

**Nội dung:**

**An Adaptive VSTEP Preparation System with Comprehensive Skill Assessment and Personalized Learning Support**

- Mã đề tài: SP26SE146
- Nhóm: GSP26SE63
- Loại phần mềm: Web Application + Mobile App + Admin Portal
- GVHD học thuật: Lâm Hữu Khánh Phương
- GVHD doanh nghiệp: Trần Trọng Huỳnh

---

## Slide 2 — Thành viên nhóm

**Phần:** Mở đầu

**Nội dung:**

**Team Members**

- Hoàng Văn Anh Nghĩa — SE172605 — Trưởng nhóm / Backend Developer
- Nguyễn Minh Khôi — SE172625 — Mobile Developer
- Nguyễn Nhật Phát — SE172607 — Frontend Developer
- Nguyễn Trần Tấn Phát — SE173198 — Frontend Developer

---

## Slide 3 — Mục lục

**Phần:** Mở đầu

**Nội dung:**

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

**Phần:** Context

**Nội dung:**

**Context**

Phần này giới thiệu lý do vì sao việc luyện thi VSTEP quan trọng và vì sao người học cần một nền tảng số để hỗ trợ luyện tập, đánh giá và cải thiện năng lực.

---

## Slide 5 — Vì sao VSTEP quan trọng?

**Phần:** Context

**Nội dung:**

**Why VSTEP Matters**

- VSTEP là một yêu cầu năng lực tiếng Anh quan trọng tại Việt Nam.
- VSTEP được sử dụng cho yêu cầu tốt nghiệp đại học.
- VSTEP cũng được dùng cho chương trình sau đại học và chứng chỉ nghề nghiệp.
- Bài thi bao gồm bốn kỹ năng: Listening, Reading, Writing và Speaking.
- Người học cần một phương pháp luyện tập có định hướng thay vì chỉ dùng tài liệu tĩnh.
- Writing và Speaking cần phản hồi chi tiết theo tiêu chí chấm điểm.

---

## Slide 6 — Cấu trúc bài thi VSTEP

**Phần:** Context

**Nội dung:**

**VSTEP Test Structure**

- Listening: 3 phần, 35 câu hỏi.
- Reading: 4 bài đọc, 40 câu hỏi.
- Writing: Task 1 thư/email (tối thiểu 120 từ, khoảng 20 phút); Task 2 essay (tối thiểu 250 từ, khoảng 40 phút).
- Speaking: 3 phần, được đánh giá theo rubric và tín hiệu giọng nói.
- Listening và Reading có thể chấm tự động bằng đáp án.
- Writing và Speaking cần đánh giá theo rubric và phản hồi chi tiết.
- Quy đổi band nội bộ: dưới 4.0 = chưa đạt B1; 4.0-5.5 = B1; 6.0-8.0 = B2; 8.5-10.0 = C1.

---

## Slide 7 — Problems

**Phần:** Problems

**Nội dung:**

**Current Learner Problems**

- Tài liệu học bị phân tán ở PDF, Word, Facebook, Google Drive và nhiều website khác nhau.
- Có nhiều mock test, nhưng người học nhận được ít hướng dẫn để cải thiện.
- Phản hồi cho Writing và Speaking thường chung chung, chậm hoặc không dựa trên rubric.
- Người học không biết rõ kỹ năng hoặc tiêu chí nào đang yếu.
- Việc theo dõi tiến bộ dài hạn theo từng kỹ năng còn khó khăn.

---

## Slide 8 — Actors

**Phần:** Actors

**Nội dung:**

**System Actors**

- Learner: luyện kỹ năng, làm mock test, nhận phản hồi, theo dõi gợi ý học tập và ôn từ vựng.
- Teacher: hỗ trợ người học, theo dõi lịch đặt/lịch dạy và đưa ra định hướng khi cần.
- Staff: quản lý khóa học, lịch học, nội dung, đề thi và hoạt động vận hành.
- Admin: quản lý người dùng, vai trò, cấu hình hệ thống, thanh toán, khuyến mãi, đề thi và thống kê.

---

## Slide 9 — Main Features by Actors

**Phần:** Main Features by Actors

**Nội dung:**

**Main Features by Actors**

**Learner**

- Luyện tập bốn kỹ năng và làm mock test.
- Xem điểm số, phản hồi, tiến độ và gợi ý học tập.
- Ôn từ vựng bằng spaced repetition.

**Teacher**

- Xem lịch giảng dạy và lịch đặt của học viên.
- Hỗ trợ tiến độ học tập và đưa ra định hướng học tập.

**Staff**

- Quản lý khóa học, lịch học, nội dung, đề thi và vận hành.

**Admin**

- Quản lý người dùng, vai trò, cấu hình hệ thống, thanh toán, khuyến mãi và thống kê.

---

## Slide 10 — Learner Flow

**Phần:** Main Features by Actors

**Nội dung:**

**Learner Flow**

Luồng học tập của người học gồm:

1. Login
2. Practice / Mock Test
3. Assessment
4. Feedback
5. Recommendation
6. Review
7. Progress Tracking

Luồng này cho thấy hệ thống kết nối quá trình luyện tập, đánh giá, phản hồi và cải thiện liên tục.

---

## Slide 11 — System Architecture

**Phần:** System Architecture

**Nội dung:**

**System Architecture**

Phần này trình bày kiến trúc kỹ thuật chính của hệ thống, bao gồm các ứng dụng client, backend services, domain modules, external integrations và xử lý dữ liệu.

---

## Slide 12 — System Overview

**Phần:** System Architecture

**Nội dung:**

**System Overview**

- Các ứng dụng client gồm Learner Web App, Mobile App và Admin App.
- Backend API xử lý xác thực, phân quyền, kiểm tra dữ liệu, luật nghiệp vụ và service workflows.
- Domain services gồm Practice & Exam, Assessment Engine, Learning và Course & Payment.
- External integrations gồm AI Service, Speech Service và PayOS.
- Backend kết nối các client applications với domain services và external providers.

---

## Slide 13 — Backend and Data Processing

**Phần:** System Architecture

**Nội dung:**

**Backend and Data Processing**

- Backend tuân theo pattern: Controller -> FormRequest -> Service -> Model -> Resource.
- Business logic được xử lý trong service layer.
- Các tác vụ đánh giá Writing và Speaking được xử lý bất đồng bộ.
- PostgreSQL lưu users, profiles, practice sessions, exams, submissions và assessment results.
- Redis và Horizon hỗ trợ xử lý background jobs.
- Object storage lưu audio Speaking và các media files.

---

## Slide 14 — Technology Stack

**Phần:** Technology

**Nội dung:**

**Technology Stack**

- Backend: PHP 8.3, Laravel 13, Laravel Octane + FrankenPHP, Laravel Horizon, JWT Auth (php-open-source-saver/jwt-auth), Laravel AI 0.4.
- Database và Queue: PostgreSQL và Redis.
- Learner Web (frontend-v3): React 19.2, TypeScript 5.8, Vite 8, TanStack Query 5.99, TanStack Router 1.168, Tailwind CSS 4, Recharts 3.8.
- Admin Portal: React 19.2, TypeScript 5.8, Vite 8, TanStack Query 5.99, TanStack Router 1.168, Ant Design 6, Recharts 3.8.
- Mobile: Expo SDK 54, React Native 0.81, Expo Router 6, TanStack Query 5.62, Expo SecureStore, Expo Speech Recognition.
- External integrations: dịch vụ AI, dịch vụ giọng nói, cổng thanh toán PayOS, Google Sign-In, lưu trữ đối tượng tương thích S3.

---

## Slide 15 — CI/CD and Deployment

**Phần:** Technology

**Nội dung:**

**CI/CD and Deployment**

- GitHub Actions chạy quy trình triển khai.
- Application images được đẩy lên GitHub Container Registry.
- Hệ thống được triển khai lên VPS.
- Traefik được dùng làm reverse proxy.
- Runtime services gồm Backend API, PostgreSQL, Redis/Horizon và LanguageTool.

---

## Slide 16 — Demo Workflow 1: Practice Submission

**Phần:** Demo Workflow 1, 2, 3

**Nội dung:**

**Demo Workflow 1 — Practice Submission**

1. Người học đăng nhập.
2. Người học chọn bài luyện Writing hoặc Speaking.
3. Người học nộp bài viết hoặc audio Speaking.
4. Backend kiểm tra dữ liệu và tạo assessment attempt.
5. Tác vụ đánh giá nặng được đưa vào background job.

**Mục tiêu demo:** cho thấy cách bài luyện của người học được chuyển thành dữ liệu đầu vào có cấu trúc cho quá trình đánh giá.

---

## Slide 17 — Demo Workflow 2: Assessment Result / Mock Test Result

**Phần:** Demo Workflow 1, 2, 3

**Nội dung:**

**Demo Workflow 2 — Assessment Result / Mock Test Result**

- Người học xem overall band score (thang 0-10).
- Người học xem điểm theo từng tiêu chí.
- Người học xem điểm mạnh và gợi ý cải thiện do rubric sinh ra.
- Listening và Reading được chấm đồng bộ bằng đáp án.
- Writing và Speaking được chấm bất đồng bộ bằng assessment jobs theo cơ chế nhiều lớp:
  1. Điểm thành phần theo tiêu chí (Writing: 4 tiêu chí; Speaking: 5 tiêu chí) trên thang 0-10.
  2. Công thức tham chiếu trọng số đều cho Writing: TF 25% + Organization 25% + Grammar 25% + Vocabulary 25% (chỉ hiển thị).
  3. Giới hạn Task-Fulfillment (TF <= trung bình(Grammar, Vocabulary, Organization) x tf_cap_ratio) để tránh nội dung lấn át.
  4. Giới hạn nội dung cho ca bất thường: lạc đề, quá ngắn, copy đề, lặp/spam, không phải tiếng Anh.
  5. Tín hiệu phụ theo tiêu chí (punctuation cho grammar, spelling cho vocabulary, tone/register cho task fulfillment).
- Kết quả giải thích cách điểm được tạo ra thông qua rubric formulas, trọng số và bằng chứng.

**Lưu ý Speaking:** band Speaking dùng chấm tất định cho Grammar, Vocabulary, Fluency và Pronunciation; Discourse Management được điều chỉnh bởi content factor từ LLM.

---

## Slide 18 — Công thức chấm điểm Writing

**Phần:** Demo Workflow 1, 2, 3

**Nội dung:**

**Writing Scoring Formula**

**Công thức tham chiếu trọng số đều (chỉ hiển thị):**
- Task Fulfillment: 25%
- Organization: 25%
- Grammar: 25%
- Vocabulary: 25%

**Cơ chế chấm nhiều lớp (code trong apps/backend-v2/app/Services/Grading/):**
- Bước 1: Điểm thành phần theo tiêu chí (0-10 mỗi cái) qua WritingScoringFormula.
- Bước 2: Giới hạn Task-Fulfillment - TF <= trung bình(grammar, vocabulary, organization) x tf_cap_ratio.
- Bước 3: Band tổng có trọng số từ DB rubric (GradingRubric::computeOverallBand).
- Bước 4: Giới hạn nội dung cho ca bất thường (lạc đề, quá ngắn, copy, spam, không phải tiếng Anh) qua ContentCapPolicy.

**Tín hiệu phụ theo tiêu chí (cấu hình trong DB rubric, không có fallback):**
- Grammar: số lỗi punctuation.
- Vocabulary: số lỗi spelling.
- Task Fulfillment: tone/register (chỉ Part 2).

**Band cuối:** 0-10, làm tròn đến 0.5 gần nhất. AI chỉ cung cấp bằng chứng và content relevance; band cuối được code tính tất định.

---

## Slide 19 — Demo Workflow 3: Learning Path and Vocabulary Review

**Phần:** Demo Workflow 1, 2, 3

**Nội dung:**

**Demo Workflow 3 — Learning Path and Vocabulary Review**

- Hệ thống phân tích kỹ năng yếu và tiêu chí yếu từ kết quả đánh giá.
- Learning Path bao phủ 6 chiều: vocabulary, grammar, writing, speaking, listening, reading.
- Ngưỡng kỹ năng yếu: band dưới 5.0 sẽ kích hoạt gợi ý.
- Ví dụ: Grammar score thấp dẫn đến đề xuất luyện grammar và Writing tasks liên quan.
- Ôn từ vựng dùng FSRS v6 spaced repetition (các trường: difficulty, stability, lapses, due_at, last_review_at).
- Trạng thái: new -> learning -> review -> (re)learning với các bước học kiểu Anki.
- Trả lời đúng: stability tăng, interval giãn ra.
- Trả lời sai: đếm lapse, kích hoạt relearning steps, interval rút ngắn.

---

## Slide 20 — Demo Scenario

**Phần:** Demo Workflow 1, 2, 3

**Nội dung:**

**Demo Scenario**

Luồng demo dự kiến:

1. Login as learner.
2. Submit Writing Task 2.
3. View overall score and criterion scores.
4. View feedback.
5. Check learning path.
6. Review vocabulary.

**Mục tiêu demo:** Practice -> Scoring -> Improvement.

---

## Slide 21 — Differentiation

**Phần:** Differentiation

**Nội dung:**

**Differentiation**

| Existing Test Websites | Our System |
|---|---|
| Test-focused | Practice + improvement-focused |
| Mostly answer-key scoring | Rubric/formula-based scoring for Writing/Speaking |
| Limited personalization | Skill-gap recommendation |
| Weak progress tracking | Progress dashboard |
| Limited feedback | Criterion scores + actionable feedback |

Hệ thống không chỉ cho người học biết kết quả, mà còn giải thích điểm yếu và đề xuất nội dung cần luyện tiếp theo.

---

## Slide 22 — Achievements: Product

**Phần:** Achievements

**Nội dung:**

**Achievements — Product**

- Đã triển khai nền tảng multi-client gồm Learner Web App, Mobile App, Admin App và Backend API.
- Đã triển khai authentication, profile, practice, mock tests, assessment và progress tracking.
- Đã triển khai vocabulary review, course support, booking, wallet/payment, notifications và content management support.
- Đã triển khai rubric-based Writing and Speaking assessment.
  - AI chỉ hỗ trợ trích bằng chứng và content relevance.
  - Band cuối do code tính tất định theo công thức rubric (AI không chấm điểm cuối).
- Đã triển khai asynchronous grading jobs và chuẩn bị Docker-based deployment.

---

## Slide 23 — Achievements: Validation and Delivery

**Phần:** Achievements

**Nội dung:**

**Achievements — Validation and Delivery**

- Assessment validation được tách thành hai nhóm độc lập.
- Benchmark (Cambridge/FCE có nguồn): 9/9 khớp với band CEFR dự kiến.
- Guardrail (ca bất thường kiểu VSTEP): 5/5 xử lý an toàn.
  - Lạc đề.
  - Quá ngắn.
  - Copy đề.
  - Lặp/spam.
  - Không phải tiếng Anh.
- Hai nhóm cố ý tách riêng: benchmark đo tính nhất quán band điểm, guardrail chứng minh hệ thống không chấm cao cho ca bất thường.
- Đã hoàn thành capstone reports, design documentation, testing documentation, user guide, final report, source code và deployment package.

---

## Slide 24 — Limitations

**Phần:** Limitations

**Nội dung:**

**Limitations**

- Hệ thống hiện tại chỉ hỗ trợ định dạng VSTEP B1-C1.
- Chấm điểm tự động cho Writing và Speaking là công cụ hỗ trợ luyện tập, không thay thế giám khảo chính thức.
- Hệ thống phụ thuộc vào external AI và speech-processing services.
- Dynamic adaptive difficulty cho toàn bộ bài luyện là hướng phát triển tương lai.
- Teacher-assigned individual modules là hướng phát triển tương lai.
- Machine-learning predictive analytics và large-scale official validation là hướng phát triển tương lai.

---

## Slide 25 — Conclusion

**Phần:** Conclusion

**Nội dung:**

**Conclusion**

Adaptive VSTEP Preparation System giúp người học trả lời ba câu hỏi quan trọng:

1. Trình độ hiện tại của tôi là gì?
2. Kỹ năng và tiêu chí nào của tôi đang yếu?
3. Tôi nên luyện tập gì tiếp theo?

Giá trị cốt lõi của hệ thống là kết nối luyện tập bốn kỹ năng, phản hồi theo rubric, gợi ý học tập cá nhân hóa, ôn từ vựng và theo dõi tiến độ thành một vòng cải thiện liên tục.

---

## Slide 26 — Thank You

**Phần:** Thank You

**Nội dung:**

**Thanks for listening!**

**Q&A**
