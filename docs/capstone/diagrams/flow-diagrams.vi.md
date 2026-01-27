# Sơ Đồ Luồng Hệ Thống Luyện Thi VSTEP Thích Ứng

## 1. Kiến Trúc Hệ Thống

```mermaid
flowchart TB
    subgraph Users ["Users"]
        L["Learner<br/>Practice, Mock Test, Progress Tracking"]
        I["Instructor<br/>Grading Writing/Speaking, Monitoring"]
        A["Admin<br/>User Management, Content"]
    end

    subgraph Frontend ["Frontend Layer"]
        W["Web Application<br/>React/Next.js, Full-featured"]
        P["PWA<br/>Mobile Browser Access"]
        M["Mobile Application<br/>Native Android"]
    end

    subgraph Gateway ["API Gateway"]
        G["API Gateway<br/>Authentication, Rate Limiting, Routing"]
    end

    subgraph Core ["Core Services"]
        PM["Practice Mode<br/>Adaptive Exercises, Scaffolding"]
        MM["Mock Test Mode<br/>Full Test Simulation"]
        AE["Adaptive Engine<br/>Personalized Learning Path"]
        PT["Progress Tracking<br/>Spider Chart, Sliding Window"]
    end

    subgraph Grading ["Grading Service"]
        AI["AI Grading Engine<br/>LLM (GPT/Gemini), Speech-to-Text"]
        HG["Manual Grading Portal<br/>Instructor Review, Override"]
    end

    subgraph Data ["Data Layer"]
        DB["PostgreSQL<br/>Users, Questions, Results"]
        C["Redis<br/>Session, Cache"]
        F["S3/Cloud Storage<br/>Audio Files, Uploads"]
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
    Profile["Thiết lập Hồ sơ<br/>Role, Goals, Current Level"]
    Placement["Placement Test<br/>Đánh giá 4 kỹ năng"]
    Select["Chọn Mode<br/>Practice hoặc Mock Test"]
    Practice["Practice Mode<br/>Adaptive Scaffolding"]
    Mock["Mock Test<br/>Full Exam Simulation"]
    Feedback["Feedback & Results<br/>AI + Human Grading"]
    Progress["Progress Tracking<br/>Spider Chart, Sliding Window"]
    GoalCheck{"Goal<br/>Đã đạt?"}
    GoalSet["Thiết lập Goal<br/>Target Level, Timeline"]
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
    classDef decision fill:#f57c00,stroke:#e65100,color:#fff
    classDef outcome fill:#7b1fa2,stroke:#4a148c,color:#fff

    class Start,End start
    class Reg,Profile,Placement,Practice,Mock,Feedback,Progress,GoalSet process
    class GoalCheck decision
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

    subgraph AI ["AI Grading Pipeline"]
        Transcribe["Speech-to-Text<br/>Convert audio to text"]
        Grammar["Grammar Analysis<br/>Errors, Complexity"]
        Vocab["Vocabulary Analysis<br/>Range, Accuracy"]
        Content["Content Analysis<br/>Relevance, Coverage"]
        Fluency["Fluency Assessment<br/>Pace, Pauses (Speaking)"]
        Pronunciation["Pronunciation<br/>Phonetic accuracy (Speaking)"]
        ScoreAI["AI Score<br/>Confidence level calculated"]
    end

    subgraph Scoring ["Scoring"]
        Confidence{"Confidence<br/>Score > 85?"}
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
        Certificate["Certificate<br/>If passing score"]
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
    Confidence -->|Yes| AutoPass
    Confidence -->|No| HumanReview
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
        Prediction["Performance Prediction<br/>Expected score range"]
    end

    subgraph LearningPath ["Learning Path Generation"]
        Priority["Priority Calculation<br/>Lowest skill first"]
        Path["Recommended Path<br/>Exercises, Topics"]
        Timeline["Timeline Estimate<br/>Weeks to goal"]
        Adjust["Adaptive Adjustment<br/>Based on progress"]
    end

    subgraph Visualization ["Visualization"]
        Dashboard["User Dashboard<br/>Overview, Quick stats"]
        Report["Detailed Report<br/>Exportable PDF"]
        Notification["Notifications<br/>Milestones, Reminders"]
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

## 7. Authentication & RBAC

```mermaid
flowchart TB
    subgraph Auth ["Authentication"]
        Login["Login Page<br/>Email/Password"]
        OAuth["OAuth 2.0<br/>Google SSO"]
        MFA["Multi-Factor Auth<br/>Optional, Recommended"]
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
    MFA --> Token
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
| **Hành trình Người dùng** | Vòng đời người học | Registration → Placement → Practice/Mock Test → Progress |
| **Practice Mode - Writing** | Adaptive Scaffolding Viết | Template → Keywords → Free Writing |
| **Practice Mode - Listening** | Adaptive Scaffolding Nghe | Full Text → Highlights → Pure Audio |
| **Mock Test Flow** | Thi thử giả lập | 4 Sections, Timer, Scoring, Results Report |
| **Hybrid Grading** | Đánh giá AI + Human | AI Instant → Human Override → Final Score |
| **Progress Tracking** | Analytics & visualization | Spider Chart, Sliding Window, Learning Path |
| **Authentication & RBAC** | Bảo mật & phân quyền | JWT, OAuth, Role-based permissions |

---

*Tài liệu được tạo cho Hệ thống Luyện Thi VSTEP Thích Ứng (SP26SE145)*
