# Nội dung trình bày Capstone VSTEP — Tiếng Việt

Định hướng chỉnh sửa theo góp ý: nói nhanh phần bối cảnh quen thuộc, làm rõ vấn đề thực tế, nhấn mạnh cơ chế chấm điểm do code/formula kiểm soát, không để AI quyết định điểm cuối, để thuật toán Anki/FSRS ở phần "See detail", và trình bày demo workflow bằng diagram.

---

## Slide 1 — Tiêu đề

**Phần:** Mở đầu

**Nội dung:**

**An Adaptive VSTEP Preparation System with Comprehensive Skill Assessment and Personalized Learning Support**

- Tên tiếng Việt: Hệ thống luyện thi VSTEP thích ứng với đánh giá toàn diện kỹ năng và hỗ trợ học tập cá nhân hóa
- Mã đề tài: SP26SE145
- Nhóm: GSP26SE63
- Loại phần mềm: Web Application + Mobile App

**Lời nói ngắn:**

Kính chào hội đồng. Nhóm em xin trình bày hệ thống luyện thi VSTEP thích ứng, tập trung vào đánh giá bốn kỹ năng, phản hồi nhanh và gợi ý học tập cá nhân hóa.

---

## Slide 2 — Thành viên nhóm

**Phần:** Mở đầu

**Nội dung:**

- Hoàng Văn Anh Nghĩa — SE172605 — Team Leader
- Nguyễn Minh Khôi — SE172625 — Developer
- Nguyễn Nhật Phát — SE172607 — Developer
- Nguyễn Trần Tấn Phát — SE173198 — Developer

**Lời nói ngắn:**

Đây là các thành viên tham gia phát triển hệ thống. Sau phần giới thiệu nhanh, nhóm em xin đi thẳng vào bối cảnh, vấn đề, giải pháp và demo.

---

## Slide 3 — Agenda và chiến lược trình bày

**Phần:** Mở đầu

**Nội dung:**

1. VSTEP context và cấu trúc đề thi
2. Vấn đề hiện tại của người học
3. Giải pháp và tính năng chính
4. Cơ chế chấm điểm Writing/Speaking
5. Anki/Spaced Repetition cho từ vựng
6. Kiến trúc, công nghệ và demo
7. Kết quả, giới hạn và kết luận

**Lời nói ngắn:**

Do thời gian bảo vệ có giới hạn, nhóm em sẽ trình bày ngắn các phần lý thuyết quen thuộc và tập trung nhiều hơn vào cơ chế chấm điểm cùng demo workflow diagram.

---

## Slide 4 — Context: Vì sao VSTEP quan trọng?

**Phần:** Context

**Nội dung:**

- VSTEP là kỳ thi đánh giá năng lực tiếng Anh phổ biến tại Việt Nam.
- Được dùng cho đầu ra của một số trường đại học.
- Được dùng cho đầu vào/điều kiện của một số chương trình sau đại học.
- Được dùng cho nhu cầu chứng chỉ và phát triển nghề nghiệp.
- Người học cần chuẩn bị đồng thời bốn kỹ năng: Listening, Reading, Writing, Speaking.

**Lời nói ngắn:**

VSTEP không chỉ là một bài thi tiếng Anh thông thường mà còn liên quan trực tiếp đến tốt nghiệp, học sau đại học và chứng chỉ nghề nghiệp. Vì vậy nhu cầu luyện thi VSTEP là thực tế và có số lượng người học ổn định.

---

## Slide 5 — Cấu trúc đề thi VSTEP và thang điểm

**Phần:** Context

**Nội dung:**

| Kỹ năng | Cấu trúc tổng quan | Cách chấm trong hệ thống |
|---|---|---|
| Listening | Nghe và chọn đáp án | Chấm tự động bằng answer key |
| Reading | Đọc hiểu, MCQ | Chấm tự động bằng answer key |
| Writing | Task 1 thư/email, Task 2 essay | Chấm theo rubric/formula |
| Speaking | 3 phần nói | Chấm theo rubric/formula + speech signals |

- Band nội bộ: thang 0-10, làm tròn 0.5.
- Mục tiêu slide: giới thiệu nhanh, không đi quá sâu vào học thuật.

**Lời nói ngắn:**

VSTEP gồm bốn kỹ năng. Với Listening và Reading, hệ thống có thể chấm trực tiếp bằng đáp án. Với Writing và Speaking, điểm cần dựa trên tiêu chí và công thức chấm, nên đây là phần nhóm em tập trung xử lý kỹ hơn.

