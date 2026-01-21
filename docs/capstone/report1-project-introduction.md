# I. Record of Changes

| Date | A/M/D | In Charge | Change Description |
|------|-------|-----------|-------------------|
| 2026-01-21 | A | Hoàng Văn Anh Nghĩa | Initial document creation |

*A - Added, M - Modified, D - Deleted

# II. Project Introduction

## 1. Overview

### 1.1 Project Information

- Project name (EN): An Adaptive VSTEP Preparation System with Comprehensive Skill Assessment and Personalized Learning Support
- Project name (VN): Hệ Thống Luyện Thi VSTEP Thích Ứng Với Đánh Giá Toàn Diện Kỹ Năng Và Hỗ Trợ Học Tập Cá Nhân Hóa
- Project code: SP26SE145
- Group name: GSP26SE63
- Software type: Web Application & Mobile Application
- Duration: 01/01/2026 – 30/04/2026

### 1.2 Project Team

| Full Name | Role | Email | Mobile |
|-----------|------|-------|--------|
| Lâm Hữu Khánh Phương | Academic Supervisor | phuonglhk@fe.edu.vn | N/A |
| Trần Trọng Huỳnh | Industry Supervisor | huynhtt4@fe.edu.vn | 0988258758 |
| Hoàng Văn Anh Nghĩa | Team Leader | nghiahvase172605@fpt.edu.vn | N/A |
| Nguyễn Minh Khôi | Developer | khoinmse172625@fpt.edu.vn | 0944207257 |
| Nguyễn Nhật Phát | Developer | phatnnse172607@fpt.edu.vn | 0981567488 |
| Nguyễn Trần Tấn Phát | Developer | phatnttse173198@fpt.edu.vn | 0343062376 |

## 2. Product Background

Trong kỷ nguyên hội nhập toàn cầu, năng lực ngoại ngữ đóng vai trò then chốt đối với sự thành công trong học tập và thăng tiến nghề nghiệp. Kỳ thi VSTEP (Vietnamese Standardized Test of English Proficiency) được Bộ Giáo dục và Đào tạo công nhận theo Quyết định số 729/QĐ-BGDĐT ngày 11/03/2015, là công cụ đánh giá năng lực ngoại ngữ theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam (tương thích CEFR), với các cấp độ từ A1 đến C1.

**Quy mô và tầm quan trọng:**

- Theo Thông tư 01/2014/TT-BGDĐT, chứng chỉ ngoại ngữ (bao gồm VSTEP) là điều kiện đầu ra bắt buộc cho sinh viên đại học.
- Hiện có 24 đơn vị được Bộ GD&ĐT cấp phép tổ chức thi VSTEP trên toàn quốc.
- VSTEP được sử dụng rộng rãi cho:
  - Xét tốt nghiệp đại học/cao đẳng (yêu cầu phổ biến: B1-B2)
  - Cấp chứng chỉ cho giáo viên tiếng Anh (yêu cầu: B2-C1)
  - Tuyển dụng viên chức và thăng tiến nghề nghiệp trong khu vực công

**Thách thức hiện tại:**

Dựa trên khảo sát sơ bộ với 50 sinh viên FPT University đang ôn luyện VSTEP (tháng 12/2025) và phân tích các nghiên cứu về học ngoại ngữ, nhóm nhận diện các thách thức chính:

| Thách thức | Mô tả | Bằng chứng |
|------------|-------|------------|
| Chênh lệch kỹ năng (Skill Gap) | Trình độ không đồng đều giữa 4 kỹ năng. Người học có thể đạt B2 ở Đọc nhưng chỉ A2 ở Nói | 78% người được khảo sát cho biết có ít nhất 1 kỹ năng yếu hơn đáng kể |
| Tài liệu tĩnh (Static Materials) | Phương pháp truyền thống dựa vào tài liệu cố định, không điều chỉnh theo trình độ thực tế | Các sách luyện thi phổ biến chỉ có 1 mức độ khó cố định |
| Thiếu cá nhân hóa | Lớp học "cào bằng" không thích ứng được với nhu cầu cá nhân | 65% cho biết mất thời gian vào nội dung đã biết; 72% muốn có lộ trình riêng |
| Thiếu phản hồi tức thì | Kỹ năng Viết và Nói không được đánh giá ngay, dẫn đến lặp lại sai lầm | Thời gian chờ phản hồi bài Viết trung bình: 3-7 ngày |

