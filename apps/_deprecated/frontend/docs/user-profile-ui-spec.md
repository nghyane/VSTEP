# UI Spec — Hồ sơ người dùng (Post-Login)

> Tài liệu mô tả chi tiết layout, hành vi, và API mapping cho các chức năng: **Xem/Cập nhật thông tin**, **Đổi mật khẩu**, **Đăng xuất** — xuất hiện sau khi đăng nhập thành công.

### Quy tắc chung (tuân thủ AGENTS.md + SKILL.md)

- **shadcn components first**: dùng `<Input>`, `<Label>`, `<Button>`, `<Card>`, `<Avatar>`, `<DropdownMenu>` từ `@/components/ui/`. Không dùng raw `<input>`, `<label>`, `<div>` khi đã có shadcn tương ứng.
- **Icons**: chỉ dùng `@hugeicons/react` + `@hugeicons/core-free-icons`. Tuyệt đối **không dùng `lucide-react`**.
- **className merging**: luôn dùng `cn()` từ `@/lib/utils`. Không dùng template literals cho className.
- **Colors**: dùng semantic tokens (`text-primary`, `bg-muted/30`, `text-destructive`, `text-success`). Không hard-code hex/rgb/màu cụ thể như `text-green-600`.
- **Surfaces**: dùng tinted fills (`bg-muted/30`, `bg-primary/5`). Không dùng `border` hoặc `shadow` trên cards.
- **Border radius**: `rounded-xl`+ cho containers, `rounded-full` cho pills/avatar.
- **No inline styles**, no glow, no neon shadows, no gradients.
- **Interactive states**: mọi component phải handle đủ 4 state: **loading**, **error**, **empty**, **success**.
- **Imports**: dùng path alias `@/`. Không relative path ngoài `./`.

---

## 1. Avatar & User Menu (Header Bar)

### Vị trí

- Nằm ở **góc trên bên phải** của header bar (`sticky top-0`).
- Hiển thị trên **mọi trang** sau khi đăng nhập (cả Learner layout lẫn Admin layout).

### Components sử dụng

```ts
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserCircleIcon, Settings01Icon, Logout01Icon } from "@hugeicons/core-free-icons"
```

### Hiển thị Avatar

| Thành phần | Mô tả | Component |
|------------|-------|-----------|
| **Avatar hình tròn** | `size-8` (32px), nền `bg-primary/10`, chữ `text-primary` | `<Avatar>` + `<AvatarFallback>` |
| **Initials** | Lấy 2 ký tự đầu từ `fullName`. Nếu chưa có `fullName` → lấy 2 ký tự đầu của `email`. Viết HOA | Render trong `<AvatarFallback>` |
| **Cursor** | `cursor-pointer` — cho biết clickable | Class trên `<DropdownMenuTrigger>` |

### Dropdown Menu (click vào Avatar)

Dùng shadcn `<DropdownMenu>` (Radix UI) — `align="end"`, `className="w-48"`.

| Thứ tự | Menu item | Icon (hugeicons) | Hành vi |
|--------|-----------|------------------|---------|
| 1 | **Hồ sơ** | `UserCircleIcon` | `<Link to="/profile">` |
| 2 | **Cài đặt** | `Settings01Icon` | _(placeholder, chưa implement)_ |
| — | Separator | — | `<DropdownMenuSeparator>` |
| 3 | **Đăng xuất** | `Logout01Icon` | `onClick={handleLogout}` |

### Dữ liệu nguồn

- Lấy user từ `localStorage` qua `user()` trong `@/lib/auth`.
- Dữ liệu được lưu lúc đăng nhập thành công (`auth.save()`).

```ts
// Cấu trúc user trong localStorage
interface AuthUser {
  id: string
  email: string
  fullName: string | null
  role: "learner" | "instructor" | "admin"
}
```

---

## 2. Trang Hồ sơ (`/profile`)

### Route & Guard

- Route: `/_learner/profile` — nằm trong layout `_learner` (cần đăng nhập).
- Chưa đăng nhập → redirect `/login` (guard ở `_learner.tsx` via `beforeLoad`).

### Layout tổng thể

