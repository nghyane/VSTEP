# Sơ Đồ Luồng Hệ Thống Luyện Thi VSTEP Thích Ứng

> **Phiên bản Mermaid:** v11+ với ELK layout, new shapes, professional styling

---

## 1. Kiến Trúc Tổng Quan (High-Level)

```mermaid
---
config:
  layout: elk
  theme: default
---
flowchart TB
    subgraph Users["NGƯỜI DÙNG"]
        direction LR
        L@{ shape: circle, label: "Learner" }
        I@{ shape: circle, label: "Instructor" }
        A@{ shape: circle, label: "Admin" }
    end

    subgraph BunApp["MAIN APP (Bun + Elysia)"]
        direction TB
        Auth@{ shape: fr-rect, label: "Authentication\nJWT + RBAC" }
        API@{ shape: fr-rect, label: "REST API\nResource Endpoints" }
        Core@{ shape: fr-rect, label: "Core Modules\nAssessment · Progress · Content" }
        QueueClient@{ shape: st-rect, label: "Queue Client\nRabbitMQ Publisher" }
    end

    subgraph GradingService["GRADING SERVICE (Python + Celery)"]
        direction TB
        Worker@{ shape: st-rect, label: "Celery Workers" }
        Grader@{ shape: fr-rect, label: "AI Grading\nLLM · STT · Scorer" }
    end

    subgraph DataLayer["DATA LAYER"]
        direction LR
        MainDB@{ shape: cyl, label: "PostgreSQL\nMain DB" }
        GradingDB@{ shape: cyl, label: "PostgreSQL\nGrading DB" }
        MQ@{ shape: rounded, label: "RabbitMQ" }
        Redis@{ shape: cyl, label: "Redis\nCache · Rate Limit" }
    end

    Users --> BunApp
    BunApp --> MainDB
    BunApp --> Redis
    BunApp --> QueueClient
    QueueClient --> MQ
    MQ --> Worker
    Worker --> Grader
    Grader --> GradingDB
    Grader --> MQ
    MQ --> BunApp

    classDef users fill:#1565c0,stroke:#90caf9,stroke-width:2px,color:#fff
    classDef bun fill:#e65100,stroke:#ffab91,stroke-width:2px,color:#fff
    classDef python fill:#2e7d32,stroke:#a5d6a7,stroke-width:2px,color:#fff
    classDef data fill:#c2185b,stroke:#f48fb1,stroke-width:2px,color:#fff

    classDef usersBox fill:none,stroke:#1565c0,stroke-width:3px
    classDef bunBox fill:none,stroke:#e65100,stroke-width:3px
    classDef pythonBox fill:none,stroke:#2e7d32,stroke-width:3px
    classDef dataBox fill:none,stroke:#c2185b,stroke-width:3px

    class Users usersBox
    class BunApp bunBox
    class GradingService pythonBox
    class DataLayer dataBox

    class L,I,A users
    class Auth,API,Core,QueueClient bun
    class Worker,Grader python
    class MainDB,GradingDB,MQ,Redis data
    
```

> **Kiến trúc Multi-Language:**
> - **Main App (Bun + Elysia)**: API, Auth, Assessment, Progress, Content — TypeScript
> - **Grading Service (Python + Celery)**: AI Grading, STT, Scoring — Celery workers
> - **Giao tiếp**: Queue-based (RabbitMQ) với idempotency qua `requestId`
> - **Database**: Tách biệt hoàn toàn — Main App chỉ connect MainDB, Grading Service chỉ connect GradingDB
> - **Real-time**: SSE (Server-Sent Events) cho status updates
>
> **Nguyên tắc quan trọng:**
> - **Main App chỉ connect MainDB** — Không bao giờ truy cập GradingDB
> - **Grading Service chỉ connect GradingDB** — Không bao giờ truy cập MainDB
> - **Giao tiếp duy nhất**: RabbitMQ (AMQP)

---

## 2. Luồng Xử Lý Submission (Chi tiết)

