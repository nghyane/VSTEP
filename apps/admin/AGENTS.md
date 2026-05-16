# VSTEP Admin — Agent Instructions

Stack: **bun · Vite 8 · React 19 · TanStack Router + Query v5 · Ant Design v6 · `@ant-design/icons` v6 · Biome · ky · Zustand**.

Commands: `bun run dev` (port 5180) · `bun run build` · `bun run lint`.

> **Migration baseline (2026-05):** Tailwind, lucide-react, sonner, custom design tokens — đã **xoá hoàn toàn**. Mọi UI dùng Ant Design v6. Không quay lại. Không thêm UI library khác (shadcn, MUI, Mantine, Radix UI, Chakra). Không cài `@ant-design/pro-components` (giữ bundle nhỏ — đã 494 kB gzip).

---

## 1. ONLY Ant Design — hard rule

Tất cả UI **phải** dùng components từ `antd` hoặc icons từ `@ant-design/icons`. Tuyệt đối không:

| Anti-pattern | Đúng |
|---|---|
| `className="flex gap-2 mt-4 text-muted bg-surface"` | `<Flex gap={8} style={{ marginTop: 16 }}>` + `<Typography.Text type="secondary">` |
| `import { X } from "lucide-react"` | `import { CloseOutlined } from "@ant-design/icons"` |
| `import { toast } from "sonner"` | `const { message } = App.useApp(); message.success(...)` |
| `<button onClick={...}>` raw HTML | `<Button onClick={...}>` |
| `<div>` tự build modal/drawer | `<Modal>` / `<Drawer>` của antd |
| `style={{ color: "#1677ff" }}` hardcode | `const { token } = theme.useToken(); style={{ color: token.colorPrimary }}` |
| Tạo CSS file mới | Inline styles props + antd theme tokens |
| `<Alert message="..." />` (deprecated antd v6) | `<Alert title="..." />` hoặc `<Alert description="..." />` |

---

## 2. Antd v6 conventions (đọc kỹ — nhiều breaking change)

### Static API requires `<App>` wrapper

`message.xxx()`, `notification.xxx()`, `Modal.confirm()` **static imports không hoạt động** với ConfigProvider theme/locale. Phải dùng hook:

```tsx
import { App } from "antd"

function MyComponent() {
  const { message, notification, modal } = App.useApp()
  message.success("Đã lưu")
  modal.confirm({ title: "Chắc chứ?", onOk: () => {...} })
}
```

`<AntdApp>` đã wrap ở [main.tsx](src/main.tsx) → mọi component nested đều dùng được hook.

### Deprecated props (v5 → v6)

| Component | Cũ (v5) | Mới (v6) |
|---|---|---|
| `Alert` | `message` | `title` (hoặc `description` cho text dài) |
| `Button` | `iconPosition` | `iconPlacement` |
| `Space` / `Space.Compact` | `direction` | `orientation` |
| `Tag` | `bordered={false}` | `variant="filled"` |
| `Modal` / `Drawer` | tự handle mask | mask blur default ON |
| `Form.List` | `onFinish` có Form.List data | `onFinish` **không** include — dùng `form.getFieldsValue(true)` |
| `Table` | `pagination={{ position: [...] }}` | `pagination={{ placement: [...] }}` |

Khi gặp tsc/runtime warning "deprecated" → fix ngay, không bỏ qua.

### Theme & tokens

- Theme cấu hình **duy nhất** ở [main.tsx](src/main.tsx) qua `<ConfigProvider theme={{ token: {...} }}>`.
- Đổi color/radius/font → chỉ sửa `theme.token`. **Không** override CSS classes antd (`.ant-btn { ... }`) — sẽ vỡ khi upgrade.
- Cần token trong component:
  ```tsx
  import { theme } from "antd"
  const { token } = theme.useToken()
  // token.colorPrimary, token.colorTextSecondary, token.colorBorder,
  // token.borderRadius, token.padding, token.fontSize, ...
  ```