```
┌─────────────────────────────────────────────────┐
│  Header bar (LearnerLayout)        [🔥 12] [AV] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Hồ sơ cá nhân              (h1, max-w-2xl)    │
│                                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │  [Avatar 80px]  Nguyễn Văn A             │  │
│  │                 email@example.com         │  │
│  │                 [Badge: Người học]        │  │
│  │                 Thành viên từ 15/01/2026  │  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│          (no border, no shadow — flat)          │
│                                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │  🔵 Cập nhật thông tin    (bg-muted/30)  │  │
│  │                                          │  │
│  │  <Label> Họ và tên   <Input />           │  │
│  │  <Label> Email        <Input />          │  │
│  │                                          │  │
│  │  <Button> Lưu thay đổi                  │  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │  🔒 Đổi mật khẩu         (bg-muted/30)  │  │
│  │                                          │  │
│  │  <Label> Mật khẩu hiện tại  <Input />   │  │
│  │  <Label> Mật khẩu mới       <Input />   │  │
│  │  <Label> Xác nhận MK mới    <Input />   │  │
│  │                                          │  │
│  │  <Button> Đổi mật khẩu                  │  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

> **Note**: Các section card dùng `div` với `className={cn("rounded-2xl bg-muted/30 p-6")}`. Không dùng `border` hay `shadow` (theo SKILL.md: _tinted, not bordered_).

---

## 3. Section: Thông tin cá nhân (read-only header)

### API

```
GET /api/users/:id    🔒 Cần đăng nhập
```

- `:id` = `user().id` từ localStorage.
- Response:

```json
{
  "id": "uuid",
  "email": "hocvien@example.com",
  "fullName": "Nguyễn Văn A",
  "role": "learner",
  "createdAt": "2026-01-15T08:30:00.000Z",
  "updatedAt": "2026-03-01T10:00:00.000Z"
}
```

### Components sử dụng

```ts
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
```

### Hiển thị

| Thành phần | Chi tiết | Styling |
|------------|----------|---------|
| **Avatar lớn** | Initials 2 ký tự đầu `fullName` (hoặc `email`) | `<Avatar className={cn("size-20")}>` + `<AvatarFallback className={cn("bg-primary/10 text-3xl font-bold text-primary")}>` |
| **Tên** | `fullName` — nếu `null` hiển thị _"Chưa đặt tên"_ | `text-xl font-bold` |
| **Email** | `email` | `text-sm text-muted-foreground` |
| **Badge vai trò** | `learner` → "Người học", `instructor` → "Giảng viên", `admin` → "Quản trị viên" | `rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary` |
| **Ngày tham gia** | Format `createdAt` theo locale `vi-VN` | `text-xs text-muted-foreground` |

### Interactive states

| State | UI |
|-------|----|
| **Loading** | Text _"Đang tải..."_ hoặc `<Skeleton>` component, `text-muted-foreground` |
| **Error** | Text đỏ `text-destructive` với error message |
| **Empty** (`data` null) | Không render section |
| **Success** | Render thông tin bình thường |

### Hook

```ts
import { useUser } from "@/hooks/use-user"

const { data, isLoading, isError, error } = useUser(userId)
// queryKey: ["users", userId]
// queryFn:  api.get<User>(`/api/users/${userId}`)
```

---

## 4. Section: Cập nhật thông tin

### API

```
PATCH /api/users/:id    🔒 Cần đăng nhập (tự sửa mình)
```

- Chỉ gửi các trường muốn thay đổi (partial update).
- Request body:

```json
{
  "fullName": "Tên mới",
  "email": "email-moi@example.com"
}
```

- Response `200`: object `User` đã cập nhật.
- Error `409`: email đã tồn tại → hiển thị thông báo lỗi.

### Components sử dụng

```ts
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserCircleIcon, UserIcon, Mail01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
```

### Form fields

| Field | Component | Icon (hugeicons) | Pre-fill | Validation |
|-------|-----------|------------------|----------|------------|
| **Họ và tên** | `<Input type="text">` | `UserIcon` | `data.fullName` | Không bắt buộc |
| **Email** | `<Input type="email">` | `Mail01Icon` | `data.email` | HTML5 email validation |

> **Quan trọng**: Dùng shadcn `<Input>` và `<Label>`, KHÔNG dùng raw `<input>` / `<label>`. Input component đã có sẵn focus ring, border, sizing chuẩn.

### Section container

```tsx
<div className={cn("rounded-2xl bg-muted/30 p-6")}>
  <div className="mb-5 flex items-center gap-2">
    <HugeiconsIcon icon={UserCircleIcon} className="size-5 text-primary" />
    <h3 className="text-lg font-bold">Cập nhật thông tin</h3>
  </div>
  <form className="space-y-4">
    {/* form fields */}
  </form>
