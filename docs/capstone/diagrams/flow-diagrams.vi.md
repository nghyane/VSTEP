# Sơ Đồ Luồng Hệ Thống Luyện Thi VSTEP Thích Ứng

## 1. Kiến Trúc Hệ Thống (Multi-Language)

```mermaid
flowchart TB
    subgraph Users ["Users"]
        L["Learner<br/>Practice, Mock Test, Progress"]
        I["Instructor<br/>Grading, Monitoring"]
        A["Admin<br/>User & Content Management"]
    end

    subgraph BunApp ["Bun Main Application"]
        subgraph API ["API Layer"]
            Auth["Authentication<br/>JWT, OAuth 2.0"]
            Validate["Request Validation<br/>Input sanitization"]
            Route["REST API<br/>Resource-oriented endpoints"]
        end

        subgraph Core ["Core Modules"]
            Assessment["Assessment<br/>Practice, Mock, Submission"]
            Progress["Progress<br/>Spider Chart, Sliding Window"]
            Content["Content<br/>Question Bank, Recommender"]
        end

        subgraph QueueClient ["Queue Client"]
            Enqueue["Job Publisher<br/>Redis Streams/RabbitMQ"]
            Poller["Status Poller<br/>Job completion check"]
        end
    end

    subgraph QueueInfra ["Message Queue"]
        Stream["Redis Streams<br/>Consumer groups"]
        Topics["Topics:<br/>grading.request, grading.callback"]
    end

    subgraph GradingService ["Grading Service (Python/Rust/Go)"]
        subgraph GradingAPI ["Grading API"]
            Receive["Job Receiver<br/>Validate, idempotency check"]
            Router["Task Router<br/>Essay → LLM, Speech → STT"]
        end

        subgraph GradingCore ["Grading Core"]
            LLMGrader["LLM Grader<br/>GPT/Gemini (Writing)"]
            STTGrader["STT Grader<br/>Whisper/API (Speaking)"]
            Scorer["Scorer Engine<br/>Rubric, confidence calc"]
        end

        subgraph GradingDB ["Grading Storage"]
            JobDB["Job State<br/>Pending, Processing, Done"]
            ResultDB["Results<br/>Scores, Feedback, Diagnostics"]
        end
    end

    subgraph External ["External Services"]
        LLMs["LLM APIs<br/>GPT-4, Gemini Pro"]
        STT APIs["Speech-to-Text<br/>Whisper, Azure"]
    end

    subgraph Observability ["Observability"]
        Logs["Structured Logs<br/>JSON, level-based"]
        Metrics["Metrics<br/>Prometheus format"]
        Traces["Distributed Traces<br/>OpenTelemetry"]
    end

    subgraph Data ["Data Layer"]
        MainDB["PostgreSQL<br/>Users, Content, Progress (Main App)"]
        GradingDB["PostgreSQL<br/>Grading Jobs, Results (Grading Service)"]
        Redis["Redis<br/>Session, Cache, Queue metadata"]
    end

    %% Styling
    classDef users fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef api fill:#e65100,stroke:#bf360c,color:#fff
    classDef core fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef queue fill:#ff8f00,stroke:#ff6f00,color:#fff
    classDef service fill:#6a1b9a,stroke:#4a148c,color:#fff
    classDef external fill:#00796b,stroke:#004d40,color:#fff
    classDef observability fill:#455a64,stroke:#37474f,color:#fff
    classDef data fill:#37474f,stroke:#263238,color:#fff

    class L,I,A users
    class Auth,Validate,Route,Enqueue,Poller api
    class Assessment,Progress,Content core
    class Stream,Topics queue
    class Receive,Router,LLMGrader,STTGrader,Scorer,JobDB,ResultDB service
    class LLMs,STT APIs external
    class Logs,Metrics,Traces observability
    class MainDB,GradingDB,Redis data

    %% User flows
    L --> Web["Web/PWA"]
    L --> Mobile["Mobile App"]
    Web --> Auth
    Mobile --> Auth
    Auth --> Route
    Route --> Assessment
    Route --> Progress
    Route --> Content

    %% Submission flow
    Assessment --> Enqueue
    Enqueue --> Stream
    Stream --> Topics
    Topics --> Receive
    Receive --> Router
    Router --> LLMGrader
    Router --> STTGrader
    LLMGrader --> LLMs
    STTGrader --> STT APIs
    LLMs --> Scorer
    STT APIs --> Scorer
    Scorer --> JobDB
    Scorer --> ResultDB
    JobDB --> Poller
    ResultDB --> Poller

    %% Results return
    Poller --> Progress
    Progress --> MainDB
    Content --> MainDB
    Assessment --> MainDB

    %% Observability
    Route --> Logs
    Assessment --> Traces
    Receive --> Traces
    Scorer --> Traces
    Traces --> Metrics
    Metrics --> Redis
```

