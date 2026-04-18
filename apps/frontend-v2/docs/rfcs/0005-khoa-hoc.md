# RFC 0005 — Khóa học cấp tốc (Phase 1 UI)

| Field | Value |
|---|---|
| Status | Draft |
| Created | 2026-04-18 |
| Updated | 2026-04-18 |
| Superseded by | — |

## Summary

Thêm luồng **Khóa học cấp tốc** — admin mở lớp ôn thi sát kỳ thi (vd: đợt Văn Lang 15–17/04), learner dùng xu mua trọn gói. Phase 1 chỉ làm UI: danh sách khóa → mua → trang "Khóa của tôi" hiện Zoom link livestream tĩnh. Booking 1-1 slot đẩy sang phase sau.

## Motivation

- Nền tảng hiện chỉ có "Luyện tập" + "Thi thử" — không có điểm chạm giáo viên thật.
- Trung tâm cần kênh bán khóa cấp tốc (giáo viên "gà bài" sát đề thi) mà không phải xây LMS full.
- Role đơn giản: chỉ **admin** (CRUD khóa) và **learner** (mua + xem). Không có instructor dashboard.
- Khóa học bán bằng **tiền thật (VND)** qua cổng thanh toán (QR/banking/MoMo). **Xu** chỉ là vật phẩm tặng kèm khuyến mãi — kích hoạt vòng lặp coin economy cho luyện tập + thi thử.

## Scope & Non-goals

**In scope (phase 1):**
- Trang danh sách khóa đang tuyển sinh (learner-facing).
- Trang chi tiết khóa — mô tả, giáo viên, giá VND, xu tặng kèm, số slot, lịch livestream tĩnh.
- Dialog thanh toán mock: chọn phương thức (VietQR/Banking/MoMo) → giả lập success 600ms → lưu enrollment + cộng xu bonus.
- Trang "Khóa của tôi" — list khóa đã mua, hiện Zoom link + lịch buổi livestream.
- Expire tự động theo `endDate` — khóa hết hạn vẫn hiện trong "Khóa của tôi" nhưng gắn badge "Đã kết thúc", link Zoom ẩn.
- Mock CRUD shape — data model phải flexible để admin sửa sau (giá VND, bonus xu, slot, ngày, link Zoom đều là field không hard-code trong component).

**Out of scope (phase sau):**
- Booking slot 1-1 với giáo viên (admin sẽ xử lý bằng tay qua Google Meet link tĩnh ở phase 1).
- Admin UI (CRUD khóa) — backend chưa có, phase 1 chỉ mock data trong file.
- Gửi email Zoom link — backend sẽ lo khi có API.
- Payment gateway thật (VNPay, MoMo, etc.) — phase 1 chỉ mock success sau 600ms.
- Refund / cancel khóa.
- Notification khi sắp livestream.

## Data model (mock)

Toàn bộ field đều là mock, nhưng shape phải map 1:1 với DB sau này để không phải đổi component.

```ts
// src/lib/mock/courses.ts
export interface Course {
  id: string
  title: string                    // "VSTEP B1 Cấp tốc — K94"
  slug: string                     // "vstep-b1-cap-toc-k94"
  targetExam: string               // "Đợt thi Đại học Văn Lang 15–17/04/2026"
  level: "B1" | "B2" | "C1"
  description: string              // markdown/plain
  priceVnd: number                 // giá khóa học bằng VND — admin set
  bonusCoins: number               // xu tặng kèm khi mua — admin set
  maxSlots: number
  soldSlots: number                // mock — học viên đã mua
  startDate: string                // ISO "2026-04-22"
  endDate: string                  // ISO "2026-05-06" — dùng để expire
  instructor: {
    name: string
    title: string                  // "Thạc sĩ Ngôn ngữ Anh"
    avatarUrl?: string
    bio: string
  }
  livestreamUrl: string            // Zoom/Meet link — admin dán tay
  sessions: CourseSession[]        // lịch buổi cụ thể
}

export interface CourseSession {
  id: string
  sessionNumber: number            // "Buổi 01"
  date: string                     // ISO date
  startTime: string                // "19:30"
  endTime: string                  // "21:30"
  topic: string                    // "Nghe/Đọc" hoặc "Viết/Nói"
}
```

