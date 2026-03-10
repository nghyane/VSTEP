# I. Lịch Sử Thay Đổi

*A — Thêm mới · M — Chỉnh sửa · D — Xóa

| Ngày | A/M/D | Người phụ trách | Mô tả thay đổi |
|------|-------|-----------|-------------------|
| 02/03/2026 | A | Nghĩa (Trưởng nhóm) | SDD ban đầu — thiết kế kiến trúc, biểu đồ thành phần, biểu đồ tuần tự, thiết kế cơ sở dữ liệu, thiết kế giao diện |

---
# II. Tài Liệu Thiết Kế Phần Mềm

## 1. Thiết Kế Hệ Thống

### 1.1 Kiến Trúc Hệ Thống

Hệ thống Luyện thi VSTEP Thích ứng tuân theo kiến trúc **monorepo dạng module** với ba ứng dụng triển khai độc lập dùng chung một Git repository:

| Ứng dụng | Runtime | Vai trò |
|-------------|---------|------|
| **Backend** (API chính) | Bun + Elysia | Máy chủ REST API xử lý tất cả yêu cầu từ client, xác thực, logic nghiệp vụ, và chấm điểm tự động cho các kỹ năng trắc nghiệm |
| **Grading** (Worker AI) | Python + FastAPI | Worker bất đồng bộ tiêu thụ tác vụ từ Redis Streams cho việc chấm Writing/Speaking bằng AI thông qua LLM và STT |
| **Frontend** (Web SPA) | React 19 + Vite 7 | Ứng dụng trang đơn phục vụ giao diện cho người học, giảng viên và quản trị viên |

**Các quyết định kiến trúc chính:**

- **Mô hình Shared-DB**: Backend kết nối tới PostgreSQL qua Drizzle ORM. Grading Worker chỉ giao tiếp qua Redis Streams — không kết nối trực tiếp tới PostgreSQL. Backend grading consumer đọc kết quả từ stream `grading:results` và thực hiện tất cả các thao tác ghi DB.
- **Redis Streams**: Redis Streams với `XADD`/`XREADGROUP` và consumer group cho việc dispatch tác vụ và tiêu thụ kết quả đáng tin cậy.
- **JWT Auth**: Cặp access/refresh token với rotation và phát hiện tái sử dụng.
- **Parse, Don't Validate**: Tất cả đầu vào được xác thực tại biên API qua Zod/TypeBox schema. Code nội bộ mặc định dữ liệu hợp lệ.
- **Throw, Don't Return**: Tất cả ứng dụng sử dụng hệ thống phân cấp lỗi có kiểu. Lỗi được throw, không bao giờ trả về dưới dạng giá trị.


```mermaid
flowchart TB
    subgraph Clients ["Client Layer"]
        WebApp["Web Application<br/>React 19 + Vite 7<br/>SPA"]
        MobileApp["Mobile Application<br/>React Native<br/>Android"]
    end

    subgraph APILayer ["API Layer — Bun + Elysia"]
        Gateway["Elysia App<br/>CORS + OpenAPI + Error Plugin"]
        subgraph Modules ["Feature Modules /api"]
            AuthMod["Auth Module<br/>register, login,<br/>refresh, logout"]
            SubMod["Submissions Module<br/>CRUD, auto-grade,<br/>grading-dispatch, review"]
            ExamMod["Exams Module<br/>CRUD, sessions,<br/>answers, submit"]
            QuestMod["Questions Module<br/>CRUD, question bank"]
            ProgMod["Progress Module<br/>overview, skill detail,<br/>spider chart, goals"]
            ClassMod["Classes Module<br/>CRUD, members,<br/>dashboard, feedback"]
            UserMod["Users Module"]
            KPMod["Knowledge Points"]
        end
        HealthMod["Health Check<br/>GET /health"]
    end

    subgraph WorkerLayer ["Worker Layer — Python"]
        Worker["Grading Worker<br/>Redis Streams consumer"]
        WritingPipe["Writing Pipeline<br/>LLM 4-criteria grading"]
        SpeakingPipe["Speaking Pipeline<br/>STT + LLM grading"]
    end

    subgraph DataLayer ["Data Layer"]
        PG["PostgreSQL 17<br/>Primary Data Store"]
        Redis["Redis 7.2+<br/>Streams + Cache"]
        ObjectStorage["S3-compatible<br/>Object Storage"]
    end

    subgraph External ["External Services"]
        LLMAPI["LLM Provider APIs<br/>triển khai hiện tại:<br/>OpenAI-compatible / Cloudflare"]
        STTAPI["STT Provider APIs<br/>triển khai hiện tại:<br/>Cloudflare Workers AI"]
    end

    WebApp -->|"REST<br/>JSON + JWT"| Gateway
    MobileApp -->|"REST<br/>JSON + JWT"| Gateway
    Gateway --> Modules
    Gateway --> HealthMod

    SubMod -->|"XADD<br/>grading:tasks"| Redis
    Worker -->|"XREADGROUP<br/>grading:tasks"| Redis
    SubMod -->|"XREADGROUP<br/>grading:results"| Redis

    Modules -->|"Drizzle ORM<br/>TCP 5432"| PG

    Worker --> WritingPipe
    Worker --> SpeakingPipe
    WritingPipe -->|"HTTPS"| LLMAPI
    SpeakingPipe -->|"HTTPS"| STTAPI
    SpeakingPipe -->|"HTTPS"| LLMAPI
    Worker -->|"XADD<br/>grading:results"| Redis

    HealthMod -->|"ping"| PG
    HealthMod -->|"ping"| Redis
    Modules -->|"S3 API<br/>TCP 9000"| ObjectStorage

    classDef client fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef api fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef worker fill:#e65100,stroke:#bf360c,color:#fff
    classDef data fill:#6a1b9a,stroke:#4a148c,color:#fff
    classDef external fill:#c62828,stroke:#b71c1c,color:#fff

    class WebApp,MobileApp client
    class Gateway,AuthMod,SubMod,ExamMod,QuestMod,ProgMod,ClassMod,UserMod,KPMod,HealthMod api
    class Worker,WritingPipe,SpeakingPipe worker
    class PG,Redis,ObjectStorage data
    class LLMAPI,STTAPI external
```


