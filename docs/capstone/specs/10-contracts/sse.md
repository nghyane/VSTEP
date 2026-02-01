# Server-Sent Events (SSE) Specification

> **Phiên bản**: 1.2 · SP26SE145

## 1. Mục đích

Định nghĩa cơ chế SSE để push real-time grading status về cho client. SSE được chọn thay vì WebSocket vì tính đơn giản (one-way, auto-reconnect native), phù hợp với use case "server push status updates" mà không cần bidirectional communication.

---

## 2. Phạm vi

- SSE endpoint trên Bun Main App cho từng submission
- Các event chính: grading.progress, grading.review_required, grading.completed, grading.failed, ping
- Authentication qua query parameter (SSE/EventSource API không hỗ trợ custom headers từ browser)
- Reconnection tự động với `Last-Event-ID` để replay events bị miss

---

## 3. Luồng hoạt động (tóm tắt)

- Client mở SSE stream theo submission (kèm token); server validate token + ownership.
- Grading Service publish callback messages lên `grading.callback`.
- Main App consume callback, dedup theo `eventId`, update MainDB, append `submission_events`, push SSE nếu có connection.
- Client reconnect dùng `Last-Event-ID`; server replay best-effort từ `submission_events` hoặc fallback polling.

```mermaid
sequenceDiagram
  participant C as Client
  participant API as Main App
  participant RMQ as RabbitMQ
  participant G as Grading Service
  participant DB as MainDB

  C->>API: open SSE(submissionId, token)
  API->>API: validate JWT + ownership
  API-->>C: stream opened

  G->>RMQ: publish grading.callback (progress/completed/error)
  RMQ->>API: deliver callback
  API->>API: dedup by eventId
  API->>DB: update submission + append submission_events
  API-->>C: push SSE event

  C->>API: reconnect (Last-Event-ID)
  API->>DB: replay from submission_events (best-effort)
  API-->>C: replayed events
```

---

## 4. SSE Endpoint

Một endpoint duy nhất, mỗi submission một stream riêng. Client mở EventSource connection với submission ID và access token.

### Authentication

Token truyền qua query parameter vì EventSource API (browser) không cho phép custom headers. Server validate JWT signature, kiểm tra expiration, và xác nhận user là owner của submission (submission.userId == token.sub).

### Response Headers

- Content-Type: `text/event-stream`
- Cache-Control: `no-cache`
- Connection: `keep-alive`
- X-Accel-Buffering: `no` (tắt nginx buffering nếu có reverse proxy)

---

## 5. Các loại Event

### grading.progress
Gửi khi grading đang xử lý. Data tối thiểu: submissionId, status (PROCESSING/ANALYZING/GRADING). Có thể kèm progress (0..1) và message (best-effort).

### grading.review_required
Gửi khi AI grading hoàn tất nhưng `reviewRequired=true`. UI phải hiển thị trạng thái “đang chờ chấm thủ công” và không coi đây là kết quả cuối cùng.

### grading.completed
Gửi khi có kết quả cuối cùng sẵn sàng cho learner (auto-grade hoặc sau human review). Client nên đóng connection sau khi nhận event này.

### grading.failed
Gửi khi grading thất bại (hết retry hoặc timeout). Data tối thiểu: submissionId, reason, errorCode.

### ping
Heartbeat event gửi mỗi 30 giây để giữ connection alive. Data rỗng.

---

## 6. Cầu nối AMQP → SSE (Callback Consumer)

Main App chạy một AMQP consumer lắng nghe `grading.callback` queue. Đây là cầu nối giữa async grading và real-time SSE push.

Khi nhận callback message:

1. **Idempotency check**: Kiểm tra `eventId` đã có trong bảng `processed_callbacks` chưa. Nếu đã xử lý → skip.
2. **Update MainDB**: Cập nhật submission status và result/error dựa trên callback.
3. **Record processed**: Ghi `eventId` vào `processed_callbacks` để ngăn duplicate.
4. **Append event log**: Ghi event vào `submission_events` để phục vụ SSE replay theo `Last-Event-ID`.
5. **Push SSE**: Publish event vào in-memory pub/sub channel của submission. Nếu có client đang subscribe → event được push qua SSE stream.

In-memory pub/sub là một map đơn giản: `submissionId → Set<SSE connections>`. Khi SSE connection đóng, connection được unsubscribe khỏi channel.

---

## 7. Reconnection & Replay

- Server gửi `retry: 5000` (5 giây) trong stream để browser biết thời gian chờ trước khi reconnect.
- Mỗi event có `id` field = `eventId` (từ callback message).
- Khi client reconnect, browser tự động gửi header `Last-Event-ID` với ID của event cuối cùng nhận được.
- Server replay best-effort bằng cách đọc từ event log theo submission (xem `../30-data/database-schema.md` mục `submission_events`).
- Nếu không tìm thấy event tương ứng (do retention cleanup hoặc client gửi ID quá cũ), server không fail; thay vào đó client nên gọi polling fallback để sync trạng thái hiện tại.

---

## 8. Timeouts

- **Heartbeat**: Ping mỗi 30 giây để giữ connection và phát hiện client disconnect.
- **Idle timeout**: Connection tự đóng sau 30 phút không có event thực (chỉ có ping).
- **SLA alignment**: SSE connection thường sẽ kết thúc trước SLA timeout (writing 20 phút, speaking 60 phút) khi nhận completed/failed event.

---

## 9. Failure Modes

| Tình huống | Hành vi |
|-----------|---------|
| Token không hợp lệ hoặc hết hạn | Trả về 401, không mở stream |
| Submission không tồn tại | Trả về 404 |
| User không phải owner | Trả về 403 |
| AMQP consumer mất kết nối | Auto-reconnect. Events queue trong RabbitMQ cho đến khi consumer reconnect |
| Không có client nào đang subscribe | Event từ pub/sub bị drop — chấp nhận được vì không ai đang listen |
| Client disconnect | SSE stream đóng, connection bị unsubscribe khỏi pub/sub |
| Worker crash | Events tiếp tục queue trong RabbitMQ, được deliver khi consumer reconnect |
| Bun process restart | In-memory pub/sub bị reset. Clients auto-reconnect với Last-Event-ID, replay từ DB |

---

## 10. Acceptance Criteria

- Client mở SSE connection và nhận events real-time khi grading status thay đổi
- Khi grading hoàn thành, client nhận event completed với score và band
- Sau disconnect + reconnect, client nhận lại events bị miss qua Last-Event-ID replay
- SSE stream không bị buffering bởi reverse proxy (nginx/Caddy)
- Health endpoint không bị ảnh hưởng bởi số lượng SSE connections mở

---

## 11. Cross-references

| Chủ đề | Tài liệu |
|--------|-----------|
| Queue callback format | `queue-contracts.md` |
| Submission states | `../20-domain/submission-lifecycle.md` |
| Processed callbacks table | `../30-data/database-schema.md` Section 2.5 |
| Real-time flow diagram | `../../diagrams/flow-diagrams.vi.md` Section 4 |
