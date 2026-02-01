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
            Realtime["Real-time Notifier<br/>WebSocket/SSE"]
        end
    end

    subgraph QueueInfra ["Message Queue"]
        Stream["Redis Streams<br/>Consumer groups"]
        Topics["Topics:<br/>grading.request, grading.callback"]
        DeadLetter["Dead Letter Queue<br/>Failed jobs"]
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
    classDef error fill:#c62828,stroke:#b71c1c,color:#fff

    class L,I,A users
    class Auth,Validate,Route,Enqueue,Poller,Realtime api
    class Assessment,Progress,Content core
    class Stream,Topics,DeadLetter queue
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

    %% Real-time updates
    JobDB --> Realtime
    ResultDB --> Realtime
    Realtime --> Web
    Realtime --> Mobile

    %% Error handling
    Receive -.->|"Invalid job"| DeadLetter
    Scorer -.->|"Processing fail"| DeadLetter
    DeadLetter --> Retry["Retry Logic<br/>Exponential backoff"]
    Retry -->|"Max retries"| Alert["Alert Admin"]

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
> - **Real-time**: WebSocket/SSE cho status updates
> - **Error Handling**: Dead Letter Queue + Exponential backoff
>
> **Nguyên tắc:**
> - Grading request → enqueue → async processing → poll callback → update progress
> - Strict API contract với `requestId` cho idempotency
> - Separate schemas, no cross-service writes
> - Real-time notifications cho job status changes
> - Automatic retry với dead letter queue cho failed jobs

---

## 2. Error Handling & Failure Recovery Flow

```mermaid
flowchart TB
    subgraph Submission ["Submission Phase"]
        Submit["User Submit<br/>Writing/Speaking"]
        Validate["Validate Input<br/>Format, Size, Auth"]
        SaveLocal["Save to LocalStorage<br/>Backup"]
    end

    subgraph QueuePhase ["Queue Phase"]
        EnqueueJob["Enqueue Job<br/>Redis Stream"]
        QueueMonitor["Queue Monitor<br/>Health check"]
    end

    subgraph Processing ["Grading Phase"]
        Dequeue["Dequeue Job<br/>Consumer Group"]
        Process["Process Job<br/>AI/Human Grading"]
        CircuitBreaker{"Circuit Breaker<br/>External API status"}
    end

    subgraph ExternalAPI ["External Services"]
        LLMCall["LLM API Call<br/>GPT/Gemini"]
        STTCall["STT API Call<br/>Whisper/Azure"]
    end

    subgraph Recovery ["Recovery Mechanisms"]
        RetryLogic{"Retry Logic<br/>Attempt < 3?"}
        Backoff["Exponential Backoff<br/>2^n seconds"]
        DeadLetter["Dead Letter Queue<br/>Persistent storage"]
        Compensate["Compensating Action<br/>Rollback/Notify"]
    end

    subgraph Final ["Resolution"]
        Success["Success<br/>Return results"]
        ManualRecovery["Manual Recovery<br/>Admin intervention"]
        UserNotify["Notify User<br/>Error message"]
    end

    %% Main flow
    Submit --> Validate
    Validate -->|"Valid"| SaveLocal
    SaveLocal --> EnqueueJob
    EnqueueJob --> QueueMonitor
    QueueMonitor --> Dequeue
    Dequeue --> Process
    Process --> CircuitBreaker

    %% External API calls
    CircuitBreaker -->|"Closed"| LLMCall
    CircuitBreaker -->|"Closed"| STTCall
    CircuitBreaker -->|"Open"| RetryLogic
    LLMCall -->|"Success"| Success
    STTCall -->|"Success"| Success

    %% Failure paths
    LLMCall -->|"Timeout/Fail"| RetryLogic
    STTCall -->|"Timeout/Fail"| RetryLogic
    Process -->|"Logic Error"| RetryLogic
    Dequeue -->|"Invalid message"| DeadLetter

    %% Retry logic
    RetryLogic -->|"Yes"| Backoff
    Backoff --> Dequeue
    RetryLogic -->|"No"| DeadLetter
    DeadLetter --> Compensate

    %% Compensating actions
    Compensate -->|"Auto-recoverable"| ManualRecovery
    Compensate -->|"Notify user"| UserNotify
    ManualRecovery -->|"Success"| Success

    %% Circuit breaker recovery
    DeadLetter -->|"After cooldown"| CircuitReset["Reset Circuit<br/>Health check"]
    CircuitReset --> CircuitBreaker

    classDef normal fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef warning fill:#f57c00,stroke:#e65100,color:#fff
    classDef error fill:#c62828,stroke:#b71c1c,color:#fff
    classDef success fill:#388e3c,stroke:#1b5e20,color:#fff
    classDef recovery fill:#6a1b9a,stroke:#4a148c,color:#fff

    class Submit,Validate,SaveLocal,EnqueueJob,QueueMonitor normal
    class Dequeue,Process,CircuitBreaker,LLMCall,STTCall warning
    class DeadLetter,UserNotify error
    class Success,Compensate success
    class RetryLogic,Backoff,ManualRecovery,CircuitReset recovery
```