```mermaid
flowchart TB
    subgraph DevMachine ["Developer Machine"]
        subgraph DockerCompose ["Docker Compose"]
            PGContainer["PostgreSQL 17<br/>Container<br/>Port 5432"]
            RedisContainer["Redis 7.2 Alpine<br/>Container<br/>Port 6379"]
            ObjectStorageContainer["S3-compatible Object Storage<br/>Container cho local dev<br/>Port 9000/9001"]
        end

        subgraph BunRuntime ["Bun Runtime"]
            BackendAPI["Backend API Server<br/>Elysia on port 3000<br/>bun run dev"]
        end

        subgraph PythonRuntime ["Python Runtime"]
            GradingAPI["Grading Service<br/>FastAPI on port 8000<br/>uvicorn"]
            GradingWorker["Grading Worker<br/>Redis Streams consumer<br/>python -m app.worker"]
        end

        subgraph ViteDevServer ["Vite Dev Server"]
            FrontendDev["React 19 SPA<br/>Port 5173<br/>bun run dev"]
        end
    end

    subgraph ExternalAPIs ["External APIs"]
        AIProviders["AI Provider APIs<br/>triển khai hiện tại: OpenAI-compatible + Cloudflare Workers AI"]
    end

    BackendAPI -->|"TCP 5432"| PGContainer
    BackendAPI -->|"TCP 6379"| RedisContainer
    BackendAPI -->|"S3 API 9000"| ObjectStorageContainer
    GradingWorker -->|"TCP 6379"| RedisContainer
    GradingWorker -->|"HTTPS"| AIProviders
    FrontendDev -->|"HTTP :3000"| BackendAPI

    classDef container fill:#0277bd,stroke:#01579b,color:#fff
    classDef runtime fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef external fill:#e65100,stroke:#bf360c,color:#fff

    class PGContainer,RedisContainer,ObjectStorageContainer container
    class BackendAPI,GradingAPI,GradingWorker,FrontendDev runtime
    class AIProviders external
```

### 1.2 Biểu Đồ Gói (Package Diagram)

