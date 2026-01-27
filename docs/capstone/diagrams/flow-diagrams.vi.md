# Flow Diagrams for Adaptive VSTEP Training System

## 1. System Architecture

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

## 2. User Journey

```mermaid
flowchart LR
    Start(["Start"])
    Reg["Register<br/>Email, OAuth (Google)"]
    Profile["Profile Setup<br/>Role, Goals, Proficiency"]
    Placement["Placement Test<br/>4-Skill Assessment"]
    Select["Select Mode<br/>Practice or Mock Test"]
    Practice["Practice Mode<br/>Adaptive Scaffolding"]
    Mock["Mock Test<br/>Full Test"]
    Feedback["Feedback & Results<br/>AI + Human Grading"]
    Progress["Progress Tracking<br/>Spider Chart, Sliding Window"]
    GoalCheck{"Goals<br/>Achieved?"}
    GoalSet["Set Goals<br/>Target Level, Deadline"]
    End(["End"])

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
    GoalCheck -->|No| Select
    GoalCheck -->|Yes| End

    classDef start fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef process fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef decision fill:#f57c0,stroke:#e65100,color:#fff
    classDef outcome fill:#7b1fa2,stroke:#4a148c,color:#fff

    class Start,End start
    class Reg,Profile,Placement,Practice,Mock,Feedback,Progress,GoalSet process
    class GoalCheck decision
```

## 3. Practice Flow with Adaptive Scaffolding

### 3A. Writing Skill Scaffolding

```mermaid
flowchart TB
    subgraph Input ["Input"]
        Task["Select Writing<br/>Task 1 (Letter), Task 2 (Essay)"]
        Level["Determine Level<br/>Based on Placement Test"]
    end

    subgraph Assessment ["Assessment"]
        Stage1["Stage 1: Template<br/>Complete Opening Sentences"]
        Stage2["Stage 2: Keywords<br/>Key Phrases"]
        Stage3["Stage 3: Free Writing<br/>No Prompts"]
    end

    subgraph Scaffold ["Scaffolding Type"]
        Template["Template Mode<br/>Structure, Connectors, Time"]
        Keywords["Keywords Mode<br/>Topic Words, Academic Words"]
        Free["Free Writing<br/>Write Without Support"]
    end

    subgraph Feedback ["Feedback"]
        Grammar["Grammar Check<br/>Instant AI Feedback"]
        Vocab["Vocabulary<br/>Word Choice, Phrases"]
        Cohesion["Cohesion & Coherence<br/>Logic, Flow, Organization"]
        Task["Task Completion<br/>Content, Format"]
    end

    subgraph Progression ["Progression"]
        Up["Level Up<br/>Move to Higher Stage"]
        Stay["Stay Same<br/>More Practice"]
        Down["Level Down<br/>Increase Support"]
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

### 3B. Listening Skill Scaffolding

```mermaid
flowchart TB
    subgraph Input ["Input"]
        Exercise["Select Listening<br/>Fill-in, Multiple Choice, Summary"]
        Level["Determine Level<br/>Based on Placement Test"]
    end

    subgraph Assessment ["Assessment"]
        Stage1["Stage 1: Full Text<br/>With Transcript"]
        Stage2["Stage 2: Highlights<br/>Key Phrases"]
        Stage3["Stage 3: Pure Audio<br/>No Visual Support"]
    end

    subgraph Scaffold ["Scaffolding Type"]
        FullText["Full Text Mode<br/>Read While Listening"]
        Highlights["Highlights Mode<br/>Emphasized Keywords"]
        PureAudio["Pure Audio Mode<br/>Audio Only, No Transcript"]
    end

    subgraph Feedback ["Feedback"]
        Accuracy["Check Accuracy<br/>True/False"]
        Script["View Script<br/>Compare with Transcript"]
        Tips["Tips & Explanations<br/>Why Answer is Correct"]
    end

    subgraph Progression ["Progression"]
        Up["Level Up<br/>Decrease Support"]
        Stay["Stay Same<br/>Same Support Level"]
        Down["Increase Support<br/>Add More Support"]
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