*Lưu ý: Dữ liệu khảo sát sơ bộ sẽ được mở rộng và validate trong giai đoạn Requirements Elicitation.*

**Giải pháp đề xuất:**

Dự án "Hệ thống ôn luyện VSTEP thích ứng" được hình thành nhằm:

- Chuyển đổi từ mô hình học tập "mức độ cố định" sang "định hướng theo cấp độ"
- Tích hợp kiến trúc mô-đun kép: Luyện tập chuyên sâu và Thi thử giả lập
- Áp dụng Adaptive Scaffolding (Hỗ trợ linh hoạt) để cá nhân hóa lộ trình học

## 3. Existing Systems

Nhóm phân tích các giải pháp hiện có theo 5 tiêu chí đánh giá:

1. **Cá nhân hóa:** Khả năng điều chỉnh nội dung theo trình độ người học
2. **Đánh giá 4 kỹ năng:** Hỗ trợ đầy đủ Nghe, Nói, Đọc, Viết
3. **Phản hồi tức thì:** Thời gian chờ kết quả đánh giá
4. **Theo dõi tiến độ:** Công cụ visualization và analytics
5. **Phù hợp VSTEP:** Bám sát format và rubric chính thức

### 3.1 Traditional VSTEP Preparation Methods

Các trung tâm luyện thi trực tiếp (offline) và giáo trình ôn luyện truyền thống với chương trình "một khuôn mẫu cho tất cả" (one-size-fits-all).

| Ưu điểm | Nhược điểm |
|---------|------------|
| Độ tin cậy cao - nội dung bám sát cấu trúc đề thi chính thức | Thiếu tính cá nhân hóa - không tính đến sự chênh lệch trình độ |
| Tương tác trực tiếp - được giải đáp thắc mắc ngay | Khó theo dõi tiến độ phát triển các kỹ năng cụ thể |
| | Thời gian không linh hoạt - rào cản với người đi làm |

### 3.2 General English Learning Applications

Ví dụ: Duolingo (duolingo.com), ELSA Speak (elsaspeak.com)

| Ưu điểm | Nhược điểm |
|---------|------------|
| Tính tương tác cao với gamification | Nội dung chung chung - không thiết kế cho VSTEP |
| Dễ tiếp cận - hoàn toàn trên mobile, chi phí thấp | Mất cân bằng kỹ năng (ELSA chỉ Nói, Duolingo thiếu Viết/Đọc học thuật B2-C1) |

### 3.3 VSTEP Mock Test Platforms

Ví dụ: luyenthivstep.vn, vstepmaster.edu.vn, tienganh123.com

| Ưu điểm | Nhược điểm |
|---------|------------|
| Làm quen với kỳ thi - giao diện thi máy tính | Đánh giá kỹ năng chủ động yếu - thiếu AI cho Viết/Nói |
| Kết quả tức thì cho Nghe/Đọc | Không có lộ trình học tập thích ứng |
| Kho lưu trữ lớn các đề thi | Phân tích dữ liệu tĩnh - chỉ điểm số, thiếu visualization |

### 3.4 AI Writing & Speaking Platforms

Ví dụ: Grammarly (grammarly.com), Write & Improve by Cambridge (writeandimprove.com), SpeechAce (speechace.com)

| Ưu điểm | Nhược điểm |
|---------|------------|
| AI phản hồi tức thì cho grammar, pronunciation | Không theo rubric VSTEP (khác tiêu chí chấm) |
| Công nghệ tiên tiến, UX tốt | Chỉ focus 1-2 kỹ năng, không toàn diện |
| | Không có mock test theo format VSTEP |

### 3.5 IELTS/TOEFL Preparation Platforms

Ví dụ: Magoosh (magoosh.com), British Council - Road to IELTS (takeielts.britishcouncil.org)

| Ưu điểm | Nhược điểm |
|---------|------------|
| Mô hình adaptive learning đã được chứng minh | Format và rubric khác VSTEP hoàn toàn |
| Hệ sinh thái hoàn chỉnh | Chi phí cao ($100-200/năm) |
| | Không phục vụ mục tiêu chứng chỉ Việt Nam |

### 3.6 Comparative Analysis Summary