```mermaid
flowchart TB
    subgraph Monorepo ["VSTEP Monorepo"]
        subgraph BackendPkg ["apps/backend/src/"]
            CommonPkg["common/<br/>env, errors, logger, scoring,<br/>state-machine, utils, constants,<br/>auth-types, schemas"]
            DBPkg["db/<br/>schema/, relations,<br/>types/, helpers, index"]
            ModulesPkg["modules/<br/>auth, users, questions,<br/>submissions, exams, progress,<br/>classes, knowledge-points, health"]
            PluginsPkg["plugins/<br/>auth middleware,<br/>error handler"]
            AppEntry["app.ts + index.ts"]
        end

        subgraph GradingPkg ["apps/grading/app/"]
            GradingCore["Core:<br/>grading, writing,<br/>speaking, stt, llm"]
            GradingSupport["Support:<br/>models, scoring,<br/>prompts, config, db"]
            GradingEntry["main.py + worker.py"]
        end

        subgraph FrontendPkg ["apps/frontend/src/"]
            FEPages["pages/"]
            FEComponents["components/"]
            FEHooks["hooks/"]
            FEServices["services/<br/>API client"]
        end

        subgraph DocsPkg ["docs/"]
            Specs["specs/<br/>5 consolidated spec files"]
            Reports["capstone/reports/"]
        end
    end

    AppEntry --> ModulesPkg
    AppEntry --> PluginsPkg
    ModulesPkg --> CommonPkg
    ModulesPkg --> DBPkg
    PluginsPkg --> CommonPkg

    GradingEntry --> GradingCore
    GradingEntry --> GradingSupport

    FEPages --> FEComponents
    FEPages --> FEHooks
    FEHooks --> FEServices

    classDef be fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef gr fill:#e65100,stroke:#bf360c,color:#fff
    classDef fe fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef doc fill:#78909c,stroke:#546e7a,color:#fff

    class CommonPkg,DBPkg,ModulesPkg,PluginsPkg,AppEntry be
    class GradingCore,GradingSupport,GradingEntry gr
    class FEPages,FEComponents,FEHooks,FEServices fe
    class Specs,Reports doc
```

| # | Gói | Mô tả |
|---|-----|-------|
| 1 | `apps/backend/src/common/` | Tiện ích dùng chung: biến môi trường (`env.ts`), phân cấp lỗi (`errors.ts`), logging JSON (`logger.ts`), tính điểm và band (`scoring.ts`), máy trạng thái bài nộp, hàm tiện ích (`assertExists`, `assertAccess`), hằng số, kiểu xác thực và schema dùng chung |
| 2 | `apps/backend/src/db/` | Tầng cơ sở dữ liệu: định nghĩa schema Drizzle ORM cho tất cả bảng, quan hệ giữa các bảng, kiểu TypeBox cho cột JSONB (câu trả lời, kết quả chấm điểm, nội dung câu hỏi, blueprint đề thi), instance kết nối DB và helper phân trang |
| 3 | `apps/backend/src/modules/` | Các module chức năng theo nghiệp vụ: auth (đăng ký, đăng nhập, refresh, logout), users, questions (ngân hàng câu hỏi), submissions (CRUD, chấm tự động, dispatch chấm AI, quy trình đánh giá), exams (CRUD, phiên thi, nộp bài), progress (tổng quan, chi tiết kỹ năng, biểu đồ radar, mục tiêu), classes (CRUD, thành viên, dashboard, phản hồi), knowledge-points, health |
| 4 | `apps/backend/src/plugins/` | Plugin Elysia xuyên suốt: middleware xác thực JWT (`auth.ts`), xử lý lỗi toàn cục (`error.ts`) chuyển AppError thành HTTP response |
| 5 | `apps/backend/src/app.ts`, `index.ts` | Điểm khởi chạy: `app.ts` tạo Elysia root app và gắn plugin + module; `index.ts` khởi động server trên port 3000 |
| 6 | `apps/grading/app/` (Core) | Pipeline chấm điểm AI: router điều phối theo skill (`grading.py`), pipeline Writing 4 tiêu chí qua LLM, pipeline Speaking (STT + LLM), client LLM và STT có thể cấu hình nhà cung cấp, prompt template theo rubric VSTEP |
| 7 | `apps/grading/app/` (Support) | Hỗ trợ dịch vụ chấm điểm: model dữ liệu (`models.py`), tính điểm và band (`scoring.py`), cấu hình Pydantic Settings, structured logging, health probe |
| 8 | `apps/grading/app/main.py`, `worker.py` | Điểm khởi chạy: `main.py` chạy FastAPI (health + admin endpoint); `worker.py` consumer Redis Streams xử lý và retry tác vụ chấm điểm |
| 9 | `apps/frontend/src/` | SPA React 19: pages (theo vai trò learner/instructor/admin), components dùng chung, hooks, services (API client với fetch wrapper + interceptors) |
| 10 | `docs/` | Tài liệu dự án: đặc tả kỹ thuật (`specs/`), báo cáo capstone (`capstone/reports/`) |

---

## 2. Thiết Kế Cơ Sở Dữ Liệu

### 2.1 ERD Khái Niệm (Conceptual ERD)

![Conceptual ERD](../../diagrams/erd/conceptual-erd.svg)

> Source: [`docs/capstone/diagrams/erd/conceptual-erd.d2`](../../diagrams/erd/conceptual-erd.d2) — render bằng `d2 --layout=elk`

