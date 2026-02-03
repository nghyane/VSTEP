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

    %% Nodes - solid fill
    classDef users fill:#1565c0,stroke:#1565c0,color:#fff
    classDef bun fill:#e65100,stroke:#e65100,color:#fff
    classDef python fill:#2e7d32,stroke:#2e7d32,color:#fff
    classDef data fill:#c2185b,stroke:#c2185b,color:#fff

    %% Subgraph boxes - transparent with thick colored border
    classDef usersBox fill:none,stroke:#1565c0,stroke-width:3px,color:#1565c0
    classDef bunBox fill:none,stroke:#e65100,stroke-width:3px,color:#e65100
    classDef pythonBox fill:none,stroke:#2e7d32,stroke-width:3px,color:#2e7d32
    classDef dataBox fill:none,stroke:#c2185b,stroke-width:3px,color:#c2185b

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
        User["User Submit\nWriting/Speaking"]
    end

    subgraph Bun["MAIN APP (Bun)"]
        direction TB
        Validate["Validate Input"]
        CreateSub["Create Submission\nStatus: PENDING"]
        SaveDB[("MainDB")]
        WriteOutbox["Write Outbox"]
        Relay["Outbox Relay Worker"]
        Consume["Callback Consumer"]
        UpdateStatus["Update Status\nPROCESSING → COMPLETED"]
    end

    subgraph Queue["MESSAGE QUEUE"]
        ReqQueue@{ shape: doc, label: "grading.request" }
        CbQueue@{ shape: doc, label: "grading.callback" }
    end

    subgraph Python["GRADING SERVICE (Python)"]
        direction TB
        Receive["Receive Job"]
        Process["Process Grading\nAI / STT / Scorer"]
        SaveGrade[("GradingDB")]
        SendCb["Send Callback"]
    end

    User --> Validate --> CreateSub --> SaveDB
    CreateSub --> WriteOutbox
    WriteOutbox --> Relay --> ReqQueue --> Receive
    Receive --> Process --> SaveGrade --> SendCb --> CbQueue --> Consume
    Consume --> UpdateStatus --> SaveDB

    %% Nodes
    classDef client fill:#1565c0,stroke:#1565c0,color:#fff
    classDef bun fill:#e65100,stroke:#e65100,color:#fff
    classDef queue fill:#7b1fa2,stroke:#7b1fa2,color:#fff
    classDef python fill:#2e7d32,stroke:#2e7d32,color:#fff
    classDef db fill:#c2185b,stroke:#c2185b,color:#fff

    %% Boxes - transparent with thick colored border
    classDef clientBox fill:none,stroke:#1565c0,stroke-width:3px,color:#1565c0
    classDef bunBox fill:none,stroke:#e65100,stroke-width:3px,color:#e65100
    classDef queueBox fill:none,stroke:#7b1fa2,stroke-width:3px,color:#7b1fa2
    classDef pythonBox fill:none,stroke:#2e7d32,stroke-width:3px,color:#2e7d32

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
        Retry@{ shape: st-rect, label: "Retry Logic\nExponential + Jitter" }
        DLQ@{ shape: doc, label: "Dead Letter Queue" }
        Alert@{ shape: rounded, label: "Alert Admin" }
    end

    subgraph Success["SUCCESS"]
        Complete@{ shape: dbl-circ, label: "Completed" }
    end

    Submit --> Validate --> Enqueue --> Backpressure
    Backpressure -->|"No"| Dequeue
    Backpressure -->|"Yes"| Delayed["Set DELAYED\nNotify User"]
    
    Dequeue --> Process --> Circuit
    Circuit -->|"Closed"| External
    Circuit -->|"Open"| Retry
    
    External -->|"Success"| Complete
    External -->|"Timeout/Fail"| Retry
    
    Retry -->|"Retryable"| Dequeue
    Retry -->|"Max retries"| DLQ --> Alert
    
    Process -->|"Invalid message"| DLQ

    %% Nodes
    classDef normal fill:#1976d2,stroke:#1976d2,color:#fff
    classDef decision fill:#f57c00,stroke:#f57c00,color:#fff
    classDef warning fill:#ffa726,stroke:#ffa726,color:#000
    classDef error fill:#d32f2f,stroke:#d32f2f,color:#fff
    classDef success fill:#388e3c,stroke:#388e3c,color:#fff

    %% Boxes - transparent with thick colored border
    classDef normalBox fill:none,stroke:#1976d2,stroke-width:3px,color:#1976d2
    classDef queueBox fill:none,stroke:#f57c00,stroke-width:3px,color:#f57c00
    classDef processBox fill:none,stroke:#ffa726,stroke-width:3px,color:#ffa726
    classDef errorBox fill:none,stroke:#d32f2f,stroke-width:3px,color:#d32f2f
    classDef successBox fill:none,stroke:#388e3c,stroke-width:3px,color:#388e3c

    class Submission normalBox
    class QueuePhase queueBox
    class Processing processBox
    class Recovery errorBox
    class Success successBox

    class Submit,Validate,SaveLocal,Enqueue,QueueMonitor normal
    class Dequeue,Process,Circuit,LLMCall,STTCall decision
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

    %% Nodes
    classDef pending fill:#757575,stroke:#757575,color:#fff
    classDef active fill:#f57c00,stroke:#f57c00,color:#fff
    classDef success fill:#388e3c,stroke:#388e3c,color:#fff
    classDef error fill:#d32f2f,stroke:#d32f2f,color:#fff
    classDef review fill:#1976d2,stroke:#1976d2,color:#fff

    %% Box
    classDef statesBox fill:none,stroke:#616161,stroke-width:3px,color:#616161

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
        Outbox["INSERT INTO outbox\nstatus: 'pending'"]
    end

    subgraph Async["ASYNC PROCESSING"]
        Relay["Outbox Relay Worker\n(poll every 1-2s)"]
        Lock["SELECT ... FOR UPDATE\nSKIP LOCKED"]
        Publish["Publish to RabbitMQ"]
        Confirm["UPDATE outbox\nstatus: 'sent'"]
    end

    Sub --> Outbox
    Outbox -.->|"poll"| Relay --> Lock --> Publish --> Confirm

    %% Nodes
    classDef trans fill:#1976d2,stroke:#1976d2,color:#fff
    classDef async fill:#f57c00,stroke:#f57c00,color:#fff

    %% Boxes
    classDef transBox fill:none,stroke:#1976d2,stroke-width:3px,color:#1976d2
    classDef asyncBox fill:none,stroke:#f57c00,stroke-width:3px,color:#f57c00

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
        Endpoint["SSE Endpoint\n/api/sse/submissions/:id"]
        Heartbeat["Heartbeat\n30s"]
        Reconnect["Reconnect Logic\nLast-Event-ID"]
    end

    subgraph Bun["MAIN APP (Bun)"]
        Consumer["AMQP Consumer\ngrading.callback"]
        PubSub["In-Memory Pub/Sub"]
        DBUpdate["DB Update"]
        Fallback["REST Fallback"]
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

    %% Nodes
    classDef client fill:#1565c0,stroke:#1565c0,color:#fff
    classDef sse fill:#7b1fa2,stroke:#7b1fa2,color:#fff
    classDef bun fill:#f57c00,stroke:#f57c00,color:#fff
    classDef worker fill:#388e3c,stroke:#388e3c,color:#fff
    classDef queue fill:#c2185b,stroke:#c2185b,color:#fff

    %% Boxes
    classDef clientBox fill:none,stroke:#1565c0,stroke-width:3px,color:#1565c0
    classDef sseBox fill:none,stroke:#7b1fa2,stroke-width:3px,color:#7b1fa2
    classDef bunBox fill:none,stroke:#f57c00,stroke-width:3px,color:#f57c00
    classDef workerBox fill:none,stroke:#388e3c,stroke-width:3px,color:#388e3c
    classDef queueBox fill:none,stroke:#c2185b,stroke-width:3px,color:#c2185b

    class Client clientBox
    class SSE sseBox
    class Bun bunBox
    class Worker workerBox
    class Queue queueBox

    class Browser,LocalState client
    class Endpoint,Heartbeat,Reconnect sse
    class Consumer,PubSub,DBUpdate,Fallback bun
    class JobStart,Progress,JobComplete worker
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
        ModelCons@{ shape: fr-rect, label: "Model Consistency\n30%" }
        RuleVal@{ shape: fr-rect, label: "Rule Validation\n25%" }
        ContentSim@{ shape: fr-rect, label: "Content Similarity\n25%" }
        LengthHeur@{ shape: fr-rect, label: "Length Heuristic\n20%" }
        Score@{ shape: diam, label: "Confidence Score\n0-100%" }
    end

    subgraph Routing["ROUTING"]
        Threshold@{ shape: diam, label: "Confidence ≥ 85%?" }
        SpotCheck@{ shape: diam, label: "Spot Check\n5-10%?" }
        Auto@{ shape: rounded, label: "Auto-Grade" }
        Human@{ shape: rounded, label: "Human Review Queue" }
    end

    subgraph HumanGrading["HUMAN GRADING"]
        Claim@{ shape: fr-rect, label: "Claim Submission\nRedis Lock 15m" }
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

    %% Nodes
    classDef input fill:#1976d2,stroke:#1976d2,color:#fff
    classDef process fill:#f57c00,stroke:#f57c00,color:#fff
    classDef ai fill:#388e3c,stroke:#388e3c,color:#fff
    classDef conf fill:#fbc02d,stroke:#fbc02d,color:#000
    classDef route fill:#7b1fa2,stroke:#7b1fa2,color:#fff
    classDef human fill:#5d4037,stroke:#5d4037,color:#fff

    %% Boxes
    classDef inputBox fill:none,stroke:#1976d2,stroke-width:3px,color:#1976d2
    classDef processBox fill:none,stroke:#f57c00,stroke-width:3px,color:#f57c00
    classDef aiBox fill:none,stroke:#388e3c,stroke-width:3px,color:#388e3c
    classDef confBox fill:none,stroke:#fbc02d,stroke-width:3px,color:#fbc02d
    classDef routeBox fill:none,stroke:#7b1fa2,stroke-width:3px,color:#7b1fa2
    classDef humanBox fill:none,stroke:#5d4037,stroke-width:3px,color:#5d4037

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
    class Threshold,Auto,Human route
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
    Reg@{ shape: fr-rect, label: "Đăng ký\nEmail/Password" }
    Profile@{ shape: fr-rect, label: "Thiết lập\nHồ sơ" }
    Goal@{ shape: fr-rect, label: "Thiết lập Goal\nTarget Level" }
    SelfAssess@{ shape: rounded, label: "Self-Assessment\n(Optional)" }
    Select@{ shape: diam, label: "Chọn Mode" }
    Practice@{ shape: fr-rect, label: "Practice Mode\nAdaptive" }
    Mock@{ shape: fr-rect, label: "Mock Test\nFull Exam" }
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

    %% Nodes
    classDef start fill:#1565c0,stroke:#1565c0,color:#fff
    classDef process fill:#e65100,stroke:#e65100,color:#fff
    classDef decision fill:#7b1fa2,stroke:#7b1fa2,color:#fff
    classDef success fill:#388e3c,stroke:#388e3c,color:#fff
    classDef optional fill:#757575,stroke:#757575,color:#fff

    %% No subgraphs in this diagram
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

    %% Nodes
    classDef input fill:#1976d2,stroke:#1976d2,color:#fff
    classDef stage fill:#f57c00,stroke:#f57c00,color:#fff
    classDef feedback fill:#388e3c,stroke:#388e3c,color:#fff
    classDef progress fill:#7b1fa2,stroke:#7b1fa2,color:#fff

    %% Boxes
    classDef inputBox fill:none,stroke:#1976d2,stroke-width:3px,color:#1976d2
    classDef stageBox fill:none,stroke:#f57c00,stroke-width:3px,color:#f57c00
    classDef feedbackBox fill:none,stroke:#388e3c,stroke-width:3px,color:#388e3c
    classDef progressBox fill:none,stroke:#7b1fa2,stroke-width:3px,color:#7b1fa2

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
        Rate@{ shape: fr-rect, label: "Rate Limit\n5 req/min" }
        Access@{ shape: doc, label: "Access Token\nJWT" }
        Refresh@{ shape: doc, label: "Refresh Token\nJWT" }
    end

    subgraph Verify["VERIFICATION"]
        Validate@{ shape: fr-rect, label: "Validate JWT" }
        RefreshEp@{ shape: fr-rect, label: "Refresh Endpoint" }
        Store@{ shape: cyl, label: "Refresh Token Store\nMainDB" }
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

    %% Nodes
    classDef auth fill:#1565c0,stroke:#1565c0,color:#fff
    classDef verify fill:#e65100,stroke:#e65100,color:#fff
    classDef rbac fill:#388e3c,stroke:#388e3c,color:#fff
    classDef resources fill:#7b1fa2,stroke:#7b1fa2,color:#fff
    classDef data fill:#c2185b,stroke:#c2185b,color:#fff

    %% Boxes
    classDef authBox fill:none,stroke:#1565c0,stroke-width:3px,color:#1565c0
    classDef verifyBox fill:none,stroke:#e65100,stroke-width:3px,color:#e65100
    classDef rbacBox fill:none,stroke:#388e3c,stroke-width:3px,color:#388e3c
    classDef resourcesBox fill:none,stroke:#7b1fa2,stroke-width:3px,color:#7b1fa2

    class Auth authBox
    class Verify verifyBox
    class RBAC rbacBox
    class Resources resourcesBox

    class Login,Rate,Access,Refresh auth
    class Validate,RefreshEp verify
    class Roles,Check rbac
    class Practice,Mock,Grading,Admin resources
    class Store data