- Locale: `viVN` (đã set, ảnh hưởng `DatePicker`, `Pagination`, `Table` empty text, ...).

### CSS variables mode (default ON)

Antd v6 bật `cssVar: true` mặc định → tất cả styles dùng CSS custom properties. **Chỉ modern browsers** (Chrome 88+, Firefox 89+, Safari 14+). IE/legacy không support — admin panel không cần.

---

## 3. Component playbook

Khi cần thứ gì → tìm component antd tương ứng trước khi tự build.

### Layout

| Cần | Dùng |
|---|---|
| Vertical stack | `<Flex vertical gap={16}>` |
| Horizontal stack | `<Flex gap={8} align="center">` |
| Split row | `<Flex justify="space-between" align="center">` |
| Grid responsive | `<Row gutter={[16,16]}><Col xs={24} md={12} lg={8}>` |
| Wrap với split character | `<Space split={<Divider type="vertical" />}>` |
| Section divider | `<Divider>` hoặc `<Divider orientation="left">Title</Divider>` |
| Page shell | `<Layout>` (đã setup ở [_app.tsx](src/routes/_app.tsx)) |

### Typography

| Cần | Dùng |
|---|---|
| Page title h1 | `<Typography.Title level={3}>` (level 1/2 quá to cho admin) |
| Section title | `<Typography.Title level={4}>` |
| Card title | `<Typography.Title level={5}>` |
| Body | `<Typography.Text>` |
| Muted/helper | `<Typography.Text type="secondary">` |
| Success/danger/warning | `<Typography.Text type="success\|danger\|warning">` |
| Code/mono | `<Typography.Text code>` |
| Inline link (route) | TanStack `<Link>` |
| Inline link (external) | `<Typography.Link href="..." target="_blank">` |
| Long paragraph | `<Typography.Paragraph>` (auto ellipsis với prop `ellipsis`) |

### Forms

- **Mọi form dùng `<Form>` + `<Form.Item>`**. Đừng raw `<label>` + state useState per field.
- Layout: `<Form layout="vertical">` cho admin panels (default cho dense forms).
- Validation: `<Form.Item rules={[{ required: true, message: '...' }]}>` hoặc external state qua `validateStatus="error" help="..."`.
- Submit: `<Form onFinish={values => ...}>` + `<Button type="primary" htmlType="submit">`.
- Inputs: `Input`, `Input.Password`, `Input.TextArea`, `InputNumber`, `Select`, `DatePicker`, `RangePicker`, `Switch`, `Checkbox`, `Radio.Group`, `Upload`.
- File upload: `<Upload action="..." accept=".pdf" maxCount={1}>` — đừng tự handle FormData.

### Feedback

| Cần | Dùng | Ghi chú |
|---|---|---|
| Toast | `App.useApp().message` | KHÔNG static `message.xxx` |
| Notification (top-right card) | `App.useApp().notification` | |
| Confirm | `App.useApp().modal.confirm(...)` hoặc `<Popconfirm>` cho inline | |
| Banner | `<Alert type="error\|warning\|info\|success" title="..." description="..." />` | v6: dùng `title`, KHÔNG `message` |
| Inline error | `<Form.Item validateStatus="error" help="...">` | |
| Empty state | `<Empty description="..." image={Empty.PRESENTED_IMAGE_SIMPLE} />` | |
| Loading overlay | `<Spin spinning={loading}>{children}</Spin>` | |
| Skeleton placeholder | `<Skeleton active />` | dùng khi initial load page |
| Result page | `<Result status="success\|error\|404" title="..." />` | cho post-action page |

### Data display

| Cần | Dùng |
|---|---|
| Table (sortable, pagination) | `<Table columns={...} dataSource={...} rowKey="id" pagination={{ pageSize: 20 }} />` |
| List of cards | `<List grid={{ gutter: 16, column: 3 }} dataSource={...} renderItem={...} />` |
| Description list (key-value) | `<Descriptions bordered column={2}>` |
| Stats / KPI | `<Statistic title="..." value={...} prefix={...} />` |
| Badge dot/count | `<Badge count={5}>` hoặc `<Badge dot>` |
| Status tag | `<Tag color="success\|error\|warning\|processing\|default">` |
| Avatar | `<Avatar icon={<UserOutlined />} />` hoặc `<Avatar src="...">` |
| Timeline | `<Timeline items={[{ children: "..." }]} />` |
| Tree | `<Tree treeData={...} />` |

