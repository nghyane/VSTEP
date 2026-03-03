# VSTEP Mobile — Sơ đồ luồng

Tài liệu mô tả các luồng hoạt động chính của ứng dụng di động VSTEP, sử dụng sơ đồ Mermaid.

## Mục lục

- [1. Luồng xác thực](#1-luồng-xác-thực)
- [2. Luồng Onboarding](#2-luồng-onboarding)
- [3. Luồng luyện tập](#3-luồng-luyện-tập)
- [4. Luồng bài thi](#4-luồng-bài-thi)
- [5. Luồng lớp học](#5-luồng-lớp-học)
- [6. Luồng điều hướng tổng quan](#6-luồng-điều-hướng-tổng-quan)
- [7. Luồng token tự động làm mới](#7-luồng-token-tự-động-làm-mới)
- [8. Luồng dữ liệu](#8-luồng-dữ-liệu)

---

## 1. Luồng xác thực

Khi ứng dụng khởi động, hệ thống kiểm tra token trong SecureStore để xác định trạng thái đăng nhập. Nếu token hợp lệ, người dùng được chuyển thẳng vào ứng dụng; nếu không, chuyển về màn hình đăng nhập.

```mermaid
graph TD
    A[Ứng dụng khởi động] --> B{Kiểm tra SecureStore}
    B -- Có token --> C[GET /api/auth/me]
    B -- Không có token --> L[Màn hình đăng nhập]

    C --> D{Token hợp lệ?}
    D -- Hợp lệ --> E["(app)/(tabs) — Trang chủ"]
    D -- Không hợp lệ --> F[Làm mới token]

    F --> G{Làm mới thành công?}
    G -- Thành công --> E
    G -- Thất bại --> H[Xóa token khỏi SecureStore]
    H --> L
```

### Đăng nhập

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant App as Ứng dụng
    participant API as Backend API
    participant SS as SecureStore

    U->>App: Nhập email + mật khẩu
    App->>API: POST /api/auth/login
    API-->>App: accessToken + refreshToken + user
    App->>SS: Lưu accessToken & refreshToken
    App->>App: setUser(user)
    App->>App: Chuyển hướng đến (app)/(tabs)
```

### Đăng ký

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant App as Ứng dụng
    participant API as Backend API
    participant SS as SecureStore

    U->>App: Nhập họ tên + email + mật khẩu
    App->>API: POST /api/auth/register
    API-->>App: accessToken + refreshToken + user
    App->>SS: Lưu accessToken & refreshToken
    App->>App: setUser(user)
    App->>App: Chuyển hướng đến (app)/(tabs)
```

### Đăng xuất

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant App as Ứng dụng
    participant API as Backend API
    participant SS as SecureStore
    participant RQ as React Query

    U->>App: Nhấn "Đăng xuất"
    App->>API: POST /api/auth/logout
    App->>SS: Xóa toàn bộ token
    App->>RQ: Xóa query cache
    App->>App: setUser(null)
    App->>App: Chuyển hướng đến màn hình đăng nhập
```

---

## 2. Luồng Onboarding

Khi người dùng mới chưa thiết lập mục tiêu học tập, ứng dụng tự động chuyển đến màn hình onboarding dạng wizard gồm 4 bước. Người dùng có thể truy cập lại wizard từ trang Hồ sơ để cập nhật mục tiêu.

```mermaid
graph TD
    A[Trang chủ] --> B{Đã có mục tiêu?}
    B -- Có --> C[Hiển thị trang chủ bình thường]
    B -- Chưa có --> D[Chuyển đến onboarding modal]

    D --> S0[Bước 0: Chào mừng<br/>Logo + lời chào]
    S0 --> S1[Bước 1: Chọn band mục tiêu<br/>B1 / B2 / C1]
    S1 --> S2[Bước 2: Thời gian học mỗi ngày<br/>15 / 30 / 45 / 60 phút]
    S2 --> S3[Bước 3: Thời hạn hoàn thành<br/>3 tháng / 6 tháng / 1 năm / Không]

    S3 --> E{Đã có mục tiêu cũ?}
    E -- Có --> F["PATCH /api/progress/goals/:id"]
    E -- Chưa --> G[POST /api/progress/goals]

    F --> H[Refetch tiến độ học tập]
    G --> H
    H --> I["router.replace('/(app)/(tabs)')"]
```

> **Chống spam điều hướng:** Sử dụng `isTransitioning` ref để chặn thao tác điều hướng trong lúc chuyển cảnh (~500ms).

> **Truy cập lại:** Hồ sơ → "Mục tiêu học tập" → cùng wizard (cập nhật mục tiêu hiện tại).

---

## 3. Luồng luyện tập

Người dùng chọn kỹ năng muốn luyện tập, hệ thống tải câu hỏi tương ứng. Bài Nghe/Đọc được chấm điểm ngay lập tức, còn bài Viết/Nói được chấm bất đồng bộ qua AI (Groq LLM).

```mermaid
graph TD
    A[Trang chủ / Tab Luyện tập] --> B[Chọn kỹ năng]
    B --> L[Nghe — Listening]
    B --> R[Đọc — Reading]
    B --> W[Viết — Writing]
    B --> S[Nói — Speaking]

    L --> Q[GET /api/questions?skill=X]
    R --> Q
    W --> Q
    S --> Q

    Q --> V{Loại câu hỏi}
    V -- Nghe / Đọc --> OV[ObjectiveView<br/>Trắc nghiệm MCQ]
    V -- Viết --> WV[WritingView<br/>Nhập văn bản]
    V -- Nói --> SV[SpeakingView<br/>Phần 1 / 2 / 3 + nhập text dự phòng]

    OV --> SUB[POST /api/submissions<br/>Gửi câu trả lời]
    WV --> SUB
    SV --> SUB

    SUB --> RS{Loại kết quả}
    RS -- Nghe / Đọc --> IM[Hiển thị điểm ngay lập tức]
    RS -- Viết / Nói --> POLL[Chờ chấm bất đồng bộ]
```

### Chi tiết chấm điểm bất đồng bộ (Viết / Nói)

```mermaid
sequenceDiagram
    participant App as Ứng dụng
    participant API as Backend API
    participant GW as Grading Worker
    participant LLM as Groq LLM

    App->>API: POST /api/submissions
    API-->>App: submission (trạng thái: đang chấm)
    API->>GW: Gửi bài vào hàng đợi
    GW->>LLM: Gọi AI chấm điểm
    LLM-->>GW: Kết quả + độ tin cậy

    alt Độ tin cậy cao
        GW->>API: Cập nhật → completed
    else Độ tin cậy trung bình / thấp
        GW->>API: Cập nhật → review_pending
        Note over API: Chờ giáo viên duyệt
    end

    loop Polling kết quả
        App->>API: GET /api/submissions/:id
        API-->>App: Trạng thái hiện tại
    end

    App->>App: Hiển thị kết quả khi hoàn tất
```

---

## 4. Luồng bài thi

Người dùng chọn bài thi từ danh sách, bắt đầu phiên thi, trả lời câu hỏi theo từng phần kỹ năng. Hệ thống tự động lưu bài mỗi 30 giây và hiển thị đồng hồ đếm ngược.

```mermaid
graph TD
    A[Tab Bài thi] --> B[Danh sách bài thi<br/>GET /api/exams]
    B --> C[Chọn bài thi]
    C --> D[Chi tiết bài thi<br/>GET /api/exams/:id]
    D --> |"Hiển thị: tiêu đề, thời lượng,<br/>phân bổ kỹ năng, số câu hỏi"| E["Nhấn 'Bắt đầu'"]
    E --> F[POST /api/exams/:id/start<br/>Tạo phiên thi]
    F --> G[Màn hình phiên thi]
```

### Chi tiết phiên thi

```mermaid
graph TD
    G[Màn hình phiên thi] --> H[Tải câu hỏi song song<br/>useQueries — staleTime: Infinity]
    H --> I[Hiển thị tab theo kỹ năng<br/>Nghe / Đọc / Viết / Nói]

    I --> J[Theo dõi câu trả lời<br/>Record‹string, SubmissionAnswer›]
    J --> K{Tự động lưu mỗi 30s}
    K --> |"dirty = true"| M[useSaveAnswers<br/>Lưu bài lên server]
    M --> N[Cập nhật trạng thái lưu]

    I --> O[Điều hướng câu hỏi<br/>Trước / Sau]
    I --> T[Đồng hồ đếm ngược<br/>Thanh trên cùng]

    J --> P["Nhấn 'Nộp bài'"]
    P --> Q[Alert xác nhận]
    Q --> R[POST /api/exams/sessions/:id/submit]
    R --> S[Màn hình kết quả<br/>Điểm từng kỹ năng + tổng điểm]
```

---

## 5. Luồng lớp học

Người dùng có thể xem danh sách lớp đã tham gia, tham gia lớp mới bằng mã mời, xem chi tiết lớp với danh sách thành viên và phản hồi từ giáo viên.

```mermaid
graph TD
    A[Tab Lớp học] --> B[Danh sách lớp đã tham gia<br/>GET /api/classes]
    B --> C{Hành động}

    C --> D["Nhấn 'Tham gia'"]
    D --> E[Nhập mã mời]
    E --> F[POST /api/classes/join]
    F --> G[Cập nhật danh sách lớp]

    C --> H[Chọn lớp]
    H --> I[Chi tiết lớp<br/>GET /api/classes/:id]
    I --> J[Danh sách thành viên]
    I --> K[Phản hồi của giáo viên<br/>GET /api/classes/:id/feedback]
    I --> L["Nhấn 'Rời lớp'"]
```

---

## 6. Luồng điều hướng tổng quan

Cấu trúc điều hướng của ứng dụng sử dụng Expo Router với các stack lồng nhau. Thanh tab dưới cùng có hiệu ứng spring animation, nút Bài thi ở giữa có biểu tượng hình tròn nổi bật.

```mermaid
graph TD
    ROOT[Root Stack] --> IDX[index<br/>Chuyển hướng theo trạng thái xác thực]

    ROOT --> AUTH["(auth) Stack<br/>Chưa đăng nhập"]
    AUTH --> LOGIN[login — Đăng nhập]
    AUTH --> REG[register — Đăng ký]

    ROOT --> APP["(app) Stack<br/>Đã đăng nhập"]

    APP --> TABS["(tabs) — 5 tab<br/>CustomTabBar với spring animation"]
    TABS --> TAB1["🏠 Trang chủ<br/>Hero, lưới kỹ năng, thống kê, thẻ mục tiêu"]
    TABS --> TAB2["📊 Tiến độ<br/>Thanh kỹ năng, biểu đồ mạng nhện, xu hướng"]
    TABS --> TAB3["📝 Bài thi<br/>Nút tròn ở giữa, danh sách bài thi"]
    TABS --> TAB4["👥 Lớp học<br/>Danh sách lớp + tham gia"]
    TABS --> TAB5["👤 Hồ sơ<br/>Thông tin, mật khẩu, bài nộp, mục tiêu, đăng xuất"]

    APP --> OB[onboarding — Modal]
    APP --> EXAM["exam/[id] — Chi tiết bài thi"]
    APP --> SESSION["session/[id] — Phiên thi"]
    APP --> PRAC[practice/index — Chọn kỹ năng]
    APP --> PRACSKILL["practice/[skill] — Luyện tập"]
    APP --> PRACRES["practice/result/[id] — Kết quả"]
    APP --> CLS[classes/index — Danh sách lớp]
    APP --> CLSDET["classes/[id] — Chi tiết lớp"]
    APP --> SKILL["skill/[name] — Chi tiết kỹ năng"]
    APP --> SUBS[submissions/index — Danh sách bài nộp]
    APP --> SUBSDET["submissions/[id] — Chi tiết bài nộp"]
```

---

## 7. Luồng token tự động làm mới

Khi một yêu cầu API trả về lỗi 401, hệ thống tự động thử làm mới token. Cơ chế sử dụng một promise duy nhất (`refreshPromise`) để tránh nhiều yêu cầu làm mới chạy đồng thời.

```mermaid
sequenceDiagram
    participant App as Ứng dụng
    participant Client as API Client
    participant SS as SecureStore
    participant API as Backend API

    App->>Client: Gửi yêu cầu API
    Client->>API: Request + Bearer token
    API-->>Client: 401 Unauthorized

    Client->>SS: Kiểm tra refreshToken
    alt Có refreshToken
        Client->>Client: Kiểm tra refreshPromise đang chạy?
        alt Chưa có promise
            Client->>API: POST /api/auth/refresh
            alt Làm mới thành công
                API-->>Client: accessToken + refreshToken mới
                Client->>SS: Lưu token mới
                Client->>API: Gửi lại yêu cầu ban đầu với token mới
                API-->>Client: Phản hồi thành công
                Client-->>App: Kết quả
            else Làm mới thất bại
                API-->>Client: Lỗi
                Client->>SS: Xóa toàn bộ token
                Client->>App: Chuyển hướng đến đăng nhập
            end
        else Đã có promise đang chạy
            Client->>Client: Chờ promise hiện tại hoàn thành
            Client->>API: Gửi lại yêu cầu với token mới
            API-->>Client: Phản hồi
            Client-->>App: Kết quả
        end
    else Không có refreshToken
        Client->>SS: Xóa toàn bộ token
        Client->>App: Chuyển hướng đến đăng nhập
    end
```

> **Lưu ý:** Biến `refreshPromise` đảm bảo chỉ có một yêu cầu làm mới token tại một thời điểm. Các yêu cầu 401 đồng thời sẽ chờ cùng một promise thay vì tạo nhiều yêu cầu làm mới.

---

## 8. Luồng dữ liệu

Kiến trúc luồng dữ liệu trong ứng dụng tuân theo mô hình một chiều: component gọi custom hook, hook sử dụng React Query để quản lý cache và đồng bộ, API Client xử lý giao tiếp HTTP với backend.

```mermaid
graph LR
    A[Màn hình<br/>Component] --> B[Custom Hook]
    B --> C["@tanstack/react-query<br/>Cache + Đồng bộ"]
    C --> D["API Client<br/>src/lib/api.ts"]
    D --> E[Backend REST API]
```

### Chi tiết API Client

```mermaid
graph TD
    D["API Client<br/>src/lib/api.ts"] --> F[Gắn Bearer token<br/>vào header Authorization]
    D --> G[Tự động làm mới<br/>khi nhận 401]
    D --> H[Serialize / Deserialize<br/>JSON]

    F --> I[Gửi yêu cầu HTTP]
    G --> I
    H --> I
    I --> E[Backend REST API]
```

### Luồng dữ liệu chi tiết

```mermaid
sequenceDiagram
    participant SC as Màn hình
    participant HK as Custom Hook
    participant RQ as React Query
    participant AC as API Client
    participant SS as SecureStore
    participant BE as Backend API

    SC->>HK: Gọi hook (vd: useExams)
    HK->>RQ: useQuery / useMutation
    RQ->>AC: Gọi queryFn / mutationFn
    AC->>SS: Lấy accessToken
    SS-->>AC: Token
    AC->>BE: HTTP Request + Bearer token
    BE-->>AC: JSON Response
    AC-->>RQ: Dữ liệu đã parse
    RQ-->>HK: data / isLoading / error
    HK-->>SC: Trả về state cho UI

    Note over RQ: Cache dữ liệu theo queryKey<br/>Tự động refetch khi stale<br/>Hỗ trợ optimistic update
```