> **Kiến trúc Multi-Language:**
> - **Main App (Bun)**: API, Auth, Assessment, Progress, Content - TypeScript
> - **Grading Service (Python/Rust/Go)**: AI Grading, STT, Scoring - ML-optimized language
> - **Giao tiếp**: REST + Queue (Redis Streams/RabbitMQ) với idempotency
> - **Database**: Tách biệt hoàn toàn - Main DB vs Grading DB
>
> **Nguyên tắc:**
> - Grading request → enqueue → async processing → poll callback → update progress
> - Strict API contract với `requestId` cho idempotency
> - Separate schemas, no cross-service writes

## 2. Hành Trình Người Dùng

```mermaid
flowchart LR
    Start(["Bắt đầu"])
    Reg["Đăng ký<br/>Email, OAuth (Google)"]
    Profile["Thiết lập Hồ sơ<br/>Role, Goals"]
    GoalSet["Thiết lập Goal<br/>Target Level, Timeline"]
    SelfAssess["Self-Assessment (Optional)<br/>3-5 phút, ước lượng level"]
    Select["Chọn Mode<br/>Practice hoặc Mock Test"]
    Practice["Practice Mode<br/>Adaptive Scaffolding"]
    Mock["Mock Test<br/>Full Exam Simulation"]
    Feedback["Feedback & Results<br/>AI + Human Grading"]
    Progress["Progress Tracking<br/>Spider Chart, Sliding Window"]
    GoalCheck{"Goal<br/>Đã đạt?"}
    Placement["Placement Test (Optional)<br/>Đánh giá đầy đủ 4 kỹ năng"]
    End(["Kết thúc"])

    Start --> Reg
    Reg --> Profile
    Profile --> GoalSet
    GoalSet --> SelfAssess
    SelfAssess --> Select
    Select --> Practice
    Select --> Mock
    Practice --> Feedback
    Mock --> Feedback
    Feedback --> Progress
    Progress --> GoalCheck
    GoalSet --> GoalCheck
    GoalCheck -->|Không| Select
    GoalCheck -->|Có| End
    SelfAssess -.->|Sau này| Placement

    classDef start fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef process fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef decision fill:#f57c00,stroke:#e65100,color:#fff
    classDef outcome fill:#7b1fa2,stroke:#4a148c,color:#fff
    classDef optional fill:#78909c,stroke:#546e7a,color:#fff,stroke-dasharray: 5 5

    class Start,End start
    class Reg,Profile,GoalSet,SelfAssess,Practice,Mock,Feedback,Progress,Select process
    class GoalCheck decision
    class Placement optional
```

## 3. Practice Mode với Adaptive Scaffolding

### 3A. Writing Adaptive Scaffolding