| Tiêu chí | Truyền thống | Duolingo/ELSA | Thi thử online | AI Tools | IELTS Prep | Hệ thống đề xuất |
|----------|--------------|---------------|----------------|----------|------------|------------------|
| Cá nhân hóa | Không | Một phần | Không | Một phần | Có | Adaptive Scaffolding |
| Đánh giá 4 kỹ năng | Có | Không | 2/4 | Không | Có | Hybrid Grading |
| Phản hồi tức thì | Không | Có | MCQ only | Có | Một phần | AI + Human |
| Theo dõi tiến độ | Không | Cơ bản | Không | Không | Một phần | Spider Chart + Sliding Window |
| Phù hợp VSTEP | Có | Không | Có | Không | Không | Có |
| Chi phí | Cao | Thấp/Miễn phí | Thấp | Trung bình | Cao | Trung bình |

**Kết luận phân tích:** Chưa có giải pháp nào kết hợp được cả 3 yếu tố: (1) Phù hợp VSTEP, (2) Cá nhân hóa adaptive, và (3) Đánh giá đầy đủ 4 kỹ năng với phản hồi tức thì.

## 4. Business Opportunity

Thị trường ôn luyện VSTEP tại Việt Nam đang bộc lộ những lỗ hổng rõ rệt:

| Vấn đề | Chi tiết | Quy mô ảnh hưởng |
|--------|----------|------------------|
| Skill Proficiency Gap | Người học không đồng đều 4 kỹ năng. Phương pháp "cào bằng" gây lãng phí thời gian | Khoảng 2 triệu sinh viên đại học cần đạt chuẩn đầu ra ngoại ngữ/năm |
| Thiếu phản hồi tức thì | Viết và Nói là kỹ năng productive (khó nhất) nhưng không có đánh giá ngay | Thời gian chờ trung bình 3-7 ngày cho bài Viết |
| Áp lực thời gian | Đa số là người bận rộn (sinh viên năm cuối, người đi làm) | 72% người khảo sát muốn có lộ trình tối ưu thay vì tự học |

**Competitive Landscape Analysis:**

| Đối thủ | Hạn chế |
|---------|---------|
| Lớp học truyền thống & Sách | Tài liệu tĩnh, bài thi fixed-level, thiếu phản hồi linh hoạt |
| Website thi thử VSTEP | "Kho chứa đề" trắc nghiệm, thiếu AI phân tích sâu, bỏ ngỏ chấm Nói/Viết |
| Ứng dụng quốc tế | Không bám sát cấu trúc đề VSTEP, không phục vụ mục tiêu chứng chỉ VN |

**Unique Value Proposition (UVP):**

Hệ thống tạo ra sự khác biệt với 4 lợi thế cốt lõi và các chỉ số đo lường:

| # | Lợi thế | Mô tả | Chỉ số mục tiêu |
|---|---------|-------|-----------------|
| 1 | Adaptive Scaffolding | Điều chỉnh mức độ hỗ trợ theo trình độ: Writing (Template - Keywords - Free), Listening (Full text - Highlight - Pure audio) | Skill gap reduction >=30% sau 4 tuần |
| 2 | Hybrid Grading | AI chấm nhanh (grammar, spelling, pronunciation) + Human review cho productive skills | Feedback latency: <5 phút (AI), <24h (Human) |
| 3 | Advanced Visualization | Spider Chart (độ lệch kỹ năng) + Sliding Window (avg 10 bài gần nhất) | User engagement +40% vs static charts |
| 4 | Multi-Goal Profiles | Linh hoạt mục tiêu: B1 trong 1 tháng - B2 trong 3 tháng | Support >=3 concurrent learning goals |

**Tradeoffs được chấp nhận:**

- Hybrid Grading tăng chi phí vận hành (cần đội ngũ rater) nhưng đảm bảo accuracy cho kỹ năng productive
- Adaptive complexity tăng development effort nhưng tạo differentiation rõ ràng

**Strategic Fit:**

Dự án phù hợp với các xu hướng và chính sách:

| Khía cạnh | Phù hợp |
|-----------|---------|
| Chuyển đổi số giáo dục | Quyết định 131/QĐ-TTg về "Tăng cường ứng dụng CNTT trong dạy và học" |
| Personalized Learning | Xu hướng toàn cầu - thị trường EdTech dự kiến đạt $404B vào 2025 |
| Nhu cầu nội địa | VSTEP là chứng chỉ Việt Nam, giảm phụ thuộc IELTS/TOEFL (chi phí thấp hơn 50-70%) |