```

### 9.1 Refresh Token Enforcement

```mermaid
flowchart TB
    subgraph Login["LOGIN FLOW"]
        Attempt@{ shape: fr-rect, label: "Login Attempt" }
        Count@{ shape: diam, label: "Count Active Tokens" }
        Warn@{ shape: rounded, label: "Return 409 Conflict\n+ Device List" }
        Revoke@{ shape: fr-rect, label: "User Confirm Revoke\nOldest Device" }
        Issue@{ shape: doc, label: "Issue New Token" }
    end

    Attempt --> Count
    Count -->|"< 3"| Issue
    Count -->|"≥ 3"| Warn --> Revoke --> Issue

    %% Nodes
    classDef process fill:#1976d2,stroke:#1976d2,color:#fff
    classDef decision fill:#f57c00,stroke:#f57c00,color:#fff
    classDef success fill:#388e3c,stroke:#388e3c,color:#fff

    %% Box
    classDef loginBox fill:none,stroke:#1976d2,stroke-width:3px,color:#1976d2

    class Login loginBox

    class Attempt,Revoke,Issue process
    class Count decision
    class Issue success
```

### 9.2 Role Permissions

| Role | Permissions |
|------|-------------|
| **Learner** | Practice, Mock Test, Progress, View Results |
| **Instructor** | Learner permissions + Grading Portal, Review |
| **Admin** | All permissions + User/Content Management |

---

## Style Guide

### Color Convention

| Type | Fill | Stroke | Text | Usage |
|------|------|--------|------|-------|
| **Nodes** | Solid color | Same as fill | White | Individual elements |
| **Subgraphs** | Light tint (10-20%) | Dark color | Black | Container boxes |

### Node Colors

| Layer | Node Fill | Box Stroke | Box Text |
|-------|-----------|------------|----------|
| Client | `#1565c0` | `#1565c0` (3px) | `#1565c0` |
| Bun/API | `#e65100` | `#e65100` (3px) | `#e65100` |
| Python | `#2e7d32` | `#2e7d32` (3px) | `#2e7d32` |
| Queue | `#7b1fa2` | `#7b1fa2` (3px) | `#7b1fa2` |
| Database | `#c2185b` | `#c2185b` (3px) | `#c2185b` |
| Success | `#388e3c` | `#388e3c` (3px) | `#388e3c` |
| Error | `#d32f2f` | `#d32f2f` (3px) | `#d32f2f` |
| Warning | `#f57c00` | `#f57c00` (3px) | `#f57c00` |

> **Note**: Box fill is always `none` (transparent) for visibility on both light and dark modes.

### Shapes

| Shape | Syntax | Usage |
|-------|--------|-------|
| Circle | `@{ shape: circle }` | Users, states |
| Double Circle | `@{ shape: dbl-circ }` | End states |
| Cylinder | `@{ shape: cyl }` | Databases |
| Document | `@{ shape: doc }` | Queues, tokens |
| Rectangle | `@{ shape: rect }` (default) | Processes |
| Framed Rect | `@{ shape: fr-rect }` | Core modules |
| Stacked Rect | `@{ shape: st-rect }` | Multi-process |
| Diamond | `@{ shape: diam }` | Decisions |
| Rounded | `@{ shape: rounded }` | Soft edges |

---

*Cập nhật với Mermaid v11 ELK layout · SP26SE145*