```mermaid
flowchart TB
    subgraph Input ["Input"]
        Task["Select Writing Task<br/>Task 1 (Email), Task 2 (Essay)"]
        Level["Determine Level<br/>Based on Placement/Test"]
    end

    subgraph Assessment ["Assessment"]
        Stage1["Stage 1: Template<br/>Full sentence starters"]
        Stage2["Stage 2: Keywords<br/>Key phrases, transitions"]
        Stage3["Stage 3: Free Writing<br/>No scaffolding"]
    end

    subgraph Scaffold ["Scaffolding Type"]
        Template["Template Mode<br/>Structure, Connectors, Time"]
        Keywords["Keywords Mode<br/>Topic words, Academic vocab"]
        Free["Free Writing<br/>Independent composition"]
    end

    subgraph Feedback ["Feedback"]
        Grammar["Grammar Check<br/>AI Instant Feedback"]
        Vocab["Vocabulary<br/>Word choice, Collocations"]
        Cohesion["Coherence & Cohesion<br/>Logic, Flow, Organization"]
        Task["Task Achievement<br/>Content coverage, Format"]
    end

    subgraph Progression ["Progression"]
        Up["Level Up<br/>Move to next stage"]
        Stay["Stay Same<br/>Repeat, More practice"]
        Down["Level Down<br/>Increase support"]
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

### 3B. Listening Adaptive Scaffolding

```mermaid
flowchart TB
    subgraph Input ["Input"]
        Exercise["Select Listening Exercise<br/>Dictation, MCQ, Summary"]
        Level["Determine Level<br/>Based on Placement/Test"]
    end

    subgraph Assessment ["Assessment"]
        Stage1["Stage 1: Full Text<br/>Transcript available"]
        Stage2["Stage 2: Highlights<br/>Key phrases shown"]
        Stage3["Stage 3: Pure Audio<br/>No visual support"]
    end

    subgraph Scaffold ["Scaffolding Type"]
        FullText["Full Text Mode<br/>Read while listening"]
        Highlights["Highlights Mode<br/>Key words emphasized"]
        PureAudio["Pure Audio Mode<br/>Audio only, no transcript"]
    end

    subgraph Feedback ["Feedback"]
        Accuracy["Accuracy Check<br/>Correct/Incorrect"]
        Script["Script View<br/>Compare with transcript"]
        Tips["Tips & Explanations<br/>Why answer is correct"]
    end

    subgraph Progression ["Progression"]
        Up["Level Up<br/>Remove scaffolding"]
        Stay["Stay Same<br/>Same support level"]
        Down["Increase Support<br/>Add scaffolding"]
    end

    Exercise --> Level
    Level -->|Beginner| Stage1
    Level -->|Intermediate| Stage2
    Level -->|Advanced| Stage3
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

## 4. Luồng Mock Test

