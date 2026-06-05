# 05. Demo workflow script — kịch bản demo trực tiếp

File này dùng cho **phần của bạn: nói slide preview (Slide 18-21) + demo web thật, tổng ~6-7 phút**. Nhóm 4 người, các phần khác do người khác nói, nên phần này phải gọn và đúng. Toàn bộ thao tác, URL và nhãn nút dưới đây đã đối chiếu với code thực tế của `apps/frontend-v3` (learner web) và `apps/admin` (admin portal).

## Nguyên tắc khi demo

- **Trên slide: nói ít, nói đúng.** Mỗi workflow chỉ 1-2 câu, không đọc liệt kê. Để màn demo thật làm phần còn lại.
- Chỉ nói đúng thứ đang hiển thị trên màn hình. Không claim tính năng không bấm được.
- Không nói "AI chấm điểm". Câu chuẩn: **AI/công cụ ngoài chỉ trích xuất chỉ số đầu vào; backend tính điểm bằng công thức cố định**.
- Writing/Speaking chấm bất đồng bộ. Nếu kết quả chưa về kịp, dùng bài đã chấm sẵn trong lịch sử (xem mục Chuẩn bị).

## Phân bổ ~6-7 phút (của bạn)

- **Slide 18-21 (preview 3 workflow):** ~1 phút, nói lướt.
- **Demo web — Workflow 1 (Learner practice):** ~1 phút 30 giây — chỉ lướt vòng luyện tập + 1 màn feedback.
- **Demo web — Workflow 2 (Mock test & result):** ~3 phút — **trọng tâm, demo kỹ nhất**.
- **Demo web — Workflow 3 (Admin management):** ~1 phút 30 giây — chỉ vào rubric có version.
- **Buffer chuyển tab/đăng nhập:** ~30 giây.

> Nếu cháy giờ: giữ Workflow 2 đầy đủ, rút Workflow 1 còn 1 màn, Workflow 3 chỉ mở màn rubric list nói 1 câu.

## Lời thoại nói trên Slide 18-21 (văn nói, xưng "em", ~1 phút)

Đây là phần nói trên slide preview, TRƯỚC khi demo web. Đọc trực tiếp, không cần thao tác.

### Slide 18 — Demo Overview

```text
Dạ thưa hội đồng, sau phần công thức tính điểm, em xin chuyển sang phần demo sản phẩm.
Em xin giới thiệu trước ba phần mà nhóm em sẽ demo.
Phần thứ nhất: người học luyện tập và xem nhận xét.
Phần thứ hai: làm bài thi thử và xem kết quả từng kỹ năng.
Phần thứ ba: trang quản trị, dùng để quản lý nội dung và tiêu chí chấm điểm.
Ba slide sau là các bước thao tác, để hội đồng nắm trước trước khi em demo thật.
```

### Slide 19 — Demo Workflow 1: Learner Practice

```text
Phần đầu tiên là người học luyện tập.
Sau khi đăng nhập, người học vào trang tổng quan, rồi vào trang luyện tập.
Ở đây hệ thống gợi ý kỹ năng nên luyện trước, dựa trên kết quả học trước đó.
Người học chọn một kỹ năng, làm bài, nộp bài và xem nhận xét.
Bài trắc nghiệm thì có giải thích từng câu. Bài Viết và Nói thì có điểm theo từng tiêu chí và nhận xét để cải thiện.
Ý chính ở đây là: người học làm bài xong thì biết mình sai ở đâu và nên luyện gì tiếp, chứ không chỉ làm bài rồi thôi.
```

### Slide 20 — Demo Workflow 2: Mock Test & Result

