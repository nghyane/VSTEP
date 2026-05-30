# Decision Record — Assessment Validation Strategy

## Mục đích

Ghi lại cách kiểm chứng mô-đun chấm điểm để tránh nhầm lẫn giữa benchmark độ khớp và kiểm thử tình huống rủi ro.

## Quyết định

### 1. VSTEP là chuẩn mục tiêu

VSTEP là chuẩn format/rubric mục tiêu của sản phẩm:

- Writing Task 1: thư/email, tối thiểu 120 từ, khoảng 20 phút.
- Writing Task 2: essay, tối thiểu 250 từ, khoảng 40 phút.
- Tiêu chí Writing: Task Fulfillment, Organization, Vocabulary, Grammar.
- Thang điểm nội bộ: 0–10.
- Mapping: dưới 4.0 chưa đạt B1, 4.0–5.5 B1, 6.0–8.0 B2, 8.5–10.0 C1.

### 2. Benchmark và guardrail tách riêng

```text
Benchmark có nguồn
→ dùng để đo độ khớp mức năng lực dự đoán

Guardrail theo VSTEP
→ dùng để kiểm tra bài bất thường không bị chấm cao
```

### 3. Cambridge/FCE chỉ là benchmark phụ có nguồn

Cambridge/FCE được dùng vì có bài mẫu kèm điểm/nhận xét độc lập. Đây không phải chuẩn mục tiêu của sản phẩm và không phải quy đổi chính thức sang VSTEP.

### 4. Guardrail dùng tình huống theo VSTEP

Các tình huống rủi ro hiện có:

- Lạc đề.
- Quá ngắn.
- Copy lại đề.
- Lặp câu/spam.
- Không phải tiếng Anh.

Guardrail không dùng để báo cáo độ chính xác CEFR. Guardrail dùng để chứng minh hệ thống không chấm cao cho bài bất thường.

### 5. Không claim official equivalence

Validation hiện tại chứng minh tính nhất quán trên bộ mẫu chọn lọc, không thay thế chấm thi chính thức bởi giám khảo hoặc kiểm định đo lường quy mô lớn.

## Kết quả hiện tại

```text
Benchmark có nguồn: 9/9 khớp CEFR
Guardrail theo VSTEP: 5/5 xử lý đúng
```