### 2.1 Retry Strategy

| Failure Type | Retry Count | Backoff Strategy | Action After Max Retries |
|--------------|-------------|------------------|--------------------------|
| LLM API Timeout | 3 | Exponential: 2s, 4s, 8s | Dead Letter → Manual review |
| STT API Fail | 3 | Exponential: 1s, 2s, 4s | Dead Letter → Retry with backup provider |
| Queue Processing Error | 3 | Linear: 5s, 10s, 15s | Dead Letter → Alert admin |
| Invalid Message Format | 0 | N/A | Immediate Dead Letter |
| Circuit Breaker Open | Until closed | 30s cooldown | Queue pause → Health check |

### 2.2 Circuit Breaker States

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open: Failure rate > 50%
    Open --> HalfOpen: After 30s cooldown
    HalfOpen --> Closed: Success rate > 80%
    HalfOpen --> Open: Any failure
    Closed --> Closed: Process normally
```

---

## 3. Data Consistency & Saga Pattern

```mermaid
flowchart TB
    subgraph Client ["Client"]
        UserAction["User Submit Essay"]
        OptimisticUI["Optimistic UI<br/>Pending state"]
        FinalUI["Final Result<br/>Success/Error"]
    end

    subgraph MainService ["Main Application (Bun)"]
        CreateSubmission["Create Submission<br/>Status: PENDING"]
        SagaOrchestrator["Saga Orchestrator<br/>Coordinate steps"]
        UpdateStatus["Update Status<br/>PROCESSING → COMPLETED"]
        CompensateMain["Compensate<br/>Mark FAILED"]
    end

    subgraph MessageQueue ["Message Queue"]
        JobRequest["Topic: grading.request<br/>Job payload"]
        JobCallback["Topic: grading.callback<br/>Result payload"]
        SagaLog["Saga Log<br/>Event sourcing"]
    end

    subgraph GradingService ["Grading Service"]
        ReceiveJob["Receive Job<br/>Validate"]
        ProcessGrading["Process Grading<br/>AI/Human"]
        StoreResult["Store Result<br/>Grading DB"]
        SendCallback["Send Callback<br/>Async"]
    end

    subgraph DataStores ["Data Stores"]
        MainDB[("Main DB<br/>Submission record")]
        GradingDB[("Grading DB<br/>Job & Result")]
        RedisCache[("Redis<br/>Status cache")]
    end

    %% Saga flow
    UserAction --> OptimisticUI
    OptimisticUI --> CreateSubmission
    CreateSubmission --> MainDB
    CreateSubmission --> SagaOrchestrator
    SagaOrchestrator --> SagaLog
    SagaOrchestrator --> JobRequest
    SagaOrchestrator --> RedisCache

    %% Grading service processing
    JobRequest --> ReceiveJob
    ReceiveJob --> GradingDB
    ReceiveJob --> ProcessGrading
    ProcessGrading --> StoreResult
    StoreResult --> SendCallback
    SendCallback --> JobCallback

    %% Callback handling
    JobCallback --> SagaOrchestrator
    SagaOrchestrator --> UpdateStatus
    UpdateStatus --> MainDB
    UpdateStatus --> RedisCache
    UpdateStatus --> FinalUI

    %% Failure compensation
    ProcessGrading -->|"Fail"| ErrorHandler["Error Handler"]
    ErrorHandler --> CompensateGrading["Compensate: Store ERROR"]
    CompensateGrading --> GradingDB
    CompensateGrading -->|"Callback with error"| JobCallback
    JobCallback --> CompensateMain
    CompensateMain --> MainDB
    CompensateMain --> RedisCache
    CompensateMain --> FinalUI

    %% Timeout handling
    SagaOrchestrator -->|"Timeout > 5min"| TimeoutHandler["Timeout Handler"]
    TimeoutHandler --> CompensateMain
    TimeoutHandler --> Alert["Alert Admin"]

    classDef client fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef main fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef queue fill:#ff8f00,stroke:#ff6f00,color:#fff
    classDef grading fill:#6a1b9a,stroke:#4a148c,color:#fff
    classDef data fill:#37474f,stroke:#263238,color:#fff
    classDef error fill:#c62828,stroke:#b71c1c,color:#fff

    class UserAction,OptimisticUI,FinalUI client
    class CreateSubmission,SagaOrchestrator,UpdateStatus,CompensateMain,TimeoutHandler main
    class JobRequest,JobCallback,SagaLog queue
    class ReceiveJob,ProcessGrading,StoreResult,SendCallback,ErrorHandler,CompensateGrading grading
    class MainDB,GradingDB,RedisCache data
    class Alert error