### Navigation

| Cần | Dùng |
|---|---|
| Sidebar menu | `<Menu mode="inline" items={...} />` (đã có ở [Sidebar.tsx](src/components/Sidebar.tsx)) |
| Tabs | `<Tabs items={[{ key, label, children }]} />` |
| Breadcrumb | `<Breadcrumb items={[{ title: "Home" }, { title: "Vocab" }]} />` |
| Pagination standalone | `<Pagination total={...} pageSize={20} />` |
| Steps wizard | `<Steps current={1} items={[...]} />` |

---

## 4. Icons

- Chỉ dùng `@ant-design/icons`. Naming: `<Name>Outlined`, `<Name>Filled`, `<Name>TwoTone`.
- Default: `Outlined`. `Filled` chỉ khi cần emphasis (active state, primary action).
- Common mapping:
  | Concept | Icon |
  |---|---|
  | Add / Create | `PlusOutlined` |
  | Delete | `DeleteOutlined` |
  | Edit | `EditOutlined` |
  | View / Preview | `EyeOutlined` |
  | Search | `SearchOutlined` |
  | Filter | `FilterOutlined` |
  | Back | `ArrowLeftOutlined` |
  | Save | `SaveOutlined` |
  | Cancel / Close | `CloseOutlined` |
  | Settings | `SettingOutlined` |
  | More menu | `MoreOutlined` |
  | Drag handle | `HolderOutlined` |
  | Warning | `WarningOutlined` |
  | Info | `InfoCircleOutlined` |
  | Success | `CheckCircleOutlined` |
  | Audio / Speaker | `SoundOutlined` / `AudioOutlined` |
  | Image | `PictureOutlined` |
  | File | `FileTextOutlined` / `FileOutlined` |
  | User | `UserOutlined` / `TeamOutlined` |
  | Calendar / Date | `CalendarOutlined` |
  | Clock | `ClockCircleOutlined` |
  | Up / Down / Left / Right | `UpOutlined` / `DownOutlined` / `LeftOutlined` / `RightOutlined` |

- Color: pass `style={{ color: token.colorPrimary }}` hoặc dùng `<Typography.Text type="success"><CheckOutlined /></Typography.Text>`.

---

## 5. Component shims `#/components/*`

19 shim kế thừa từ thời pre-antd, internals dùng antd. Có thể dùng tiếp **hoặc** import antd trực tiếp — không bắt buộc qua shim.

| Shim | Render gì | Khi nào dùng |
|---|---|---|
| `Button` | `antd Button` | Khi cần variant `primary\|secondary\|ghost\|danger` semantic |
| `Input` / `Textarea` / `Select` | antd tương ứng | Khi cần prop `invalid?: boolean` |
| `Modal` / `ConfirmDialog` | `antd Modal` | Size `sm\|md\|lg` map width 400/560/720 |
| `Card` | `antd Card` | Khi cần `title`/`description`/`action`/`padded` |
| `Badge` | `antd Tag` | Map variant → color |
| `Switch` / `Tabs` / `Skeleton` | antd tương ứng | thuần passthrough |
| `FormField` | `antd Form.Item` | label + error + helper API quen thuộc |
| `PageHeader` | `Flex` + `Typography` | Header layout chuẩn |
| `StatCard` | `Card` + `Statistic` | KPI tile |
| `DataTable` | `antd Table` | Adapter từ TanStack `ColumnDef[]` |
| `TagInput` | `antd Select mode="tags"` | có prop `allowed` để whitelist |
| `Sidebar` / `Topbar` | `antd Menu` + `Layout` | dùng ở `_app.tsx`, đừng import nơi khác |
| `Toaster` | `null` (backward-compat) | KHÔNG dùng — toast qua `App.useApp().message` |