```mermaid
---
config:
  layout: elk
---
flowchart TB
    subgraph Client["CLIENT"]
        User["User Submit<br/>Writing/Speaking"]
    end

    subgraph Bun["MAIN APP (Bun)"]
        direction TB
        Validate["Validate Input"]
        CreateSub["Create Submission<br/>Status: PENDING"]
        SaveDB[("MainDB")]
        WriteOutbox["Write Outbox"]
        Relay["Outbox Relay Worker"]
        Consume["Callback Consumer"]
        UpdateStatus["Update Status<br/>PROCESSING → COMPLETED"]
    end

    subgraph Queue["MESSAGE QUEUE"]
        ReqQueue@{ shape: doc, label: "grading.request" }
        CbQueue@{ shape: doc, label: "grading.callback" }
    end

    subgraph Python["GRADING SERVICE (Python)"]
        direction TB
        Receive["Receive Job"]
        Process["Process Grading<br/>AI / STT / Scorer"]
        SaveGrade[("GradingDB")]
        SendCb["Send Callback"]
    end

    User --> Validate --> CreateSub --> SaveDB
    CreateSub --> WriteOutbox
    WriteOutbox --> Relay --> ReqQueue --> Receive
    Receive --> Process --> SaveGrade --> SendCb --> CbQueue --> Consume
    Consume --> UpdateStatus --> SaveDB

    classDef client fill:#1565c0,stroke:#90caf9,stroke-width:2px,color:#fff
    classDef bun fill:#e65100,stroke:#ffab91,stroke-width:2px,color:#fff
    classDef queue fill:#7b1fa2,stroke:#ce93d8,stroke-width:2px,color:#fff
    classDef python fill:#2e7d32,stroke:#a5d6a7,stroke-width:2px,color:#fff
    classDef db fill:#c2185b,stroke:#f48fb1,stroke-width:2px,color:#fff

    classDef clientBox fill:none,stroke:#1565c0,stroke-width:3px
    classDef bunBox fill:none,stroke:#e65100,stroke-width:3px
    classDef queueBox fill:none,stroke:#7b1fa2,stroke-width:3px
    classDef pythonBox fill:none,stroke:#2e7d32,stroke-width:3px

    class Client clientBox
    class Bun bunBox
    class Queue queueBox
    class Python pythonBox

    class User client
    class Validate,CreateSub,WriteOutbox,Relay,Consume,UpdateStatus bun
    class ReqQueue,CbQueue queue
    class Receive,Process,SendCb python
    class SaveDB,SaveGrade db

```

---

## 3. Error Handling & Recovery

```mermaid
---
config:
  layout: elk
---
flowchart TB
    subgraph Submission["SUBMISSION PHASE"]
        Submit@{ shape: rounded, label: "User Submit" }
        Validate@{ shape: fr-rect, label: "Validate" }
    end

    subgraph QueuePhase["QUEUE PHASE"]
        Enqueue@{ shape: doc, label: "Enqueue Job" }
        Backpressure@{ shape: diam, label: "Backpressure?" }
    end

    subgraph Processing["GRADING PHASE"]
        Dequeue@{ shape: fr-rect, label: "Dequeue" }
        Process@{ shape: fr-rect, label: "Process" }
        Circuit@{ shape: diam, label: "Circuit Breaker?" }
        External@{ shape: rounded, label: "LLM / STT API" }
    end

    subgraph Recovery["RECOVERY"]
        Retry@{ shape: st-rect, label: "Retry Logic<br/>Exponential + Jitter" }
        DLQ@{ shape: doc, label: "Dead Letter Queue" }
        Alert@{ shape: rounded, label: "Alert Admin" }
    end

    subgraph Success["SUCCESS"]
        Complete@{ shape: dbl-circ, label: "Completed" }
    end

    Submit --> Validate --> Enqueue --> Backpressure
    Backpressure -->|"No"| Dequeue
    Backpressure -->|"Yes"| Delayed["Set DELAYED<br/>Notify User"]
    
    Dequeue --> Process --> Circuit
    Circuit -->|"Closed"| External
    Circuit -->|"Open"| Retry
    
    External -->|"Success"| Complete
    External -->|"Timeout/Fail"| Retry
    
    Retry -->|"Retryable"| Dequeue
    Retry -->|"Max retries"| DLQ --> Alert
    
    Process -->|"Invalid message"| DLQ

    classDef normal fill:#1565c0,stroke:#90caf9,stroke-width:2px,color:#fff
    classDef decision fill:#e65100,stroke:#ffab91,stroke-width:2px,color:#fff
    classDef warning fill:#f57c00,stroke:#ffcc80,stroke-width:2px,color:#fff
    classDef error fill:#c62828,stroke:#ef5350,stroke-width:2px,color:#fff
    classDef success fill:#2e7d32,stroke:#a5d6a7,stroke-width:2px,color:#fff

    classDef normalBox fill:none,stroke:#1565c0,stroke-width:3px
    classDef decisionBox fill:none,stroke:#e65100,stroke-width:3px
    classDef warningBox fill:none,stroke:#f57c00,stroke-width:3px
    classDef errorBox fill:none,stroke:#c62828,stroke-width:3px
    classDef successBox fill:none,stroke:#2e7d32,stroke-width:3px

    class Submission normalBox
    class QueuePhase decisionBox
    class Processing normalBox
    class Recovery warningBox
    class Success successBox

    class Submit,Validate normal
    class Backpressure,Circuit decision
    class Retry warning
    class DLQ,Alert error
    class Complete success

```