```

### 3.1 Saga Steps

| Step | Action | Compensation | Timeout |
|------|--------|--------------|---------|
 1 | Create submission (PENDING) | Delete submission | 10s |
| 2 | Publish grading job | Mark submission FAILED | 5s |
| 3 | Grading service processes | N/A (async) | 5min |
| 4 | Receive callback | Retry callback | 30s |
| 5 | Update submission (COMPLETED) | Mark submission ERROR | 10s |

### 3.2 Consistency Guarantees

- **Main DB**: Source of truth for submission status
- **Grading DB**: Source of truth for grading results
- **Redis**: Cache for real-time status (eventual consistency)
- **Saga Log**: Audit trail for all saga events

---

## 4. Real-time Status Updates Flow

```mermaid
flowchart TB
    subgraph UserDevice ["User Device"]
        Browser["Browser/Mobile App"]
        LocalState["Local State<br/>Submission status"]
        UI["UI Components<br/>Status indicators"]
    end

    subgraph Connection ["Connection Layer"]
        WebSocket["WebSocket Server<br/>Socket.io/ws"]
        SSE["Server-Sent Events<br/>Fallback"]
        ConnectionManager["Connection Manager<br/>Heartbeat, reconnect"]
    end

    subgraph Backend ["Backend Services"]
        StatusPublisher["Status Publisher<br/>Redis Pub/Sub"]
        EventEmitter["Event Emitter<br/>Domain events"]
        RESTFallback["REST Fallback<br/>Polling endpoint"]
    end

    subgraph GradingWorkers ["Grading Workers"]
        JobStart["Job Started<br/>PROCESSING"]
        ProgressUpdate["Progress Update<br/>25%, 50%, 75%"]
        JobComplete["Job Complete<br/>DONE/ERROR"]
    end

    subgraph Redis ["Redis Layer"]
        PubSub["Pub/Sub Channels<br/>user:{id}:grading"]
        StateCache["State Cache<br/>TTL: 1 hour"]
    end

    %% Status flow
    JobStart --> EventEmitter
    ProgressUpdate --> EventEmitter
    JobComplete --> EventEmitter

    EventEmitter --> StatusPublisher
    StatusPublisher --> PubSub
    PubSub --> WebSocket
    PubSub --> SSE

    %% To user
    WebSocket --> Browser
    SSE --> Browser
    Browser --> LocalState
    LocalState --> UI

    %% Connection management
    Browser --> ConnectionManager
    ConnectionManager -->|"Reconnect"| WebSocket
    ConnectionManager -->|"Fallback"| SSE
    ConnectionManager -->|"Last resort"| RESTFallback

    %% State sync
    RESTFallback --> StateCache
    StateCache -->|"Sync on reconnect"| Browser

    classDef user fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef conn fill:#ff8f00,stroke:#ff6f00,color:#fff
    classDef backend fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef worker fill:#6a1b9a,stroke:#4a148c,color:#fff
    classDef cache fill:#37474f,stroke:#263238,color:#fff

    class Browser,LocalState,UI user
    class WebSocket,SSE,ConnectionManager conn
    class StatusPublisher,EventEmitter,RESTFallback backend
    class JobStart,ProgressUpdate,JobComplete worker
    class PubSub,StateCache cache
```

### 4.1 Status States

```mermaid
stateDiagram-v2
    [*] --> PENDING: User submits
    PENDING --> QUEUED: Job enqueued
    QUEUED --> PROCESSING: Worker picks up
    PROCESSING --> ANALYZING: AI processing
    ANALYZING --> GRADING: Scoring
    GRADING --> COMPLETED: Success
    GRADING --> ERROR: Failure
    PROCESSING --> ERROR: Timeout
    QUEUED --> ERROR: Invalid job
    ERROR --> RETRYING: Auto-retry
    RETRYING --> PROCESSING: Retry attempt
    RETRYING --> FAILED: Max retries
    COMPLETED --> [*]
    FAILED --> [*]
