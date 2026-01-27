# Sơ Đồ Luồng Hệ Thống Luyện Thi VSTEP Thích Ứng

## 1. Kiến Trúc Hệ Thống

```mermaid
flowchart TB
    subgraph Users ["Người Dùng"]
        L["Người học<br/>Luyện tập, Thi thử, Theo dõi"]
        I["Giảng viên<br/>Chấm Viết/Nói, Giám sát"]
        A["Quản trị viên<br/>Quản lý người dùng, Nội dung"]
    end

    subgraph Frontend ["Lớp Giao Diện"]
        W["Ứng dụng Web<br/>React/Next.js, Đầy đủ tính năng"]
        P["PWA<br/>Truy cập qua trình duyệt di động"]
        M["Ứng dụng Di động<br/>Native Android"]
    end

    subgraph Gateway ["API Gateway"]
        G["API Gateway<br/>Xác thực, Giới hạn tốc độ, Định tuyến"]
    end

    subgraph Core ["Dịch Vụ Cốt Lõi"]
        PM["Chế độ Luyện tập<br/>Bài tập thích ứng, Hỗ trợ"]
        MM["Chế độ Thi thử<br/>Mô phỏng đề thi thật"]
        AE["Động cơ Thích ứng<br/>Lộ trình học cá nhân"]
        PT["Theo dõi Tiến độ<br/>Spider Chart, Sliding Window"]
    end

    subgraph Grading ["Dịch vụ Chấm Điểm"]
        AI["Động cơ AI Chấm<br/>LLM (GPT/Gemini), Speech-to-Text"]
        HG["Cổng Chấm Thủ công<br/>Giảng viên duyệt, Ghi đè"]
    end

    subgraph Data ["Lớp Dữ liệu"]
        DB["PostgreSQL<br/>Người dùng, Câu hỏi, Kết quả"]
        C["Redis<br/>Phiên, Bộ nhớ đệm"]
        F["S3/Lưu trữ Đám mây<br/>Tệp âm thanh, Tải lên"]
    end

    classDef users fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef frontend fill:#6a1b9a,stroke:#4a148c,color:#fff
    classDef gateway fill:#e65100,stroke:#bf360c,color:#fff
    classDef core fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef grading fill:#c62828,stroke:#b71c1c,color:#fff
    classDef data fill:#37474f,stroke:#263238,color:#fff

    class L,I,A users
    class W,P,M frontend
    class G gateway
    class PM,MM,AE,PT core
    class AI,HG grading
    class DB,C,F data

    L --> W
    L --> P
    L --> M
    I --> W
    I --> P
    A --> W
    W --> G
    P --> G
    M --> G
    G --> PM
    G --> MM
    G --> AE
    G --> PT
    PM --> AI
    MM --> AI
    MM --> HG
    PM --> HG
    AI --> DB
    HG --> DB
    AE --> DB
    PT --> DB
    AI --> F
    HG --> F
```

## 2. Hành Trình Người Dùng

```mermaid
flowchart LR
    Start(["Bắt đầu"])
    Reg["Đăng ký<br/>Email, OAuth (Google)"]
    Profile["Thiết lập Hồ sơ<br/>Vai trò, Mục tiêu, Trình độ"]
    Placement["Bài kiểm tra Đầu vào<br/>Đánh giá 4 kỹ năng"]
    Select["Chọn Chế độ<br/>Luyện tập hoặc Thi thử"]
    Practice["Chế độ Luyện tập<br/>Hỗ trợ thích ứng"]
    Mock["Thi thử Giả lập<br/>Đề thi đầy đủ"]
    Feedback["Phản hồi & Kết quả<br/>AI + Chấm thủ công"]
    Progress["Theo dõi Tiến độ<br/>Spider Chart, Sliding Window"]
    GoalCheck{"Mục tiêu<br/>Đã đạt?"}
    GoalSet["Thiết lập Mục tiêu<br/>Mức độ, Thời hạn"]
    End(["Kết thúc"])

    Start --> Reg
    Reg --> Profile
    Profile --> Placement
    Placement --> GoalSet
    GoalSet --> Select
    Select --> Practice
    Select --> Mock
    Practice --> Feedback
    Mock --> Feedback
    Feedback --> Progress
    Progress --> GoalCheck
    GoalSet --> GoalCheck
    GoalCheck -->|Không| Select
    GoalCheck -->|Có| End

    classDef start fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef process fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef decision fill:#f57c0,stroke:#e65100,color:#fff
    classDef outcome fill:#7b1fa2,stroke:#4a148c,color:#fff

    class Start,End start
    class Reg,Profile,Placement,Practice,Mock,Feedback,Progress,GoalSet process
    class GoalCheck decision
```

