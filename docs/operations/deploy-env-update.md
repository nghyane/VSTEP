# Production env update procedure

Quy trình cập nhật biến môi trường backend trên VPS production.

## 1. Lấy thông tin server từ CI/CD

Đọc workflow deploy:

```bash
.github/workflows/build-images.yml
```

Các thông tin cần kiểm tra trong job `deploy`:

- `host`: VPS production
- `username`: user SSH
- `target`: thư mục app trên VPS, hiện tại là `/opt/vstep`
- compose file sync/deploy: `docker-compose.yml`

## 2. SSH vào VPS

```bash
ssh <username>@<host>
cd /opt/vstep
```

## 3. Xác định file env backend

Trong `docker-compose.yml`, service `backend` và `horizon` dùng:

```yaml
env_file:
  - ./apps/backend-v2/.env
```

Vì vậy file cần cập nhật là:

```bash
/opt/vstep/apps/backend-v2/.env
```

## 4. Cập nhật biến mail

Thêm hoặc thay thế các key sau trong `apps/backend-v2/.env`:

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=<resend-api-key>
MAIL_SCHEME=smtp
MAIL_FROM_ADDRESS=support@vstepgo.com
MAIL_FROM_NAME="VSTEP Go Support"
```

Không commit secret thật vào repository. Chỉ lưu secret trên server hoặc secret manager.

## 5. Recreate service nhận env mới

Sau khi sửa `.env`, recreate các service Laravel:

```bash
docker compose -f docker-compose.yml --env-file .env up -d --force-recreate backend horizon
```

## 6. Verify

Kiểm tra env đã được ghi đúng, không in secret thật ra log/share output:

```bash
grep -E '^(MAIL_MAILER|MAIL_HOST|MAIL_PORT|MAIL_USERNAME|MAIL_SCHEME|MAIL_FROM_ADDRESS|MAIL_FROM_NAME)=' apps/backend-v2/.env
```

Kiểm tra trạng thái container:

```bash
docker compose -f docker-compose.yml --env-file .env ps backend horizon
```

Kết quả mong đợi:

- `backend` status `healthy`
- `horizon` status `healthy`
