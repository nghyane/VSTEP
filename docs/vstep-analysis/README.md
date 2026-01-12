# VSTEP Analysis Documentation

> **Vietnamese Standardized Test of English Proficiency** - Phân tích toàn diện format đề thi B1, B2, C1

## 📋 Mục lục

| Phần | Mô tả | Link |
|------|-------|------|
| **Reading** | 4 passages, 40 MCQ, 60 phút | [📖 Chi tiết](./reading/README.md) |
| **Listening** | 3 parts, 35 MCQ, 40 phút | [🎧 Chi tiết](./listening/README.md) |
| **Writing Task 1** | Email/Letter, 120+ từ, 20 phút | [✍️ Chi tiết](./writing/task1-email-letter.md) |
| **Writing Task 2** | Essay, 250+ từ, 40 phút | [📝 Chi tiết](./writing/task2-essay.md) |
| **Speaking** | 3 parts, 12 phút | [🎤 Chi tiết](./speaking/README.md) |
| **Scoring** | Rubrics chi tiết cho Writing & Speaking | [📊 Chi tiết](./scoring/README.md) |

---

## 🎯 Tổng quan VSTEP

### Thông tin chung

| Thông tin | Chi tiết |
|-----------|----------|
| **Tên đầy đủ** | Vietnamese Standardized Test of English Proficiency |
| **Phát triển bởi** | Vietnam National University (VNU) |
| **Phiên bản** | VSTEP.3-5 (đánh giá B1 → C1) |
| **Chuẩn tham chiếu** | CEFR (Khung tham chiếu Châu Âu) |
| **4 Kỹ năng** | Listening, Reading, Writing, Speaking |
| **Tổng thời gian** | ~172 phút |

### Thang điểm & Level

| Điểm | VSTEP Level | CEFR | Đối tượng phù hợp |
|------|-------------|------|-------------------|
| 4.0 – 5.5 | Level 3 | **B1** | Sinh viên đại học, cao đẳng |
| 6.0 – 8.0 | Level 4 | **B2** | Giáo viên THPT, học viên cao học |
| 8.5 – 10 | Level 5 | **C1** | GV tiếng Anh, GV đại học |

---

## 📊 Cấu trúc bài thi

```
VSTEP Test (~172 phút)
├── 🎧 Listening (40 phút)
│   ├── Part 1: Announcements (Q1-8)
│   ├── Part 2: Conversations (Q9-20)
│   └── Part 3: Lectures (Q21-35)
│
├── 📖 Reading (60 phút)
│   ├── Passage 1: B1 level (Q1-10)
│   ├── Passage 2: B2 level (Q11-20)
│   ├── Passage 3: B2 level (Q21-30)
│   └── Passage 4: C1 level (Q31-40)
│
├── ✍️ Writing (60 phút)
│   ├── Task 1: Email/Letter (120+ từ) - 1/3 điểm
│   └── Task 2: Essay (250+ từ) - 2/3 điểm
│
└── 🎤 Speaking (12 phút)
    ├── Part 1: Social Interaction (2-3 phút)
    ├── Part 2: Solution Discussion (3-4 phút)
    └── Part 3: Topic Development (4-5 phút)
```

---

## ✍️ Writing - Focus chính

### Task 1: Email/Letter

| Loại thư | Formal | Informal |
|----------|--------|----------|
| Thank-you letter | ✓ | ✓ |
| Apology letter | ✓ | ✓ |
| Request letter | ✓ | |
| Application letter | ✓ | |
| Complaint letter | ✓ | |
| Advice letter | | ✓ |
| Invitation letter | ✓ | ✓ |

### Task 2: Essay Types

| Dạng | Nhận biết |
|------|-----------|
| **Opinion/Agree-Disagree** | "Do you agree or disagree?", "What is your opinion?" |
| **Discussion** | "Discuss both views and give your opinion" |
| **Problem-Solution** | "What are the causes and solutions?" |
| **Cause-Effect** | "What are the causes and effects?" |
| **Advantages-Disadvantages** | "What are the advantages and disadvantages?" |

### Tiêu chí chấm điểm (4 criteria)

1. **Task Fulfillment** - Hoàn thành nhiệm vụ
2. **Organization** - Tổ chức bài viết
3. **Vocabulary** - Từ vựng
4. **Grammar** - Ngữ pháp

---

## 🔢 Công thức tính điểm

### Writing Score
```
Writing = (Task 1 × 1/3) + (Task 2 × 2/3)
```

### Speaking Score
```
Speaking = (Grammar + Vocabulary + Pronunciation + Fluency + Discourse) ÷ 5
```

### Overall Score
```
Overall = (Listening + Reading + Writing + Speaking) ÷ 4
```

---

## 📁 Cấu trúc thư mục

```
docs/vstep-analysis/
├── README.md (file này)
├── reading/
│   └── README.md
├── listening/
│   └── README.md
├── writing/
│   ├── task1-email-letter.md
│   └── task2-essay.md
├── speaking/
│   └── README.md
├── scoring/
│   └── README.md
└── samples/
    └── (đề thi mẫu)
```

---

## 📚 Nguồn tham khảo chính

| Nguồn | URL |
|-------|-----|
| **VNU Official** | https://vstep.vnu.edu.vn |
| **VSTEP.edu.vn** | https://vstep.edu.vn |
| **ZIM Academy** | https://zim.vn |
| **English Test Store** | https://englishteststore.net |

---

## 🛠️ Sử dụng cho hệ thống luyện thi

### Data Models gợi ý

```typescript
// Question Types
interface QuestionType {
  skill: 'reading' | 'listening' | 'writing' | 'speaking';
  part: number;
  type: string; // e.g., 'main-idea', 'vocabulary', 'inference'
  level: 'B1' | 'B2' | 'C1';
}

// Writing Task
interface WritingTask {
  taskNumber: 1 | 2;
  type: 'email' | 'letter' | 'essay';
  subType?: string; // e.g., 'thank-you', 'opinion', 'problem-solution'
  minWords: number;
  timeMinutes: number;
  weight: number; // 0.33 or 0.67
}

// Scoring Criteria
interface ScoringCriteria {
  name: string;
  maxScore: 10;
  descriptors: Record<number, string>; // band -> description
}
```

### Features quan trọng

| Feature | Priority | Lý do |
|---------|----------|-------|
| Timer cho từng section | HIGH | Simulate điều kiện thi thật |
| Audio một lần (Listening) | HIGH | Đúng format |
| Word counter (Writing) | HIGH | Check minimum |
| Rubric-based scoring | HIGH | 4-5 criteria |
| Sample answers by level | MEDIUM | Tham khảo |
| Progress tracking | MEDIUM | Xác định điểm yếu |

---

*Tài liệu được tạo: Tháng 1/2026*
*Cập nhật lần cuối: Dựa trên đề thi thực tế 2024-2025*