</div>
```

### Interactive states & Hành vi

| State | UI |
|-------|----|
| **Idle** | Form với dữ liệu pre-fill, button "Lưu thay đổi" enabled |
| **Submitting** (`isPending`) | Button disabled, text đổi thành _"Đang lưu..."_ |
| **Success** (`isSuccess`) | Text `text-success` — _"Đã cập nhật thông tin"_. Invalidate query `["users", userId]` |
| **Error** (`isError`) | Text `text-destructive` — hiển thị `error.message` |

### Hook

```ts
import { useUpdateUser } from "@/hooks/use-user"

const update = useUpdateUser(userId)
// mutationFn: api.patch<User>(`/api/users/${userId}`, body)
// onSuccess:  invalidateQueries(["users", userId])

update.mutate({ fullName, email })
```

---

## 5. Section: Đổi mật khẩu

### API

```
POST /api/users/:id/password    🔒 Cần đăng nhập
```

- Request body:

```json
{
  "currentPassword": "matkhau-cu",
  "newPassword": "matkhau-moi-123"
}
```

- Response `200`: `{ "success": true }`.
- Error `400/401`: mật khẩu hiện tại sai → hiển thị thông báo lỗi.

### Components sử dụng

```ts
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { LockPasswordIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
```

### Form fields

| Field | Component | Validation (client-side) |
|-------|-----------|--------------------------|
| **Mật khẩu hiện tại** | `<Input type="password">` | Bắt buộc |
| **Mật khẩu mới** | `<Input type="password">` | Tối thiểu 8 ký tự |
| **Xác nhận mật khẩu mới** | `<Input type="password">` | Phải khớp với "Mật khẩu mới" |

> Dùng shadcn `<Input>` — KHÔNG dùng raw `<input>` với custom CSS class.

### Section container

```tsx
<div className={cn("rounded-2xl bg-muted/30 p-6")}>
  <div className="mb-5 flex items-center gap-2">
    <HugeiconsIcon icon={LockPasswordIcon} className="size-5 text-primary" />
    <h3 className="text-lg font-bold">Đổi mật khẩu</h3>
  </div>
  <form className="space-y-4">
    {/* form fields */}
  </form>
</div>
```

### Interactive states & Hành vi

1. Validate client-side trước khi gọi API:
   - `newPassword.length < 8` → _"Mật khẩu mới phải có ít nhất 8 ký tự"_ (`text-destructive`)
   - `newPassword !== confirmPassword` → _"Mật khẩu xác nhận không khớp"_ (`text-destructive`)
2. Gọi `POST /api/users/:id/password`.

| State | UI |
|-------|----|
| **Idle** | Form rỗng, button "Đổi mật khẩu" enabled |
| **Validation error** | Text `text-destructive` dưới form |
| **Submitting** (`isPending`) | Button disabled, text _"Đang xử lý..."_ |
| **Success** (`isSuccess`) | Text `text-success` — _"Đã đổi mật khẩu thành công"_. Clear cả 3 input fields |
| **Error** (`isError`) | Text `text-destructive` — hiển thị `error.message` |

### Hook

```ts
import { useChangePassword } from "@/hooks/use-user"

const changePw = useChangePassword(userId)
// mutationFn: api.post(`/api/users/${userId}/password`, body)

changePw.mutate(
  { currentPassword, newPassword },
  { onSuccess: () => { /* clear form fields */ } }
)
```

---

## 6. Đăng xuất

### Trigger

- Click **"Đăng xuất"** trong `<DropdownMenuItem>` của Avatar dropdown (trên header bar).

### API

```
POST /api/auth/logout    🔒 Cần đăng nhập
```

- Request body:

```json
{
  "refreshToken": "token-của-bạn"
}
```

- Header: `Authorization: Bearer <accessToken>`

### Luồng xử lý

```
1. Lấy accessToken và refreshToken từ localStorage
2. Gọi POST /api/auth/logout (gửi refreshToken trong body, accessToken trong header)
3. Dù thành công hay thất bại (finally):
   a. Xóa toàn bộ token khỏi localStorage — auth.clear()
   b. Redirect về /login bằng window.location.href (hard reload)
```

### Code pattern

```ts
import { logout } from "@/lib/api"
import { clear, refreshToken, token } from "@/lib/auth"

async function handleLogout() {
  try {
    const t = token()         // accessToken từ localStorage
    const r = refreshToken()  // refreshToken từ localStorage
    if (t && r) await logout(r, t)
  } finally {
    clear()                   // xóa localStorage
    window.location.href = "/login"  // hard redirect
  }
}
```

> **Lưu ý**: Dùng `window.location.href` (hard reload) thay vì `navigate()` để đảm bảo clear hết React state, query cache, v.v.

---

## 7. Xử lý lỗi & Token tự động refresh

### Cơ chế auto-refresh (trong `@/lib/api.ts`)

Mọi API call qua `authRequest()` đều có cơ chế tự động refresh khi gặp lỗi `401`:

```
Request với accessToken
  ├─ 200 OK → trả kết quả
  └─ 401 Unauthorized
       ├─ Có refreshToken → gọi POST /api/auth/refresh
       │    ├─ Thành công → lưu token mới, retry request gốc
       │    └─ Thất bại  → clear token, throw error
       └─ Không có refreshToken → clear token, throw error
```

### Bảng mã lỗi liên quan

| Mã | Ý nghĩa | UI hiển thị |
|----|---------|-------------|
| 200 | Thành công | Text `text-success`: thông báo thành công |
| 400 | Dữ liệu sai | Text `text-destructive`: message từ server |
| 401 | Token hết hạn / sai mật khẩu | Auto-refresh hoặc text `text-destructive` |
| 409 | Email trùng | Text `text-destructive`: "Email đã tồn tại" |
| 500 | Lỗi server | Text `text-destructive`: "Đã có lỗi xảy ra" |

---

## 8. Design Tokens & Styling

> Tuân thủ **Soft Rounded UI** (SKILL.md): tinted surfaces, flat depth, very rounded, muted canvas + saturated accents.

| Token | Dùng cho |
|-------|----------|
| `bg-primary/10` | Avatar background, role badge |
| `text-primary` | Avatar text, icon accent, badge text |
| `bg-muted/30` | Section card background (tinted, not bordered) |
| `text-muted-foreground` | Email, ngày tham gia, secondary text |
| `text-destructive` | Error messages |
| `text-success` | Success messages (semantic token — **không dùng** `text-green-600`) |
| `rounded-2xl` | Section card containers |
| `rounded-full` | Avatar, role badge pill |

### Font

- **DIN Round** (defined in `src/styles.css`)
- Body: weight 500, Headings: weight 700
- Numeric: `tabular-nums`

### Những thứ KHÔNG dùng

- ❌ `border` hoặc `shadow` trên cards
- ❌ Hard-coded hex/rgb colors (vd: `text-green-600`, `bg-[#xxx]`)
- ❌ Raw `<input>`, `<label>` — dùng shadcn `<Input>`, `<Label>`
- ❌ `lucide-react` icons — dùng `@hugeicons/react`
- ❌ Inline styles
- ❌ Glow, neon, gradient, shimmer effects

---

## 9. Tóm tắt API sử dụng

| Chức năng | Method | Endpoint | Auth | Ghi chú |
|-----------|--------|----------|------|---------|
| Xem thông tin user | `GET` | `/api/users/:id` | 🔒 | Chỉ xem chính mình |
| Cập nhật thông tin | `PATCH` | `/api/users/:id` | 🔒 | Partial update (chỉ gửi field muốn đổi) |
| Đổi mật khẩu | `POST` | `/api/users/:id/password` | 🔒 | Cần mật khẩu cũ |
| Đăng xuất | `POST` | `/api/auth/logout` | 🔒 | Gửi refreshToken trong body |
| Refresh token | `POST` | `/api/auth/refresh` | ❌ | Tự động trong `api.ts` |

---

## 10. Tóm tắt Components & Libraries

| Thư viện | Import path | Dùng cho |
|----------|-------------|----------|
| shadcn Avatar | `@/components/ui/avatar` | Avatar hiển thị initials |
| shadcn Button | `@/components/ui/button` | Submit buttons |
| shadcn Input | `@/components/ui/input` | Form input fields |
| shadcn Label | `@/components/ui/label` | Form labels |
| shadcn DropdownMenu | `@/components/ui/dropdown-menu` | User menu dropdown |
| shadcn Popover | `@/components/ui/popover` | Streak popover (header) |
| Hugeicons | `@hugeicons/react` + `@hugeicons/core-free-icons` | Tất cả icons |
| TanStack React Query | `@tanstack/react-query` | `useQuery`, `useMutation` |
| TanStack Router | `@tanstack/react-router` | `Link`, `createFileRoute`, `useNavigate` |
| cn() utility | `@/lib/utils` | className merging (luôn dùng) |