**Hypothesis cần validate:**

- Giả thuyết: Adaptive learning có thể giảm 30-50% thời gian ôn luyện so với phương pháp truyền thống
- Phương pháp validate: A/B testing trong pilot phase với 2 nhóm người học

## 5. Software Product Vision

**Vision Statement:**

Dành cho sinh viên đại học cần đạt chuẩn đầu ra, người đi làm cần chứng chỉ thăng tiến, và trung tâm ngoại ngữ tại Việt Nam đang gặp khó khăn với phương pháp ôn luyện VSTEP thiếu cá nhân hóa và phản hồi chậm, Hệ thống ôn luyện VSTEP thích ứng là một nền tảng học tập kỹ thuật số kết hợp Web và Mobile cung cấp lộ trình học cá nhân hóa, đánh giá 4 kỹ năng với phản hồi tức thì, và trực quan hóa tiến độ. Khác với các trang web thi thử tĩnh (chỉ có đề và đáp án) hoặc ứng dụng tiếng Anh tổng quát (không bám sát VSTEP), sản phẩm của chúng tôi kết hợp Adaptive Scaffolding + Hybrid Grading + Analytics để thu hẹp skill gap hiệu quả.

**Measurable Vision Targets:**

| Chỉ số | Mục tiêu | Timeline |
|--------|----------|----------|
| Skill gap reduction | >=30% | Sau 4 tuần sử dụng |
| Writing feedback latency | <5 phút (AI) | MVP launch |
| User satisfaction (NPS) | >=40 | End of pilot |
| Active users retention | >=60% (monthly) | 3 tháng sau launch |

**Kiến trúc Mô-đun Kép:**

Hệ thống được thiết kế với hai module chính:

1. **LUYỆN TẬP CHUYÊN SÂU (Practice Mode):** Adaptive exercises, Scaffolded support, Instant feedback, Skill-focused

2. **THI THỬ GIẢ LẬP (Mock Test Mode):** Timed simulation, Real exam format, Full scoring, Performance report

3. **ADAPTIVE SCAFFOLDING:** Writing (Template - Keywords - Free writing), Listening (Full text - Highlights - Pure audio)

**Giá trị cho từng đối tượng:**

| Đối tượng | Giá trị mang lại |
|-----------|------------------|
| Người học (Learners) | Lộ trình cá nhân hóa, Spider Chart trực quan năng lực, Sliding Window theo dõi tiến độ thực tế |
| Giảng viên (Instructors) | Hybrid Grading giảm gánh nặng chấm bài, dashboard theo dõi học viên, data-driven feedback |
| Tổ chức giáo dục | Công cụ chuyển đổi số có khả năng mở rộng, tiết kiệm chi phí, quản lý đa profile người dùng |

**Đóng góp xã hội:**

| Đóng góp | Mục tiêu đo lường |
|----------|-------------------|
| Tiếp cận giáo dục | Giảm rào cản chi phí: VSTEP (~1.5 triệu VND) vs IELTS (~5 triệu VND) |
| Hiệu quả học tập | Giảm skill gap 30% cho người dùng active |
| Hỗ trợ vùng sâu vùng xa | Mobile-first design cho khu vực hạ tầng internet hạn chế |
| Chuẩn bị nguồn nhân lực | Đóng góp vào mục tiêu 50% sinh viên đạt B1+ trước tốt nghiệp |

## 6. Project Scope & Limitations

### 6.1 Major Features

FE-01: User Authentication - Đăng ký, đăng nhập, quản lý profile với các vai trò Learner/Instructor/Admin. Hệ thống hỗ trợ xác thực qua email/password và OAuth (Google). Người dùng có thể cập nhật thông tin cá nhân, đổi mật khẩu, và quản lý các thiết bị đăng nhập.

FE-02: Placement Test - Bài kiểm tra đầu vào xác định trình độ ban đầu cho 4 kỹ năng (Nghe, Nói, Đọc, Viết). Kết quả được sử dụng để khởi tạo Spider Chart và đề xuất lộ trình học phù hợp. Bài test được thiết kế adaptive để rút ngắn thời gian kiểm tra trong khi vẫn đảm bảo độ chính xác.

