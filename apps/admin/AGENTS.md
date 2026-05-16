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

**Pattern canonical của project (KHÔNG dùng `Form.useForm()` antd):**

Project đã chọn pattern **typed useState + `<FormField>` shim + Laravel-style errors** (vì BE trả `{ message, errors: { field: [...] } }`). Tất cả 18 form file ở `features/admin-*/` đều theo pattern này — đừng đổi sang `Form.useForm()`.

```tsx
import { type FormEvent, useState } from "react"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Button } from "#/components/Button"
import { Alert } from "antd"
import { extractError } from "#/lib/api"

interface Props {
  initial?: WordData
  onSubmit: (input: WordFormInput) => Promise<unknown>
  onCancel: () => void
  submitting?: boolean
}

export function WordForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const [state, setState] = useState<WordFormInput>({ word: initial?.word ?? "", ... })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [generic, setGeneric] = useState<string | null>(null)

  function set<K extends keyof WordFormInput>(key: K, value: WordFormInput[K]) {
    setState((s) => ({ ...s, [key]: value }))
  }

  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({}); setGeneric(null)
    try {
      await onSubmit(state)
    } catch (err) {
      const x = await extractError(err)
      if (x.errors) {
        setErrors(x.errors)
        setGeneric(Object.values(x.errors).flat().join(" • ") || x.message)
      } else setGeneric(x.message)
    }
  }

  return (
    <form onSubmit={handle}>
      {generic && <Alert type="error" description={generic} style={{ marginBottom: 12 }} />}
      <FormField label="Từ" required error={errors.word}>
        <Input value={state.word} onChange={(e) => set("word", e.target.value)} />
      </FormField>
      <Flex justify="end" gap={8} style={{ marginTop: 16 }}>
        <Button variant="ghost" onClick={onCancel}>Huỷ</Button>
        <Button type="submit" loading={submitting}>Lưu</Button>
      </Flex>
    </form>
  )
}
```

**Lý do chọn pattern này:**
- BE Laravel trả validation errors theo shape `{ errors: { field: [msg, msg] } }` → map trực tiếp vào `<FormField error={errors.field}>` của shim, không cần adapter
- `useState` typed = explicit, agent đọc 1 nhịp hiểu state shape; `Form.useForm()` magic, type loose
- Submission lifecycle (try/catch quanh `await onSubmit`) → caller (modal/page) control mutation + close logic
- Pattern này lặp lại 18 lần → đã thành **convention không thương lượng**

**Inputs dùng shim hoặc antd trực tiếp:**
- Shim ở `#/components/{Input, Textarea, Select, Switch, TagInput}` — có prop `invalid?: boolean` map tới `status="error"`
- Antd direct: `InputNumber`, `DatePicker`, `RangePicker`, `Checkbox`, `Radio.Group`, `Upload`
- File upload: `<Upload action="..." accept=".pdf" maxCount={1}>` — đừng tự handle FormData

**Khi nào DÙNG `Form.useForm()` antd:** Page **mới chưa có domain pattern** + form đơn giản không call BE Laravel (vd: filter form local, settings page). Không refactor 18 form hiện tại.

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
- **Form state** = `useState<FormInput>` typed object + `<FormField>` shim + Laravel-style errors (xem §3 Forms cho pattern chuẩn). **KHÔNG** dùng `Form.useForm()` antd cho form gọi BE.
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

## 8. Splitting & maintainability — KHÔNG monolith

> **Quy tắc tối thượng:** file > 200 dòng = code smell. file > 300 dòng = phải split. **Không có file 500+ dòng nào được merge.**

### Cảm hứng từ industry standards

Rule này tổng hợp pattern từ các kiến trúc tham khảo (đọc nhanh để hiểu nguyên tắc, **không** cần follow rigid):