### 3.1 Retry Strategy

| Failure Type | Retry Count | Backoff | Max Retries Action |
|--------------|-------------|---------|-------------------|
| LLM API Timeout | 3 | Exponential: 2s, 4s, 8s | DLQ → Manual review |
| STT API Fail | 3 | Exponential: 1s, 2s, 4s | DLQ → Backup provider |
| Queue Error | 3 | Linear: 5s, 10s, 15s | DLQ → Alert admin |
| Invalid Format | 0 | N/A | Immediate DLQ |
| Circuit Open | Until closed | 30s cooldown | Queue pause |

### 3.2 Circuit Breaker States

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

## 4. State Machine & Data Consistency

```mermaid
---
config:
  layout: elk
---
flowchart TB
    subgraph States["SUBMISSION STATES"]
        direction LR
        PENDING@{ shape: circle, label: "PENDING" }
        QUEUED@{ shape: circle, label: "QUEUED" }
        PROCESSING@{ shape: circle, label: "PROCESSING" }
        ANALYZING@{ shape: circle, label: "ANALYZING" }
        GRADING@{ shape: circle, label: "GRADING" }
        COMPLETED@{ shape: dbl-circ, label: "COMPLETED" }
        ERROR@{ shape: rounded, label: "ERROR" }
        FAILED@{ shape: rounded, label: "FAILED" }
        REVIEW@{ shape: circle, label: "REVIEW_REQUIRED" }
    end

    PENDING -->|"Job published"| QUEUED
    QUEUED -->|"Worker picks up"| PROCESSING
    PROCESSING -->|"AI analyzing"| ANALYZING
    ANALYZING -->|"Scoring"| GRADING
    GRADING -->|"AI done, auto-grade"| COMPLETED
    GRADING -->|"AI done, review needed"| REVIEW
    REVIEW -->|"Instructor reviews"| COMPLETED
    
    PROCESSING -->|"Retryable error"| ERROR
    ANALYZING -->|"Retryable error"| ERROR
    GRADING -->|"Retryable error"| ERROR
    
    ERROR -->|"Auto-retry"| PROCESSING
    ERROR -->|"Max retries"| FAILED
    
    QUEUED -->|"Invalid job"| FAILED
    PROCESSING -->|"SLA timeout"| FAILED

    classDef pending fill:#616161,stroke:#9e9e9e,stroke-width:2px,color:#fff
    classDef active fill:#f57c00,stroke:#ffcc80,stroke-width:2px,color:#fff
    classDef success fill:#2e7d32,stroke:#a5d6a7,stroke-width:2px,color:#fff
    classDef error fill:#c62828,stroke:#ef5350,stroke-width:2px,color:#fff
    classDef review fill:#1565c0,stroke:#90caf9,stroke-width:2px,color:#fff

    classDef statesBox fill:none,stroke:#616161,stroke-width:3px

    class States statesBox

    class PENDING pending
    class QUEUED,PROCESSING,ANALYZING,GRADING active
    class COMPLETED success
    class ERROR,FAILED error
    class REVIEW review

```

### 4.1 State Machine Transitions

| Event | From | To | Action |
|-------|------|-----|--------|
| User submits | — | PENDING | Create record |
| Job published | PENDING | QUEUED | Enqueue to RabbitMQ |
| Worker picks up | QUEUED | PROCESSING | Start grading |
| AI analyzing | PROCESSING | ANALYZING | LLM/STT processing |
| Scoring | ANALYZING | GRADING | Calculate scores |
| AI done, auto-grade | GRADING | COMPLETED | Save result |
| AI done, review needed | GRADING | REVIEW_REQUIRED | Queue for instructor |
| Instructor reviews | REVIEW_REQUIRED | COMPLETED | Save final result |
| Retryable error | any AI state | ERROR | Log error |
| Max retries exceeded | ERROR | FAILED | DLQ, notify user |
| SLA timeout | any AI state | FAILED | Timeout scheduler |

### 4.2 Outbox Pattern