## 3. Luồng Luyện Tập với Hỗ Trợ Thích Ứng

### 3A. Hỗ Trợ Kỹ Năng Viết

```mermaid
flowchart TB
    subgraph Input ["Đầu vào"]
        Task["Chọn bài Viết<br/>Task 1 (Thư), Task 2 (Bài luận)"]
        Level["Xác định mức độ<br/>Dựa trên Placement Test"]
    end

    subgraph Assessment ["Đánh giá"]
        Stage1["Giai đoạn 1: Mẫu<br/>Câu mở đầu đầy đủ"]
        Stage2["Giai đoạn 2: Từ khóa<br/>Cụm từ then chốt"]
        Stage3["Giai đoạn 3: Viết tự do<br/>Không có gợi ý"]
    end

    subgraph Scaffold ["Loại Hỗ trợ"]
        Template["Chế độ Mẫu<br/>Cấu trúc, Từ nối, Thời gian"]
        Keywords["Chế độ Từ khóa<br/>Từ chủ đề, Từ học thuật"]
        Free["Viết tự do<br/>Tự viết không hỗ trợ"]
    end

    subgraph Feedback ["Phản hồi"]
        Grammar["Kiểm tra Ngữ pháp<br/>Phản hồi tức thì từ AI"]
        Vocab["Từ vựng<br/>Lựa chọn từ, Cụm từ"]
        Cohesion["Liên kết & Mạch lạc<br/>Logic, Luồng, Tổ chức"]
        Task["Hoàn thành Yêu cầu<br/>Nội dung, Định dạng"]
    end

    subgraph Progression ["Tiến trình"]
        Up["Lên cấp<br/>Chuyển sang giai đoạn cao hơn"]
        Stay["Giữ nguyên<br/>Luyện tập thêm"]
        Down["Giảm cấp<br/>Tăng hỗ trợ"]
    end

    Task --> Level
    Level -->|A1-A2| Stage1
    Level -->|B1| Stage2
    Level -->|B2-C1| Stage3
    Stage1 --> Template
    Stage2 --> Keywords
    Stage3 --> Free
    Template --> Grammar
    Keywords --> Grammar
    Free --> Grammar
    Grammar --> Vocab
    Vocab --> Cohesion
    Cohesion --> Task
    Task --> Up
    Task --> Stay
    Task --> Down

    classDef input fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef assessment fill:#f57c00,stroke:#e65100,color:#fff
    classDef scaffold fill:#388e3c,stroke:#1b5e20,color:#fff
    classDef feedback fill:#c62828,stroke:#b71c1c,color:#fff
    classDef progression fill:#6a1b9a,stroke:#4a148c,color:#fff

    class Task,Level input
    class Stage1,Stage2,Stage3 assessment
    class Template,Keywords,Free scaffold
    class Grammar,Vocab,Cohesion,Task feedback
    class Up,Stay,Down progression
```

### 3B. Hỗ Trợ Kỹ Năng Nghe