```

### 4.2 Update Frequency

| Status | Update Type | Latency |
|--------|-------------|---------|
| PENDING → QUEUED | Real-time | < 100ms |
| QUEUED → PROCESSING | Real-time | < 500ms |
| PROCESSING progress | Batch | Every 25% or 10s |
| ANALYZING details | Real-time | Streaming tokens |
| Final result | Real-time | < 100ms |
| ERROR | Real-time | Immediate |

---

## 5. Hybrid Grading với Confidence Score

```mermaid
flowchart TB
    subgraph Input ["Submission"]
        Writing["Writing Submission<br/>Essay/Email"]
        Speaking["Speaking Submission<br/>Audio recording"]
    end

    subgraph Preprocess ["Pre-processing"]
        Validate["Validate Input<br/>Format, length, language"]
        Transcribe["Speech-to-Text<br/>Whisper/API"]
        Extract["Extract Features<br/>Word count, sentences"]
    end

    subgraph AIGrading ["AI Grading Engine"]
        GrammarCheck["Grammar Analysis<br/>Errors, complexity score"]
        VocabCheck["Vocabulary Analysis<br/>Range, accuracy, collocations"]
        ContentCheck["Content Analysis<br/>Relevance, coverage, coherence"]
        FluencyCheck["Fluency Analysis<br/>Pace, pauses (speaking)"]
        Pronunciation["Pronunciation<br/>Phonetic accuracy (speaking)"]
    end

    subgraph ConfidenceCalc ["Confidence Calculation"]
        ModelConsistency["Model Consistency<br/>Multiple sample variance"]
        RuleValidation["Rule Validation<br/>Format, word count, rubric"]
        ContentSimilarity["Content Similarity<br/>Template detection"]
        LengthHeuristic["Length Heuristic<br/>Band-appropriate length"]
        ConfidenceScore["Confidence Score<br/>0-100%"]
    end

    subgraph Routing ["Routing Decision"]
        Threshold{"Confidence ≥ 85%?"}
        AutoGrade["Auto-Grade<br/>Publish result immediately"]
        HumanQueue["Human Review Queue<br/>Priority by confidence"]
    end

    subgraph HumanGrading ["Human Grading"]
        InstructorReview["Instructor Review<br/>Rubric-based scoring"]
        Override["Override AI<br/>If discrepancy > 1 band"]
        WeightedScore["Weighted Final Score<br/>AI + Human"]
    end

    subgraph Output ["Final Output"]
        Feedback["Detailed Feedback<br/>Strengths, weaknesses"]
        Suggestions["Improvement Suggestions<br/>Personalized"]
        Report["Score Report<br/>PDF + Dashboard"]
    end

    %% Writing flow
    Writing --> Validate
    Validate --> Extract
    Extract --> GrammarCheck
    Extract --> VocabCheck
    Extract --> ContentCheck

    %% Speaking flow
    Speaking --> Validate
    Validate --> Transcribe
    Transcribe --> Extract
    Extract --> FluencyCheck
    Extract --> Pronunciation
    Transcribe --> ContentCheck

    %% AI scoring convergence
    GrammarCheck --> ModelConsistency
    VocabCheck --> ModelConsistency
    ContentCheck --> ModelConsistency
    FluencyCheck --> ModelConsistency
    Pronunciation --> ModelConsistency

    %% Confidence calculation
    ModelConsistency --> ConfidenceScore
    RuleValidation --> ConfidenceScore
    ContentSimilarity --> ConfidenceScore
    LengthHeuristic --> ConfidenceScore

    %% Routing
    ConfidenceScore --> Threshold
    Threshold -->|"Yes (High confidence)"| AutoGrade
    Threshold -->|"No (Low confidence)"| HumanQueue

    %% Human grading flow
    HumanQueue --> InstructorReview
    InstructorReview --> Override
    Override --> WeightedScore

    %% Final output
    AutoGrade --> Feedback
    WeightedScore --> Feedback
    Feedback --> Suggestions
    Suggestions --> Report

    classDef input fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef preprocess fill:#f57c00,stroke:#e65100,color:#fff
    classDef ai fill:#00796b,stroke:#004d40,color:#fff
    classDef confidence fill:#fbc02d,stroke:#f57f17,color:#000
    classDef routing fill:#7b1fa2,stroke:#4a148c,color:#fff
    classDef human fill:#5d4037,stroke:#3e2723,color:#fff
    classDef output fill:#303f9f,stroke:#1a237e,color:#fff

    class Writing,Speaking input
    class Validate,Transcribe,Extract preprocess
    class GrammarCheck,VocabCheck,ContentCheck,FluencyCheck,Pronunciation ai
    class ModelConsistency,RuleValidation,ContentSimilarity,LengthHeuristic,ConfidenceScore confidence
    class Threshold,AutoGrade,HumanQueue routing
    class InstructorReview,Override,WeightedScore human
    class Feedback,Suggestions,Report output
```

### 5.1 Confidence Score Formula

```
Confidence Score = Σ(Factor_i × Weight_i)

Factors:
├── Model Consistency (30%)
│   └── Calculate std dev across 3 LLM samples
│   └── Score = 100 - (std_dev × 20)
│
├── Rule Validation (25%)
│   ├── Word count within band range (+20)
│   ├── Format compliance (+20)
│   ├── Rubric coverage (+20)
│   └── Time limit compliance (+20)
│
├── Content Similarity (25%)
│   └── Cosine similarity vs template essays
│   └── Score = (1 - similarity) × 100
│   └── Lower similarity = higher confidence
│
└── Length Heuristic (20%)
    ├── Sentence count appropriate (+25)
    ├── Paragraph structure valid (+25)
    ├── Vocabulary density ok (+25)
    └── Complexity score appropriate (+25)