```mermaid
flowchart TB
    subgraph Start ["Bắt đầu"]
        Intro["Test Introduction<br/>Format, Duration, Instructions"]
        Auth["Identity Verification<br/>Login, Session Token"]
    end

    subgraph Section1 ["Section 1: Listening (40 min)"]
        L1["Part 1: Pictures<br/>Question-Response"]
        L2["Part 2: Q&A<br/>Short Conversations"]
        L3["Part 3: Reading<br/>Passages, Questions"]
    end

    subgraph Section2 ["Section 2: Reading (60 min)"]
        R1["True/False/Not Given<br/>Identify statements"]
        R2["Multiple Choice<br/>Select correct answer"]
        R3["Matching/Fill-in<br/>Headings, Blanks"]
    end

    subgraph Section3 ["Section 3: Writing (60 min)"]
        W1["Task 1: Email/Letter<br/>150-180 words"]
        W2["Task 2: Essay<br/>300-350 words"]
    end

    subgraph Section4 ["Section 4: Speaking (12 min)"]
        S1["Part 1: Introduction<br/>Personal questions"]
        S2["Part 2: Cue Card<br/>1-2 min talk"]
        S3["Part 3: Discussion<br/>Follow-up questions"]
    end

    subgraph Submission ["Nộp bài"]
        Submit["Submit Test<br/>Confirm completion"]
        Verify["Verify Responses<br/>Check incomplete items"]
    end

    subgraph Scoring ["Chấm điểm"]
        ListeningScore["Listening Score<br/>Auto-graded MCQ"]
        ReadingScore["Reading Score<br/>Auto-graded MCQ"]
        WritingScore["Writing Score<br/>AI + Human Grading"]
        SpeakingScore["Speaking Score<br/>AI + Human Grading"]
    end

    subgraph Results ["Kết quả"]
        Total["Total Score<br/>4-Skill Average"]
        Breakdown["Skill Breakdown<br/>Each skill score"]
        Report["Detailed Report<br/>Spider Chart, Recommendations"]
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
    Verify -->|Complete| ListeningScore
    Verify -->|Incomplete| S3
    ListeningScore --> ReadingScore
    ReadingScore --> WritingScore
    WritingScore --> SpeakingScore
    SpeakingScore --> Total
    Total --> Breakdown
    Breakdown --> Report

    classDef start fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef section fill:#f57c00,stroke:#e65100,color:#fff
    classDef submission fill:#e65100,stroke:#bf360c,content:#fff
    classDef scoring fill:#7b1fa2,stroke:#4a148c,color:#fff
    classDef results fill:#37474f,stroke:#263238,color:#fff

    class Intro,Auth start
    class L1,L2,L3,R1,R2,R3,W1,W2,S1,S2,S3 section
    class Submit,Verify submission
    class ListeningScore,ReadingScore,WritingScore,SpeakingScore scoring
    class Total,Breakdown,Report results
```

## 5. Luồng Hybrid Grading

```mermaid
flowchart TB
    subgraph Submission ["Submission"]
        WritingSubmit["Writing Submission<br/>Essay, Email"]
        SpeakingSubmit["Speaking Submission<br/>Audio recording"]
    end

    subgraph AI_Writing ["AI Grading - Writing"]
        W_Grammar["Grammar Analysis<br/>Errors, Complexity"]
        W_Vocab["Vocabulary Analysis<br/>Range, Accuracy"]
        W_Content["Content Analysis<br/>Relevance, Coverage, Coherence"]
        W_Score["Writing Score<br/>Confidence calculated"]
    end

    subgraph AI_Speaking ["AI Grading - Speaking"]
        Transcribe["Speech-to-Text<br/>Convert audio to text"]
        S_Fluency["Fluency Assessment<br/>Pace, Pauses"]
        S_Pronunciation["Pronunciation<br/>Phonetic accuracy"]
        S_Content["Content Analysis<br/>Relevance, Coverage"]
        S_Score["Speaking Score<br/>Confidence calculated"]
    end

    subgraph Scoring ["Scoring"]
        Confidence{"Confidence<br/>Score > 85%?"}
        NoteConfidence("Weighted score:<br/>- Model self-consistency<br/>- Rule checks<br/>- Length validation<br/>- Templated detection<br/><br/><i>Note: Confidence is heuristic, not ML probability</i>")
        AutoPass["Auto-Grade<br/>High confidence"]
        HumanReview["Human Review<br/>Low confidence, Flagged"]
    end

    subgraph Human ["Human Grading"]
        Instructor["Instructor Portal<br/>Review, Comment"]
        Rubric["Rubric Scoring<br/>VSTEP criteria"]
        Override["Override AI<br/>If necessary"]
        ScoreFinal["Final Score<br/>AI + Human weighted"]
    end

    subgraph Final ["Final Output"]
        Feedback["Detailed Feedback<br/>Strengths, Weaknesses"]
        Suggestion["Suggestions<br/>Improvement areas"]
        Badge["Completion Badge / Report PDF"]
    end

    %% Writing flow (no Transcribe)
    WritingSubmit --> W_Grammar
    W_Grammar --> W_Vocab
    W_Vocab --> W_Content
    W_Content --> W_Score

    %% Speaking flow (needs Transcribe)
    SpeakingSubmit --> Transcribe
    Transcribe --> S_Fluency
    Transcribe --> S_Content
    S_Fluency --> S_Pronunciation
    S_Pronunciation --> S_Score

    %% Confidence check
    W_Score --> Confidence
    S_Score --> Confidence
    Confidence -->|Yes| AutoPass
    Confidence -->|No| HumanReview
    NoteConfidence -.-> Confidence

    %% Final flow
    AutoPass --> Feedback
    HumanReview --> Instructor
    Instructor --> Rubric
    Rubric --> Override
    Override --> ScoreFinal
    ScoreFinal --> Suggestion
    Suggestion --> Badge

    classDef submission fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef ai fill:#00796b,stroke:#004d40,color:#fff
    classDef scoring fill:#fbc02d,stroke:#f57f17,color:#000
    classDef human fill:#5d4037,stroke:#3e2723,color:#fff
    classDef final fill:#303f9f,stroke:#1a237e,color:#fff
    classDef note fill:#546e7a,stroke:#37474f,color:#fff

    class WritingSubmit,SpeakingSubmit submission
    class W_Grammar,W_Vocab,W_Content,W_Score ai
    class Transcribe,S_Fluency,S_Pronunciation,S_Content,S_Score ai
    class Confidence,AutoPass,HumanReview,NoteConfidence scoring
    class Instructor,Rubric,Override,ScoreFinal human
    class Feedback,Suggestion,Badge final
```