```mermaid
flowchart TB
    subgraph Input ["Đầu vào"]
        Exercise["Chọn bài Nghe<br/>Điền từ, Trắc nghiệm, Tóm tắt"]
        Level["Xác định mức độ<br/>Dựa trên Placement Test"]
    end

    subgraph Assessment ["Đánh giá"]
        Stage1["Giai đoạn 1: Toàn văn<br/>Có transcript"]
        Stage2["Giai đoạn 2: Gạch chân<br/>Cụm từ quan trọng"]
        Stage3["Giai đoạn 3: Thuần Âm<br/>Không hỗ trợ thị giác"]
    end

    subgraph Scaffold ["Loại Hỗ trợ"]
        FullText["Chế độ Toàn văn<br/>Đọc khi nghe"]
        Highlights["Chế độ Gạch chân<br/>Từ khóa được nhấn mạnh"]
        PureAudio["Chế độ Thuần Âm<br/>Chỉ âm thanh, không transcript"]
    end

    subgraph Feedback ["Phản hồi"]
        Accuracy["Kiểm tra Độ chính xác<br/>Đúng/Sai"]
        Script["Xem Script<br/>So sánh với bản ghi"]
        Tips["Mẹo & Giải thích<br/>Tại sao đáp án đúng"]
    end

    subgraph Progression ["Tiến trình"]
        Up["Lên cấp<br/>Giảm hỗ trợ"]
        Stay["Giữ nguyên<br/>Cùng mức hỗ trợ"]
        Down["Tăng hỗ trợ<br/>Thêm hỗ trợ"]
    end

    Exercise --> Level
    Level -->|Sơ cấp| Stage1
    Level -->|Trung cấp| Stage2
    Level -->|Cao cấp| Stage3
    Stage1 --> FullText
    Stage2 --> Highlights
    Stage3 --> PureAudio
    FullText --> Accuracy
    Highlights --> Accuracy
    PureAudio --> Accuracy
    Accuracy --> Script
    Script --> Tips
    Tips --> Up
    Tips --> Stay
    Tips --> Down

    classDef input fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef assessment fill:#f57c00,stroke:#e65100,color:#fff
    classDef scaffold fill:#388e3c,stroke:#1b5e20,color:#fff
    classDef feedback fill:#c62828,stroke:#b71c1c,color:#fff
    classDef progression fill:#6a1b9a,stroke:#4a148c,color:#fff

    class Exercise,Level input
    class Stage1,Stage2,Stage3 assessment
    class FullText,Highlights,PureAudio scaffold
    class Accuracy,Script,Tips feedback
    class Up,Stay,Down progression
```

## 4. Luồng Thi Thử Giả Lập

```mermaid
flowchart TB
    subgraph Start ["Bắt đầu"]
        Intro["Giới thiệu Đề thi<br/>Cấu trúc, Thời gian, Hướng dẫn"]
        Auth["Xác minh Danh tính<br/>Đăng nhập, Token phiên"]
    end

    subgraph Section1 ["Phần 1: Nghe (40 phút)"]
        L1["Phần 1: Hình ảnh<br/>Câu hỏi - Phản hồi"]
        L2["Phần 2: Hỏi đáp<br/>Đoạn hội thoại ngắn"]
        L3["Phần 3: Đọc<br/>Bài đọc, Câu hỏi"]
    end

    subgraph Section2 ["Phần 2: Đọc (60 phút)"]
        R1["True/False/Not Given<br/>Xác định mệnh đề"]
        R2["Trắc nghiệm<br/>Chọn đáp án đúng"]
        R3["Nối/Điền<br/>Tiêu đề, Chỗ trống"]
    end

    subgraph Section3 ["Phần 3: Viết (60 phút)"]
        W1["Task 1: Thư<br/>150-180 từ"]
        W2["Task 2: Bài luận<br/>300-350 từ"]
    end

    subgraph Section4 ["Phần 4: Nói (12 phút)"]
        S1["Phần 1: Giới thiệu<br/>Câu hỏi cá nhân"]
        S2["Phần 2: Bài thuyết trình<br/>Nói 1-2 phút"]
        S3["Phần 3: Thảo luận<br/>Câu hỏi tiếp theo"]
    end

    subgraph Submission ["Nộp bài"]
        Submit["Nộp Đề thi<br/>Xác nhận hoàn thành"]
        Verify["Xác minh Câu trả lời<br/>Kiểm tra mục chưa trả lời"]
    end

    subgraph Scoring ["Chấm điểm"]
        ListeningScore["Điểm Nghe<br/>Trắc nghiệm tự động"]
        ReadingScore["Điểm Đọc<br/>Trắc nghiệm tự động"]
        WritingScore["Điểm Viết<br/>AI + Chấm thủ công"]
        SpeakingScore["Điểm Nói<br/>AI + Chấm thủ công"]
    end

    subgraph Results ["Kết quả"]
        Total["Tổng điểm<br/>Trung bình 4 kỹ năng"]
        Breakdown["Chi tiết Kỹ năng<br/>Điểm từng kỹ năng"]
        Report["Báo cáo Chi tiết<br/>Spider Chart, Đề xuất"]
    end

    Intro --> Auth
    Auth --> L1
    L1 --> L2
    L2 --> L3
    L3 --> R1
    R1 --> R2
    R2 --> R3
    R3 --> W1
    W1 --> W2
    W2 --> S1
    S1 --> S2
    S2 --> S3
    S3 --> Submit
    Submit --> Verify
    Verify -->|Hoàn thành| ListeningScore
    Verify -->|Chưa hoàn thành| S3
    ListeningScore --> ReadingScore
    ReadingScore --> WritingScore
    WritingScore --> SpeakingScore
    SpeakingScore --> Total
    Total --> Breakdown
    Breakdown --> Report

    classDef start fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef section fill:#f57c00,stroke:#e65100,color:#fff
    classDef submission fill:#e65100,stroke:#bf360c,color:#fff
    classDef scoring fill:#7b1fa2,stroke:#4a148c,color:#fff
    classDef results fill:#37474f,stroke:#263238,color:#fff

    class Intro,Auth start
    class L1,L2,L3,R1,R2,R3,W1,W2,S1,S2,S3 section
    class Submit,Verify submission
    class ListeningScore,ReadingScore,WritingScore,SpeakingScore scoring
    class Total,Breakdown,Report results
```