```mermaid
flowchart TB
    subgraph Transaction["SAME TRANSACTION"]
        direction TB
        Sub["INSERT INTO submissions"]
        Outbox["INSERT INTO outbox<br/>status: 'pending'"]
    end

    subgraph Async["ASYNC PROCESSING"]
        Relay["Outbox Relay Worker<br/>(poll every 1-2s)"]
        Lock["SELECT ... FOR UPDATE<br/>SKIP LOCKED"]
        Publish["Publish to RabbitMQ"]
        Confirm["UPDATE outbox<br/>status: 'sent'"]
    end

    Sub --> Outbox
    Outbox -.->|"poll"| Relay --> Lock --> Publish --> Confirm

    classDef trans fill:#1565c0,stroke:#90caf9,stroke-width:2px,color:#fff
    classDef async fill:#e65100,stroke:#ffab91,stroke-width:2px,color:#fff

    classDef transBox fill:none,stroke:#1565c0,stroke-width:3px
    classDef asyncBox fill:none,stroke:#e65100,stroke-width:3px

    class Transaction transBox
    class Async asyncBox

    class Sub,Outbox trans
    class Relay,Lock,Publish,Confirm async

```

---

## 5. Real-time Updates (SSE)

```mermaid
---
config:
  layout: elk
---
flowchart TB
    subgraph Client["CLIENT"]
        Browser["Browser/Mobile"]
        LocalState["Local State"]
    end

    subgraph SSE["SSE LAYER"]
        Endpoint["SSE Endpoint<br/>/api/sse/submissions/:id"]
        Heartbeat["Heartbeat<br/>30s"]
        Reconnect["Reconnect Logic<br/>Last-Event-ID"]
    end

    subgraph Bun["MAIN APP (Bun)"]
        Consumer["AMQP Consumer<br/>grading.callback"]
        PubSub["In-Memory Pub/Sub"]
        DBUpdate["DB Update"]
        Fallback["REST Fallback<br/>/api/submissions/:id/status"]
    end

    subgraph Worker["GRADING WORKER"]
        JobStart["Job Started"]
        Progress["Progress Update"]
        JobComplete["Job Complete"]
    end

    subgraph Queue["QUEUE"]
        CbQueue@{ shape: doc, label: "grading.callback" }
    end

    JobStart --> CbQueue
    Progress --> CbQueue
    JobComplete --> CbQueue
    
    CbQueue --> Consumer --> DBUpdate --> PubSub --> Endpoint
    Endpoint --> Browser --> LocalState
    
    Browser -->|"SSE fail"| Fallback
    
    Endpoint --> Heartbeat
    Browser --> Reconnect --> Endpoint

    classDef client fill:#1565c0,stroke:#90caf9,stroke-width:2px,color:#fff
    classDef sse fill:#7b1fa2,stroke:#ce93d8,stroke-width:2px,color:#fff
    classDef bun fill:#e65100,stroke:#ffab91,stroke-width:2px,color:#fff
    classDef worker fill:#2e7d32,stroke:#a5d6a7,stroke-width:2px,color:#fff
    classDef queue fill:#c2185b,stroke:#f48fb1,stroke-width:2px,color:#fff

    classDef clientBox fill:none,stroke:#1565c0,stroke-width:3px
    classDef sseBox fill:none,stroke:#7b1fa2,stroke-width:3px
    classDef bunBox fill:none,stroke:#e65100,stroke-width:3px
    classDef workerBox fill:none,stroke:#2e7d32,stroke-width:3px
    classDef queueBox fill:none,stroke:#c2185b,stroke-width:3px

    class Client clientBox
    class SSE sseBox
    class Bun bunBox
    class Worker workerBox
    class Queue queueBox

    class Browser,LocalState client
    class Endpoint,Heartbeat,Reconnect sse
    class Consumer,PubSub,DBUpdate,Fallback bun
    class JobStart,Progress,JobComplete worker
    class CbQueue queue

```

### 5.1 Status Mapping

| Status | Meaning | Update Type |
|--------|---------|-------------|
| PENDING | Chờ enqueue | Real-time < 100ms |
| QUEUED | Job trong RabbitMQ | Real-time < 500ms |
| PROCESSING | Worker đang xử lý | Batch 25% / 10s |
| ANALYZING | AI đang analyze | Streaming tokens |
| COMPLETED | Done | Real-time < 100ms |
| ERROR | Processing fail | Immediate |
| FAILED | Timeout / Max retries | Immediate |

---

## 6. Hybrid Grading với Confidence Score