```

### 5.2 Confidence Thresholds

| Confidence | Action | Human Review Priority |
|------------|--------|----------------------|
| 90-100% | Auto-grade | None |
| 85-89% | Auto-grade + flag for audit | Low |
| 70-84% | Human review | Medium |
| 50-69% | Human review | High |
| < 50% | Human review + AI warning | Critical |

### 5.3 Weighted Final Score (AI + Human)

```
If Human and AI agree (within 0.5 band):
    Final = (AI_score × 0.4) + (Human_score × 0.6)

If Human and AI disagree (> 0.5 band):
    Final = Human_score (Human overrides)
    Flag for model retraining
```

---

## 6. Hành Trình Người Dùng

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
    GoalCheck -->|"Không"| Select
    GoalCheck -->|"Có"| End
    SelfAssess -.->|"Sau này"| Placement

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

---

## 7. Practice Mode - Adaptive Scaffolding

### 7A. Writing Adaptive Scaffolding

```mermaid
flowchart TB
    subgraph Input ["Input"]
        Task["Select Writing Task<br/>Task 1 (Email), Task 2 (Essay)"]
        Level["Determine Level<br/>Based on Placement/Test"]
        History["Attempt History<br/>Last 3 scores"]
    end

    subgraph Assessment ["Stage Assessment"]
        Stage1["Stage 1: Template<br/>Full sentence starters"]
        Stage2["Stage 2: Keywords<br/>Key phrases, transitions"]
        Stage3["Stage 3: Free Writing<br/>No scaffolding"]
    end

    subgraph Algorithm ["Progression Algorithm"]
        CheckScores{"Check Last 3 Scores"}
        AvgCalc["Calculate Average"]
        Decision{"Progression Decision"}
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
        TaskResp["Task Achievement<br/>Content coverage, Format"]
    end

    subgraph Progression ["Progression Logic"]
        LevelUp["Level Up<br/>Move to next stage"]
        Stay["Stay Same<br/>Repeat, More practice"]
        LevelDown["Level Down<br/>Increase support"]
        MicroHint["Micro-Scaffolding<br/>On-demand hints"]
    end

    Task --> Level
    Level --> History
    History --> CheckScores

    %% Stage assignment
    Level -->|"A1-A2"| Stage1
    Level -->|"B1"| Stage2
    Level -->|"B2-C1"| Stage3

    Stage1 --> Template
    Stage2 --> Keywords
    Stage3 --> Free

    %% Feedback flow
    Template --> Grammar
    Keywords --> Grammar
    Free --> Grammar
    Grammar --> Vocab
    Vocab --> Cohesion
    Cohesion --> TaskResp

    %% Progression algorithm
    TaskResp --> AvgCalc
    AvgCalc --> Decision

    Decision -->|"Avg ≥ 80% x 3 lần"| LevelUp
    Decision -->|"Avg 50-80%"| Stay
    Decision -->|"Avg < 50% x 2 lần"| LevelDown
    Decision -->|"Hint requested"| MicroHint

    LevelUp -->|"Template → Keywords"| Stage2
    LevelUp -->|"Keywords → Free"| Stage3
    Stay --> Stage1
    Stay --> Stage2
    Stay --> Stage3
    LevelDown -->|"Free → Keywords"| Stage2
    LevelDown -->|"Keywords → Template"| Stage1

    classDef input fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef assessment fill:#f57c00,stroke:#e65100,color:#fff
    classDef algorithm fill:#6a1b9a,stroke:#4a148c,color:#fff
    classDef scaffold fill:#388e3c,stroke:#1b5e20,color:#fff
    classDef feedback fill:#c62828,stroke:#b71c1c,color:#fff
    classDef progression fill:#1565c0,stroke:#0d47a1,color:#fff

    class Task,Level,History input
    class Stage1,Stage2,Stage3 assessment
    class CheckScores,AvgCalc,Decision algorithm
    class Template,Keywords,Free scaffold
    class Grammar,Vocab,Cohesion,TaskResp feedback
    class LevelUp,Stay,LevelDown,MicroHint progression