## 5. Luồng Chấm Điểm Kết Hợp (Hybrid Grading)

```mermaid
flowchart TB
    subgraph Submission ["Nộp bài"]
        WritingSubmit["Bài Viết<br/>Bài luận, Thư"]
        SpeakingSubmit["Bài Nói<br/>Ghi âm"]
    end

    subgraph AI ["Quy trình AI"]
        Transcribe["Speech-to-Text<br/>Chuyển âm thanh thành văn bản"]
        Grammar["Phân tích Ngữ pháp<br/>Lỗi, Độ phức tạp"]
        Vocab["Phân tích Từ vựng<br/>Phạm vi, Độ chính xác"]
        Content["Phân tích Nội dung<br/>Mức độ liên quan, Bao phủ"]
        Fluency["Đánh giá Trôi chảy<br/>Tốc độ, Dừng (Nói)"]
        Pronunciation["Phát âm<br/>Độ chính xác âm học (Nói)"]
        ScoreAI["Điểm AI<br/>Mức độ tin cậy tính toán"]
    end

    subgraph Scoring ["Chấm điểm"]
        Confidence{"Độ tin cậy<br/>Điểm > 85?"}
        AutoPass["Chấm tự động<br/>Độ tin cậy cao"]
        HumanReview["Duyệt thủ công<br/>Độ tin cậy thấp, Đánh dấu"]
    end

    subgraph Human ["Chấm thủ công"]
        Instructor["Cổng Giảng viên<br/>Duyệt, Bình luận"]
        Rubric["Chấm theo Rubric<br/>Tiêu chí VSTEP"]
        Override["Ghi đè AI<br/>Nếu cần thiết"]
        ScoreFinal["Điểm cuối<br/>Kết hợp AI + Người"]
    end

    subgraph Final ["Kết quả cuối"]
        Feedback["Phản hồi Chi tiết<br/>Điểm mạnh, Điểm yếu"]
        Suggestion["Đề xuất<br/>Cải thiện"]
        Certificate["Chứng chỉ<br/>Nếu đạt điểm"]
    end

    WritingSubmit --> Transcribe
    SpeakingSubmit --> Transcribe
    Transcribe --> Grammar
    Grammar --> Vocab
    Vocab --> Content
    Content --> Fluency
    Fluency --> Pronunciation
    Pronunciation --> ScoreAI
    ScoreAI --> Confidence
    Confidence -->|Có| AutoPass
    Confidence -->|Không| HumanReview
    AutoPass --> Feedback
    HumanReview --> Instructor
    Instructor --> Rubric
    Rubric --> Override
    Override --> ScoreFinal
    ScoreFinal --> Suggestion
    Suggestion --> Certificate

    classDef submission fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef ai fill:#00796b,stroke:#004d40,color:#fff
    classDef scoring fill:#fbc02d,stroke:#f57f17,color:#000
    classDef human fill:#5d4037,stroke:#3e2723,color:#fff
    classDef final fill:#303f9f,stroke:#1a237e,color:#fff

    class WritingSubmit,SpeakingSubmit submission
    class Transcribe,Grammar,Vocab,Content,Fluency,Pronunciation,ScoreAI ai
    class Confidence,AutoPass,HumanReview scoring
    class Instructor,Rubric,Override,ScoreFinal human
    class Feedback,Suggestion,Certificate final
```

