# 06. Giới hạn và câu hỏi

## Giới hạn chính

1. Automated scoring không thay thế giám khảo.
2. Chưa có bộ dữ liệu VSTEP chuẩn công khai có điểm giám khảo.
3. Speaking grammar phụ thuộc LanguageTool rule-based.
4. Pronunciation phụ thuộc Azure và chất lượng audio.
5. Gợi ý học tập hiện dựa trên điểm yếu theo kỹ năng, chưa phải mô hình machine learning thích ứng hoàn chỉnh.

## Q&A sản phẩm

### Hệ thống có chỉ là app chấm điểm không?

Không. Chấm điểm là module lõi. Toàn hệ thống gồm practice 4 kỹ năng, Writing/Speaking feedback, vocabulary, mock test, learning path và progress dashboard.

### Vocabulary liên quan gì đến assessment?

Kết quả practice/mock test cho biết learner yếu từ vựng ở kỹ năng/chủ đề nào. Từ đó hệ thống gợi ý học và ôn từ theo phương pháp ôn tập ngắt quãng.

### Learning path cá nhân hóa bằng gì?

Dựa trên điểm yếu theo kỹ năng, kết quả practice/mock test, từ vựng yếu và lịch sử tiến độ. Hiện là gợi ý học tập dựa trên điểm yếu.

### Hệ thống có chấm chính xác như giám khảo VSTEP không?

Không. Đây là practice assessment tool. Điểm chính thức vẫn cần giám khảo/instructor xác nhận.

### Không có VSTEP chuẩn thì chứng minh bằng gì?

Bằng việc bám tiêu chí đánh giá, dùng tín hiệu có nguồn tham chiếu, kiểm thử bằng bộ mẫu nội bộ, kiểm thử tình huống rủi ro và cung cấp căn cứ chấm điểm để kiểm tra lại.

### AI có tự chấm điểm không?

Không. AI/external services chỉ cung cấp signals. Backend tính điểm cuối theo rubric/formula.

### Nếu thí sinh nói lạc đề thì sao?

Hệ thống đánh giá content relevance khi có prompt/requirements. Nếu content factor thấp, hệ thống cap discourse và overall score.

### Mobile và payment có phải trọng tâm không?

Không. Demo chính trên web app. Mobile là learner module; payment/course booking là supporting module.

### Hướng phát triển?

- Thu thập human-rated VSTEP Writing/Speaking samples.
- Tích hợp GEC model cho learner English nếu cần.
- Mở rộng adaptive difficulty.
- Cải thiện instructor analytics.