---

## Slide 6 — Problem: Thực trạng luyện thi hiện nay

**Phần:** Problems

**Nội dung:**

- Nhiều trung tâm/lớp luyện thi chủ yếu bán khóa học và tài liệu.
- Tài liệu thường phân tán: file Word, PDF, bài đăng Facebook, Google Drive.
- Người học luyện đề nhiều nhưng thiếu lộ trình cải thiện kỹ năng.
- Writing/Speaking thường thiếu phản hồi nhanh, chi tiết và nhất quán theo tiêu chí.
- Người học khó biết: mình yếu kỹ năng nào, tiêu chí nào, nên học gì tiếp theo.

**Lời nói ngắn:**

Vấn đề chính không phải là thiếu tài liệu, mà là thiếu một hệ thống có cấu trúc. Người học có thể làm rất nhiều đề, nhưng sau đó vẫn không biết mình yếu ở đâu và cần luyện gì để cải thiện.

---

## Slide 7 — Product Positioning: Giải pháp của nhóm

**Phần:** Solution

**Nội dung:**

Hệ thống của nhóm hướng đến một vòng học tập liên tục:

**Practice -> Scoring -> Feedback -> Recommendation -> Review -> Progress Tracking**

- Luyện tập bốn kỹ năng theo định dạng VSTEP.
- Đánh giá Writing/Speaking bằng rubric và công thức do hệ thống kiểm soát.
- AI hỗ trợ trích xuất bằng chứng và tạo feedback, không quyết định điểm cuối.
- Gợi ý học tập theo skill gap.
- Ôn từ vựng bằng spaced repetition.
- Theo dõi tiến độ trực quan.

**Lời nói ngắn:**

Điểm khác biệt của hệ thống là không dừng ở việc làm đề và xem điểm. Hệ thống biến kết quả thành phản hồi, gợi ý học tập và theo dõi tiến bộ để người học có hướng cải thiện rõ ràng.

---

## Slide 8 — Actors

**Phần:** Actors

**Nội dung:**

- **Learner:** luyện tập, làm mock test, xem điểm, feedback, learning path và ôn từ vựng.
- **Teacher/Instructor:** theo dõi, hỗ trợ định hướng học tập, quản lý lịch/session khi cần.
- **Staff:** quản lý nội dung học tập, đề thi, khóa học và vận hành.
- **Admin:** quản lý người dùng, vai trò, cấu hình, thanh toán/khuyến mãi và thống kê.

**Lời nói ngắn:**

Learner là actor trung tâm. Các actor còn lại hỗ trợ vận hành, quản lý nội dung và hỗ trợ quá trình học tập.

---

## Slide 9 — Main Features by Actors

**Phần:** Main Features

**Nội dung:**

| Actor | Chức năng chính |
|---|---|
| Learner | Practice Listening/Reading/Writing/Speaking, Mock Test, Assessment Result, Progress, Learning Path, Vocabulary Review |
| Teacher | Course/session support, lịch dạy, hỗ trợ học viên |
| Staff | Content management, question bank, exam/practice content |
| Admin | User/role management, system configuration, payment/promotion, reports |

**Lời nói ngắn:**

Các chức năng được chia theo vai trò. Trong phần demo, nhóm em sẽ tập trung vào learner flow vì đây là luồng thể hiện rõ nhất giá trị sản phẩm.

---

## Slide 10 — Learner Flow

**Phần:** Main Features

**Nội dung:**

1. Đăng nhập
2. Chọn bài luyện hoặc mock test
3. Nộp bài làm
4. Hệ thống chấm điểm
5. Xem feedback và điểm theo tiêu chí
6. Nhận gợi ý học tập
7. Ôn tập và theo dõi tiến độ

**Lời nói ngắn:**

Đây là luồng sử dụng chính của người học. Nhóm em sẽ dùng luồng này để demo thay vì trình bày quá nhiều lý thuyết.

---

## Slide 11 — Nguyên tắc chấm điểm cốt lõi

**Phần:** Scoring Core

**Nội dung:**

**Không để AI quyết định điểm cuối cùng.**

- Rubric, trọng số và tham số được cấu hình trong hệ thống.
- Code/formula parser tính điểm dựa trên công thức cố định.
- AI chỉ hỗ trợ:
  - trích xuất bằng chứng nội dung,
  - nhận diện mức độ liên quan,
  - hỗ trợ tạo feedback dễ hiểu.