## 6. Luồng Theo Dõi Tiến Độ & Lộ Trình Học

```mermaid
flowchart TB
    subgraph DataCollection ["Thu thập Dữ liệu"]
        Scores["Điểm thi<br/>Placement, Luyện tập, Thi thử"]
        Attempts["Lịch sử Lần làm<br/>Câu trả lời"]
        Time["Thời gian Học<br/>Thời lượng học"]
        Accuracy["Tỷ lệ Chính xác<br/>Đúng/Tổng số"]
    end

    subgraph SpiderChart ["Trực quan Spider Chart"]
        Skills["Radar 4 kỹ năng<br/>Nghe, Đọc, Viết, Nói"]
        Levels["Chỉ báo Mức độ<br/>A1, A2, B1, B2, C1"]
        Gap["Phân tích Khoảng trống<br/>Xác định điểm yếu"]
        History["Xu hướng Lịch sử<br/>Tiến bộ theo thời gian"]
    end

    subgraph SlidingWindow ["Phân tích Sliding Window"]
        Window["Trung bình Động<br/>10 lần gần nhất"]
        Trend["Phát hiện Xu hướng<br/>Cải thiện, Ổn định, Suy giảm"]
        Prediction["Dự đoán Hiệu suất<br/>Khoảng điểm dự kiến"]
    end

    subgraph LearningPath ["Tạo Lộ trình Học"]
        Priority["Tính Ưu tiên<br/>Kỹ năng thấp nhất trước"]
        Path["Đường dẫn Đề xuất<br/>Bài tập, Chủ đề"]
        Timeline["Ước tính Thời gian<br/>Tuần đến mục tiêu"]
        Adjust["Điều chỉnh Thích ứng<br/>Dựa trên tiến bộ"]
    end

    subgraph Visualization ["Trực quan"]
        Dashboard["Bảng điều khiển<br/>Tổng quan, Thống kê nhanh"]
        Report["Báo cáo Chi tiết<br/>Xuất PDF"]
        Notification["Thông báo<br/>Mốc quan trọng, Nhắc nhở"]
    end

    Scores --> DataCollection
    Attempts --> DataCollection
    Time --> DataCollection
    Accuracy --> DataCollection
    DataCollection --> Skills
    DataCollection --> Window
    Skills --> Gap
    Gap --> Priority
    Window --> Trend
    Trend --> Prediction
    Priority --> Path
    Prediction --> Timeline
    Path --> Adjust
    Skills --> Dashboard
    Window --> Dashboard
    Gap --> Report
    Trend --> Report
    Path --> Notification

    classDef data fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef spider fill:#388e3c,stroke:#1b5e20,color:#fff
    classDef sliding fill:#f57c00,stroke:#e65100,color:#fff
    classDef path fill:#7b1fa2,stroke:#4a148c,color:#fff
    classDef viz fill:#00838f,stroke:#006064,color:#fff

    class Scores,Attempts,Time,Accuracy data
    class Skills,Levels,Gap,History spider
    class Window,Trend,Prediction sliding
    class Priority,Path,Timeline,Adjust path
    class Dashboard,Report,Notification viz
```

## 7. Xác Thực & Kiểm Soát Truy Cập Theo Vai Trò