### 2.2 ERD Vật Lý (Physical ERD)

![Physical ERD](../../diagrams/erd/physical-erd.svg)

> Source: [`docs/capstone/diagrams/erd/physical-erd.d2`](../../diagrams/erd/physical-erd.d2) — render bằng `d2 --layout=elk`


| # | Bảng | Mô tả |
|---|------|-------|
| 1 | `users` | Tài khoản người dùng: email, mật khẩu hash (Argon2id), vai trò (`learner`/`instructor`/`admin`), thông tin hồ sơ |
| 2 | `refresh_tokens` | Refresh token (lưu SHA-256 hash): JTI duy nhất, thông tin thiết bị, thời hạn, trạng thái thu hồi, liên kết token thay thế |
| 3 | `questions` | Ngân hàng câu hỏi: kỹ năng, cấp độ, phần thi, nội dung JSONB (discriminated union theo skill+part), đáp án JSONB |
| 4 | `submissions` | Bài nộp luyện tập: liên kết người dùng + câu hỏi, trạng thái (state machine), điểm, band, chế độ chấm, ưu tiên đánh giá |
| 5 | `submission_details` | Chi tiết bài nộp: câu trả lời JSONB (objective/writing/speaking), kết quả chấm điểm JSONB (auto/AI/human) |
| 6 | `exams` | Đề thi: loại (practice/placement/mock), cấp độ, kỹ năng, blueprint JSONB chứa danh sách questionId theo section, thời gian |
| 7 | `exam_sessions` | Phiên thi: liên kết người dùng + đề thi, trạng thái, thời gian bắt đầu/kết thúc, điểm từng kỹ năng, band tổng |
| 8 | `exam_answers` | Câu trả lời trong phiên thi: liên kết session + question, câu trả lời JSONB, kết quả đúng/sai |
| 9 | `exam_submissions` | Bảng nối phiên thi — bài nộp: liên kết exam_session với submission cho Writing/Speaking |
| 10 | `user_progress` | Tiến trình tổng hợp: một dòng mỗi (user, skill), điểm trung bình, xu hướng, cấp độ hiện tại/mục tiêu, số lần làm bài |
| 11 | `user_skill_scores` | Lịch sử điểm từng lần: liên kết user + skill + submission, điểm, dùng cho tính toán cửa sổ trượt |
| 12 | `user_goals` | Mục tiêu học tập: band mục tiêu, hạn chót, band ước lượng hiện tại, ngày đạt được |
| 13 | `user_placements` | Kết quả xếp lớp đầu vào: cấp độ từng kỹ năng, trạng thái, nguồn (tự đánh giá/placement test), độ tin cậy |
| 14 | `user_knowledge_progress` | Tiến trình knowledge point: liên kết user + knowledge_point, mức thành thạo, số lần đúng/tổng |
| 15 | `classes` | Lớp học: tên, mô tả, giảng viên, mã mời, trạng thái hoạt động |
| 16 | `class_members` | Thành viên lớp: liên kết class + user, ngày tham gia |
| 17 | `instructor_feedback` | Phản hồi giảng viên: liên kết class + giảng viên + người học, kỹ năng, nội dung phản hồi |
| 18 | `knowledge_points` | Điểm kiến thức: tên, danh mục (grammar/vocabulary/strategy/topic), mô tả |
| 19 | `question_knowledge_points` | Bảng nối câu hỏi — knowledge point |
| 20 | `notifications` | Thông báo: liên kết user, loại, tiêu đề, nội dung, trạng thái đã đọc |
| 21 | `device_tokens` | Token thiết bị: liên kết user, token cho push notification, nền tảng |
| 22 | `vocabulary_topics` | Chủ đề từ vựng: tên, mô tả, cấp độ |
| 23 | `vocabulary_words` | Từ vựng: liên kết topic, từ, nghĩa, ví dụ, phát âm |
| 24 | `user_vocabulary_progress` | Tiến trình từ vựng: liên kết user + word, mức thành thạo, lần ôn tập tiếp theo |

---
## 3. Thiết Kế Chi Tiết

### 3.1 Biểu Đồ Thành Phần

#### 3.1.1 Biểu Đồ Thành Phần Backend