- Các chỉ số đầu vào được đo/đếm bằng code, speech service hoặc language tools.
- Điểm cuối được tính bởi formula và được làm tròn theo rule của hệ thống.

**Lời nói ngắn:**

Đây là điểm nhóm em muốn nhấn mạnh. Hệ thống không hỏi AI "bài này mấy điểm". AI chỉ là công cụ hỗ trợ phân tích. Điểm cuối cùng được kiểm soát bởi code và công thức chấm của nhóm.

---

## Slide 12 — Nguồn tiêu chí và cách chuẩn hóa rubric

**Phần:** Scoring Core

**Nội dung:**

- Cấu trúc tiêu chí bám theo định dạng và hướng đánh giá VSTEP.
- Áp dụng cho ngữ cảnh luyện thi VSTEP tại Việt Nam.
- Rubric được chuẩn hóa thành các tiêu chí, trọng số và tham số có thể cấu hình.
- Automated thresholds là calibration nội bộ để đảm bảo hệ thống chấm nhất quán trong phạm vi luyện tập.
- Official score vẫn cần giám khảo/đơn vị có thẩm quyền xác nhận.

**Lời nói ngắn:**

Nhóm em dùng tiêu chí VSTEP làm căn cứ thiết kế rubric. Tuy nhiên hệ thống là công cụ luyện tập, nên các ngưỡng tự động là phần nhóm em chuẩn hóa để tạo feedback nhất quán, không thay thế điểm chính thức.

---

## Slide 13 — Scoring Pipeline

**Phần:** Scoring Core

**Nội dung:**

**Input -> Feature Extraction -> Criterion Scores -> Formula -> Final Band -> Feedback**

1. Người học nộp bài viết hoặc audio.
2. Hệ thống trích xuất chỉ số: số từ, câu, đoạn, linking words, lỗi, transcript, speaking rate, pause count, pronunciation score...
3. Công thức tính điểm từng tiêu chí.
4. Công thức tổng hợp điểm cuối theo trọng số.
5. Guardrails kiểm tra bài bất thường.
6. AI tạo feedback dựa trên điểm và bằng chứng.

**Lời nói ngắn:**

Pipeline này cho thấy AI nằm sau phần tính điểm, không đứng ở vị trí quyết định điểm. Điểm được sinh ra từ các tiêu chí và chỉ số định lượng.

---

## Slide 14 — Writing Scoring Formula

**Phần:** Scoring Core

**Nội dung:**

| Tiêu chí | Trọng số | Tín hiệu đầu vào |
|---|---:|---|
| Task Fulfillment | 25% | points covered, points required, depth factor, examples, clear position, irrelevant content, word count |
| Organization | 25% | paragraph count, linking words, sentence count, sentence variety, salutation/closing với Task 1 |
| Grammar | 25% | grammar structure count, grammar errors, sentence count, punctuation errors |
| Vocabulary | 25% | unique ratio, average word length, readability, CEFR/advanced ratio, spelling errors |

**Công thức tổng:**

`final_band = round_to_0_5(weighted_mean(criteria_scores))`

**Guardrail nội bộ:**

`Task Fulfillment <= avg(Grammar, Vocabulary, Organization) * tf_cap_ratio`

**Lời nói ngắn:**

Writing được chia thành bốn tiêu chí, mỗi tiêu chí có trọng số 25%. Điểm cuối là weighted mean và làm tròn 0.5. Ngoài ra có rule giới hạn Task Fulfillment để tránh trường hợp nội dung có vẻ đúng nhưng ngữ pháp, từ vựng, bố cục quá yếu vẫn bị chấm cao bất hợp lý.

---

## Slide 15 — Speaking Scoring Formula

**Phần:** Scoring Core

**Nội dung:**

| Tiêu chí | Trọng số | Tín hiệu đầu vào |
|---|---:|---|
| Grammar | 20% | grammar structure count, language errors, sentence count |
| Vocabulary | 20% | unique ratio, word length, readability, complex vocabulary |
| Fluency | 20% | speaking rate, pause count, word count |
| Discourse Management | 20% | linking words, sentence variety, content relevance factor |
| Pronunciation | 20% | pronunciation score từ speech service |

**Công thức tổng:**