## 6. Luồng Progress Tracking & Learning Path

```mermaid
flowchart TB
    subgraph DataCollection ["Data Collection"]
        Scores["Test Scores<br/>Placement, Practice, Mock"]
        Attempts["Attempt History<br/>Questions answered"]
        Time["Time Spent<br/>Learning duration"]
        Accuracy["Accuracy Rate<br/>Correct/Total ratio"]
    end

    subgraph SpiderChart ["Spider Chart Visualization"]
        Skills["4 Skills Radar<br/>Listening, Reading, Writing, Speaking"]
        Levels["Level Indicators<br/>A1, A2, B1, B2, C1"]
        Gap["Skill Gap Analysis<br/>Identify weak areas"]
        History["Historical Trend<br/>Progress over time"]
    end

    subgraph SlidingWindow ["Sliding Window Analytics"]
        Window["Moving Average<br/>Last 10 attempts"]
        Trend["Trend Detection<br/>Improving, Stable, Declining"]
    end

    subgraph LearningPath ["Learning Path Generation"]
        Priority["Priority Calculation<br/>Lowest skill first"]
        Path["Recommended Path<br/>Exercises, Topics"]
        Timeline["Timeline Estimate<br/>Weeks to goal"]
        Adjust["Adaptive Adjustment<br/>Based on progress"]
    end

    subgraph Visualization ["Visualization"]
        Dashboard["User Dashboard<br/>Overview, Quick stats"]
        Report2["Detailed Report<br/>Exportable PDF"]
        Notification["Notifications<br/>Milestones, Reminders"]
    end

    Scores --> Skills
    Scores --> Window
    Attempts --> Skills
    Attempts --> Window
    Time --> Skills
    Time --> Window
    Accuracy --> Skills
    Accuracy --> Window
    Skills --> Gap
    Gap --> Priority
    Window --> Trend
    Priority --> Path
    Path --> Timeline
    Timeline --> Adjust
    Skills --> Dashboard
    Window --> Dashboard
    Gap --> Report2
    Trend --> Report2
    Path --> Notification

    classDef data fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef spider fill:#388e3c,stroke:#1b5e20,color:#fff
    classDef sliding fill:#f57c00,stroke:#e65100,color:#fff
    classDef path fill:#7b1fa2,stroke:#4a148c,color:#fff
    classDef viz fill:#00838f,stroke:#006064,color:#fff

    class Scores,Attempts,Time,Accuracy data
    class Skills,Levels,Gap,History spider
    class Window,Trend sliding
    class Priority,Path,Timeline,Adjust path
    class Dashboard,Report2,Notification viz
```