```mermaid
flowchart TB
    subgraph EntryPoint ["Entry Point"]
        AppTS["app.ts<br/>Elysia root app"]
        IndexTS["index.ts<br/>app.listen on port 3000"]
    end

    subgraph Plugins ["Plugins"]
        ErrorPlugin["errorPlugin<br/>Global error handler<br/>AppError to HTTP response"]
        CorsPlugin["CORS Plugin<br/>@elysiajs/cors"]
        OpenAPIPlugin["OpenAPI Plugin<br/>@elysiajs/openapi<br/>Auto-generate /openapi.json"]
    end

    subgraph APIModules ["API Modules — prefix /api"]
        Auth["auth/<br/>register, login,<br/>refresh, logout, me"]
        Users["users/<br/>list, getById,<br/>role management"]
        Questions["questions/<br/>CRUD, list with filters,<br/>question bank"]
        Submissions["submissions/<br/>create, list, find,<br/>auto-grade, review workflow"]
        Exams["exams/<br/>CRUD, start session,<br/>save answers, submit"]
        Progress["progress/<br/>overview, skill detail,<br/>spider chart, goals, ETA"]
        Classes["classes/<br/>CRUD, join/leave,<br/>dashboard, feedback"]
        KnowledgePoints["knowledge-points/<br/>taxonomy CRUD"]
    end

    subgraph HealthModule ["Root Module"]
        Health["health/<br/>GET /health<br/>DB + Redis probe"]
    end

    subgraph Common ["Common Layer"]
        Env["env.ts<br/>t3-oss/env-core<br/>Validated env vars"]
        Errors["errors.ts<br/>AppError hierarchy<br/>BadRequest, NotFound,<br/>Conflict, Unauthorized,<br/>Forbidden, TokenExpired"]
        Logger["logger.ts<br/>Structured JSON logging"]
        Scoring["scoring.ts<br/>scoreToBand, normalizeAnswer,<br/>BAND_THRESHOLDS"]
        StateMachine["state-machine.ts<br/>Submission state transitions"]
        Utils["utils.ts<br/>assertExists, assertAccess,<br/>normalizeEmail, generateInviteCode"]
        Constants["constants.ts<br/>MAX_PAGE_SIZE, JWT_SECRET_KEY,<br/>MAX_REFRESH_TOKENS_PER_USER"]
        AuthTypes["auth-types.ts<br/>Actor, ROLES, ROLE_LEVEL,<br/>JWTPayload"]
        Schemas["schemas.ts<br/>Shared TypeBox enum schemas"]
    end

    subgraph DBLayer ["Database Layer"]
        Schema["schema/<br/>users, questions, submissions,<br/>exams, progress, classes,<br/>knowledge-points, enums, columns"]
        Relations["relations.ts<br/>Drizzle relation definitions"]
        DBIndex["index.ts<br/>db instance, paginate helper,<br/>table re-exports"]
        Types["types/<br/>answers, grading,<br/>question-content,<br/>exam-blueprint"]
    end

    subgraph External ["External"]
        PG["PostgreSQL"]
        RedisExt["Redis"]
    end

    IndexTS --> AppTS
    AppTS --> Plugins
    AppTS --> Health
    AppTS --> APIModules

    APIModules --> Common
    APIModules --> DBLayer
    Submissions -->|"grading-dispatch<br/>XADD"| RedisExt
    Submissions -->|"XREADGROUP<br/>grading:results"| RedisExt
    DBLayer -->|"Drizzle ORM"| PG

    classDef entry fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef plugin fill:#00695c,stroke:#004d40,color:#fff
    classDef module fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef common fill:#f57c00,stroke:#e65100,color:#fff
    classDef db fill:#6a1b9a,stroke:#4a148c,color:#fff
    classDef ext fill:#c62828,stroke:#b71c1c,color:#fff

    class AppTS,IndexTS entry
    class ErrorPlugin,CorsPlugin,OpenAPIPlugin plugin
    class Auth,Users,Questions,Submissions,Exams,Progress,Classes,KnowledgePoints,Health module
    class Env,Errors,Logger,Scoring,StateMachine,Utils,Constants,AuthTypes,Schemas common
    class Schema,Relations,DBIndex,Types db
    class PG,RedisExt ext
```

#### 3.1.2 Biểu Đồ Thành Phần Dịch Vụ Chấm Điểm