```mermaid
---
config:
  layout: elk
---
flowchart TB
    subgraph Input["INPUT"]
        Writing@{ shape: doc, label: "Writing Submission" }
        Speaking@{ shape: doc, label: "Speaking Submission" }
    end

    subgraph Preprocess["PRE-PROCESSING"]
        Validate@{ shape: fr-rect, label: "Validate Input" }
        Transcribe@{ shape: fr-rect, label: "Speech-to-Text" }
        Extract@{ shape: fr-rect, label: "Extract Features" }
    end

    subgraph AIGrading["AI GRADING"]
        direction TB
        Grammar@{ shape: fr-rect, label: "Grammar Analysis" }
        Vocab@{ shape: fr-rect, label: "Vocabulary Analysis" }
        Content@{ shape: fr-rect, label: "Content Analysis" }
        Fluency@{ shape: fr-rect, label: "Fluency Analysis" }
    end

    subgraph Confidence["CONFIDENCE CALCULATION"]
        ModelCons@{ shape: fr-rect, label: "Model Consistency<br/>30%" }
        RuleVal@{ shape: fr-rect, label: "Rule Validation<br/>25%" }
        ContentSim@{ shape: fr-rect, label: "Content Similarity<br/>25%" }
        LengthHeur@{ shape: fr-rect, label: "Length Heuristic<br/>20%" }
        Score@{ shape: diam, label: "Confidence Score\n0-100%" }
    end

    subgraph Routing["ROUTING"]
        Threshold@{ shape: diam, label: "Confidence ≥ 85%?" }
        SpotCheck@{ shape: diam, label: "Spot Check<br/>5-10%?" }
        Auto@{ shape: rounded, label: "Auto-Grade" }
        Human@{ shape: rounded, label: "Human Review Queue" }
    end

    subgraph HumanGrading["HUMAN GRADING"]
        Claim@{ shape: fr-rect, label: "Claim Submission<br/>Redis Lock 15m" }
        Review@{ shape: fr-rect, label: "Instructor Review" }
        Override@{ shape: diam, label: "Override AI?" }
        Weighted@{ shape: fr-rect, label: "Weighted Final Score" }
    end

    Writing --> Validate --> Extract
    Speaking --> Validate --> Transcribe --> Extract
    
    Extract --> Grammar --> ModelCons
    Extract --> Vocab --> RuleVal
    Extract --> Content --> ContentSim
    Extract --> Fluency --> LengthHeur
    
    ModelCons --> Score
    RuleVal --> Score
    ContentSim --> Score
    LengthHeur --> Score
    
    Score --> Threshold
    Threshold -->|"Yes"| SpotCheck
    SpotCheck -->|"No"| Auto
    SpotCheck -->|"Yes"| Human
    Threshold -->|"No"| Human
    
    Human --> Claim --> Review --> Override --> Weighted

    classDef input fill:#1565c0,stroke:#90caf9,stroke-width:2px,color:#fff
    classDef process fill:#e65100,stroke:#ffab91,stroke-width:2px,color:#fff
    classDef ai fill:#2e7d32,stroke:#a5d6a7,stroke-width:2px,color:#fff
    classDef conf fill:#f9a825,stroke:#f57f17,stroke-width:2px,color:#000
    classDef route fill:#7b1fa2,stroke:#ce93d8,stroke-width:2px,color:#fff
    classDef human fill:#5d4037,stroke:#3e2723,stroke-width:2px,color:#fff

    classDef inputBox fill:none,stroke:#1565c0,stroke-width:3px
    classDef processBox fill:none,stroke:#e65100,stroke-width:3px
    classDef aiBox fill:none,stroke:#2e7d32,stroke-width:3px
    classDef confBox fill:none,stroke:#f9a825,stroke-width:3px
    classDef routeBox fill:none,stroke:#7b1fa2,stroke-width:3px
    classDef humanBox fill:none,stroke:#5d4037,stroke-width:3px

    class Input inputBox
    class Preprocess processBox
    class AIGrading aiBox
    class Confidence confBox
    class Routing routeBox
    class HumanGrading humanBox

    class Writing,Speaking input
    class Validate,Transcribe,Extract process
    class Grammar,Vocab,Content,Fluency ai
    class ModelCons,RuleVal,ContentSim,LengthHeur,Score conf
    class Threshold,SpotCheck,Auto route
    class Claim,Review,Override,Weighted human

```

### 6.1 Confidence Score Formula

```
Confidence Score = clamp(0, 100, Σ(Factor_i × Weight_i))

Factors:
├── Model Consistency (30%)
│   └── std dev across 3 LLM samples
│   └── Score = 100 - (std_dev × 20)
├── Rule Validation (25%)
│   ├── Word count within band range
│   ├── Format compliance
│   ├── Rubric coverage
│   └── Time limit compliance
├── Content Similarity (25%)
│   └── Cosine similarity vs template essays
│   └── Lower similarity = higher confidence
└── Length Heuristic (20%)
    ├── Sentence count appropriate
    ├── Paragraph structure valid
    ├── Vocabulary density ok
    └── Complexity score appropriate
```