## 7. Authentication & RBAC

```mermaid
flowchart TB
    subgraph Auth ["Authentication"]
        Login["Login Page<br/>Email/Password"]
        OAuth["OAuth 2.0<br/>Google SSO"]
        Token["JWT Token<br/>Access + Refresh tokens"]
    end

    subgraph Verify ["Verification"]
        Validate["Validate Token<br/>Signature check"]
        Session["Session Management<br/>Redis cache"]
        Refresh["Token Refresh<br/>Before expiry"]
    end

    subgraph RBAC ["Role-Based Access Control"]
        Roles["Role Assignment<br/>Learner, Instructor, Admin"]
        Permissions["Permission Matrix<br/>Based on role"]
        Check["Permission Check<br/>Each request"]
    end

    subgraph Permissions ["Protected Resources"]
        PracticeRes["Practice Mode<br/>All authenticated users"]
        MockRes["Mock Test<br/>All authenticated users"]
        GradingRes["Grading Portal<br/>Instructors only"]
        AdminRes["Admin Panel<br/>Admins only"]
    end

    subgraph Session ["Session"]
        Active["Active Session<br/>User context"]
        Timeout["Session Timeout<br/>30 min inactivity"]
        Logout["Logout<br/>Clear session"]
    end

    Login --> Token
    OAuth --> Token
    Token --> Validate
    Validate --> Session
    Session --> Refresh
    Refresh --> Session
    Roles --> Permissions
    Permissions --> Check
    Check -->|Yes| PracticeRes
    Check -->|Yes| MockRes
    Check -->|Instructor| GradingRes
    Check -->|Admin| AdminRes
    PracticeRes --> Active
    MockRes --> Active
    GradingRes --> Active
    AdminRes --> Active
    Active --> Timeout
    Timeout -->|Expired| Logout

    classDef auth fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef verify fill:#e65100,stroke:#bf360c,color:#fff
    classDef rbac fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef permissions fill:#c62828,stroke:#b71c1c,color:#fff
    classDef resources fill:#6a1b9a,stroke:#4a148c,color:#fff
    classDef session fill:#455a64,stroke:#37474f,color:#fff

    class Login,OAuth,Token auth
    class Validate,Session,Refresh verify
    class Roles,Permissions,Check rbac
    class PracticeRes,MockRes,GradingRes,AdminRes permissions
    class Active,Timeout,Logout session
```

## Tóm Tắt Sơ Đồ

| Sơ đồ | Mục đích | Thành phần chính |
|-------|----------|------------------|
| **Kiến trúc Hệ thống** | Multi-Language Services | Bun (API/Core) + Python/Rust/Go (Grading) - Separate DB, Queue-based communication |
| **Hành trình Người dùng** | Vòng đời người học | Registration → Goal → Self-Assessment → Practice/Mock Test |
| **Practice Mode - Writing** | Adaptive Scaffolding Viết | Template → Keywords → Free Writing |
| **Practice Mode - Listening** | Adaptive Scaffolding Nghe | Full Text → Highlights → Pure Audio |
| **Mock Test Flow** | Thi thử giả lập | 4 Sections, Timer, Scoring, Results Report |
| **Hybrid Grading** | Đánh giá AI + Human | AI Instant → Human Override → Final Score |
| **Progress Tracking** | Analytics & visualization | Spider Chart, Sliding Window, Learning Path |
| **Authentication & RBAC** | Bảo mật & phân quyền | JWT, OAuth, Role-based permissions |

---

**Tóm tắt hệ thống:** Hệ thống ưu tiên giảm friction cho người học bằng cách cho phép chọn mục tiêu trước, sau đó sử dụng self-assessment và dữ liệu hành vi ban đầu để hiệu chỉnh mức độ học tập dần theo thời gian, thay vì phụ thuộc vào một bài placement test duy nhất.

*Tài liệu được tạo cho Hệ thống Luyện Thi VSTEP Thích Ứng (SP26SE145)*