## 4. Mock Test Flow

```mermaid
flowchart TB
    subgraph Start ["Start"]
        Intro["Test Introduction<br/>Structure, Time, Instructions"]
        Auth["Identity Verification<br/>Login, Session Token"]
    end

    subgraph Section1 ["Section 1: Listening (40 minutes)"]
        L1["Part 1: Pictures<br/>Question-Response"]
        L2["Part 2: Q&A<br/>Short Conversations"]
        L3["Part 3: Reading<br/>Passage, Questions"]
    end

    subgraph Section2 ["Section 2: Reading (60 minutes)"]
        R1["True/False/Not Given<br/>Statement Identification"]
        R2["Multiple Choice<br/>Select Correct Answer"]
        R3["Matching/Fill<br/>Headings, Gaps"]
    end

    subgraph Section3 ["Section 3: Writing (60 minutes)"]
        W1["Task 1: Letter<br/>150-180 words"]
        W2["Task 2: Essay<br/>300-350 words"]
    end

    subgraph Section4 ["Section 4: Speaking (12 minutes)"]
        S1["Part 1: Introduction<br/>Personal Questions"]
        S2["Part 2: Presentation<br/>Speak 1-2 minutes"]
        S3["Part 3: Discussion<br/>Follow-up Questions"]
    end

    subgraph Submission ["Submission"]
        Submit["Submit Test<br/>Confirm Completion"]
        Verify["Verify Answers<br/>Check Unanswered Items"]
    end

    subgraph Scoring ["Scoring"]
        ListeningScore["Listening Score<br/>Multiple Choice Auto"]
        ReadingScore["Reading Score<br/>Multiple Choice Auto"]
        WritingScore["Writing Score<br/>AI + Human Grading"]
        SpeakingScore["Speaking Score<br/>AI + Human Grading"]
    end

    subgraph Results ["Results"]
        Total["Total Score<br/>Average of 4 Skills"]
        Breakdown["Skill Breakdown<br/>Score Per Skill"]
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
    classDef submission fill:#e65100,stroke:#bf360c,color:#fff
    classDef scoring fill:#7b1fa2,stroke:#4a148c,color:#fff
    classDef results fill:#37474f,stroke:#263238,color:#fff

    class Intro,Auth start
    class L1,L2,L3,R1,R2,R3,W1,W2,S1,S2,S3 section
    class Submit,Verify submission
    class ListeningScore,ReadingScore,WritingScore,SpeakingScore scoring
    class Total,Breakdown,Report results
```

## 5. Hybrid Grading Flow