```text
Phần thứ hai là làm bài thi thử và xem kết quả. Đây là phần em sẽ demo kỹ nhất.
Người học chọn một đề, có thể làm đủ bốn kỹ năng hoặc chọn một vài kỹ năng.
Bài thi làm lần lượt qua bốn kỹ năng Nghe, Đọc, Viết, Nói. Bài được tự động lưu trong lúc làm.
Nộp xong, người học xem được điểm tổng, điểm từng kỹ năng và nhận xét cho từng bài.
Nghe và Đọc có điểm ngay. Viết và Nói được chấm sau ít giây, kết quả tự hiện lên khi chấm xong.
Em xin nói rõ một ý: điểm Viết và Nói do hệ thống tính bằng công thức cố định, dựa trên các số liệu lấy ra từ bài làm. AI chỉ giúp lấy các số liệu đó, không tự cho điểm. Và đây là điểm để luyện tập, không phải điểm chính thức.
```

### Slide 21 — Demo Workflow 3: Admin Management

```text
Phần thứ ba là trang quản trị.
Người quản trị có thể quản lý nội dung học, đề thi, người dùng và khóa học ngay trên giao diện, không phải sửa tay trong code.
Phần em muốn nói rõ là tiêu chí chấm điểm. Mỗi bộ tiêu chí có nhiều phiên bản, với ba trạng thái: bản nháp, đang dùng, và đã lưu lại.
Người quản trị tạo bản nháp, chỉnh sửa, chạy thử để xem trước kết quả chấm, rồi mới cho áp dụng.
Như vậy công thức và mức điểm được quản lý theo phiên bản, và hệ thống luôn chấm bằng đúng bộ tiêu chí đang dùng.
Dạ trên đây là ba phần chính. Sau đây em xin demo trực tiếp trên sản phẩm.
```


## Chuẩn bị trước demo (bắt buộc)

- Đăng nhập sẵn 2 tài khoản trên 2 tab: **learner** (web) và **admin** (admin portal).
- Tài khoản learner phải còn **đủ xu** để vào thi thử (có trừ xu khi bắt đầu).
- Có sẵn **một bài thi thử đã chấm xong** trong lịch sử để mở ngay cho Workflow 2 (tránh chờ AI chấm).
- Có sẵn **một bài Writing đã chấm** để mở nếu cần ở Workflow 1.
- Chuẩn bị sẵn micro cho bước device check của thi thử.
- Mở sẵn các URL ở tab ẩn để chuyển nhanh, tránh gõ tay trước hội đồng.

---

## Workflow 1 — Learner Practice (~1 phút 30 giây)

**Mục tiêu nói với hội đồng:** cho thấy learner có một vòng luyện tập có phản hồi, không chỉ làm đề rồi thôi.

> **Rút gọn cho 1ph30:** chỉ cần Dashboard → Practice hub → mở **1 bài Writing đã chấm sẵn** trong "Bài đã nộp". Bỏ qua phần làm bài MCQ trực tiếp nếu thiếu thời gian.

### Lộ trình thao tác

1. **Dashboard** — `/dashboard`, tiêu đề "Tổng quan".
   - Chỉ nhanh: biểu đồ năng lực 4 kỹ năng (radar "Năng lực 4 kỹ năng"), streak, gợi ý hành động tiếp theo ở thẻ "Bắt đầu".
   - Bấm "Bắt đầu" để sang practice hub.

2. **Practice hub** — `/luyen-tap`, tiêu đề "Luyện tập".
   - Chỉ phần "Gợi ý": hệ thống ưu tiên kỹ năng yếu (nhãn "Ưu tiên / Cải thiện / Duy trì") dựa trên dữ liệu thi thử.
   - Hai nhóm: "Nền tảng" (Từ vựng, Ngữ pháp) và "Kỹ năng" (Nghe, Đọc, Viết, Nói).

3. **Demo một kỹ năng MCQ (Reading hoặc Listening)** — vào `/luyen-tap/doc` hoặc `/luyen-tap/nghe`, chọn một bài.
   - Trả lời vài câu, bấm "Next", khi đủ đáp án nút đổi thành "Finish".
   - Sau khi nộp: hiện giải thích từng câu ("Chính xác!" / "Chưa đúng", "Đáp án đúng: …") và popup hoàn thành.
   - Câu nói: phản hồi này có ngay vì trắc nghiệm chấm trực tiếp trên backend.