```mermaid
flowchart TB
    subgraph Entry ["Entry Points"]
        Main["main.py<br/>FastAPI app<br/>Health + admin endpoints"]
        WorkerPy["worker.py<br/>Redis Streams consumer<br/>process + retry logic"]
    end

    subgraph Core ["Core Grading"]
        Grading["grading.py<br/>grade router<br/>writing vs speaking dispatch"]
        Writing["writing.py<br/>Writing grading pipeline<br/>Extract text, call LLM,<br/>4-criteria scoring"]
        Speaking["speaking.py<br/>Speaking grading pipeline<br/>Download audio, STT,<br/>transcript to LLM"]
        STT["stt.py<br/>STT client có thể cấu hình nhà cung cấp<br/>Audio to transcript"]
        LLM["llm.py<br/>LLM client<br/>Structured output parsing"]
        Prompts["prompts.py<br/>VSTEP rubric prompts<br/>Writing + Speaking templates"]
    end

    subgraph Support ["Support"]
        Models["models.py<br/>Task, Result, WritingScore,<br/>SpeakingScore, GrammarError,<br/>PermanentError"]
        ScoringPy["scoring.py<br/>Score calculation,<br/>snap to 0.5, band mapping"]
        Config["config.py<br/>Pydantic Settings<br/>Redis URL, AI API keys"]
        LoggerPy["logger.py<br/>structlog JSON logger"]
        HealthPy["health.py<br/>DB + Redis health probes"]
    end

    subgraph External ["External"]
        RedisQ["Redis<br/>grading:tasks stream<br/>grading:results stream"]
        AIProviderAPI["AI Provider APIs<br/>LLM + STT"]
    end

    WorkerPy -->|"XREADGROUP"| RedisQ
    WorkerPy --> Grading
    Grading -->|"skill=writing"| Writing
    Grading -->|"skill=speaking"| Speaking
    Writing --> LLM
    Writing --> Prompts
    Speaking --> STT
    Speaking --> LLM
    Speaking --> Prompts
    LLM --> AIProviderAPI
    STT --> AIProviderAPI

    Grading --> ScoringPy
    WorkerPy -->|"XADD results"| RedisQ

    WorkerPy --> Models
    WorkerPy --> Config
    WorkerPy --> LoggerPy

    classDef entry fill:#1565c0,stroke:#0d47a1,color:#fff
    classDef core fill:#e65100,stroke:#bf360c,color:#fff
    classDef support fill:#f57c00,stroke:#e65100,color:#000
    classDef ext fill:#6a1b9a,stroke:#4a148c,color:#fff

    class Main,WorkerPy entry
    class Grading,Writing,Speaking,STT,LLM,Prompts core
    class Models,ScoringPy,Config,LoggerPy,HealthPy support
    class RedisQ,AIProviderAPI ext
```

#### 3.1.3 Cấu Trúc Thành Phần Frontend

```mermaid
flowchart TB
    subgraph App ["React 19 SPA"]
        Router["React Router<br/>Route definitions"]

        subgraph AuthPages ["Auth Pages"]
            Login["LoginPage"]
            Register["RegisterPage"]
        end

        subgraph LearnerPages ["Learner Pages"]
            Dashboard["DashboardPage<br/>Quick-start links,<br/>summary widgets"]
            subgraph PracticePages ["Practice Mode"]
                SkillSelect["SkillSelectionPage<br/>4 skills with badges"]
                QuestionView["QuestionViewPage<br/>Scaffolding applied"]
                ResultView["ResultViewPage<br/>Score + feedback"]
            end
            subgraph ExamPages ["Mock Test"]
                ExamList["ExamListPage<br/>Filter by level"]
                ExamSession["ExamSessionPage<br/>Timed, 4 sections"]
                ExamResult["ExamResultPage<br/>Per-skill breakdown"]
            end
            subgraph ProgressPages ["Progress"]
                ProgressOverview["ProgressOverviewPage<br/>Spider Chart"]
                SkillDetail["SkillDetailPage<br/>Score history, trend"]
                GoalSetting["GoalSettingPage<br/>Target band, deadline"]
            end
        end

        subgraph InstructorPages ["Instructor Pages"]
            ReviewQueue["ReviewQueuePage<br/>Priority-sorted list"]
            ReviewDetail["ReviewDetailPage<br/>AI result + grading form"]
            ClassDashboard["ClassDashboardPage<br/>Member stats"]
        end

        subgraph SharedComponents ["Shared Components"]
            Layout["Layout + Navigation"]
            AuthContext["AuthContext<br/>JWT management"]
            APIClient["API Client<br/>fetch wrapper + interceptors"]
        end
    end

    Router --> AuthPages
    Router --> LearnerPages
    Router --> InstructorPages
    LearnerPages --> SharedComponents
    InstructorPages --> SharedComponents

    classDef page fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef shared fill:#f57c00,stroke:#e65100,color:#fff

    class Login,Register,Dashboard,SkillSelect,QuestionView,ResultView,ExamList,ExamSession,ExamResult,ProgressOverview,SkillDetail,GoalSetting,ReviewQueue,ReviewDetail,ClassDashboard page
    class Layout,AuthContext,APIClient shared
```

### 3.2 Biểu Đồ Tuần Tự