```

#### Progression Rules

| Current Stage | Condition | Action | Next Stage |
|---------------|-----------|--------|------------|
| Template | Avg ≥ 80% across 3 attempts | Level Up | Keywords |
| Template | Avg < 50% across 2 attempts | Stay + More support | Template (add hints) |
| Keywords | Avg ≥ 75% across 3 attempts | Level Up | Free |
| Keywords | Avg < 60% across 2 attempts | Level Down | Template |
| Keywords | 60-75% range | Stay | Keywords |
| Free | Avg ≥ 70% across 3 attempts | Maintain | Free (increase difficulty) |
| Free | Avg < 65% across 2 attempts | Level Down | Keywords |

### 7B. Listening Adaptive Scaffolding

```mermaid
flowchart TB
    subgraph Input ["Input"]
        Exercise["Select Listening Exercise<br/>Dictation, MCQ, Summary"]
        Level["Determine Level<br/>Based on Placement/Test"]
        AccuracyHistory["Accuracy History<br/>Last 3 attempts"]
    end

    subgraph Assessment ["Stage Assessment"]
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

    subgraph Progression ["Progression Logic"]
        Up["Level Up<br/>Remove scaffolding"]
        Stay["Stay Same<br/>Same support level"]
        Down["Increase Support<br/>Add scaffolding"]
    end

    Exercise --> Level
    Level --> AccuracyHistory

    Level -->|"Beginner (A1-A2)"| Stage1
    Level -->|"Intermediate (B1)"| Stage2
    Level -->|"Advanced (B2-C1)"| Stage3

    Stage1 --> FullText
    Stage2 --> Highlights
    Stage3 --> PureAudio

    FullText --> Accuracy
    Highlights --> Accuracy
    PureAudio --> Accuracy
    Accuracy --> Script
    Script --> Tips

    Tips -->|"Accuracy ≥ 80% x 3"| Up
    Tips -->|"Accuracy 50-80%"| Stay
    Tips -->|"Accuracy < 50% x 2"| Down

    Up -->|"Full Text → Highlights"| Stage2
    Up -->|"Highlights → Pure Audio"| Stage3
    Stay --> Stage1
    Stay --> Stage2
    Stay --> Stage3
    Down -->|"Pure Audio → Highlights"| Stage2
    Down -->|"Highlights → Full Text"| Stage1

    classDef input fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef assessment fill:#f57c00,stroke:#e65100,color:#fff
    classDef scaffold fill:#388e3c,stroke:#1b5e20,color:#fff
    classDef feedback fill:#c62828,stroke:#b71c1c,color:#fff
    classDef progression fill:#6a1b9a,stroke:#4a148c,color:#fff

    class Exercise,Level,AccuracyHistory input
    class Stage1,Stage2,Stage3 assessment
    class FullText,Highlights,PureAudio scaffold
    class Accuracy,Script,Tips feedback
    class Up,Stay,Down progression
```

---

## 8. Luồng Mock Test

```mermaid
flowchart TB
    subgraph Start ["Bắt đầu"]
        Intro["Test Introduction<br/>Format, Duration, Instructions"]
        Auth["Identity Verification<br/>Login, Session Token"]
        Prepare["Test Preparation<br/>Audio check, instructions"]
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
        AutoSave["Auto-Save<br/>Every 30 seconds"]
    end

    subgraph Section4 ["Section 4: Speaking (12 min)"]
        S1["Part 1: Introduction<br/>Personal questions"]
        S2["Part 2: Cue Card<br/>1-2 min talk"]
        S3["Part 3: Discussion<br/>Follow-up questions"]
        Record["Audio Recording<br/>Local + Cloud backup"]
    end

    subgraph Submission ["Nộp bài"]
        Submit["Submit Test<br/>Confirm completion"]
        Verify["Verify Responses<br/>Check incomplete items"]
        Confirm["Final Confirmation<br/>No return after submit"]
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
        Certificate["Certificate<br/>PDF download"]
    end

    Intro --> Auth
    Auth --> Prepare
    Prepare --> L1
    L1 --> L2
    L2 --> L3
    L3 --> R1
    R1 --> R2
    R2 --> R3
    R3 --> W1
    W1 --> AutoSave
    W2 --> AutoSave
    W1 --> W2
    W2 --> S1
    S1 --> Record
    S2 --> Record
    S3 --> Record
    S1 --> S2
    S2 --> S3
    S3 --> Submit
    Submit --> Verify
    Verify -->|"Incomplete"| S3
    Verify -->|"Complete"| Confirm
    Confirm --> ListeningScore
    ListeningScore --> ReadingScore
    ReadingScore --> WritingScore
    WritingScore --> SpeakingScore
    SpeakingScore --> Total
    Total --> Breakdown
    Breakdown --> Report
    Report --> Certificate

    classDef start fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef section fill:#f57c00,stroke:#e65100,color:#fff
    classDef submission fill:#e65100,stroke:#bf360c,color:#fff
    classDef scoring fill:#7b1fa2,stroke:#4a148c,color:#fff
    classDef results fill:#37474f,stroke:#263238,color:#fff

    class Intro,Auth,Prepare start
    class L1,L2,L3,R1,R2,R3,W1,W2,S1,S2,S3,Record,AutoSave section
    class Submit,Verify,Confirm submission
    class ListeningScore,ReadingScore,WritingScore,SpeakingScore scoring
    class Total,Breakdown,Report,Certificate results