### 6.2 Confidence Thresholds

| Confidence | Action | Human Priority |
|------------|--------|----------------|
| 90-100% | Auto-grade | None |
| 85-89% | Auto-grade + audit flag | Low |
| 70-84% | Human review | Medium |
| 50-69% | Human review | High |
| < 50% | Human review + AI warning | Critical |

### 6.3 Weighted Final Score

```
If scoreDiff <= 0.5 AND bandStepDiff <= 1:
    Final = (AI_score × 0.4) + (Human_score × 0.6)
Else:
    Final = Human_score (Human overrides)
    Flag for audit + model tuning
```

---

## 7. Hành Trình Ngườii Dùng

```mermaid
---
config:
  layout: elk
---
flowchart LR
    Start@{ shape: circle, label: "Bắt đầu" }
    Reg@{ shape: fr-rect, label: "Đăng ký<br/>Email/Password" }
    Profile@{ shape: fr-rect, label: "Thiết lập<br/>Hồ sơ" }
    Goal@{ shape: fr-rect, label: "Thiết lập Goal<br/>Target Level" }
    SelfAssess@{ shape: rounded, label: "Self-Assessment<br/>(Optional)" }
    Select@{ shape: diam, label: "Chọn Mode" }
    Practice@{ shape: fr-rect, label: "Practice Mode<br/>Adaptive" }
    Mock@{ shape: fr-rect, label: "Mock Test<br/>Full Exam" }
    Feedback@{ shape: fr-rect, label: "Feedback & Results" }
    Progress@{ shape: fr-rect, label: "Progress Tracking" }
    GoalCheck@{ shape: diam, label: "Goal đạt?" }
    End@{ shape: dbl-circ, label: "Kết thúc" }

    Start --> Reg --> Profile --> Goal --> SelfAssess --> Select
    Select -->|"Practice"| Practice
    Select -->|"Mock"| Mock
    Practice --> Feedback
    Mock --> Feedback
    Feedback --> Progress --> GoalCheck
    GoalCheck -->|"Không"| Select
    GoalCheck -->|"Có"| End

    classDef start fill:#1565c0,stroke:#90caf9,stroke-width:2px,color:#fff
    classDef process fill:#e65100,stroke:#ffab91,stroke-width:2px,color:#fff
    classDef decision fill:#7b1fa2,stroke:#ce93d8,stroke-width:2px,color:#fff
    classDef success fill:#2e7d32,stroke:#a5d6a7,stroke-width:2px,color:#fff
    classDef optional fill:#616161,stroke:#9e9e9e,stroke-width:2px,stroke-dasharray: 5 5,color:#fff

    class Start start
    class Reg,Profile,Goal,Practice,Mock,Feedback,Progress process
    class Select,GoalCheck decision
    class End success
    class SelfAssess optional

```

---

## 8. Practice Mode — Adaptive Scaffolding

### 8A. Writing Scaffolding

```mermaid
---
config:
  layout: elk
---
flowchart TB
    subgraph Input["INPUT"]
        Task@{ shape: doc, label: "Select Task" }
        Level@{ shape: diam, label: "Determine Level" }
        History@{ shape: rounded, label: "Attempt History" }
    end

    subgraph Stage["SCAFFOLD STAGE"]
        direction LR
        S1@{ shape: fr-rect, label: "Stage 1: Template" }
        S2@{ shape: fr-rect, label: "Stage 2: Keywords" }
        S3@{ shape: fr-rect, label: "Stage 3: Free" }
    end

    subgraph Feedback["FEEDBACK LOOP"]
        direction TB
        Grammar@{ shape: fr-rect, label: "Grammar Check" }
        Vocab@{ shape: fr-rect, label: "Vocabulary" }
        Cohesion@{ shape: fr-rect, label: "Coherence" }
        TaskResp@{ shape: fr-rect, label: "Task Achievement" }
    end

    subgraph Progression["PROGRESSION"]
        Check@{ shape: diam, label: "Check Last 3 Scores" }
        Up@{ shape: rounded, label: "Level Up" }
        Stay@{ shape: rounded, label: "Stay Same" }
        Down@{ shape: rounded, label: "Level Down" }
    end

    Task --> Level --> History --> Stage
    Level -->|"A1-A2"| S1
    Level -->|"B1"| S2
    Level -->|"B2-C1"| S3
    
    S1 --> Grammar --> Check
    S2 --> Grammar --> Check
    S3 --> Grammar --> Check
    Grammar --> Vocab --> Cohesion --> TaskResp
    
    Check -->|"Avg ≥ 80% × 3"| Up
    Check -->|"Avg 50-80%"| Stay
    Check -->|"Avg < 50% × 2"| Down
    
    Up -->|"S1→S2"| S2
    Up -->|"S2→S3"| S3
    Stay --> Stage
    Down -->|"S2→S1"| S1
    Down -->|"S3→S2"| S2

    classDef input fill:#1565c0,stroke:#90caf9,stroke-width:2px,color:#fff
    classDef stage fill:#e65100,stroke:#ffab91,stroke-width:2px,color:#fff
    classDef feedback fill:#2e7d32,stroke:#a5d6a7,stroke-width:2px,color:#fff
    classDef progress fill:#7b1fa2,stroke:#ce93d8,stroke-width:2px,color:#fff

    classDef inputBox fill:none,stroke:#1565c0,stroke-width:3px
    classDef stageBox fill:none,stroke:#e65100,stroke-width:3px
    classDef feedbackBox fill:none,stroke:#2e7d32,stroke-width:3px
    classDef progressBox fill:none,stroke:#7b1fa2,stroke-width:3px

    class Input inputBox
    class Stage stageBox
    class Feedback feedbackBox
    class Progression progressBox

    class Task,Level,History input
    class S1,S2,S3 stage
    class Grammar,Vocab,Cohesion,TaskResp feedback
    class Check,Up,Stay,Down progress

```