`final_band = round_to_0_5(weighted_mean(criteria_scores))`

**Lời nói ngắn:**

Speaking cũng không để AI tự chấm điểm cuối. Hệ thống dùng transcript, chỉ số giọng nói, độ trôi chảy và pronunciation signal để tính từng tiêu chí. AI chỉ hỗ trợ content relevance trong phạm vi kiểm soát.

---

## Slide 16 — Guardrails cho bài bất thường

**Phần:** Scoring Core

**Nội dung:**

Hệ thống cần tránh chấm cao cho các trường hợp:

- Lạc đề.
- Quá ngắn.
- Copy lại đề.
- Lặp/spam nội dung.
- Không phải tiếng Anh.
- Audio rỗng hoặc transcript không đủ dữ liệu.

**Cách xử lý:**

- Content cap giới hạn điểm tổng khi content score thấp.
- Short essay cap giới hạn điểm Task Fulfillment khi số từ quá thấp.
- Evidence-based feedback giải thích vì sao bị giới hạn điểm.

**Lời nói ngắn:**

Phần guardrail rất quan trọng vì nếu chỉ nhìn hình thức hoặc để AI tự nhận xét, hệ thống có thể chấm cao cho bài bất thường. Nhóm em có rule để giới hạn điểm trong các trường hợp này.

---

## Slide 17 — Vocabulary Review: Anki/Spaced Repetition

**Phần:** Learning Support

**Nội dung:**

- Hệ thống hỗ trợ học từ vựng bằng spaced repetition theo hướng Anki/FSRS.
- Người học có thể ôn từ bằng flashcard, gõ từ, nghe và đảo chiều nghĩa.
- Mỗi từ có trạng thái học tập: new, learning, review, relearning.
- Hệ thống lưu difficulty, stability, lapse count, due date và lịch sử ôn tập.
- Khi trả lời đúng: interval được giãn ra.
- Khi trả lời sai: từ quay lại quá trình học/relearning.