```

---

## 9. Luồng Progress Tracking & Learning Path

```mermaid
flowchart TB
    subgraph DataCollection ["Data Collection"]
        Scores["Test Scores<br/>Placement, Practice, Mock"]
        Attempts["Attempt History<br/>Questions answered"]
        Time["Time Spent<br/>Learning duration"]
        Accuracy["Accuracy Rate<br/>Correct/Total ratio"]
        Velocity["Velocity Metric<br/>Improvement rate"]
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
        Prediction["Predictive ETA<br/>ML-based estimate"]
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
    Velocity --> Window
    Velocity --> Prediction

    Skills --> Gap
    Gap --> Priority
    Window --> Trend
    Window --> Prediction
    Priority --> Path
    Path --> Timeline
    Timeline --> Adjust
    Prediction --> Timeline

    Skills --> Dashboard
    Window --> Dashboard
    Gap --> Report2
    Trend --> Report2
    Prediction --> Report2
    Path --> Notification

    classDef data fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef spider fill:#388e3c,stroke:#1b5e20,color:#fff
    classDef sliding fill:#f57c00,stroke:#e65100,color:#fff
    classDef path fill:#7b1fa2,stroke:#4a148c,color:#fff
    classDef viz fill:#00838f,stroke:#006064,color:#fff

    class Scores,Attempts,Time,Accuracy,Velocity data
    class Skills,Levels,Gap,History spider
    class Window,Trend,Prediction sliding
    class Priority,Path,Timeline,Adjust path
    class Dashboard,Report2,Notification viz
```

---

## 10. Authentication & RBAC

```mermaid
flowchart TB
    subgraph Auth ["Authentication"]
        Login["Login Page<br/>Email/Password"]
        OAuth["OAuth 2.0<br/>Google SSO"]
        Token["JWT Token<br/>Access + Refresh tokens"]
        RateLimit["Rate Limiting<br/>5 attempts/minute"]
    end

    subgraph Verify ["Verification"]
        Validate["Validate Token<br/>Signature check"]
        Session["Session Management<br/>Redis cache"]
        Refresh["Token Refresh<br/>Before expiry"]
        Logout["Logout<br/>Clear session"]
    end

    subgraph RBAC ["Role-Based Access Control"]
        Roles["Role Assignment<br/>Learner, Instructor, Admin"]
        Permissions["Permission Matrix<br/>Based on role"]
        Check["Permission Check<br/>Each request"]
    end

    subgraph Protected ["Protected Resources"]
        PracticeRes["Practice Mode<br/>All authenticated users"]
        MockRes["Mock Test<br/>All authenticated users"]
        GradingRes["Grading Portal<br/>Instructors only"]
        AdminRes["Admin Panel<br/>Admins only"]
    end

    subgraph Session ["Session"]
        Active["Active Session<br/>User context"]
        Timeout["Session Timeout<br/>30 min inactivity"]
        Concurrent["Concurrent Session<br/>Max 3 devices"]
    end

    Login --> RateLimit
    RateLimit -->|"Under limit"| Token
    OAuth --> Token
    Token --> Validate
    Validate --> Session
    Session --> Refresh
    Refresh --> Session
    Session --> Logout

    Roles --> Permissions
    Permissions --> Check
    Check -->|"Learner"| PracticeRes
    Check -->|"Learner"| MockRes
    Check -->|"Instructor"| GradingRes
    Check -->|"Admin"| AdminRes

    PracticeRes --> Active
    MockRes --> Active
    GradingRes --> Active
    AdminRes --> Active
    Active --> Timeout
    Active --> Concurrent
    Timeout -->|"Expired"| Logout

    classDef auth fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef verify fill:#e65100,stroke:#bf360c,color:#fff
    classDef rbac fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef permissions fill:#c62828,stroke:#b71c1c,color:#fff
    classDef resources fill:#6a1b9a,stroke:#4a148c,color:#fff
    classDef session fill:#455a64,stroke:#37474f,color:#fff

    class Login,OAuth,Token,RateLimit auth
    class Validate,Session,Refresh,Logout verify
    class Roles,Permissions,Check rbac
    class PracticeRes,MockRes,GradingRes,AdminRes permissions
    class Active,Timeout,Concurrent session
```

---

## 11. Design System & Style Guide

### 11.1 Tổng Quan Thiết Kế

**Phong cách:** Editorial × Modern SaaS

Kết hợp sự tinh tế của ấn phẩm chất lượng cao với độ chính xác kỹ thuật của dashboard hiện đại. Phong cách này truyền tải sự uy tín học thuật trong khi vẫn giữ giao diện thân thiện, dễ tiếp cận cho người học.

**Nguyên tắc ngôn ngữ:** Sử dụng tiếng Việt cho toàn bộ giao diện người dùng, đảm bảo sự nhất quán và thân thiện với người học Việt Nam.

### 11.2 Hệ Thống Màu Sắc

```css
/* Primary Colors */
--primary-teal: #0D6E6E;
--primary-orange: #E07B54;

/* Backgrounds */
--bg-page: #FAFAFA;
--bg-surface: #FFFFFF;
--bg-muted: #F8F8F8;
--bg-control: #F0F0F0;