```mermaid
flowchart TB
    subgraph Auth ["Xác thực"]
        Login["Trang Đăng nhập<br/>Email/Mật khẩu"]
        OAuth["OAuth 2.0<br/>Google SSO"]
        MFA["Xác thực Đa yếu tố<br/>Tùy chọn, Khuyến nghị"]
        Token["JWT Token<br/>Access + Refresh tokens"]
    end

    subgraph Verify ["Xác minh"]
        Validate["Xác thực Token<br/>Kiểm tra chữ ký"]
        Session["Quản lý Phiên<br/>Bộ nhớ đệm Redis"]
        Refresh["Làm mới Token<br/>Trước khi hết hạn"]
    end

    subgraph RBAC ["Kiểm soát Truy cập Theo Vai trò"]
        Roles["Gán Vai trò<br/>Người học, Giảng viên, Quản trị"]
        Permissions["Ma trận Quyền<br/>Dựa trên vai trò"]
        Check["Kiểm tra Quyền<br/>Mỗi yêu cầu"]
    end

    subgraph Permissions ["Tài nguyên Được bảo vệ"]
        PracticeRes["Chế độ Luyện tập<br/>Tất cả người dùng đăng nhập"]
        MockRes["Thi thử<br/>Tất cả người dùng đăng nhập"]
        GradingRes["Cổng Chấm điểm<br/>Chỉ Giảng viên"]
        AdminRes["Bảng Quản trị<br/>Chỉ Quản trị viên"]
    end

    subgraph Session ["Phiên"]
        Active["Phiên Hoạt động<br/>Ngữ cảnh người dùng"]
        Timeout["Hết phiên<br/>30 phút không hoạt động"]
        Logout["Đăng xuất<br/>Xóa phiên"]
    end

    Login --> Token
    OAuth --> Token
    MFA --> Token
    Token --> Validate
    Validate --> Session
    Session --> Refresh
    Refresh --> Session
    Roles --> Permissions
    Permissions --> Check
    Check -->|Có| PracticeRes
    Check -->|Có| MockRes
    Check -->|Giảng viên| GradingRes
    Check -->|Quản trị viên| AdminRes
    PracticeRes --> Active
    MockRes --> Active
    GradingRes --> Active
    AdminRes --> Active
    Active --> Timeout
    Timeout -->|Hết hạn| Logout

    classDef auth fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef verify fill:#e65100,stroke:#bf360c,color:#fff
    classDef rbac fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef permissions fill:#c62828,stroke:#b71c1c,color:#fff
    classDef resources fill:#6a1b9a,stroke:#4a148c,color:#fff
    classDef session fill:#455a64,stroke:#37474f,color:#fff

    class Login,OAuth,MFA,Token auth
    class Validate,Session,Refresh verify
    class Roles,Permissions,Check rbac
    class PracticeRes,MockRes,GradingRes,AdminRes permissions
    class Active,Timeout,Logout session
```

## Tóm Tắt Sơ Đồ

| Sơ đồ | Mục đích | Thành phần chính |
|-------|----------|------------------|
| **Kiến trúc Hệ thống** | Thiết kế tổng thể | Frontend, API Gateway, Core Services, Grading, Data Layer |
| **Hành trình Người dùng** | Vòng đời người học | Đăng ký → Placement → Luyện tập/Thi thử → Tiến độ |
| **Luyện tập - Viết** | Hỗ trợ kỹ năng Viết | Template → Keywords → Viết tự do |
| **Luyện tập - Nghe** | Hỗ trợ kỹ năng Nghe | Full Text → Highlights → Pure Audio |
| **Thi thử Giả lập** | Thi thử đầy đủ | 4 phần, Timer, Chấm điểm, Báo cáo |
| **Hybrid Grading** | Đánh giá AI + Người | AI tức thì → Ghi đè người → Điểm cuối |
| **Theo dõi Tiến độ** | Analytics & trực quan | Spider Chart, Sliding Window, Learning Path |
| **Xác thực & RBAC** | Bảo mật & phân quyền | JWT, OAuth, Role-based permissions |

---

*Tài liệu được tạo cho Hệ thống Luyện Thi VSTEP Thích Ứng (SP26SE145)*
