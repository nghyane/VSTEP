# Defense Presentation Guide

## Mục tiêu buổi bảo vệ

- Trình bày ngắn, tập trung demo.
- Nhấn mạnh cơ chế chấm điểm có công thức, không phụ thuộc 100% vào AI.
- Có con số validation cụ thể.
- Nêu rõ VSTEP là chuẩn mục tiêu, Cambridge/FCE chỉ là benchmark phụ có nguồn.

## Sườn slide chính

```text
1. Title
2. Vì sao VSTEP quan trọng?
3. Cấu trúc đề thi VSTEP
4. Vấn đề người học hiện nay
5. Giải pháp của nhóm
6. Scope alignment với phiếu đăng ký
7. Tổng quan hệ thống
8. Luồng học tập người dùng
9. Điểm khác biệt so với web luyện đề
10. Nguyên tắc chấm điểm
11. Công thức Writing
12. Tham số Writing
13. Cap/trừ điểm cho bài bất thường
14. Công thức Speaking
15. Validation scoring
16. Learning Path
17. Spaced Repetition/Anki
18. Deployment & CI/CD
19. Demo scenario
20. Demo checkpoints
21. Deliverables
22. Kết luận & hướng phát triển
```

## Phân chia thời gian 1 tiếng

```text
0–10 phút   Bối cảnh, vấn đề, giải pháp, scope alignment
10–20 phút  System overview và scoring principles
20–45 phút  Demo chính
45–52 phút  Validation, CI/CD, kết quả
52–60 phút  Q&A
```

## Chia vai 4 thành viên

```text
Member 1: VSTEP context, problem, solution, scope alignment
Member 2: System modules, learner flow, practice/thi thử demo
Member 3: Assessment Engine, scoring formula, validation numbers
Member 4: Learning path, Anki/SRS, admin/course/progress, CI/CD, conclusion
```

## Script mở đầu

```text
Kính thưa hội đồng,

Đề tài của nhóm là hệ thống luyện thi VSTEP thích ứng, hỗ trợ người học luyện đủ 4 kỹ năng, nhận phản hồi theo rubric và có lộ trình học tập cá nhân hóa.

Do thời gian có hạn, nhóm xin phép trình bày ngắn phần bối cảnh và tập trung vào demo sản phẩm, đặc biệt là cơ chế chấm điểm Writing/Speaking và luồng học tập của người dùng.
```

## Script scoring

```text
Điểm quan trọng nhất trong mô-đun chấm điểm là hệ thống không để AI quyết định điểm cuối.

AI chỉ hỗ trợ trích bằng chứng và tạo feedback. Điểm cuối được tính bằng công thức rubric do nhóm kiểm soát. Với Writing, hệ thống tính trên 4 tiêu chí: Task Fulfillment, Organization, Grammar và Vocabulary. Ngoài ra, hệ thống có các rule kiểm soát như content cap để tránh bài lạc đề hoặc quá ngắn vẫn được điểm cao.
```

## Slide scoring bắt buộc có

```text
Writing Score = TF × 30% + ORG × 20% + GR × 25% + VOC × 25%

Speaking Score = Grammar × 20% + Vocabulary × 20% + Fluency × 20% + Discourse × 20% + Pronunciation × 20%

Benchmark có nguồn: 9/9 khớp CEFR
Guardrail theo VSTEP: 5/5 xử lý đúng
```

## Không nên nói

- AI chấm điểm thay giám khảo.
- AI quyết định final score.
- Hệ thống tương đương chấm thi chính thức.
- Dynamic adaptive difficulty đã hoàn chỉnh toàn hệ thống.
- Predictive analytics ML đã triển khai đầy đủ.
- 99% uptime hoặc SLA cụ thể nếu chưa có benchmark.

## Nên nói

- Rubric-based scoring.
- AI-supported evidence extraction.
- Rule-based skill-gap recommendation.
- Vocabulary spaced repetition.
- Background processing cho tác vụ nặng.
- Validation trên referenced samples và VSTEP-style risk cases.

## Phụ lục nên chuẩn bị

- Writing formula detail.
- Speaking formula detail.
- Spaced repetition/Anki detail.
- Validation samples.
- CI/CD architecture.
- Database/module architecture.