**Quy tắc shim:**
- Nếu shim đủ → dùng shim cho code ngắn.
- Nếu cần feature antd shim không expose → import antd trực tiếp ngay file đó. **Đừng mở rộng shim API** (giữ shim mỏng).
- Page mới complex (Table với filters/sort) → dùng `antd Table` trực tiếp, không qua `DataTable` shim.

---

## 6. Architecture

### Flow

`Route → Component → Hook → Lib`. Không vòng ngược.

### State

- **Server state** = TanStack Query (`useQuery` + `select` để derive). Cache key prefix dài để invalidate dễ.
- **Auth state** = Zustand ([lib/auth.ts](src/lib/auth.ts)) — discriminated union.
- **Form state** = `antd Form` (`Form.useForm()`) hoặc `useState` cho form đơn giản.
- **URL state** = TanStack Router search params (pagination, filter, tab) — không `useState` cho thứ này.
- **UI ephemeral** (modal open, dropdown) = `useState` local.

### Data flow

- API calls qua [lib/api.ts](src/lib/api.ts) (ky client). Không `fetch` trực tiếp.
- Response wrapper: backend luôn `{ data: T }` → dùng `.json<ApiResponse<T>>()` rồi access `.data`.
- Error handling: TanStack Query `onError` hoặc `try/catch` quanh `mutation.mutateAsync`. Toast qua `App.useApp().message.error()`.

---

## 7. File structure

```
src/
  components/          # Shims wrap antd: Button, Input, Card, Modal, DataTable, Sidebar, ...
  features/            # Domain features (form/tab/editor groupings reused across routes)
    admin-vocab/
    admin-grammar/
    admin-practice/
  routes/              # TanStack Router file-based (= "pages" trong ant-pro)
    __root.tsx
    _app.tsx           # Protected shell (Layout + Sidebar + Topbar + Content)
    _app/
      index.tsx        # / Dashboard
      vocab/index.tsx  # /vocab list
      vocab/$topicId.tsx  # /vocab/:id detail
      grammar/...
      practice/listening/...
    login.tsx          # /login (public)
  lib/
    api.ts             # ky client + ApiResponse<T>
    auth.ts            # Zustand auth store + AdminRole type
    utils.ts           # shared helpers (cn no-op, formatters)
  styles.css           # minimal global (body font, reset)
  main.tsx             # ConfigProvider + AntdApp + QueryClientProvider + Router
```

**Convention (theo ant-design-pro spirit):**
- `routes/` = routing-only. Mỗi file = 1 route. **Không** nested routing components (TanStack file-based đã enforce).
- Component **shared cross-route** → `src/components/`.
- Component **chỉ dùng cho 1 domain** (vocab forms, grammar editors) → `src/features/<domain>/`.
- Component **chỉ dùng cho 1 route** → inline trong file route đó (cho tới khi cần reuse mới tách).

---

## 8. Code rules

- **No `any`. No `!` non-null assertion.** Dùng early return + null check.
- **No `as` casts** ngoài DOM boundary hoặc TanStack `Link to={t(path)}` shim trong Sidebar.
- **No `console.log`.** Errors → TanStack Query `onError` hoặc throw.
- **No inline helpers** cho format date/number/currency → đặt ở [lib/utils.ts](src/lib/utils.ts).
- **No hardcode URL API.** Paths tương đối tới `api.prefixUrl` (`VITE_API_URL`).
- **ApiResponse<T> wrapper.** Backend luôn `{ data: T }`. Frontend dùng `.json<ApiResponse<T>>()` rồi `.data`.
- **Props ≤ 4.** Nhiều hơn → gom object hoặc tách component.
- **Route page ≤ 100 lines.** Chỉ compose. Logic phức tạp → split.
- **No emoji** trong source/output (trừ khi user yêu cầu).
- **No comments** giải thích cái gì code làm — chỉ comment WHY cho invariant không obvious.

---