FE-03: Practice Mode - Listening - Luyện tập kỹ năng Nghe với Adaptive Scaffolding (Full text - Highlight - Pure audio). Hệ thống tự động điều chỉnh mức độ hỗ trợ dựa trên kết quả của người học. Bao gồm các dạng bài tập: nghe điền từ, nghe chọn đáp án, và nghe tóm tắt nội dung.

FE-04: Practice Mode - Reading - Luyện tập kỹ năng Đọc với các dạng câu hỏi theo format VSTEP. Bao gồm các dạng: True/False/Not Given, Multiple Choice, Matching Headings, và Fill in the Blanks. Bài đọc được phân loại theo chủ đề và mức độ khó (B1, B2, C1).

FE-05: Practice Mode - Writing - Luyện tập kỹ năng Viết với Adaptive Scaffolding (Template - Keywords - Free writing). Hỗ trợ Task 1 (viết email/thư) và Task 2 (viết bài luận). Người học nhận phản hồi tức thì về grammar, vocabulary, và coherence từ AI.

FE-06: Practice Mode - Speaking - Luyện tập kỹ năng Nói với ghi âm và AI feedback. Hệ thống đánh giá phát âm, ngữ điệu, và fluency thông qua speech recognition. Bao gồm cả 3 phần của bài thi Speaking VSTEP: Social Interaction, Solution Discussion, và Topic Development.

FE-07: Mock Test Mode - Thi thử giả lập đầy đủ 4 kỹ năng theo đúng format và thời gian VSTEP. Người học trải nghiệm môi trường thi thực tế với đồng hồ đếm ngược và giao diện thi máy tính. Kết quả được tổng hợp thành báo cáo chi tiết với điểm số theo từng kỹ năng và band descriptor.

FE-08: AI Grading - Chấm điểm tự động bằng AI cho các bài tập MCQ, Writing, Speaking. Sử dụng các model NLP để đánh giá grammar, vocabulary, task achievement, và coherence cho Writing. Tích hợp speech-to-text và pronunciation scoring cho Speaking.

FE-09: Human Grading - Giao diện cho Instructor chấm điểm thủ công với rubric VSTEP. Instructor có thể review bài làm, để lại nhận xét chi tiết, và override điểm AI nếu cần. Hệ thống theo dõi workload và phân công bài chấm tự động.

FE-10: Progress Tracking - Spider Chart hiển thị năng lực 4 kỹ năng, Sliding Window theo dõi tiến độ. Spider Chart cập nhật realtime sau mỗi bài tập/thi thử. Sliding Window tính trung bình 10 bài gần nhất để phản ánh năng lực hiện tại, loại bỏ nhiễu từ kết quả cũ.

FE-11: Learning Path - Lộ trình học tập cá nhân hóa dựa trên kết quả và mục tiêu. Hệ thống gợi ý bài tập ưu tiên cho kỹ năng yếu nhất. Lộ trình được điều chỉnh động dựa trên tiến độ thực tế của người học.

FE-12: Goal Setting - Thiết lập mục tiêu (B1/B2/C1) và timeline. Người học có thể đặt nhiều mục tiêu đồng thời (VD: B1 trong 1 tháng cho Đọc, B2 trong 3 tháng cho Nói). Hệ thống dự đoán khả năng đạt mục tiêu dựa trên tốc độ tiến bộ hiện tại.

FE-13: Content Management - Admin quản lý ngân hàng câu hỏi, đề thi. Hỗ trợ import/export câu hỏi theo format chuẩn (Excel, JSON). Admin có thể tạo, chỉnh sửa, phân loại câu hỏi theo kỹ năng, chủ đề, và mức độ khó.

FE-14: User Management - Admin quản lý tài khoản, phân quyền. Bao gồm các chức năng: tạo tài khoản hàng loạt, khóa/mở khóa tài khoản, reset mật khẩu, và gán vai trò. Admin có thể xem lịch sử hoạt động của từng tài khoản.

FE-15: Analytics Dashboard - Báo cáo thống kê cho Instructor và Admin. Hiển thị các metrics: số lượng người dùng active, tỷ lệ hoàn thành bài tập, điểm trung bình theo kỹ năng. Hỗ trợ lọc theo thời gian, nhóm người dùng, và export báo cáo.

