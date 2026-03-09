# VSTEP — Project Documentation

> Tài liệu dự án Hệ Thống Luyện Thi VSTEP Thích Ứng (SP26SE145)

## Cấu trúc

```
docs/
├── README.md                          # File này
│
├── capstone/
│   ├── reports/
│   │   ├── ENG/                       # 4 báo cáo capstone (tiếng Anh)
│   │   │   ├── report1-project-introduction.md
│   │   │   ├── report2-project-management-plan.md
│   │   │   ├── report3-software-requirement-specification.md
│   │   │   └── report4-software-design-document.md
│   │   └── VI/                        # 4 báo cáo capstone (tiếng Việt)
│   │       ├── report1-project-introduction.md
│   │       ├── report2-project-management-plan.md
│   │       ├── report3-software-requirement-specification.md
│   │       └── report4-software-design-document.md
│   └── specs/                         # Đặc tả kỹ thuật chi tiết
│       ├── 00-overview/               # Glossary, roadmap, decisions
│       ├── 10-contracts/              # API conventions, endpoints, errors, SSE, queue
│       ├── 20-domain/                 # Scaffolding, grading, progress, review, submission
│       ├── 30-data/                   # Database schema, question content schemas
│       ├── 40-platform/              # Authentication, idempotency & concurrency
│       └── 50-ops/                    # Deployment, migrations & backup
│
└── mobile/                            # Tài liệu cho mobile team
    ├── README.md
    ├── flows.md                       # Luồng chính của app mobile
    └── backend-issues/                # Các issue backend cần xử lý cho mobile
```

## Báo cáo Capstone

| Report | Nội dung | ENG | VI |
|--------|----------|-----|-----|
| 1 | Project Introduction | [ENG](capstone/reports/ENG/report1-project-introduction.md) | [VI](capstone/reports/VI/report1-project-introduction.md) |
| 2 | Project Management Plan | [ENG](capstone/reports/ENG/report2-project-management-plan.md) | [VI](capstone/reports/VI/report2-project-management-plan.md) |
| 3 | Software Requirement Specification | [ENG](capstone/reports/ENG/report3-software-requirement-specification.md) | [VI](capstone/reports/VI/report3-software-requirement-specification.md) |
| 4 | Software Design Document | [ENG](capstone/reports/ENG/report4-software-design-document.md) | [VI](capstone/reports/VI/report4-software-design-document.md) |

## Đặc tả kỹ thuật (specs)

Các file trong `capstone/specs/` là tài liệu thiết kế nội bộ dùng để phát triển, bao gồm:

- **API contracts** — conventions, endpoints, error codes, SSE events, queue contracts
- **Domain logic** — adaptive scaffolding, hybrid grading, progress tracking, review workflow, submission lifecycle
- **Data layer** — database schema, JSONB content schemas
- **Platform** — authentication (JWT), idempotency & concurrency control
- **Operations** — deployment, migrations, backup & disaster recovery

---

*Cập nhật: Tháng 03/2026*
