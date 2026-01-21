# Report 1 – Project Introduction

## An Adaptive VSTEP Preparation System with Comprehensive Skill Assessment and Personalized Learning Support

**Hệ Thống Luyện Thi VSTEP Thích Ứng Với Đánh Giá Toàn Diện Kỹ Năng Và Hỗ Trợ Học Tập Cá Nhân Hóa**

---

## Table of Contents

- [I. Record of Changes](#i-record-of-changes)
- [II. Project Introduction](#ii-project-introduction)
  - [1. Overview](#1-overview)
  - [2. Product Background](#2-product-background)
  - [3. Existing Systems](#3-existing-systems)
  - [4. Business Opportunity](#4-business-opportunity)
  - [5. Software Product Vision](#5-software-product-vision)
  - [6. Project Scope & Limitations](#6-project-scope--limitations)

---

## I. Record of Changes

| Date | A/M/D* | In Charge | Change Description |
|------|--------|-----------|-------------------|
| 2025-12-25 | A | Hoàng Văn Anh Nghĩa | Initial document creation |
| | | | |
| | | | |

> *A - Added, M - Modified, D - Deleted

---

## II. Project Introduction

### 1. Overview

#### 1.1 Project Summary

Dự án xây dựng **hệ thống ôn luyện VSTEP thích ứng** nhằm giải quyết vấn đề: người học VSTEP có trình độ không đồng đều giữa 4 kỹ năng (Nghe, Nói, Đọc, Viết) nhưng các phương pháp hiện tại không cá nhân hóa được lộ trình học. Hệ thống áp dụng **Adaptive Scaffolding** và **Hybrid Grading (AI + Human)** để cung cấp phản hồi tức thì cho cả kỹ năng productive (Viết, Nói), đồng thời trực quan hóa năng lực qua **Spider Chart** và theo dõi tiến độ thực tế qua **Sliding Window**. Đối tượng mục tiêu: sinh viên, người đi làm cần chứng chỉ VSTEP, và các trung tâm ngoại ngữ.

#### 1.2 Project Information

| Field | Value |
|-------|-------|
| **Project Name (EN)** | An Adaptive VSTEP Preparation System with Comprehensive Skill Assessment and Personalized Learning Support |
| **Project Name (VN)** | Hệ Thống Luyện Thi VSTEP Thích Ứng Với Đánh Giá Toàn Diện Kỹ Năng Và Hỗ Trợ Học Tập Cá Nhân Hóa |
| **Project Code** | SP26SE146 |
| **Group Name** | GSP26SE63 |
| **Software Type** | Web Application & Mobile Application |
| **Duration** | 01/01/2026 – 30/04/2026 |
| **Stakeholders** | FPT University - Department of Software Engineering |

#### 1.3 Project Team

| Full Name | Role | Email | Mobile |
|-----------|------|-------|--------|
| Lâm Hữu Khánh Phương | Academic Supervisor | phuonglhk@fe.edu.vn | N/A |
| Trần Trọng Huỳnh | Industry Supervisor | huynhtt4@fe.edu.vn | 0988258758 |
| Hoàng Văn Anh Nghĩa | Team Leader | nghiahvase172605@fpt.edu.vn | N/A |
| Nguyễn Minh Khôi | Developer | khoinmse172625@fpt.edu.vn | 0944207257 |
| Nguyễn Nhật Phát | Developer | phatnnse172607@fpt.edu.vn | 0981567488 |
| Nguyễn Trần Tấn Phát | Developer | phatnttse173198@fpt.edu.vn | 0343062376 |

---

### 2. Product Background

#### 2.1 Bối cảnh và Nhu cầu

Trong kỷ nguyên hội nhập toàn cầu, năng lực ngoại ngữ đóng vai trò then chốt đối với sự thành công trong học tập và thăng tiến nghề nghiệp. Kỳ thi **VSTEP** (Vietnamese Standardized Test of English Proficiency) được Bộ Giáo dục và Đào tạo công nhận theo Quyết định số 729/QĐ-BGDĐT ngày 11/03/2015 [^1], là công cụ đánh giá năng lực ngoại ngữ theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam (tương thích CEFR), với các cấp độ từ A1 đến C1.

**Quy mô và tầm quan trọng:**
- Theo Thông tư 01/2014/TT-BGDĐT, chứng chỉ ngoại ngữ (bao gồm VSTEP) là điều kiện đầu ra bắt buộc cho sinh viên đại học [^2]
- Hiện có **24 đơn vị** được Bộ GD&ĐT cấp phép tổ chức thi VSTEP trên toàn quốc [^3]
- VSTEP được sử dụng rộng rãi cho:
  - **Xét tốt nghiệp** đại học/cao đẳng (yêu cầu phổ biến: B1-B2)
  - **Cấp chứng chỉ** cho giáo viên tiếng Anh (yêu cầu: B2-C1)
  - **Tuyển dụng** viên chức và thăng tiến nghề nghiệp trong khu vực công

[^1]: Quyết định 729/QĐ-BGDĐT về việc công nhận VSTEP, Bộ GD&ĐT, 2015
[^2]: Thông tư 01/2014/TT-BGDĐT về Khung năng lực ngoại ngữ 6 bậc
[^3]: Danh sách đơn vị tổ chức thi VSTEP - Cục Quản lý chất lượng, Bộ GD&ĐT, 2024

#### 2.2 Thách thức hiện tại

Dựa trên khảo sát sơ bộ với 50 sinh viên FPT University đang ôn luyện VSTEP (tháng 12/2025) và phân tích các nghiên cứu về học ngoại ngữ, nhóm nhận diện các thách thức chính:

| Thách thức | Mô tả | Bằng chứng |
|------------|-------|------------|
| **Chênh lệch kỹ năng (Skill Gap)** | Trình độ không đồng đều giữa 4 kỹ năng. Người học có thể đạt B2 ở Đọc nhưng chỉ A2 ở Nói | 78% người được khảo sát cho biết có ít nhất 1 kỹ năng yếu hơn đáng kể so với các kỹ năng khác |
| **Tài liệu tĩnh (Static Materials)** | Phương pháp truyền thống dựa vào tài liệu cố định, không điều chỉnh theo trình độ thực tế | Các sách luyện thi phổ biến (Sách 22 đề, Step Up to VSTEP) chỉ có 1 mức độ khó cố định |
| **Thiếu cá nhân hóa** | Lớp học "cào bằng" không thích ứng được với nhu cầu cá nhân | 65% cho biết mất thời gian vào nội dung đã biết; 72% muốn có lộ trình riêng |
| **Thiếu phản hồi tức thì** | Kỹ năng Viết và Nói không được đánh giá ngay, dẫn đến lặp lại sai lầm | Thời gian chờ phản hồi bài Viết trung bình: 3-7 ngày; Nói: chỉ đánh giá trong lớp |

> **Lưu ý**: Dữ liệu khảo sát sơ bộ sẽ được mở rộng và validate trong giai đoạn Requirements Elicitation.

#### 2.3 Giải pháp đề xuất

Dự án **"Hệ thống ôn luyện VSTEP thích ứng"** được hình thành nhằm:

- Chuyển đổi từ mô hình học tập **"mức độ cố định"** sang **"định hướng theo cấp độ"**
- Tích hợp kiến trúc mô-đun kép: **Luyện tập chuyên sâu** và **Thi thử giả lập**
- Áp dụng **Adaptive Scaffolding** (Hỗ trợ linh hoạt) để cá nhân hóa lộ trình học

---

### 3. Existing Systems

Nhóm phân tích các giải pháp hiện có theo **5 tiêu chí đánh giá**:
1. **Cá nhân hóa**: Khả năng điều chỉnh nội dung theo trình độ người học
2. **Đánh giá 4 kỹ năng**: Hỗ trợ đầy đủ Nghe, Nói, Đọc, Viết
3. **Phản hồi tức thì**: Thời gian chờ kết quả đánh giá
4. **Theo dõi tiến độ**: Công cụ visualization và analytics
5. **Phù hợp VSTEP**: Bám sát format và rubric chính thức

#### 3.1 Phương pháp ôn luyện VSTEP truyền thống

**Mô tả:** Các trung tâm luyện thi trực tiếp (offline) và giáo trình ôn luyện truyền thống với chương trình "một khuôn mẫu cho tất cả" (one-size-fits-all).

| Ưu điểm | Nhược điểm |
|---------|------------|
| Độ tin cậy cao - nội dung bám sát cấu trúc đề thi chính thức | Thiếu tính cá nhân hóa - không tính đến sự chênh lệch trình độ |
| Tương tác trực tiếp - được giải đáp thắc mắc ngay | Khó theo dõi tiến độ phát triển các kỹ năng cụ thể |
| | Thời gian không linh hoạt - rào cản với người đi làm |

#### 3.2 Ứng dụng học tiếng Anh tổng quát

**Ví dụ:** [Duolingo](https://www.duolingo.com/), [ELSA Speak](https://elsaspeak.com/)

| Ưu điểm | Nhược điểm |
|---------|------------|
| Tính tương tác cao với gamification | Nội dung chung chung - không thiết kế cho VSTEP |
| Dễ tiếp cận - hoàn toàn trên mobile, chi phí thấp | Mất cân bằng kỹ năng (ELSA chỉ Nói, Duolingo thiếu Viết/Đọc học thuật B2-C1) |

#### 3.3 Nền tảng thi thử VSTEP trực tuyến

**Ví dụ:** [luyenthivstep.vn](https://luyenthivstep.vn/), [vstepmaster.edu.vn](https://vstepmaster.edu.vn/), [tienganh123.com](https://tienganh123.com/)

| Ưu điểm | Nhược điểm |
|---------|------------|
| Làm quen với kỳ thi - giao diện thi máy tính | Đánh giá kỹ năng chủ động yếu - thiếu AI cho Viết/Nói |
| Kết quả tức thì cho Nghe/Đọc | Không có lộ trình học tập thích ứng |
| Kho lưu trữ lớn các đề thi | Phân tích dữ liệu tĩnh - chỉ điểm số, thiếu visualization |

#### 3.4 Nền tảng AI Writing & Speaking

**Ví dụ:** [Grammarly](https://grammarly.com/), [Write & Improve (Cambridge)](https://writeandimprove.com/), [SpeechAce](https://speechace.com/)

| Ưu điểm | Nhược điểm |
|---------|------------|
| AI phản hồi tức thì cho grammar, pronunciation | Không theo rubric VSTEP (khác tiêu chí chấm) |
| Công nghệ tiên tiến, UX tốt | Chỉ focus 1-2 kỹ năng, không toàn diện |
| | Không có mock test theo format VSTEP |

#### 3.5 Nền tảng luyện thi IELTS/TOEFL (Đối thủ gián tiếp)

**Ví dụ:** [Magoosh](https://magoosh.com/), [British Council - Road to IELTS](https://takeielts.britishcouncil.org/)

| Ưu điểm | Nhược điểm |
|---------|------------|
| Mô hình adaptive learning đã được chứng minh | Format và rubric khác VSTEP hoàn toàn |
| Hệ sinh thái hoàn chỉnh | Chi phí cao ($100-200/năm) |
| | Không phục vụ mục tiêu chứng chỉ Việt Nam |

#### 3.6 Bảng so sánh tổng hợp

| Tiêu chí | Truyền thống | Duolingo/ELSA | Thi thử online | AI Tools | IELTS Prep | **Hệ thống đề xuất** |
|----------|--------------|---------------|----------------|----------|------------|---------------------|
| Cá nhân hóa | ❌ | ⚠️ Một phần | ❌ | ⚠️ Một phần | ✅ | ✅ Adaptive Scaffolding |
| Đánh giá 4 kỹ năng | ✅ | ❌ | ⚠️ 2/4 | ❌ | ✅ | ✅ Hybrid Grading |
| Phản hồi tức thì | ❌ | ✅ | ⚠️ MCQ only | ✅ | ⚠️ | ✅ AI + Human |
| Theo dõi tiến độ | ❌ | ⚠️ Cơ bản | ❌ | ❌ | ⚠️ | ✅ Spider Chart + Sliding Window |
| Phù hợp VSTEP | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Chi phí** | Cao | Thấp/Miễn phí | Thấp | Trung bình | Cao | Trung bình |

> **Kết luận phân tích**: Chưa có giải pháp nào kết hợp được cả 3 yếu tố: (1) Phù hợp VSTEP, (2) Cá nhân hóa adaptive, và (3) Đánh giá đầy đủ 4 kỹ năng với phản hồi tức thì.

---

### 4. Business Opportunity

#### 4.1 Market Problem & Demand

Thị trường ôn luyện VSTEP tại Việt Nam đang bộc lộ những lỗ hổng rõ rệt:

| Vấn đề | Chi tiết | Quy mô ảnh hưởng |
|--------|----------|------------------|
| **Skill Proficiency Gap** | Người học không đồng đều 4 kỹ năng. Phương pháp "cào bằng" gây lãng phí thời gian | ~2 triệu sinh viên đại học cần đạt chuẩn đầu ra ngoại ngữ/năm [^4] |
| **Thiếu phản hồi tức thì** | Viết và Nói là kỹ năng productive (khó nhất) nhưng không có đánh giá ngay | Thời gian chờ trung bình 3-7 ngày cho bài Viết |
| **Áp lực thời gian** | Đa số là người bận rộn (sinh viên năm cuối, người đi làm) | 72% người khảo sát muốn có lộ trình tối ưu thay vì tự học |

[^4]: Số liệu sinh viên đại học - Bộ GD&ĐT, Báo cáo thống kê 2023-2024

#### 4.2 Competitive Landscape Analysis

| Đối thủ | Hạn chế |
|---------|---------|
| Lớp học truyền thống & Sách | Tài liệu tĩnh, bài thi fixed-level, thiếu phản hồi linh hoạt |
| Website thi thử VSTEP | "Kho chứa đề" trắc nghiệm, thiếu AI phân tích sâu, bỏ ngỏ chấm Nói/Viết |
| Ứng dụng quốc tế | Không bám sát cấu trúc đề VSTEP, không phục vụ mục tiêu chứng chỉ VN |

#### 4.3 Unique Value Proposition (UVP)

Hệ thống tạo ra sự khác biệt với **4 lợi thế cốt lõi** và các chỉ số đo lường:

| # | Lợi thế | Mô tả | Chỉ số mục tiêu |
|---|---------|-------|-----------------|
| 1 | **Adaptive Scaffolding** | Điều chỉnh mức độ hỗ trợ theo trình độ: Writing (Template → Keywords → Free), Listening (Full text → Highlight → Pure audio) | Skill gap reduction ≥30% sau 4 tuần |
| 2 | **Hybrid Grading** | AI chấm nhanh (grammar, spelling, pronunciation) + Human review cho productive skills | Feedback latency: <5 phút (AI), <24h (Human) |
| 3 | **Advanced Visualization** | Spider Chart (độ lệch kỹ năng) + Sliding Window (avg 10 bài gần nhất) | User engagement +40% vs static charts |
| 4 | **Multi-Goal Profiles** | Linh hoạt mục tiêu: B1 trong 1 tháng → B2 trong 3 tháng | Support ≥3 concurrent learning goals |

**Tradeoffs được chấp nhận:**
- Hybrid Grading tăng chi phí vận hành (cần đội ngũ rater) nhưng đảm bảo accuracy cho kỹ năng productive
- Adaptive complexity tăng development effort nhưng tạo differentiation rõ ràng

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        UNIQUE VALUE PROPOSITION                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. ADAPTIVE SCAFFOLDING (Hỗ trợ học tập thích ứng)                     │
│     ├── Writing: Template → Keyword hints → Free writing                 │
│     └── Listening: Full text → Keyword highlight → Pure audio            │
│                                                                          │
│  2. HYBRID GRADING (Cơ chế chấm điểm hỗn hợp)                           │
│     ├── AI: Chấm nhanh lỗi chính tả, ngữ pháp, cấu trúc                 │
│     └── Human: Đánh giá chuyên sâu cho Nói/Viết                         │
│                                                                          │
│  3. ADVANCED VISUALIZATION (Trực quan hóa năng lực)                     │
│     ├── Spider Chart: Hiển thị độ lệch giữa các kỹ năng                 │
│     └── Sliding Window: Theo dõi tiến độ thực tế (avg 10 bài gần nhất)  │
│                                                                          │
│  4. MULTI-GOAL PROFILES (Đa mục tiêu & Đa Profile)                      │
│     └── Linh hoạt thiết lập: B1 trong 1 tháng → B2 trong 3 tháng        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.4 Strategic Fit

Dự án phù hợp với các xu hướng và chính sách:

| Khía cạnh | Phù hợp |
|-----------|---------|
| **Chuyển đổi số giáo dục** | Quyết định 131/QĐ-TTg về "Tăng cường ứng dụng CNTT trong dạy và học" [^5] |
| **Personalized Learning** | Xu hướng toàn cầu - thị trường EdTech dự kiến đạt $404B vào 2025 [^6] |
| **Nhu cầu nội địa** | VSTEP là chứng chỉ Việt Nam, giảm phụ thuộc IELTS/TOEFL (chi phí thấp hơn 50-70%) |

[^5]: Quyết định 131/QĐ-TTg về chuyển đổi số giáo dục
[^6]: HolonIQ - Global EdTech Market Report 2024

**Hypothesis cần validate:**
- Giả thuyết: Adaptive learning có thể giảm 30-50% thời gian ôn luyện so với phương pháp truyền thống
- Phương pháp validate: A/B testing trong pilot phase với 2 nhóm người học

---

### 5. Software Product Vision

#### 5.1 Vision Statement

> **FOR** sinh viên đại học cần đạt chuẩn đầu ra, người đi làm cần chứng chỉ thăng tiến, và trung tâm ngoại ngữ tại Việt Nam
>
> **WHO** đang gặp khó khăn với phương pháp ôn luyện VSTEP thiếu cá nhân hóa và phản hồi chậm
>
> **THE** Hệ thống ôn luyện VSTEP thích ứng
>
> **IS A** nền tảng học tập kỹ thuật số kết hợp Web và Mobile
>
> **THAT** cung cấp lộ trình học cá nhân hóa, đánh giá 4 kỹ năng với phản hồi tức thì, và trực quan hóa tiến độ
>
> **UNLIKE** các trang web thi thử tĩnh (chỉ có đề và đáp án) hoặc ứng dụng tiếng Anh tổng quát (không bám sát VSTEP)
>
> **OUR PRODUCT** kết hợp Adaptive Scaffolding + Hybrid Grading + Analytics để thu hẹp skill gap hiệu quả

**Measurable Vision Targets:**
| Chỉ số | Mục tiêu | Timeline |
|--------|----------|----------|
| Skill gap reduction | ≥30% | Sau 4 tuần sử dụng |
| Writing feedback latency | <5 phút (AI) | MVP launch |
| User satisfaction (NPS) | ≥40 | End of pilot |
| Active users retention | ≥60% (monthly) | 3 tháng sau launch |

#### 5.2 Kiến trúc Mô-đun Kép

```
┌──────────────────────────────────────────────────────────────┐
│                    VSTEP PREPARATION SYSTEM                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌─────────────────────┐     ┌─────────────────────┐        │
│   │   LUYỆN TẬP         │     │   THI THỬ           │        │
│   │   CHUYÊN SÂU        │     │   GIẢ LẬP           │        │
│   │   (Practice Mode)   │     │   (Mock Test Mode)  │        │
│   ├─────────────────────┤     ├─────────────────────┤        │
│   │ • Adaptive exercises│     │ • Timed simulation  │        │
│   │ • Scaffolded support│     │ • Real exam format  │        │
│   │ • Instant feedback  │     │ • Full scoring      │        │
│   │ • Skill-focused     │     │ • Performance report│        │
│   └─────────────────────┘     └─────────────────────┘        │
│                                                               │
│   ┌─────────────────────────────────────────────────┐        │
│   │              ADAPTIVE SCAFFOLDING               │        │
│   ├─────────────────────────────────────────────────┤        │
│   │ Writing: Template → Keywords → Free writing     │        │
│   │ Listening: Full text → Highlights → Pure audio  │        │
│   └─────────────────────────────────────────────────┘        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

#### 5.3 Giá trị cho từng đối tượng

| Đối tượng | Giá trị mang lại |
|-----------|------------------|
| **Người học (Learners)** | Lộ trình cá nhân hóa, Spider Chart trực quan năng lực, Sliding Window theo dõi tiến độ thực tế |
| **Giảng viên (Instructors)** | Hybrid Grading giảm gánh nặng chấm bài, dashboard theo dõi học viên, data-driven feedback |
| **Tổ chức giáo dục** | Công cụ chuyển đổi số có khả năng mở rộng, tiết kiệm chi phí, quản lý đa profile người dùng |

#### 5.4 Đóng góp xã hội

Dự án hướng đến các tác động cụ thể:

| Đóng góp | Mục tiêu đo lường |
|----------|-------------------|
| **Tiếp cận giáo dục** | Giảm rào cản chi phí: VSTEP (~1.5 triệu VND) vs IELTS (~5 triệu VND) |
| **Hiệu quả học tập** | Giảm skill gap 30% cho người dùng active |
| **Hỗ trợ vùng sâu vùng xa** | Mobile-first design cho khu vực hạ tầng internet hạn chế |
| **Chuẩn bị nguồn nhân lực** | Đóng góp vào mục tiêu 50% sinh viên đạt B1+ trước tốt nghiệp |

---

### 6. Project Scope & Limitations

> *Phần này sẽ được hoàn thiện sau khi Review sections 1-5*

---

## References

1. Bộ GD&ĐT (2015). *Quyết định 729/QĐ-BGDĐT về việc công nhận VSTEP*. https://moet.gov.vn
2. Bộ GD&ĐT (2014). *Thông tư 01/2014/TT-BGDĐT về Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam*.
3. Cục Quản lý chất lượng - Bộ GD&ĐT (2024). *Danh sách đơn vị tổ chức thi VSTEP*. https://qlcl.moet.gov.vn
4. Bộ GD&ĐT (2024). *Báo cáo thống kê giáo dục đại học 2023-2024*.
5. Thủ tướng Chính phủ (2021). *Quyết định 131/QĐ-TTg về tăng cường ứng dụng CNTT trong giáo dục*.
6. HolonIQ (2024). *Global EdTech Market Report*. https://www.holoniq.com/edtech
7. VSTEP Official. *Cấu trúc đề thi VSTEP*. https://vstep.vnu.edu.vn
8. FPT University (2025). *Capstone Project Guidelines - SE Department*.

---

*Document Version: 1.1*
*Last Updated: January 2026*
*Status: Draft - Pending Section 6 (Scope & Limitations)*