### 8B. Writing Progression Rules

| Current | Condition | Action | Next |
|---------|-----------|--------|------|
| Template | Avg ≥ 80% × 3 | Level Up | Keywords |
| Template | Avg < 50% × 2 | Stay + hints | Template |
| Keywords | Avg ≥ 75% × 3 | Level Up | Free |
| Keywords | Avg < 60% × 2 | Level Down | Template |
| Keywords | 60-75% | Stay | Keywords |
| Free | Avg ≥ 70% × 3 | Maintain | Free |
| Free | Avg < 65% × 2 | Level Down | Keywords |

---

## 9. Authentication & RBAC

```mermaid
---
config:
  layout: elk
---
flowchart TB
    subgraph Auth["AUTHENTICATION"]
        Login@{ shape: rounded, label: "Login" }
        Rate@{ shape: fr-rect, label: "Rate Limit<br/>5 req/min" }
        Access@{ shape: doc, label: "Access Token<br/>JWT" }
        Refresh@{ shape: doc, label: "Refresh Token<br/>JWT" }
    end

    subgraph Verify["VERIFICATION"]
        Validate@{ shape: fr-rect, label: "Validate JWT" }
        RefreshEp@{ shape: fr-rect, label: "Refresh Endpoint" }
        Store@{ shape: cyl, label: "Refresh Token Store<br/>MainDB" }
    end

    subgraph RBAC["RBAC"]
        Roles@{ shape: fr-rect, label: "Role Assignment" }
        Check@{ shape: diam, label: "Permission Check" }
    end

    subgraph Resources["RESOURCES"]
        direction LR
        Practice@{ shape: rounded, label: "Practice Mode" }
        Mock@{ shape: rounded, label: "Mock Test" }
        Grading@{ shape: rounded, label: "Grading Portal" }
        Admin@{ shape: rounded, label: "Admin Panel" }
    end

    Login --> Rate --> Access & Refresh
    Access --> Validate
    Refresh --> RefreshEp --> Store --> Access
    
    Validate --> Roles --> Check
    Check -->|"Learner"| Practice & Mock
    Check -->|"Instructor"| Grading
    Check -->|"Admin"| Admin

    classDef auth fill:#1565c0,stroke:#90caf9,stroke-width:2px,color:#fff
    classDef verify fill:#e65100,stroke:#ffab91,stroke-width:2px,color:#fff
    classDef rbac fill:#2e7d32,stroke:#a5d6a7,stroke-width:2px,color:#fff
    classDef resources fill:#7b1fa2,stroke:#ce93d8,stroke-width:2px,color:#fff
    classDef data fill:#c2185b,stroke:#f48fb1,stroke-width:2px,color:#fff

    classDef authBox fill:none,stroke:#1565c0,stroke-width:3px
    classDef verifyBox fill:none,stroke:#e65100,stroke-width:3px
    classDef rbacBox fill:none,stroke:#2e7d32,stroke-width:3px
    classDef resourcesBox fill:none,stroke:#7b1fa2,stroke-width:3px
    classDef dataBox fill:none,stroke:#c2185b,stroke-width:3px

    class Auth authBox
    class Verify verifyBox
    class RBAC rbacBox
    class Resources resourcesBox
    class Store dataBox

    class Login,Rate,Access,Refresh auth
    class Validate,RefreshEp verify
    class Roles,Check rbac
    class Practice,Mock,Grading,Admin resources

```