4. **Demo Writing practice** — `/luyen-tap/viet`, chọn một đề, vào màn soạn bài.
   - Chỉ nhanh: đếm từ trực tiếp, đếm lỗi ngôn ngữ trực tiếp, checklist "Yêu cầu" của đề.
   - Bấm "Nộp bài". Màn chuyển sang trạng thái "AI đang chấm bài..." kèm checklist "Quy trình chấm": đọc bài và nhận diện yêu cầu → trích xuất bằng chứng theo rubric → tính điểm từng tiêu chí → tạo nhận xét.
   - Khi có kết quả: chỉ "Điểm theo tiêu chí" (Task Fulfillment, Organization, Vocabulary, Grammar), "Chỉ số bài viết" (số từ, số câu, lỗi ngữ pháp...), "Checklist yêu cầu" và "Lỗi cần sửa".
   - **Câu chốt bắt buộc:** "AI ở đây chỉ trích xuất các chỉ số như số từ, lỗi, mức bao phủ đề. Điểm từng tiêu chí do backend tính bằng công thức cố định."

> Nếu AI chấm chậm: chuyển sang tab "Bài đã nộp" (`/luyen-tap/viet#history`), mở một bài đã chấm sẵn để hiển thị kết quả ngay.

### Lưu ý chống bắt lỗi (Workflow 1)

- **Speaking luyện tập KHÔNG có dạng "thu âm Part 1/2/3".** Trong web, luyện Speaking gồm **Shadowing** (nhại theo câu, AI đánh giá độ chính xác từng từ) và **Hội thoại AI** (roleplay, phản hồi từng lượt nói). Nếu hội đồng hỏi thu âm Part: dạng thu âm Speaking theo phần là ở **thi thử**, không phải luyện tập.
- Phần "Nhận xét AI" chi tiết (AI Coach) là **tốn xu**; điểm và rubric thì miễn phí. Nói rõ nếu bấm tới nút có ghi "{n} xu".
- Đừng vào `/luyen-tap/ket-qua` — route đó chỉ redirect, không phải trang kết quả.

---

## Workflow 2 — Mock Test & Result (~3 phút, trọng tâm)

**Mục tiêu nói với hội đồng:** cho thấy một lượt thi thử đầy đủ và màn kết quả có điểm thành phần, phản hồi theo tiêu chí cho cả 4 kỹ năng.

> **Mẹo giữ 3 phút:** đừng làm bài thi mới từ đầu trên hội đồng (mất thời gian + chờ AI). Mở thẳng **một lượt thi đã chấm xong trong "Lịch sử làm bài"** để vào ngay màn kết quả. Chỉ mô tả nhanh các bước vào thi bằng lời, demo kỹ ở màn kết quả.

### Lộ trình thao tác

1. **Thư viện đề thi** — `/thi-thu`, tiêu đề "Thư viện đề thi".
   - Mỗi đề có nút "Chi tiết" và nút hành động ("Tiếp tục" nếu đang dở).
   - Bấm "Chi tiết" vào một đề.

2. **Chi tiết đề thi** — `/thi-thu/$examId`.
   - Chỉ nhanh: chọn chế độ "Thi thử 4 kỹ năng" (full) hoặc tùy chọn kỹ năng (custom), bảng "Lịch sử làm bài".
   - Bên phải là bảng bắt đầu. Bấm nút bắt đầu ("Chuẩn bị vào thi").
   - **Nói rõ:** bắt đầu thi thử sẽ **trừ xu** (có toast "Đã trừ N xu").

3. **Device check** — màn kiểm tra thiết bị (micro) hiện ra trước khi vào phòng thi. Bấm "Bắt đầu làm bài".

4. **Phòng thi** — `/phong-thi/$sessionId`.
   - 4 kỹ năng làm **tuần tự, khóa cứng theo thứ tự Nghe → Đọc → Viết → Nói**. Mỗi lúc chỉ một kỹ năng.
   - Nút cuối màn: "Chốt Nghe và sang Đọc" (và tương tự). **Đã chốt thì không quay lại được** (có hộp xác nhận "Chốt {kỹ năng}?").
   - Header hiển thị trạng thái tự lưu: "Đã lưu HH:mm" / "Tự động lưu". Bài được lưu nháp liên tục.
   - Để tiết kiệm thời gian demo: chọn chế độ **custom ít kỹ năng** hoặc trả lời nhanh từng phần rồi tới kỹ năng cuối.
   - Ở kỹ năng cuối, nút đổi thành "Nộp bài". Bấm "Nộp bài" → xác nhận "Nộp bài".