```mermaid
flowchart TB
    subgraph Submission ["Submission"]
        WritingSubmit["Writing<br/>Essay, Letter"]
        SpeakingSubmit["Speaking<br/>Recording"]
    end

    subgraph AI ["AI Process"]
        Transcribe["Speech-to-Text<br/>Convert Audio to Text"]
        Grammar["Grammar Analysis<br/>Errors, Complexity"]
        Vocab["Vocabulary Analysis<br/>Range, Accuracy"]
        Content["Content Analysis<br/>Relevance, Coverage"]
        Fluency["Fluency Assessment<br/>Speed, Pauses (Speaking)"]
        Pronunciation["Pronunciation<br/>Acoustic Accuracy (Speaking)"]
        ScoreAI["AI Score<br/>Calculated Confidence Level"]
    end

    subgraph Scoring ["Scoring"]
        Confidence{"Confidence<br/>Score > 85?"}
        AutoPass["Auto Pass<br/>High Confidence"]
        HumanReview["Manual Review<br/>Low Confidence, Flagged"]
    end

    subgraph Human ["Human Grading"]
        Instructor["Instructor Portal<br/>Review, Comment"]
        Rubric["Rubric Scoring<br/>VSTEP Criteria"]
        Override["Override AI<br/>If Necessary"]
        ScoreFinal["Final Score<br/>AI + Human Combined"]
    end

    subgraph Final ["Final Results"]
        Feedback["Detailed Feedback<br/>Strengths, Weaknesses"]
        Suggestion["Suggestions<br/>Improvement"]
        Certificate["Certificate<br/>If Passing Score"]
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

## 6. Progress Tracking & Learning Path

```mermaid
flowchart TB
    subgraph DataCollection ["Data Collection"]
        Scores["Test Scores<br/>Placement, Practice, Mock"]
        Attempts["Attempt History<br/>Answers"]
        Time["Study Time<br/>Duration"]
        Accuracy["Accuracy Rate<br/>Correct/Total"]
    end

    subgraph SpiderChart ["Spider Chart Visualization"]
        Skills["4-Skill Radar<br/>Listening, Reading, Writing, Speaking"]
        Levels["Level Indicators<br/>A1, A2, B1, B2, C1"]
        Gap["Gap Analysis<br/>Identify Weaknesses"]
        History["History Trend<br/>Progress Over Time"]
    end

    subgraph SlidingWindow ["Sliding Window Analysis"]
        Window["Moving Average<br/>Last 10 Attempts"]
        Trend["Trend Detection<br/>Improving, Stable, Declining"]
        Prediction["Performance Prediction<br/>Expected Score Range"]
    end

    subgraph LearningPath ["Learning Path Generation"]
        Priority["Priority Calculation<br/>Lowest Skills First"]
        Path["Suggested Path<br/>Exercises, Topics"]
        Timeline["Time Estimation<br/>Weeks to Goal"]
        Adjust["Adaptive Adjustment<br/>Based on Progress"]
    end

    subgraph Visualization ["Visualization"]
        Dashboard["Dashboard<br/>Overview, Quick Stats"]
        Report["Detailed Report<br/>PDF Export"]
        Notification["Notification<br/>Milestones, Reminders"]
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

## 7. Authentication & Role-Based Access Control

```mermaid
flowchart TB
    subgraph Auth ["Authentication"]
        Login["Login Page<br/>Email/Password"]
        OAuth["OAuth 2.0<br/>Google SSO"]
        MFA["Multi-Factor Auth<br/>Optional, Recommended"]
        Token["JWT Token<br/>Access + Refresh tokens"]
    end

    subgraph Verify ["Verification"]
        Validate["Token Validation<br/>Signature Check"]
        Session["Session Management<br/>Redis Cache"]
        Refresh["Token Refresh<br/>Before Expiry"]
    end

    subgraph RBAC ["Role-Based Access Control"]
        Roles["Role Assignment<br/>Learner, Instructor, Admin"]
        Permissions["Permission Matrix<br/>Based on Role"]
        Check["Permission Check<br/>Each Request"]
    end

    subgraph Permissions ["Protected Resources"]
        PracticeRes["Practice Mode<br/>All Authenticated Users"]
        MockRes["Mock Test<br/>All Authenticated Users"]
        GradingRes["Grading Portal<br/>Instructor Only"]
        AdminRes["Admin Dashboard<br/>Admin Only"]
    end

    subgraph Session ["Session"]
        Active["Active Session<br/>User Context"]
        Timeout["Session Timeout<br/>30 Min Inactivity"]
        Logout["Logout<br/>Clear Session"]
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

## Diagram Summary

| Diagram | Purpose | Key Components |
|---------|---------|----------------|
| **System Architecture** | Overall Design | Frontend, API Gateway, Core Services, Grading, Data Layer |
| **User Journey** | Learner Lifecycle | Register → Placement → Practice/Mock Test → Progress |
| **Practice - Writing** | Writing Skill Support | Template → Keywords → Free Writing |
| **Practice - Listening** | Listening Skill Support | Full Text → Highlights → Pure Audio |
| **Mock Test** | Full Test Experience | 4 Sections, Timer, Grading, Report |
| **Hybrid Grading** | AI + Human Evaluation | AI Instant → Human Override → Final Score |
| **Progress Tracking** | Analytics & Visualization | Spider Chart, Sliding Window, Learning Path |
| **Authentication & RBAC** | Security & Permissions | JWT, OAuth, Role-based Permissions |

---

*Document created for Adaptive VSTEP Training System (SP26SE145)*
