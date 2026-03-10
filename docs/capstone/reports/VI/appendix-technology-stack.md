# Phụ Lục: Công Nghệ Sử Dụng

| Tầng | Công nghệ | Phiên bản | Mục đích |
|-------|-----------|---------|---------|
| Runtime (Backend) | Bun | latest | Runtime JavaScript/TypeScript hiệu năng cao |
| Framework (Backend) | Elysia | 1.x | Framework REST API an toàn kiểu với tự động sinh OpenAPI |
| ORM | Drizzle ORM | latest | Trình xây dựng truy vấn SQL an toàn kiểu với hỗ trợ migration |
| Xác thực Schema | Zod / TypeBox | latest | Xác thực đầu vào tại biên API |
| JWT | Jose | latest | Ký, xác minh JWT và quản lý token |
| Cơ sở dữ liệu | PostgreSQL | 17 | Kho dữ liệu quan hệ chính với hỗ trợ JSONB |
| Cache / Hàng đợi | Redis | 7.2+ | Hàng đợi tác vụ (Streams XADD/XREADGROUP), caching |
| Frontend | React | 19 | Thư viện thành phần UI |
| Công cụ build | Vite | 7 | Build frontend, dev server, HMR |
| Ngôn ngữ Frontend | TypeScript | 5.x | Phát triển frontend an toàn kiểu |
| Runtime chấm điểm | Python | 3.11+ | Runtime dịch vụ chấm điểm AI |
| Framework chấm điểm | FastAPI | latest | Health check và API quản trị cho dịch vụ chấm điểm |
| Nhà cung cấp LLM | API LLM có thể cấu hình nhà cung cấp | — | Chấm điểm Writing/Speaking bằng AI qua LLM; triển khai hiện tại dùng OpenAI-compatible và Cloudflare |
| Nhà cung cấp STT | API STT có thể cấu hình nhà cung cấp | — | Chuyển đổi giọng nói thành văn bản cho Speaking; triển khai hiện tại dùng Cloudflare Workers AI |
| Linting | Biome | latest | Định dạng code và thực thi lint |
| Kiểm thử (Backend) | bun:test | — | Kiểm thử đơn vị và tích hợp |
| Kiểm thử (Grading) | pytest | — | Kiểm thử đơn vị dịch vụ chấm điểm |
| Container hóa | Docker Compose | — | PostgreSQL + Redis + object storage tương thích S3 cho phát triển cục bộ |
