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

Production compose hiện có các public host mặc định:

- API: `api.vstepgo.com` (`DOMAIN`)
- Learner web: `vstepgo.com` (`FRONTEND_DOMAIN`)
- Admin portal: `admin.vstepgo.com` (`ADMIN_DOMAIN`)
- Technical docs: `docs.vstepgo.com` (`DOCS_DOMAIN`)

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

## 7. Docs subdomain deploy checklist

Docs chạy bằng service `docs` trong `docker-compose.yml`, image `ghcr.io/<owner>/vstep-docs:<tag>`.

Trước khi deploy docs public, cấu hình DNS:

```text
docs.vstepgo.com  A  <VPS IPv4>
```

Nếu dùng subdomain khác, đặt trong `/opt/vstep/.env`:

```dotenv
DOCS_DOMAIN=docs.vstepgo.com
```

CI/CD sẽ tự build image `vstep-docs`, ghi `DOCS_IMAGE_TAG` vào `/opt/vstep/.env`, pull image và recreate service `docs`. Traefik tự cấp TLS qua Let's Encrypt khi DNS đã trỏ đúng.

Verify docs sau deploy:

```bash
docker compose -f docker-compose.yml --env-file .env ps docs
curl -I https://${DOCS_DOMAIN:-docs.vstepgo.com}
```