#### 3.2.1 Xác Thực Người Dùng (Đăng Nhập)

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend API
    participant DB as PostgreSQL

    C->>B: POST /api/auth/login<br/>{email, password}
    B->>B: Validate input schema
    B->>DB: SELECT * FROM users WHERE email = ?
    DB-->>B: User record (id, passwordHash, role)

    alt User not found
        B-->>C: 401 UNAUTHORIZED
    end

    B->>B: Bun.password.verify(password, hash)

    alt Password mismatch
        B-->>C: 401 UNAUTHORIZED
    end

    B->>DB: COUNT active refresh_tokens<br/>WHERE user_id = ? AND revoked_at IS NULL
    DB-->>B: tokenCount

    alt tokenCount ge 3
        B->>DB: UPDATE refresh_tokens SET revoked_at = NOW()<br/>WHERE user_id = ? ORDER BY created_at ASC LIMIT 1
        Note right of B: FIFO device pruning
    end

    B->>B: Sign JWT access token (jose)<br/>claims: sub, role, iat, exp
    B->>B: crypto.randomUUID() for refresh token
    B->>B: SHA-256 hash of refresh token
    B->>DB: INSERT refresh_tokens<br/>(tokenHash, jti, userId, deviceInfo, expiresAt)
    B-->>C: 200 {accessToken, refreshToken, user}
```

#### 3.2.2 Nộp Bài Luyện Tập Writing

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend API
    participant DB as PostgreSQL
    participant R as Redis
    participant W as Grading Worker
    participant G as LLM Provider API

    C->>B: POST /api/submissions<br/>{questionId, skill: "writing", answer: {text, wordCount}}
    B->>DB: SELECT question WHERE id = ? AND skill = "writing"
    DB-->>B: Question record

    rect rgba(46, 125, 50, 0.1)
        Note over B,DB: Database Transaction
        B->>DB: INSERT submissions (status=pending)
        B->>DB: INSERT submission_details (answer JSONB)
        B->>DB: UPDATE submissions SET status=processing
    end

    B->>R: XADD grading:tasks<br/>{submissionId, questionId, skill, answer}
    B-->>C: 200 {submissionId, status: "pending"}

    Note over W,R: Async processing
    W->>R: XREADGROUP grading:tasks
    R-->>W: Task payload

    W->>G: LLM grading request<br/>VSTEP rubric prompt + student text
    G-->>W: {taskFulfillment, organization,<br/>vocabulary, grammar,<br/>feedback, confidence}

    W->>W: Calculate overall score<br/>avg(4 criteria), snap to 0.5<br/>Determine band via thresholds

    W->>R: XADD grading:results<br/>{overallScore, criteriaScores, confidence, feedback}

    Note over B,R: Backend grading consumer
    B->>R: XREADGROUP grading:results

    alt confidence = high
        B->>DB: UPDATE submissions<br/>status=completed, score, band
    else confidence = medium or low
        B->>DB: UPDATE submissions<br/>status=review_pending,<br/>priority=medium or high
    end

    B->>DB: UPDATE submission_details.result<br/>(AIResult JSONB)
    B->>DB: INSERT user_skill_scores
    B->>DB: UPSERT user_progress<br/>(sliding window recalc)
```

#### 3.2.3 Luồng Phiên Thi

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend API
    participant DB as PostgreSQL
    participant R as Redis

    C->>B: POST /api/exams/:examId/start
    B->>DB: SELECT exam WHERE id = ?
    B->>DB: INSERT exam_sessions<br/>(status=in_progress, startedAt=NOW)
    B-->>C: {sessionId, questions by section, timeLimits}

    loop Every 30 seconds
        C->>B: POST /api/sessions/:id/answer<br/>{answers: [{questionId, answer}]}
        B->>DB: UPSERT exam_answers<br/>(sessionId, questionId, answer)
        B-->>C: {saved: true}
    end

    C->>B: POST /api/sessions/:id/submit
    B->>DB: SELECT all exam_answers for session

    par Auto-grade Listening
        B->>B: Compare answers vs answer key<br/>score = correct/35 * 10, snap to 0.5
    and Auto-grade Reading
        B->>B: Compare answers vs answer key<br/>score = correct/40 * 10, snap to 0.5
    end

    B->>DB: UPDATE exam_answers SET isCorrect
    B->>DB: UPDATE exam_sessions<br/>listeningScore, readingScore

    par Create W/S submissions
        B->>DB: INSERT submissions for Writing (pending)
        B->>DB: INSERT submissions for Speaking (pending)
        B->>DB: INSERT exam_submissions (junction)
    end

    B->>R: XADD grading:tasks (Writing)
    B->>R: XADD grading:tasks (Speaking)

    B->>DB: progress.record + sync for L/R
    B->>DB: UPDATE exam_sessions status=submitted

    B-->>C: {status: submitted,<br/>listeningScore, readingScore,<br/>writingStatus: pending,<br/>speakingStatus: pending}