## 9. Roles (RBAC)

- **admin** — full access
- **staff** — ẩn User management, System Config, grading internals
- **teacher** — chỉ teacher dashboard (chưa implement)

Guard ở **route level** (`beforeLoad` trong `_app.tsx`), không scatter `if (role)` check trong components.

---

## 10. Workflow

1. **Before coding:** check `src/components/` (shims), `src/features/<domain>/` (existing forms) → reuse trước khi viết mới.
2. **New page:** scaffold empty route → verify navigate works → add query → UI bằng antd primitives.
3. **Layout:** copy pattern từ route gần nhất cùng loại (list page / detail page / form modal).
4. **Change ≥ 3 files:** plan trước, confirm với user, rồi code.
5. **After edit:** `bun run lint` (biome) → pass hết → **Không commit** trừ khi user yêu cầu.

---

## 11. Hard limits

- Component file: 1 concern. 2 concern → split.
- Route component ≤ 100 lines (compose only — không logic phức tạp).
- No barrel files (`index.ts` re-export).
- No commented-out code. Xóa là xóa.
- Function ≤ 50 dòng.
- No `index.tsx` ngoài `routes/` (TanStack file-based đã handle).

---

## 12. Quick reference snippets

### Page skeleton

```tsx
import { Flex, Typography, Button, Empty } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/my-page")({
  component: MyPage,
})

function MyPage() {
  return (
    <Flex vertical gap={24}>
      <Flex justify="space-between" align="center">
        <Typography.Title level={3} style={{ margin: 0 }}>Tiêu đề</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />}>Thêm</Button>
      </Flex>
      <Empty description="Chưa có dữ liệu" />
    </Flex>
  )
}
```

### List page với Table + filter

```tsx
import { Flex, Input, Select, Table, Tag } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

function ListPage() {
  const [search, setSearch] = useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["items", { search }],
    queryFn: () => api.get("items", { searchParams: { search } }).json<...>(),
  })

  return (
    <Flex vertical gap={16}>
      <Flex gap={12}>
        <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
        <Select placeholder="Lọc theo cấp độ" options={[...]} style={{ width: 200 }} />
      </Flex>
      <Table loading={isLoading} dataSource={data?.data} rowKey="id" columns={[
        { title: "Tên", dataIndex: "name" },
        { title: "Trạng thái", dataIndex: "status", render: (s) => <Tag color={s === "published" ? "success" : "default"}>{s}</Tag> },
      ]} />
    </Flex>
  )
}
```

### Form modal

```tsx
import { Modal, Form, Input, message } from "antd"
import { useMutation } from "@tanstack/react-query"
import { App } from "antd"

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const mutation = useMutation({
    mutationFn: (values: FormData) => api.post("items", { json: values }).json(),
    onSuccess: () => {
      message.success("Đã tạo")
      onClose()
    },
  })

  return (
    <Modal title="Tạo mới" open={open} onCancel={onClose} onOk={() => form.submit()} confirmLoading={mutation.isPending}>
      <Form form={form} layout="vertical" onFinish={mutation.mutate}>
        <Form.Item name="name" label="Tên" rules={[{ required: true, message: "Bắt buộc" }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}
```

### Toast (notification từ component)

```tsx
import { App } from "antd"

function MyComponent() {
  const { message } = App.useApp()
  return <Button onClick={() => message.success("Hello")}>Click</Button>
}
```

### Theme token

```tsx
import { theme, Typography } from "antd"

function Card() {
  const { token } = theme.useToken()
  return (
    <div style={{ background: token.colorBgContainer, padding: token.padding, borderRadius: token.borderRadius }}>
      <Typography.Text style={{ color: token.colorPrimary }}>...</Typography.Text>
    </div>
  )
}
```

---

## References

- [Ant Design v6 docs](https://ant.design/docs/react/introduce)
- [Ant Design Pro folder convention](https://v5-pro.ant.design/docs/folder/)
- [Antd v5 → v6 migration](https://ant.design/docs/react/migration-v6/)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