**See detail:** [Phụ lục A — Chi tiết Anki/FSRS](#phu-luc-a--chi-tiet-ankifsrs)

**Lời nói ngắn:**

Thuật toán spaced repetition không phải điểm mới về mặt học thuật, nên nhóm em chỉ trình bày ngắn. Nếu hội đồng hỏi sâu, nhóm em sẽ mở phần phụ lục để giải thích chi tiết hơn.

---

## Slide 18 — System Architecture Overview

**Phần:** Architecture

**Nội dung:**

- **Client apps:** Learner Web App, Mobile App, Admin Portal.
- **Backend API:** authentication, authorization, validation, business logic, assessment workflow.
- **Domain modules:** Practice, Mock Test, Assessment, Learning Path, Vocabulary, Course, Payment, Notification, Content Management.
- **Data layer:** PostgreSQL, Redis/Queue, object storage cho audio/media.
- **External services:** AI service, speech service, payment service.

**Lời nói ngắn:**

Kiến trúc hệ thống được chia thành client, backend, domain modules, data layer và external services. Backend là nơi kiểm soát business logic và công thức chấm điểm.

---

## Slide 19 — Technology Snapshot

**Phần:** Technology

**Nội dung:**

- Backend: Laravel/PHP, queue/background jobs cho assessment.
- Database/Queue: PostgreSQL, Redis.
- Web/Admin: React, TypeScript.
- Mobile: React Native/Expo.
- AI/Speech: dùng như service hỗ trợ trích xuất tín hiệu, transcript và feedback.
- Deployment: Docker-based services, reverse proxy, CI/CD.

**Lời nói ngắn:**

Phần công nghệ nhóm em xin trình bày ngắn. Điểm cần nhấn mạnh là các tác vụ nặng như chấm Writing/Speaking được xử lý bất đồng bộ để không làm chậm trải nghiệm người dùng.

---

## Slide 20 — Demo Workflow Plan

**Phần:** Demo Workflow Diagram

**Nội dung:**

Nhóm em trình bày demo workflow bằng diagram theo ba luồng. Đây là phần minh họa quy trình trên slide, không phải demo live trên web:

1. **Workflow 1:** Learner Practice Submission.
2. **Workflow 2:** Assessment Result và rubric feedback.
3. **Workflow 3:** Learning Path, Progress Tracking và Vocabulary Review.

**Thông điệp workflow:**

`Practice -> Scoring -> Feedback -> Improvement`

**Lời nói ngắn:**

Sau khi đã trình bày cơ chế chính, nhóm em xin chuyển sang các workflow diagram để hội đồng thấy rõ dữ liệu đi qua hệ thống như thế nào.

---

## Slide 21 — Demo Workflow 1: Practice Submission

**Phần:** Demo Workflow Diagram

**Nội dung:**

Diagram nên thể hiện:

1. Đăng nhập bằng tài khoản learner.
2. Chọn bài luyện Writing hoặc Speaking.
3. Làm bài/nộp audio.
4. Backend validate dữ liệu.
5. Tạo assessment attempt.
6. Đưa tác vụ chấm điểm vào background job nếu cần.

**Mục tiêu:** cho thấy hệ thống tiếp nhận bài làm và chuẩn bị dữ liệu cho assessment pipeline.

**Lời nói ngắn:**

Workflow đầu tiên tập trung vào luồng nộp bài. Điểm chính là mọi bài làm đều được lưu thành assessment attempt rõ ràng để phục vụ chấm điểm, feedback và theo dõi tiến độ.

---

## Slide 22 — Demo Workflow 2: Assessment Result

**Phần:** Demo Workflow Diagram

**Nội dung:**

Diagram nên thể hiện:

- Assessment attempt được xử lý.
- Feature extraction tạo các chỉ số đầu vào.
- Formula tính criterion scores.
- Weighted formula tính final band.
- Feedback/evidence được sinh cho learner.
- Learner xem overall band, criterion scores và feedback.

**Mục tiêu:** chứng minh hệ thống có scoring transparency.

**Lời nói ngắn:**

Workflow này làm rõ điểm tổng, điểm từng tiêu chí và feedback được tạo như thế nào. Nếu hội đồng hỏi về điểm số, nhóm em sẽ quay lại công thức ở slide 14 và 15 để giải thích.

---

## Slide 23 — Demo Workflow 3: Learning Path và Vocabulary Review

**Phần:** Demo Workflow Diagram

**Nội dung:**

Diagram nên thể hiện:

1. Assessment result cập nhật progress dashboard.
2. Hệ thống xác định kỹ năng/tiêu chí yếu.
3. Learning path đề xuất nội dung luyện tiếp.
4. Vocabulary review lấy các từ đến hạn ôn.
5. Learner review vocabulary.
6. Spaced repetition cập nhật due date/interval.

**Mục tiêu:** chứng minh hệ thống biến điểm số thành hành động học tập tiếp theo.

**Lời nói ngắn:**

Luồng này thể hiện phần adaptive support của hệ thống. Người học không chỉ biết điểm, mà còn biết mình nên luyện phần nào tiếp theo.

---

## Slide 24 — Differentiation

**Phần:** Different

**Nội dung:**

| Hiện trạng | Hệ thống của nhóm |
|---|---|
| Luyện đề/tài liệu phân tán | Nền tảng có cấu trúc luyện tập |
| Chủ yếu xem đáp án | Feedback theo tiêu chí |
| Writing/Speaking khó phản hồi nhanh | Rubric/formula-based assessment |
| Ít cá nhân hóa | Skill-gap recommendation |
| Ít theo dõi dài hạn | Progress dashboard |
| AI dễ bị hiểu là tự chấm | AI chỉ hỗ trợ, code tính điểm cuối |

**Lời nói ngắn:**

Khác biệt chính là hệ thống không chỉ cung cấp đề thi, mà cung cấp một quá trình luyện tập có dữ liệu, có phản hồi và có định hướng cải thiện.

---

## Slide 25 — Achievements

**Phần:** Achievements

**Nội dung:**

- Hoàn thành nền tảng Web/Mobile/Admin và Backend API.
- Triển khai practice và mock test cho bốn kỹ năng.
- Triển khai rubric-based assessment cho Writing và Speaking.
- Tách rõ vai trò của AI và formula scoring.
- Triển khai progress tracking, learning path và vocabulary review.
- Có background jobs cho tác vụ assessment nặng.
- Chuẩn bị tài liệu, source code và deployment package.

**Lời nói ngắn:**

Kết quả quan trọng nhất là nhóm em đã hoàn thành được vòng học tập chính từ luyện tập, chấm điểm, phản hồi đến gợi ý học tiếp theo.

---

## Slide 26 — Limitations

**Phần:** Limitations

**Nội dung:**

- Hệ thống hiện chỉ tập trung vào VSTEP B1-C1.
- Chưa hỗ trợ IELTS/TOEFL/TOEIC.
- Automated Writing/Speaking scoring chỉ là công cụ hỗ trợ luyện tập, không thay thế giám khảo chính thức.
- Phụ thuộc external AI và speech-processing services.
- Dynamic adaptive difficulty cho toàn bộ bài luyện là hướng phát triển tương lai.
- Predictive analytics và validation quy mô lớn là hướng phát triển tương lai.

**Lời nói ngắn:**

Nhóm em xác định rõ giới hạn của hệ thống. Đặc biệt, điểm tự động phục vụ luyện tập và phản hồi, không được xem là điểm chính thức thay thế hội đồng chấm.

---

## Slide 27 — Conclusion

**Phần:** Conclusion

**Nội dung:**

Hệ thống giúp người học trả lời ba câu hỏi:

1. Trình độ hiện tại của tôi là gì?
2. Tôi đang yếu kỹ năng hoặc tiêu chí nào?
3. Tôi nên luyện gì tiếp theo?

Giá trị cốt lõi:

**4-skill practice + formula-controlled assessment + rubric feedback + learning recommendation + spaced repetition + progress tracking**

**Lời nói ngắn:**

Tóm lại, hệ thống hướng tới việc biến quá trình luyện thi VSTEP thành một vòng cải thiện liên tục, có dữ liệu và có định hướng cá nhân hóa cho người học.

---

## Slide 28 — Thank You

**Phần:** Closing

**Nội dung:**

**Thank you for listening!**

**Q&A**

**Lời nói ngắn:**

Phần trình bày của nhóm em đến đây là kết thúc. Nhóm em xin cảm ơn hội đồng và sẵn sàng trả lời câu hỏi.

---

<a id="phu-luc-a--chi-tiet-ankifsrs"></a>

# Phụ lục A — Chi tiết Anki/FSRS

**Mục đích:** chỉ mở khi hội đồng hỏi sâu về thuật toán spaced repetition.

**Nội dung:**

- Mỗi vocabulary item có các trạng thái học tập: new, learning, review, relearning.
- Các tham số chính:
  - `difficulty`: độ khó của thẻ đối với người học.
  - `stability`: độ ổn định ghi nhớ.
  - `lapses`: số lần quên/sai.
  - `due_at`: thời điểm cần ôn lại.
  - `last_review_at`: lần ôn gần nhất.
- Sau mỗi lần review, hệ thống cập nhật trạng thái và due date.
- Trả lời tốt làm tăng stability và kéo dài interval.
- Trả lời sai làm tăng lapse, giảm interval và có thể chuyển về relearning.

**Cách nói nếu bị hỏi:**

Hệ thống áp dụng hướng spaced repetition giống Anki/FSRS để tối ưu thời điểm ôn từ. Đây không phải đóng góp thuật toán mới của nhóm, mà là phần ứng dụng vào vocabulary review trong hệ thống luyện thi VSTEP.

---

# Phụ lục B — Công thức chấm điểm chi tiết hơn

**Mục đích:** dùng khi hội đồng hỏi sâu về logic chấm điểm.

## B1. Tổng hợp điểm theo trọng số

```text
weighted_sum = sum(criteria_score_i / 10 * weight_i)
total_weight = sum(weight_i)
raw_band = weighted_sum / total_weight * 10
final_band = round(raw_band * 2) / 2
```

## B2. Writing Task Fulfillment cap

```text
tf_cap = avg(grammar, vocabulary, organization) * tf_cap_ratio
task_fulfillment = min(task_fulfillment, round_to_0_5(tf_cap))
```

## B3. Ví dụ tín hiệu đầu vào

| Nhóm tín hiệu | Ví dụ |
|---|---|
| Text length | word count, sentence count, paragraph count |
| Language quality | grammar errors, punctuation errors, spelling errors |
| Organization | linking words, sentence variety, salutation/closing |
| Vocabulary | unique ratio, CEFR weighted average, advanced ratio |
| Speaking | transcript, speaking rate, pause count, pronunciation score |
| Content | points covered, relevance factor, irrelevant content flag |

**Cách nói nếu bị hỏi:**

AI có thể hỗ trợ trích xuất một số bằng chứng nội dung, nhưng công thức tổng hợp và điểm cuối được chạy bởi code của hệ thống, có trọng số và guardrail rõ ràng.