5. **Kết quả** — vẫn ở `/phong-thi/$sessionId` (cùng route, đổi trạng thái sau khi nộp).
   - Banner "Tổng quan": "Band hiện tại", pill "Điểm tổng" (X/10) và "Nghe + Đọc" (số câu đúng).
   - Trạng thái chấm: "Đã có kết quả" / "Đang chấm điểm". Trắc nghiệm (Nghe, Đọc) có điểm ngay; Writing/Speaking chấm bất đồng bộ và **tự cập nhật** (banner "Writing/Speaking đang được chấm, kết quả sẽ tự cập nhật...").
   - Tab kỹ năng: mỗi kỹ năng có điểm X/10 và **badge số lỗi cần xem**.
   - Mở chi tiết từng kỹ năng:
     - Nghe/Đọc → "Review trắc nghiệm": lọc "Sai / Chưa làm", xem đáp án đúng + transcript/bài đọc.
     - Viết → "Writing Task N": đề bài, bài làm, "Điểm theo tiêu chí", "Nhận xét AI" ("Điểm mạnh", "Cần cải thiện", "Gợi ý viết lại").
     - Nói → "Speaking Part N": đề nói, audio, transcript, "Điểm theo tiêu chí", "Nhận xét AI".
   - **Câu chốt bắt buộc:** "Điểm từng kỹ năng do backend tổng hợp từ các chỉ số đầu vào bằng công thức cố định. Đây là điểm tham khảo cho luyện tập, không thay thế giám khảo chính thức."

> Nếu Writing/Speaking chưa chấm xong trong lúc demo: nói "phần này chấm bất đồng bộ và tự cập nhật", rồi mở **một lượt thi đã hoàn tất trong Lịch sử làm bài** để hiển thị đầy đủ điểm thành phần.

### Lưu ý chống bắt lỗi (Workflow 2)

- **Không có trang "processing" riêng.** Nộp xong về thẳng màn kết quả; "đang chấm" chỉ là banner + tự cập nhật mỗi vài giây. Đừng hứa có màn xử lý riêng.
- **Màn kết quả KHÔNG có mục "skill gaps / lộ trình".** Điểm yếu thể hiện qua: badge số lỗi mỗi kỹ năng, bộ lọc câu "Sai/Chưa làm", và phần "Cần cải thiện" trong nhận xét AI. Biểu đồ năng lực 4 kỹ năng (radar) nằm ở **Dashboard**, tính từ lịch sử thi thử — muốn nói về skill gap thì quay về Dashboard, đừng chỉ vào màn kết quả.
- 4 kỹ năng **khóa tuần tự, không nhảy tự do**; đã chốt không quay lại. Đừng thao tác như thể đổi qua lại được.
- Thi thử có **trừ xu** và **bước device check** — nhớ nói trước để hội đồng không bất ngờ.

---

## Workflow 3 — Admin Management (~1 phút 30 giây)

**Mục tiêu nói với hội đồng:** cho thấy hệ thống vận hành được qua giao diện quản trị, đặc biệt là tiêu chí chấm điểm có version, thay vì sửa tay trong code.

> **Rút gọn cho 1ph30:** chỉ tập trung vào **rubric có version** (`/grading` → mở 1 rubric). Đề thi/Users/Khóa học chỉ lướt sidebar nói 1 câu, hoặc bỏ nếu thiếu giờ.

### Lộ trình thao tác (admin portal)

1. **Đăng nhập admin** — `/login`. Vào được portal chỉ với vai trò admin/staff/teacher. Sau khi vào là Dashboard `/`.
   - Chỉ nhanh sidebar gom nhóm: "Nội dung", "Đề thi", "Luyện tập", "Quản lý", "Quản trị".

