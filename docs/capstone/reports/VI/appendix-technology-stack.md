# Phụ Lục: Công Nghệ Sử Dụng

| Nhóm | Công nghệ | Phiên bản | Mục đích |
|------|-----------|---------|---------|
| **Backend** | Bun | latest | Runtime JavaScript/TypeScript hiệu năng cao |
| | Elysia | 1.x | Framework REST API an toàn kiểu với tự động sinh OpenAPI |
| | Drizzle ORM | latest | Trình xây dựng truy vấn SQL an toàn kiểu với hỗ trợ migration |
| | Zod / TypeBox | latest | Xác thực đầu vào tại biên API |
| | Jose | latest | Ký, xác minh JWT và quản lý token |
| **Frontend** | React | 19 | Thư viện thành phần UI |
| | Vite | 7 | Build frontend, dev server, HMR |
| | TypeScript | 5.x | Phát triển frontend an toàn kiểu |
| **Chấm điểm AI** | Python | 3.11+ | Runtime dịch vụ chấm điểm AI |
| | FastAPI | latest | Health check và API quản trị cho dịch vụ chấm điểm |
| | API LLM (cấu hình nhà cung cấp) | — | Chấm Writing/Speaking bằng AI; triển khai hiện tại dùng OpenAI-compatible và Cloudflare |
| | API STT (cấu hình nhà cung cấp) | — | Chuyển giọng nói thành văn bản cho Speaking; triển khai hiện tại dùng Cloudflare Workers AI |
| **Hạ tầng** | PostgreSQL | 17 | Kho dữ liệu quan hệ chính với hỗ trợ JSONB |
| | Redis | 7.2+ | Hàng đợi tác vụ (Streams XADD/XREADGROUP), caching |
| | Docker Compose | — | PostgreSQL + Redis + object storage tương thích S3 cho phát triển cục bộ |
| **Công cụ** | Biome | latest | Định dạng code và thực thi lint |
| | bun:test | — | Kiểm thử đơn vị và tích hợp (Backend) |
| | pytest | — | Kiểm thử đơn vị dịch vụ chấm điểm (Grading) |