**Ownership (localStorage):**

```ts
// src/lib/courses/enrollment-store.ts
interface Enrollment {
  courseId: string
  purchasedAt: number              // Date.now()
  pricePaidVnd: number             // snapshot VND đã trả
  bonusCoinsReceived: number       // snapshot xu bonus đã nhận
}

// Key: "vstep:course-enrollments:v1"
// Shape: Enrollment[]
```

API:
- `useEnrollments()` — hook trả về `Enrollment[]`
- `enrollInCourse(course)` — push enrollment + `refundCoins(course.bonusCoins)` (tặng xu bonus) → emit event. Không trừ xu vì khóa bán bằng VND.
- `isEnrolled(courseId)` — boolean
- `isCourseEnded(course)` — `new Date(course.endDate) < now`

## Routes

| Route | Purpose |
|---|---|
| `/khoa-hoc` | Landing — tabs "Khám phá" / "Khóa của tôi" |
| `/khoa-hoc/$courseId` | Chi tiết khóa (render conditional theo enrolled state) |

**Nav:** Thêm mục "Khóa học" vào sidebar `_app.tsx` (giữa "Thi thử" và "Tổng quan"), icon `GraduationCap` từ lucide.

## UI — Trang danh sách (`/khoa-hoc`)

### Tabs top

- **Khám phá** (default) — grid các khóa đang tuyển sinh.
- **Khóa của tôi** — grid các khóa đã enroll (active + expired).

### Card khóa (khám phá)

Theo Rule 0.2: `rounded-2xl border bg-card p-6 shadow-sm`.

```
┌─────────────────────────────────────┐
│ [Badge level B1]      [Còn 3 chỗ]  │
│                                     │
│ VSTEP B1 Cấp tốc — K94              │
│ Đợt thi Văn Lang 15–17/04/2026      │
│                                     │
│ • 8 buổi × 2 giờ — Online qua Zoom  │
│ • Khai giảng 22/04/2026             │
│ • Giáo viên: Thạc sĩ Nguyễn A       │
│                                     │
│ ──────────────────────────────      │
│ 1.300.000đ       [Xem chi tiết →]   │
│ [🪙 Tặng 4.000 xu]                  │
└─────────────────────────────────────┘
```

**State variants:**
- Còn chỗ (`soldSlots < maxSlots`) → badge amber "Còn X chỗ", nút primary.
- Hết chỗ (`soldSlots >= maxSlots`) → badge muted "Đã đầy", nút disabled + tooltip "Vui lòng chọn khóa khác hoặc quay lại luồng tự luyện tập".
- Đã mua (có trong enrollments) → badge emerald "Đã mua", nút secondary "Vào khóa học →".

### Card khóa (của tôi)

```
┌─────────────────────────────────────┐
│ [Badge "Đang học" hoặc "Đã kết thúc"]│
│                                     │
│ VSTEP B1 Cấp tốc — K94              │
│ 22/04/2026 — 06/05/2026             │
│                                     │
│ Buổi tiếp theo: 24/04 — 19:30       │
│ [🔗 Vào Zoom] (chỉ hiện nếu active) │
│                                     │
│ [Xem chi tiết →]                    │
└─────────────────────────────────────┘
```

Empty state tab "Khóa của tôi": illustration + text "Chưa mua khóa nào" + nút "Khám phá khóa học".

## UI — Trang chi tiết (`/khoa-hoc/$courseId`)

Container: `max-w-5xl` (Rule 0.4).

### Header
- Tên khóa + badge level
- Target exam (muted subtext)
- Nếu chưa mua + còn chỗ: panel bên phải hiện giá VND to + badge "Tặng kèm X xu" + CTA "Đăng ký khóa học"
- Nếu đã mua: thay bằng panel "🔗 Vào Zoom buổi livestream"
- Nếu hết chỗ: "Đã đầy chỗ", disabled + hint redirect về luyện tập
- Nếu đã kết thúc (user enrolled + endDate < today): "Khóa đã kết thúc ngày X"