### 9.1 Refresh Token Enforcement

```mermaid
flowchart TB
    subgraph Login["LOGIN FLOW"]
        Attempt@{ shape: fr-rect, label: "Login Attempt" }
        Count@{ shape: diam, label: "Count Active Tokens" }
        Warn@{ shape: rounded, label: "Return 409 Conflict<br/>+ Device List" }
        Revoke@{ shape: fr-rect, label: "User Confirm Revoke<br/>Oldest Device" }
        Issue@{ shape: doc, label: "Issue New Token" }
    end

    Attempt --> Count
    Count -->|"< 3"| Issue
    Count -->|"≥ 3"| Warn --> Revoke --> Issue

    classDef process fill:#e65100,stroke:#ffab91,stroke-width:2px,color:#fff
    classDef decision fill:#7b1fa2,stroke:#ce93d8,stroke-width:2px,color:#fff
    classDef success fill:#2e7d32,stroke:#a5d6a7,stroke-width:2px,color:#fff

    classDef processBox fill:none,stroke:#e65100,stroke-width:3px
    classDef decisionBox fill:none,stroke:#7b1fa2,stroke-width:3px
    classDef successBox fill:none,stroke:#2e7d32,stroke-width:3px

    class Login processBox

    class Attempt,Revoke,Issue process
    class Count decision

```

### 9.2 Role Permissions

| Role | Permissions |
|------|-------------|
| **Learner** | Practice, Mock Test, Progress, View Results |
| **Instructor** | Learner permissions + Grading Portal, Review |
| **Admin** | All permissions + User/Content Management |

---

## Tóm Tắt Diagram Types

| Section | Diagram | Features Used |
|---------|---------|---------------|
| 1. Kiến trúc | High-level Overview | ELK, cyl, fr-rect, st-rect |
| 2. Submission Flow | Detailed Flow | doc, cyl, directional subgraphs |
| 3. Error Handling | Decision Flow | diam, rounded, color-coded states |
| 4. State Machine | State Diagram | stateDiagram-v2, color-coded circles |
| 5. Outbox Pattern | Transaction Flow | Dotted lines, transaction grouping |
| 6. Real-time | SSE Architecture | Invisible connectors, fallback paths |
| 7. Hybrid Grading | Complex Pipeline | Multi-layer, decision diamonds |
| 8. User Journey | Linear Flow | LR direction, dbl-circ end |
| 9. Practice | Scaffolding Flow | Stage progression, feedback loop |
| 10. Auth | Security Flow | cyl for DB, doc for tokens |

---

## Mermaid v11 Style Guide

### Shapes Dictionary

| Shape | Syntax | Usage |
|-------|--------|-------|
| Circle | `@{ shape: circle }` | States, users |
| Double Circle | `@{ shape: dbl-circ }` | End states |
| Cylinder | `@{ shape: cyl }` | Databases |
| Document | `@{ shape: doc }` | Queues, files |
| Rounded | `@{ shape: rounded }` | Processes |
| Rectangle | `@{ shape: rect }` | Default |
| Framed Rect | `@{ shape: fr-rect }` | Core processes |
| Stacked Rect | `@{ shape: st-rect }` | Multi-process |
| Diamond | `@{ shape: diam }` | Decisions |

### Color Palette (Dark Mode Compatible)

| Layer | Fill | Stroke | Text | WCAG |
|-------|------|--------|------|------|
| Client | `#1565c0` | `#90caf9` | `#fff` | AA ✓ |
| Bun/API | `#e65100` | `#ffab91` | `#fff` | AA ✓ |
| Python | `#2e7d32` | `#a5d6a7` | `#fff` | AA ✓ |
| Queue | `#7b1fa2` | `#ce93d8` | `#fff` | AA ✓ |
| Database | `#c2185b` | `#f48fb1` | `#fff` | AA ✓ |
| Success | `#1b5e20` | `#81c784` | `#fff` | AAA ✓ |
| Error | `#b71c1c` | `#ef5350` | `#fff` | AA ✓ |
| Warning | `#e65100` | `#ffcc80` | `#fff` | AA ✓ |
| Pending/Gray | `#424242` | `#9e9e9e` | `#fff` | AAA ✓ |

> **Lưu ý về stroke colors**: Sử dụng màu stroke **sáng hơn** fill để hiện rõ trên cả light và dark mode.

---

*Cập nhật với Mermaid v11 ELK layout · SP26SE145*