FE-16: Notification System - Thông báo nhắc nhở học tập, kết quả bài thi. Hỗ trợ push notification (mobile), email, và in-app notification. Người dùng có thể tùy chỉnh tần suất và loại thông báo muốn nhận.

### 6.2 Limitations & Exclusions

LI-01: Hệ thống chỉ hỗ trợ VSTEP format (B1-B2, B2-C1), không hỗ trợ các kỳ thi tiếng Anh khác (IELTS, TOEFL, TOEIC). Quyết định này nhằm tập trung nguồn lực phát triển và đảm bảo nội dung bám sát 100% cấu trúc đề thi VSTEP chính thức. Việc mở rộng sang các kỳ thi khác sẽ được xem xét trong các phiên bản sau dựa trên nhu cầu thị trường.

LI-02: AI Grading cho Writing và Speaking là công cụ hỗ trợ, không thay thế hoàn toàn đánh giá của Instructor cho điểm chính thức. Điểm AI được sử dụng cho mục đích luyện tập và phản hồi nhanh, trong khi điểm chính thức (mock test final score) cần được Instructor review và xác nhận. Điều này đảm bảo độ tin cậy của kết quả đánh giá productive skills.

LI-03: Phiên bản MVP chỉ hỗ trợ tiếng Việt làm ngôn ngữ giao diện chính. Đối tượng mục tiêu chính là người Việt Nam ôn luyện VSTEP, do đó tiếng Việt được ưu tiên để giảm rào cản tiếp cận. Hỗ trợ đa ngôn ngữ (tiếng Anh) sẽ được bổ sung trong các phiên bản tiếp theo.

LI-04: Mobile App chỉ phát triển cho Android trong giai đoạn đầu, iOS sẽ được bổ sung sau. Theo thống kê, Android chiếm >70% thị phần smartphone tại Việt Nam, do đó được ưu tiên phát triển trước. Người dùng iOS vẫn có thể truy cập đầy đủ chức năng thông qua Progressive Web App (PWA).

LI-05: Hệ thống không tích hợp thanh toán online trong phiên bản MVP. Giai đoạn pilot sẽ áp dụng mô hình freemium hoặc thanh toán offline thông qua đối tác (trung tâm ngoại ngữ). Tích hợp cổng thanh toán (VNPay, MoMo, ZaloPay) sẽ được triển khai khi mở rộng quy mô thương mại.

# III. References

[1] Bộ Giáo dục và Đào tạo. (2015). *Quyết định số 729/QĐ-BGDĐT ngày 11/03/2015 về việc ban hành Định dạng đề thi đánh giá năng lực sử dụng tiếng Anh theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam*.

[2] Bộ Giáo dục và Đào tạo. (2014). *Thông tư số 01/2014/TT-BGDĐT ngày 24/01/2014 ban hành Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam*.

[3] Thủ tướng Chính phủ. (2022). *Quyết định số 131/QĐ-TTg ngày 25/01/2022 phê duyệt Đề án "Tăng cường ứng dụng công nghệ thông tin và chuyển đổi số trong giáo dục và đào tạo giai đoạn 2022-2025, định hướng đến năm 2030"*.

[4] HolonIQ. (2024). *Global EdTech Market to reach $404B by 2025*. Retrieved from https://www.holoniq.com/edtech

[5] Khảo sát sơ bộ nhóm dự án. (2025, tháng 12). *Khảo sát nhu cầu ôn luyện VSTEP với 50 sinh viên FPT University*. Dữ liệu nội bộ.

## Appendix A: Use Case Diagram

(Diagram sẽ được bổ sung trong Report 2 - SRS)

## Appendix B: System Architecture Overview

(Diagram sẽ được bổ sung trong Report 2 - SRS)

## Appendix C: Project Timeline

| Task Package | Description | Start | End |
|--------------|-------------|-------|-----|
| TP1 | Web Application Development | 01/01/2026 | 28/02/2026 |
| TP2 | Mobile Application Development | 15/01/2026 | 15/03/2026 |
| TP3 | Assessment Engine | 01/02/2026 | 31/03/2026 |
| TP4 | Personalized Learning Module | 15/02/2026 | 15/04/2026 |
| TP5 | Testing & Deployment | 01/04/2026 | 30/04/2026 |