### Info sections (stack)
1. **Mô tả khóa học** — paragraph + bullets (card `bg-muted/50 p-5`)
2. **Giáo viên** — avatar + tên + title + bio (card `bg-muted/50 p-5`)
3. **Lịch học chi tiết** — bảng sessions (card `bg-muted/50 p-5`)
   - Cột: Buổi | Ngày | Giờ | Chủ đề
   - Session trong quá khứ: text muted + line-through.
   - Session upcoming: text foreground.
4. **Cam kết** — bullets (card `bg-muted/50 p-5`)
   - "Tỉ lệ đạt trên 98%" — copy tĩnh trong mock

### Purchase flow

Nhấn "Đăng ký khóa học":
1. Mở `CoursePurchaseDialog` — hiện summary khóa + tổng thanh toán VND + row "Xu tặng kèm" (nếu bonusCoins > 0).
2. Chọn phương thức thanh toán — 3 options: VietQR, Chuyển khoản, Ví MoMo (mock UI, chỉ để show phase 1).
3. Nhấn "Thanh toán X đồng" → setTimeout 600ms giả lập gọi gateway → `enrollInCourse()` → `refundCoins(bonusCoins)` → toast success + notification → đóng dialog → detail page re-render với panel "Vào Zoom".

**Không animation phức tạp** — reuse pattern của luồng thi thử.

## Files affected

| File | Change |
|---|---|
| `src/lib/mock/courses.ts` | NEW — mock 3–4 khóa (K94 full, K83 còn chỗ, K101 còn chỗ, thêm 1 khóa B2) |
| `src/lib/courses/enrollment-store.ts` | NEW — localStorage store giống streak-rewards pattern |
| `src/lib/queries/courses.ts` | NEW — query options cho list + detail (mock async) |
| `src/routes/_app.khoa-hoc.tsx` | NEW — layout wrapper |
| `src/routes/_app.khoa-hoc.index.tsx` | NEW — list page với tabs |
| `src/routes/_app.khoa-hoc.$courseId.tsx` | NEW — detail page |
| `src/routes/_app.khoa-hoc\-components/CourseCard.tsx` | NEW |
| `src/routes/_app.khoa-hoc\-components/CoursePurchaseDialog.tsx` | NEW |
| `src/routes/_app.tsx` | Thêm nav item "Khóa học" |

## Mock data notes

Copy layout từ screenshot luyenthivstep.vn để mock có cảm giác thật:
- K94 B1 — đã hết chỗ (20/20)
- K83 B1 — còn 3 chỗ (17/20), khai giảng 22/04
- K101 B1 — còn 8 chỗ (12/20), khai giảng 05/05
- K64 B2 — còn chỗ, giá cao hơn

Livestream URL mock: `https://meet.google.com/abc-defg-hij` — đủ giả link, không cần thật.

Giá test default:
- B1 cấp tốc: 1.300.000đ, tặng 4.000 xu
- B2 cấp tốc: 1.800.000đ, tặng 5.000 xu

Ratio bonus ~ 0.3% giá khóa (3.000–5.000 xu cho 1.3–1.8 triệu). Đủ để học viên làm 120+ đề full-test (25 xu/đề) — kích hoạt vòng lặp coin economy sau khóa học kết thúc.

## Implementation status

- [x] Mock courses + sessions data
- [x] `enrollment-store.ts` + hook
- [x] Route `/khoa-hoc` + tabs
- [x] `CourseCard` — 3 state variants (còn chỗ / hết chỗ / đã mua)
- [x] Route `/khoa-hoc/$courseId` — conditional render theo enrolled + expired
- [x] `CoursePurchaseDialog` — mock payment methods + enrollment
- [x] Nav item sidebar
- [x] Empty state "Khóa của tôi"
- [x] Expire logic (badge "Đã kết thúc", ẩn Zoom link)

## Open questions (phase 2)

- Booking slot 1-1: schema slot (courseId, instructorId, datetime, bookedByUserId), grid 7 ngày × time slots, conflict ở BE.
- Admin CRUD UI — cần roles system trước.
- Notification "Livestream bắt đầu sau 15 phút" — cần scheduled push.