| Reference | Lấy gì áp dụng | Bỏ gì |
|---|---|---|
| [bulletproof-react](https://github.com/alan2207/bulletproof-react) (alan2207) | **Feature-based folders**, sub-folder template (`api/`, `components/`, `hooks/`, `stores/`, `types/`, `utils/`), **cross-feature import forbidden**, no barrel files (tốt cho Vite tree-shake) | kebab-case files — project đã PascalCase, không retrofit |
| [Feature-Sliced Design](https://feature-sliced.design/) | **Single responsibility per file**, segments per slice (`ui/`, `api/`, `model/`, `lib/`), **same-layer import forbidden** (high cohesion, low coupling) | 6-layer rigid hierarchy quá nặng cho admin nhỏ — không adopt `entities/`, `widgets/` |
| [Colocation pattern](https://reacthandbook.dev/project-standards) | "Code that changes together lives together" — component folder chứa subcomponents + hooks + types + queries cùng nơi | — |
| Industry consensus (Medium, freeCodeCamp) | **150 dòng = sweet spot**, **250-300 = ceiling**, **500+ = phải split** | Không hard-cap 40 dòng (quá strict cho admin form 5-10 field) |

**Triết lý project VSTEP admin (chọn lọc, không dogma):**
- ✅ Feature-based (`features/<domain>/`) — match bulletproof-react
- ✅ Cross-feature import **forbidden** — `features/admin-vocab/` không được import từ `features/admin-grammar/`. Shared code → kéo lên `components/` hoặc `lib/`.
- ✅ Colocation: route lớn → folder với sub-components + queries + types cùng chỗ
- ✅ No barrel files (xem định nghĩa rõ ở §8 "Barrel vs entry point" bên dưới)
- ❌ Không adopt FSD strict 6-layer — admin chưa đủ scale; `routes/` thay cho `pages/`, không có `entities/`/`widgets/`

### Hierarchy import (unidirectional)

```
lib/        ←── components/ ←── features/ ←── routes/
            ←──             ←── features/  (CÙNG cấp, KHÔNG cross-feature)
```

- `routes/*` import được từ tất cả các tầng dưới
- `features/<A>/` import được từ `components/`, `lib/`, **nhưng KHÔNG từ `features/<B>/`**
- `components/` chỉ import từ `lib/` (và antd)
- `lib/` không import từ tầng trên

### File = 1 concern

Mỗi file = **1 concern**. Có 2 concern → tách file. Concern = "lý do để thay đổi" (single responsibility). Ví dụ: data fetching, layout, sub-section render, form schema, table columns — mỗi cái là 1 concern.

### Khi nào BẮT BUỘC split

| Triệu chứng | Action |
|---|---|
| File > 200 dòng | Audit ngay → tìm sub-component để tách |
| File > 300 dòng | **Phải** split trước khi commit |
| Route component > 100 dòng | Tách sub-component sang `routes/.../-folder/`, route chỉ compose |
| Function > 50 dòng | Tách helper, hoặc đặt vào `lib/utils.ts` nếu shared |
| Component có > 3 sub-section (`StatsRow`, `ContentChart`, `ActionList`...) cùng file | Mỗi sub-section → 1 file riêng |
| Form có > 5 field + validation phức tạp | Tách `MyForm.tsx` + `myForm.schema.ts` (zod/yup) + `myForm.hooks.ts` (mutation) |
| Table có > 3 column phức tạp với custom render | Tách `columns.tsx` riêng |
| > 1 query/mutation trong cùng component | Tách hooks ra `useXxx.ts` |

### Pattern folder cho feature/route lớn

Khi 1 route hoặc feature phình to, **chuyển từ file đơn → folder** (colocation pattern). Theo bulletproof-react template cho feature subfolder:

**Feature scope (mature) — full template:**
```
features/admin-grammar/
  api/                        # API calls + types (response/request shapes)
    grammar.api.ts
    grammar.types.ts
  components/                 # UI components scoped riêng feature này
    PointForm.tsx
    StructureForm.tsx
    ExerciseEditor/           # nested folder khi component có sub-parts
      index.tsx               # ≤ 100 dòng — compose
      Form.tsx
      KindSelector.tsx
      Preview.tsx
  hooks/                      # custom hooks dùng nội bộ feature
    useGrammarMutations.ts
    useExerciseState.ts
  types.ts                    # types shared trong feature
  utils.ts                    # helpers nội bộ feature (nếu có)
```

> **Khi nào dùng full template:** feature có > 5 file + có API/hooks riêng. Nhỏ hơn — giữ flat.
> **"Only include folders that are necessary"** (quote từ bulletproof-react docs).

**Trước (đơn file, sai khi to):**
```
features/admin-grammar/
  ExerciseEditor.tsx          # 320 dòng — gộp form + tabs + sub-editors + mutations
```

**Sau (component-folder, đúng):**
```
features/admin-grammar/
  ExerciseEditor/
    index.tsx                 # ≤ 100 dòng — compose, public API entry
    Form.tsx                  # form chính (MCQ/fill-blank/word-form fields)
    KindSelector.tsx          # discriminator UI
    Preview.tsx               # student-view preview
    mutations.ts              # useCreateExercise, useUpdateExercise
    schema.ts                 # zod/types — payload shapes per kind
    types.ts                  # local types (Props, internal state)
```

> **Import từ ngoài:** `import { ExerciseEditor } from "#/features/admin-grammar/ExerciseEditor"` — auto-resolve `ExerciseEditor/index.tsx`. **KHÔNG** tạo barrel `features/admin-grammar/index.ts` re-export tất cả.

### Barrel vs entry point — phân biệt rõ

"Barrel file" có 2 nghĩa hay bị lẫn. Project chỉ cấm 1 loại:

| Pattern | Có phải barrel? | Status |
|---|---|---|
| `Folder/index.tsx` — file chứa **component default** của folder, là entry point | ❌ KHÔNG phải barrel | ✅ **OK — encouraged** (React/TanStack convention) |
| `Folder/index.ts` chỉ có `export * from "./Form"; export * from "./Preview"` | ✅ Barrel re-export | ❌ **CẤM** |
| `features/admin-vocab/index.ts` re-export tất cả components | ✅ Barrel | ❌ **CẤM** |
| `lib/index.ts` re-export `api`, `auth`, `utils` | ✅ Barrel | ❌ **CẤM** — import trực tiếp `from "#/lib/api"` |

**Lý do cấm barrel re-export:**
- Vỡ Vite tree-shake (bulletproof-react docs: "obstructs tree-shaking, causes performance issues")
- Khi import 1 thứ từ barrel → bundler load tất cả file trong barrel → bundle phình
- Vite v5+ có optimizeDeps mitigate phần nào nhưng vẫn không hoàn hảo

**Import luôn trực tiếp:**
```ts
// ✅ đúng
import { ExerciseEditor } from "#/features/admin-grammar/ExerciseEditor"
import { api } from "#/lib/api"
import { Button } from "#/components/Button"

// ❌ sai
import { ExerciseEditor, PointForm } from "#/features/admin-grammar"
import { api, auth, formatDate } from "#/lib"
```

**Route lớn (Dashboard, list page) tương tự:**
```
routes/_app/
  index.tsx                   # ≤ 100 dòng — chỉ compose & beforeLoad
  -dashboard/                 # private folder (dash-prefix = không thành route)
    StatsRow.tsx
    ContentChart.tsx
    ActionList.tsx
    ActivityTimeline.tsx
    AlertsBanner.tsx
    queries.ts                # 5 useQuery hooks
    types.ts
```

> **TanStack Router convention:** folder/file bắt đầu bằng `-` không generate thành route. Dùng để colocate component cho 1 route mà không pollute route tree. → Đây là cách chuẩn để break route lớn.

### Khi nào tạo `lib/` mới

- Helper dùng > 1 nơi → `src/lib/utils.ts` (nếu nhỏ) hoặc `src/lib/<domain>.ts` (nếu nguyên 1 cluster: `lib/format.ts`, `lib/csv.ts`, `lib/audio.ts`)
- Hook custom dùng > 1 nơi → `src/hooks/useXxx.ts` (tạo folder `hooks/` khi cần — admin hiện chưa có, nhưng OK khi đủ lý do)

### Anti-patterns (cấm)

| ❌ Sai | ✅ Đúng |
|---|---|
| 1 file `Form.tsx` 500 dòng gộp 4 sub-form | folder `Form/` với `index.tsx` (compose) + 4 sub-file |
| Route file 400 dòng tự inline 6 sub-component | route ≤ 100 dòng, sub-component ở `-dashboard/` |
| 3 mutation `useMutation` rải khắp component | gom vào `mutations.ts` cùng folder |
| Types inline mỗi component lặp lại | `types.ts` riêng trong folder |
| Helper format date copy-paste 5 nơi | `lib/format.ts` |

### Quy trình split file đang to

1. **Đếm dòng:** `wc -l file.tsx` → nếu > 200, audit.
2. **List sub-component & helper:** `grep "^function\|^const.*= (" file.tsx` → đếm số function nội bộ.
3. **Convert file → folder:** `mv X.tsx X/index.tsx` rồi tách từng sub-component ra file riêng.
4. **Move query/mutation:** vào `queries.ts` hoặc `mutations.ts` cùng folder.
5. **Move types:** vào `types.ts` cùng folder.
6. **Verify:** `bunx tsc --noEmit` + chạy `bun run dev` test UI không vỡ.

### Audit định kỳ

Trước khi viết feature mới có khả năng phình to:
```bash
cd apps/admin && find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20
```
File > 250 dòng → ưu tiên refactor trước, không cộng thêm code vào.

---

## 9. Code rules

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

## 10. Roles (RBAC)

- **admin** — full access
- **staff** — ẩn User management, System Config, grading internals
- **teacher** — chỉ teacher dashboard (chưa implement)

Guard ở **route level** (`beforeLoad` trong `_app.tsx`), không scatter `if (role)` check trong components.

---

## 11. Workflow

1. **Before coding:** check `src/components/` (shims), `src/features/<domain>/` (existing forms) → reuse trước khi viết mới.
2. **New page:** scaffold empty route → verify navigate works → add query → UI bằng antd primitives.
3. **Layout:** copy pattern từ route gần nhất cùng loại (list page / detail page / form modal).
4. **Change ≥ 3 files:** plan trước, confirm với user, rồi code.
5. **After edit:** `bun run lint` (biome) → pass hết → **Không commit** trừ khi user yêu cầu.

---

## 12. Hard limits

- **File ≤ 200 dòng** (warning). **File ≤ 300 dòng** (hard cap — phải split trước khi commit).
- **Route component ≤ 100 dòng** (compose only — sub-components ở `routes/.../-folder/`).
- **Component file: 1 concern.** 2 concern → split file.
- **Function ≤ 50 dòng.**
- **Props ≤ 4.** Nhiều hơn → gom object hoặc tách component.
- No barrel `index.ts` re-export (xem §8 "Barrel vs entry point"). `Folder/index.tsx` chứa component default thì OK.
- No commented-out code. Xóa là xóa.
- Audit `wc -l` trước khi viết feature mới: file > 250 dòng → refactor trước.

---

## 13. Quick reference snippets

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

### Form modal (pattern canonical — useState + FormField + Laravel errors)

```tsx
import { App, Modal } from "antd"
import { useMutation } from "@tanstack/react-query"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { api, extractError } from "#/lib/api"
import { type FormEvent, useState } from "react"

interface FormInput { name: string }

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { message } = App.useApp()
  const [state, setState] = useState<FormInput>({ name: "" })
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const mutation = useMutation({
    mutationFn: (input: FormInput) => api.post("items", { json: input }).json(),
    onSuccess: () => {
      message.success("Đã tạo")
      setState({ name: "" }); setErrors({})
      onClose()
    },
    onError: async (err) => {
      const x = await extractError(err)
      if (x.errors) setErrors(x.errors)
      else message.error(x.message)
    },
  })

  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    mutation.mutate(state)
  }

  return (
    <Modal title="Tạo mới" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      <form onSubmit={handle}>
        <FormField label="Tên" required error={errors.name}>
          <Input value={state.name} onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))} />
        </FormField>
        <Flex justify="end" gap={8} style={{ marginTop: 16 }}>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button type="submit" loading={mutation.isPending}>Tạo</Button>
        </Flex>
      </form>
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

### UI / antd
- [Ant Design v6 docs](https://ant.design/docs/react/introduce)
- [Ant Design Pro folder convention](https://v5-pro.ant.design/docs/folder/)
- [Antd v5 → v6 migration](https://ant.design/docs/react/migration-v6/)

### Routing / data
- [TanStack Router](https://tanstack.com/router) — file-based routing, `-prefix` private folders
- [TanStack Query](https://tanstack.com/query) — server state, query invalidation

### Project architecture (§8 cảm hứng)
- [bulletproof-react](https://github.com/alan2207/bulletproof-react) — feature-based folder pattern, cross-feature import boundary, no barrel files
  - [project-structure.md](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
  - [project-standards.md](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-standards.md)
- [Feature-Sliced Design](https://feature-sliced.design/) — single-responsibility per file, segment pattern (`ui/`, `api/`, `model/`, `lib/`), unidirectional layer dependency
  - [The Perfect Folder Structure for Scalable Frontend](https://feature-sliced.design/blog/frontend-folder-structure)
- [Colocation pattern — React Handbook](https://reacthandbook.dev/project-standards)
- [Robin Wieruch — React Folder Structure Best Practices](https://www.robinwieruch.de/react-folder-structure/)
- [How Many Lines Until Refactor a React Component (Medium)](https://medium.com/geekculture/how-many-lines-of-code-until-i-need-to-refactor-a-react-component-c1b8d16f5a5b) — industry consensus on file size
