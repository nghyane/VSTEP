# Capstone Scope Alignment

## Mục đích

Đối chiếu phiếu đăng ký đề tài với phạm vi capstone hiện tại, tránh trình bày quá phạm vi khi viết báo cáo hoặc bảo vệ.

## Product vision từ phiếu đăng ký

- Hệ thống luyện thi VSTEP thích ứng.
- Đánh giá toàn diện 4 kỹ năng.
- Cá nhân hóa lộ trình học.
- Theo dõi tiến độ.
- Web application, mobile application, assessment engine, recommendation module, reporting/analytics.

## Current capstone scope

- Practice và mock test cho 4 kỹ năng.
- Listening/Reading chấm tự động theo đáp án.
- Writing/Speaking chấm theo rubric-based formulas.
- AI hỗ trợ trích bằng chứng và tạo feedback, không quyết định điểm cuối.
- Skill-gap recommendation dựa trên kết quả luyện tập/mock test.
- Vocabulary spaced repetition theo hướng Anki/SRS.
- Dashboard/progress tracking.
- Course/content/admin management trong phạm vi hiện tại.
- CI/CD và deployment bằng Docker/GitHub Actions.

## Những điểm cần diễn đạt cẩn thận

| Nội dung trong phiếu đăng ký | Cách diễn đạt trong current scope |
|---|---|
| Initial assessment | Không có placement test riêng; mock test/practice đầu tiên dùng làm baseline |
| Adaptive exercises | Hỗ trợ recommendation theo skill gap; dynamic difficulty toàn hệ thống là future work |
| Predictive analytics | Dashboard/rule-based insights hiện tại; ML prediction là future work |
| Teacher-assigned modules | Giáo viên theo dõi/hỗ trợ; giao module cá nhân hóa trực tiếp là future work |
| AI real-time dưới 3 giây | Tác vụ nặng như Writing/Speaking xử lý qua background job; không claim SLA chưa benchmark |
| 99% uptime | Không claim nếu chưa có production SLA và monitoring report |

## Future work

- Dynamic adaptive difficulty cho toàn bộ bài luyện.
- Predictive analytics dựa trên dữ liệu thực tế.
- Teacher-assigned individual modules.
- Benchmark VSTEP có điểm giám khảo chính thức/quy mô lớn.
- Scale testing và SLA measurement.

## Câu nên dùng khi bảo vệ

```text
Phiếu đăng ký thể hiện product vision ban đầu. Trong phạm vi capstone hiện tại, nhóm tập trung triển khai phần core gồm practice/mock test, rubric-based scoring, AI-supported feedback, learning path và spaced repetition. Các phần cần dữ liệu lớn hoặc vận hành production dài hạn được đưa vào hướng phát triển.
```