```

#### 3.2.4 Quy Trình Đánh Giá Của Giảng Viên

```mermaid
sequenceDiagram
    participant I as Instructor
    participant B as Backend API
    participant DB as PostgreSQL

    I->>B: GET /api/submissions/queue
    B->>DB: SELECT submissions<br/>WHERE status = review_pending<br/>ORDER BY priority DESC, created_at ASC
    B-->>I: Paginated review queue

    I->>B: POST /api/submissions/:id/claim
    B->>DB: Atomic conditional UPDATE<br/>SET claimed_by, claimed_at<br/>WHERE unclaimed OR expired (15 min)

    alt Already claimed by another
        B-->>I: 409 CONFLICT
    end

    B->>DB: SELECT submission + AI result
    B-->>I: Submission with AI grading result

    I->>B: PUT /api/submissions/:id/review<br/>{overallScore, band, criteriaScores, feedback}

    B->>DB: UPDATE submissions<br/>status=completed,<br/>gradingMode=human,<br/>reviewerId=instructor
    B->>DB: UPDATE submission_details.result<br/>(preserve AI + add HumanResult)

    alt |aiScore - humanScore| > 0.5
        B->>DB: SET auditFlag = true
    end

    B->>DB: INSERT user_skill_scores
    B->>DB: UPSERT user_progress (sliding window)
    B-->>I: Updated submission with final scores
```

#### 3.2.5 Làm Mới Token

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend API
    participant DB as PostgreSQL

    C->>B: POST /api/auth/refresh<br/>{refreshToken}
    B->>B: SHA-256 hash the token

    B->>DB: SELECT FROM refresh_tokens<br/>WHERE token_hash = ?
    DB-->>B: Token record

    alt Token not found or expired
        B-->>C: 401 TOKEN_EXPIRED
    end

    alt Token already revoked (reuse detected)
        Note over B,DB: REPLAY ATTACK DETECTED
        B->>DB: UPDATE refresh_tokens<br/>SET revoked_at = NOW<br/>WHERE user_id = ? AND revoked_at IS NULL
        Note right of DB: Revoke ALL user tokens
        B-->>C: 401 UNAUTHORIZED<br/>(force re-login on all devices)
    end

    B->>DB: UPDATE refresh_tokens<br/>SET revoked_at = NOW, replaced_by_jti = newJti<br/>WHERE id = oldTokenId
    B->>B: Sign new JWT access token
    B->>B: Generate new refresh token + SHA-256
    B->>DB: INSERT refresh_tokens (new token record)
    B-->>C: 200 {accessToken, refreshToken}
```

#### 3.2.6 Theo Dõi Tiến Trình

```mermaid
sequenceDiagram
    participant Trigger as Score Event
    participant B as Backend (progress module)
    participant DB as PostgreSQL

    Note over Trigger: Auto-grade, AI grade,<br/>or instructor review completed

    Trigger->>B: progress.record(userId, skill, submissionId, score)
    B->>DB: INSERT INTO user_skill_scores<br/>(userId, skill, submissionId, score)

    Trigger->>B: progress.sync(userId, skill)
    B->>DB: SELECT score, created_at<br/>FROM user_skill_scores<br/>WHERE userId=? AND skill=?<br/>ORDER BY created_at DESC LIMIT 10

    DB-->>B: Last 10 scores (sliding window)

    B->>B: computeStats(scores)<br/>mean, sample std deviation

    alt count < 3
        B->>B: trend = insufficient_data
    else count 3-5
        alt deviation ge 1.5
            B->>B: trend = inconsistent
        else
            B->>B: trend = stable
        end
    else count ge 6
        alt deviation ge 1.5
            B->>B: trend = inconsistent
        else
            B->>B: delta = avg(last 3) - avg(prev 3)
            alt delta ge +0.5
                B->>B: trend = improving
            else delta le -0.5
                B->>B: trend = declining
            else
                B->>B: trend = stable
            end
        end
    end

    B->>DB: UPSERT user_progress<br/>ON CONFLICT (user_id, skill)<br/>SET averageScore, trend,<br/>scaffoldLevel, attemptCount
```

---

*Phiên bản tài liệu: 1.0 — Cập nhật lần cuối: SP26SE145*