/* Text Hierarchy */
--text-primary: #1A1A1A;
--text-secondary: #666666;
--text-tertiary: #888888;
--text-muted: #AAAAAA;

/* Borders */
--border-primary: #E5E5E5;
--border-divider: #F0F0F0;

/* Status Colors */
--status-success: #0D6E6E;  /* Teal */
--status-progress: #E07B54; /* Orange */
--status-pending: #DDDDDD;
--status-error: #C62828;    /* Red */
```

### 11.3 Typography

| Font | Usage | Weight |
|------|-------|--------|
| **Newsreader** (Serif) | Tiêu đề, headings | 500 |
| **JetBrains Mono** | Labels, data, kỹ thuật | 500-600 |
| **Inter** | Body text, UI elements | 400-600 |

**Ví dụ UI Labels:**
- "Chào mừng trở lại" (Welcome back)
- "Nền tảng luyện thi VSTEP thông minh" (Tagline)
- "Email", "Mật khẩu", "Đăng nhập" (Form fields)

**Type Scale:**
- Display: 40px (Large titles)
- H1: 32px (Metrics)
- H2: 24px (Section headings)
- H3: 18px (Card titles)
- Body: 14-15px
- Caption: 11px (uppercase monospace labels)

### 11.4 Component Patterns

**Buttons:**
- Corner radius: 8px
- Primary: Fill #0D6E6E, Text white - "Đăng nhập"
- Secondary: Fill white, Stroke #E5E5E5 - "Google", "GitHub"

**Input Fields:**
- Corner radius: 8px
- Fill: #FAFAFA
- Stroke: 1px #E5E5E5
- Height: 48px
- Labels: "Email", "Mật khẩu"

**Cards:**
- Corner radius: 12px
- Fill: #FFFFFF
- Stroke: 1px #E5E5E5
- Padding: 24px internal

**Status Indicators:**
- PENDING: Gray dot + "Đang chờ..."
- PROCESSING: Orange pulse + "Đang chấm..."
- COMPLETED: Green check + "Hoàn thành"
- ERROR: Red alert + "Có lỗi xảy ra"

**Section Labels:**
- Font: JetBrains Mono
- Size: 11px
- Transform: uppercase
- Letter-spacing: 2px
- Color: #888888

### 11.5 Spacing System

| Scale | Value | Usage |
|-------|-------|-------|
| xs | 2-4px | Tight stacks |
| sm | 8px | Badges, buttons |
| md | 12-16px | Card internals |
| lg | 24px | Section padding |
| xl | 32px | Section gaps |

### 11.6 Design Assets

Thiết kế UI được lưu trong thư mục `.claude/pencil/` với định dạng `.pen`.

---

## Tóm Tắt Sơ Đồ

| Sơ đồ | Mục đích | Thành phần chính |
|-------|----------|------------------|
| **1. Kiến trúc Hệ thống** | Multi-Language Services | Bun (API/Core) + Python/Rust/Go (Grading) - Separate DB, Queue-based, Real-time updates |
| **2. Error Handling** | Failure Recovery | Retry logic, Circuit breaker, Dead Letter Queue, Compensation |
| **3. Data Consistency** | Saga Pattern | Saga orchestrator, Event sourcing, Compensation actions |
| **4. Real-time Updates** | Status Notifications | WebSocket/SSE, Connection management, State sync |
| **5. Hybrid Grading** | AI + Human với Confidence | Confidence formula, Routing logic, Weighted scoring |
| **6. Hành trình Người dùng** | Vòng đời người học | Registration → Goal → Self-Assessment → Practice/Mock Test |
| **7A. Practice - Writing** | Adaptive Scaffolding Viết | Template → Keywords → Free với progression algorithm |
| **7B. Practice - Listening** | Adaptive Scaffolding Nghe | Full Text → Highlights → Pure Audio |
| **8. Mock Test Flow** | Thi thử giả lập | 4 Sections, Timer, Auto-save, Scoring, Results Report |
| **9. Progress Tracking** | Analytics & visualization | Spider Chart, Sliding Window, Predictive ETA, Learning Path |
| **10. Authentication & RBAC** | Bảo mật & phân quyền | JWT, OAuth, Rate limiting, Session management |
| **11. Design System** | UI/UX Guidelines | Editorial style, color system, typography, status indicators |

---

**Tóm tắt hệ thống:** Hệ thống ưu tiên giảm friction cho người học bằng cách cho phép chọn mục tiêu trước, sau đó sử dụng self-assessment và dữ liệu hành vi ban đầu để hiệu chỉnh mức độ học tập dần theo thời gian. Kiến trúc multi-language với queue-based communication đảm bảo scalability, trong khi hybrid grading với confidence score cân bằng automation và accuracy. Real-time updates và comprehensive error handling đảm bảo trải nghiệm người dùng mượt mà.

*Cập nhật cho Hệ thống Luyện Thi VSTEP Thích Ứng (SP26SE145)*