2. **Quản lý đề thi** — `/exams`, tiêu đề "Đề thi".
   - Nút "Tạo đề thi", "Import JSON".
   - Vào một đề `/exams/$examId`: mỗi đề có **nhiều phiên bản** ("Phiên bản đề thi"), nội dung chia 4 tab kỹ năng, có "Kích hoạt" version.

3. **Tiêu chí chấm điểm (rubric)** — `/grading`, tiêu đề "Rubric chấm điểm". (Chỉ admin thấy mục này.)
   - Nói: rubric có **version**, trạng thái ACTIVE / DRAFT / ARCHIVED. "Active để chấm bài mới, Draft để chỉnh sửa trước khi kích hoạt."
   - Mở một rubric `/grading/$rubricId`. Trình bày vòng đời: **tạo bản nháp (clone) → chỉnh sửa (Lưu bản nháp) → mô phỏng (Chạy mô phỏng) → kích hoạt (Kích hoạt)**.
   - Mở tab "Mô phỏng": nhập thông số, "Chạy mô phỏng" → ra band, bảng điểm từng tiêu chí, cảnh báo cap.
   - **Câu chốt bắt buộc:** "Công thức và ngưỡng nằm trong bộ tiêu chí có version. Admin tạo draft, mô phỏng, rồi kích hoạt — backend dùng đúng công thức này để chấm, không phải AI tự quyết điểm."

4. **Quản lý người dùng** (nếu còn thời gian) — `/users`, tiêu đề "Người dùng": tạo, sửa, khoá/mở, reset mật khẩu.

5. **Quản lý khóa học & booking** (nếu còn thời gian) — `/courses`, tiêu đề "Khóa học". Mở một khóa: các tab "Thông tin", "Buổi học", "Học viên", "Lịch 1-1", "Booking 1-1".

### Lưu ý chống bắt lỗi (Workflow 3)

- **Mô phỏng rubric và sửa policy hiện chỉ áp dụng cho Writing.** Speaking rubric hiện báo "Mô phỏng chỉ khả dụng cho Writing rubric". **Đừng demo "Chạy mô phỏng" trên rubric Speaking** — sẽ lộ giới hạn. Nếu hội đồng hỏi: nói thẳng đây là hạn chế hiện tại, Speaking đang dùng công thức cố định ở backend nhưng chưa mở trình mô phỏng trên UI.
- **Không có trang "Booking" riêng ở menu.** Booking nằm trong tab của Khóa học ("Lịch 1-1", "Booking 1-1") và view của teacher (`/teacher/bookings`). Đừng nói "vào mục Booking".
- **"Nội dung" tách làm hai chỗ:** "Nội dung" (Từ vựng `/vocab`, Ngữ pháp `/grammar`) và "Luyện tập" (`/practice/*` cho 4 kỹ năng). Đừng gộp thành một mục "Content".
- Rubric và Users **chỉ admin thấy**; staff không vào được. Nếu demo bằng tài khoản staff sẽ không thấy hai mục này.
- Có **hai hệ version khác nhau:** version của đề thi (trong `/exams`) và version của rubric chấm điểm (trong `/grading`). Đừng nói lẫn hai cái.

---

## Câu chuyển kết thúc demo

```text
Trên đây là ba luồng chính của hệ thống: learner luyện tập có phản hồi, thi thử với điểm thành phần và nhận xét theo tiêu chí, và admin quản lý nội dung cùng bộ tiêu chí chấm điểm có version. Nhóm em xin quay lại slide để tổng kết.
```

## Câu chốt vàng (dùng khi bị hỏi về AI/scoring trong lúc demo)

```text
Hệ thống không hỏi AI "bài này mấy điểm". AI và công cụ ngoài chỉ trích xuất chỉ số đầu vào và hỗ trợ feedback. Điểm Writing/Speaking trong luyện tập và thi thử do backend tính bằng công thức định lượng cố định, theo bộ tiêu chí có version. Đây là điểm tham khảo, không thay thế giám khảo VSTEP chính thức.
```
