# VSTEP Mobile — Ứng dụng luyện thi VSTEP trên điện thoại

Ứng dụng di động luyện thi VSTEP dành cho người học, xây dựng bằng **Expo SDK 54 + Expo Router v4 + TypeScript + React Query**. Chỉ hỗ trợ vai trò **learner** — không có chức năng quản trị hay giảng viên.

```
┌──────────────────────┐        REST / JSON         ┌──────────────────────┐
│     Ứng dụng Mobile  │ ◄────────────────────────► │      Backend API     │
│   Expo SDK 54 / RN   │    Bearer JWT (access +    │     (Elysia.js)      │
│   React Native 0.81  │     refresh token)         │                      │
└──────────┬───────────┘                            └──────────────────────┘
           │
           │  expo-secure-store   ┌──────────────────┐
           ├─────────────────────►│  Bộ nhớ bảo mật  │  (token + user JSON)
           │                      └──────────────────┘
           │
           │  @tanstack/react-query v5
           ├─────────────────────►  Bộ nhớ đệm truy vấn (staleTime 5 phút)
           │
           ▼
     Màn hình (Expo Router — định tuyến theo file)
```

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Công nghệ](#công-nghệ)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Hệ thống thiết kế](#hệ-thống-thiết-kế)
- [Màn hình](#màn-hình)
- [Điều hướng](#điều-hướng)
- [Tích hợp API](#tích-hợp-api)
- [Luồng xác thực](#luồng-xác-thực)
- [Luồng dữ liệu](#luồng-dữ-liệu)
- [Lệnh chạy](#lệnh-chạy)
- [Biến môi trường](#biến-môi-trường)
- [Quy ước](#quy-ước)

---

## Tổng quan

Ứng dụng di động là phần mở rộng trên điện thoại của nền tảng luyện thi VSTEP. Ứng dụng:

- Sử dụng **cùng API endpoint** với web frontend — không cần thay đổi backend
- Dùng **cùng TypeScript types** — sao chép từ web, đặt tại `src/types/api.ts`
- Theo **cùng mẫu hooks** — `useExams`, `useProgress`, `useSubmissions`,...
- Dùng **cùng mã màu** — chuyển đổi oklch → hex cho React Native
- Chỉ hỗ trợ **giao diện sáng** (light theme) — cố định trong `app.json` và mã nguồn

### Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| Đăng nhập / Đăng ký | Email + mật khẩu, token lưu trong SecureStore |
| Onboarding | Thiết lập mục tiêu band, thời gian học, thời hạn (4 bước, animation) |
| Trang chủ | Hero, lưới kỹ năng, thống kê nhanh, mục tiêu, nút luyện tập |
| Bài thi | Danh sách đề thi, chi tiết, bắt đầu thi, phiên thi đầy đủ |
| Luyện tập | Chọn kỹ năng, làm bài (8 loại câu hỏi), xem kết quả + chấm bất đồng bộ |
| Tiến độ | Thanh tiến trình kỹ năng, biểu đồ spider, xu hướng, ETA |
| Lớp học | Danh sách lớp, tham gia bằng mã mời, chi tiết lớp + phản hồi giảng viên |
| Hồ sơ | Thông tin cá nhân, đổi mật khẩu, lịch sử bài nộp, đăng xuất |
| Thông báo | Danh sách thông báo, đánh dấu đã đọc, badge đếm chưa đọc |

---

## Công nghệ

| Lớp | Công nghệ | Phiên bản |
|-----|-----------|-----------|
| Framework | Expo SDK | 54.0 |
| Runtime | React Native | 0.81.5 |
| Định tuyến | Expo Router (file-based) | 6.0 (v4 API) |
| Ngôn ngữ | TypeScript (strict) | 5.x |
| Quản lý dữ liệu | @tanstack/react-query | 5.62+ |
| Lưu token | expo-secure-store | 15.0 |
| Icon | @expo/vector-icons (Ionicons) | 15.0 |
| Logo SVG | react-native-svg | 15.12 |
| Tab bar | @react-navigation/bottom-tabs | 7.2.0 |
| Safe area | react-native-safe-area-context | 5.6 |
| Screens | react-native-screens | 4.16 |
| Dev tunnel | @expo/ngrok | 4.1 |

---

## Cấu trúc dự án

```
apps/mobile/
├── app/                              # Expo Router — các trang
│   ├── _layout.tsx                   # Root: providers, auth gate, splash
│   ├── index.tsx                     # Điểm vào — chuyển hướng theo auth
│   │
│   ├── (auth)/                       # Nhóm chưa xác thực
│   │   ├── _layout.tsx               # Stack layout
│   │   ├── login.tsx                 # Đăng nhập (email + mật khẩu)
│   │   └── register.tsx              # Đăng ký (họ tên + email + mật khẩu)
│   │
│   └── (app)/                        # Nhóm đã xác thực
│       ├── _layout.tsx               # Stack chứa tabs + 11 màn hình chi tiết
│       ├── (tabs)/                   # Bottom Tab Navigator (5 tab)
│       │   ├── _layout.tsx           # Cấu hình 5 tab + CustomTabBar
│       │   ├── index.tsx             # Tab 1: Trang chủ
│       │   ├── progress.tsx          # Tab 2: Tiến độ
│       │   ├── exams.tsx             # Tab 3: Bài thi (tab trung tâm)
│       │   ├── classes.tsx           # Tab 4: Lớp học
│       │   └── profile.tsx           # Tab 5: Hồ sơ
│       │
│       ├── onboarding.tsx            # Modal onboarding 4 bước (animation)
│       ├── exam/[id].tsx             # Chi tiết đề thi + nút bắt đầu
│       ├── session/[id].tsx          # Phiên thi (đang làm + đã hoàn thành)
│       ├── skill/[name].tsx          # Chi tiết kỹ năng từ tiến độ
│       ├── submissions/
│       │   ├── index.tsx             # Lịch sử bài nộp
│       │   └── [id].tsx              # Chi tiết bài nộp
│       ├── practice/
│       │   ├── index.tsx             # Chọn kỹ năng luyện tập (4 thẻ)
│       │   ├── [skill].tsx           # Làm bài luyện tập (8 loại câu hỏi)
│       │   └── result/[id].tsx       # Kết quả luyện tập + polling chấm W/S
│       └── classes/
│           ├── index.tsx             # Lớp học (stack screen)
│           └── [id].tsx              # Chi tiết lớp + phản hồi
│
├── src/
│   ├── types/
│   │   └── api.ts                    # Tất cả TypeScript types dùng chung (281 dòng)
│   ├── theme/
│   │   ├── colors.ts                 # Bảng màu, spacing, radius, fontSize
│   │   └── index.ts                  # useThemeColors, useSkillColor (chỉ light)
│   ├── lib/
│   │   ├── api.ts                    # API client: auth request + auto refresh 401 + upload
│   │   ├── auth.ts                   # SecureStore: save/get/clear token + user
│   │   └── query-client.ts           # QueryClient (staleTime: 5 phút, retry: 1)
│   ├── hooks/
│   │   ├── use-auth.ts               # AuthContext + useAuth hook
│   │   ├── use-exams.ts              # useExams (filter: type/skill/level), useExamDetail,
│   │   │                             #   useExamSessions, useStartExam
│   │   ├── use-exam-session.ts       # useExamSession, useSaveAnswers,
│   │   │                             #   useAnswerQuestion, useSubmitExam
│   │   ├── use-progress.ts           # useProgress, useSpiderChart, useSkillDetail,
│   │   │                             #   useCreateGoal, useUpdateGoal, useDeleteGoal,
│   │   │                             #   useActivity, useLearningPath
│   │   ├── use-submissions.ts        # useSubmissions (filter), useSubmission,
│   │   │                             #   useCreateSubmission
│   │   ├── use-questions.ts          # useQuestions (filter), useQuestion
│   │   ├── use-user.ts              # useUser, useUpdateUser, useChangePassword
│   │   ├── use-classes.ts           # useClasses, useClassDetail, useJoinClass,
│   │   │                             #   useLeaveClass, useClassFeedback
│   │   ├── use-practice.ts          # usePracticeNext (adaptive), useRefreshPractice,
│   │   │                             #   useUploadAudio
│   │   ├── use-notifications.ts     # useNotifications, useUnreadCount,
│   │   │                             #   useMarkRead, useMarkAllRead
│   │   ├── use-onboarding.ts        # useOnboardingStatus, useSelfAssess,
│   │   │                             #   useStartPlacement, useSkipOnboarding
│   │   └── use-vocabulary.ts        # useVocabularyTopics, useVocabularyTopic,
│   │                                 #   useTopicProgress, useToggleKnown
│   └── components/
│       ├── CustomTabBar.tsx           # Tab bar tuỳ chỉnh với animated border frame
│       ├── Logo.tsx                   # Logo SVG VSTEP (3 kích thước: sm/md/lg)
│       ├── StickyHeader.tsx           # Header cố định với nút thông báo (badge đếm chưa đọc)
│       ├── SpiderChart.tsx            # Biểu đồ mạng nhện SVG (4 kỹ năng)
│       ├── GradientBackground.tsx     # Nền gradient SVG cho màn hình
│       ├── HapticTouchable.tsx        # TouchableOpacity + haptic feedback
│       ├── BouncyScrollView.tsx       # ScrollView với hiệu ứng bounce + spring
│       ├── ScreenWrapper.tsx          # SafeArea wrapper
│       ├── SkillIcon.tsx              # Icon + màu theo kỹ năng
│       ├── ErrorScreen.tsx            # Màn hình lỗi
│       ├── EmptyState.tsx             # Trạng thái rỗng
│       └── LoadingScreen.tsx          # Màn hình loading
│
├── assets/
│   ├── icon.png                      # Icon ứng dụng
│   ├── splash-image.png              # Splash screen
│   └── adaptive-icon.png             # Android adaptive icon
├── app.json                          # Cấu hình Expo
├── tsconfig.json                     # TypeScript config (strict, @/* alias)
├── package.json
└── .env                              # Biến môi trường (EXPO_PUBLIC_API_URL)
```

**Thống kê**: 58 file, ~7.200 dòng mã nguồn.

---

## Hệ thống thiết kế

### Chế độ giao diện

Chỉ hỗ trợ **giao diện sáng** (light theme). Được cố định bằng:
- `app.json` → `"userInterfaceStyle": "light"`
- `useThemeColors()` luôn trả về `colors.light`
- `StatusBar style="dark"`

### Bảng màu

| Token | Giá trị hex | Sử dụng |
|-------|-------------|---------|
| `primary` | `#4F5BD5` | Nút bấm, liên kết, trạng thái active |
| `primaryForeground` | `#FAFAFA` | Chữ trên nền primary |
| `background` | `#FAFBFF` | Nền màn hình |
| `foreground` | `#171723` | Chữ chính |
| `card` | `#FAFBFF` | Bề mặt thẻ (card) |
| `cardForeground` | `#171723` | Chữ trên card |
| `muted` | `#F2F3F7` | Nền phụ |
| `mutedForeground` | `#6C6F7F` | Chữ phụ |
| `secondary` | `#E4E8FA` | Nền secondary |
| `secondaryForeground` | `#3D4A8A` | Chữ secondary |
| `accent` | `#F2F3F7` | Nền accent |
| `accentForeground` | `#171723` | Chữ accent |
| `destructive` | `#E5484D` | Lỗi, xoá |
| `border` | `#E2E4ED` | Đường viền, phân cách |
| `input` | `#E2E4ED` | Viền ô nhập liệu |
| `ring` | `#4F5BD5` | Focus ring |
| `success` | `#30A46C` | Chỉ báo tích cực |
| `successForeground` | `#FAFAFA` | Chữ trên success |
| `warning` | `#E5A700` | Cảnh báo, streak |
| `warningForeground` | `#171723` | Chữ trên warning |

### Màu kỹ năng

| Kỹ năng | Token | Giá trị | Sử dụng |
|---------|-------|---------|---------|
| Listening | `skillListening` | `#4B7BF5` | Icon, badge, thanh tiến trình |
| Reading | `skillReading` | `#34B279` | Icon, badge, thanh tiến trình |
| Writing | `skillWriting` | `#9B59D0` | Icon, badge, thanh tiến trình |
| Speaking | `skillSpeaking` | `#E5A817` | Icon, badge, thanh tiến trình |

Helper `useSkillColor(skill)` trả về màu tương ứng từ `colors.light`.

### Kiểu chữ

- **Font**: Hệ thống mặc định (San Francisco trên iOS, Roboto trên Android)
- Không dùng font tuỳ chỉnh (file `.woff2` không tương thích RN — cần `.ttf`/`.otf`)

| Token | Kích thước (px) |
|-------|----------------|
| `xs` | 12 |
| `sm` | 14 |
| `base` | 16 |
| `lg` | 18 |
| `xl` | 20 |
| `2xl` | 24 |
| `3xl` | 32 |

**Trọng lượng phổ biến**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Khoảng cách (Spacing)

| Token | Giá trị (px) |
|-------|-------------|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `base` | 16 |
| `lg` | 20 |
| `xl` | 24 |
| `2xl` | 32 |
| `3xl` | 48 |

### Bo góc (Radius)

| Token | Giá trị (px) |
|-------|-------------|
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 20 |
| `2xl` | 24 |
| `full` | 9999 |

### Mẫu component

| Mẫu | Cách thực hiện |
|------|----------------|
| Card | `View` với `borderRadius: 16`, `backgroundColor: colors.card`, đổ bóng nhẹ |
| Nút bấm | `TouchableOpacity` với nền primary, bo góc xl, chữ giữa |
| Badge | `View` nhỏ với nền màu kỹ năng opacity 15%, chữ cùng màu |
| Danh sách | `FlatList` hoặc `ScrollView` với item kiểu card |
| Loading | `ActivityIndicator` giữa màn hình, màu primary |
| Trạng thái rỗng | Icon + dòng chữ mô tả, căn giữa |
| Lỗi | `ErrorScreen` với icon cảnh báo + nút thử lại |

---

## Màn hình

### Xác thực

| Màn hình | Route | Dòng mã | Mô tả |
|----------|-------|---------|-------|
| Đăng nhập | `/(auth)/login` | 142 | Form email + mật khẩu, Logo SVG, nút đăng ký |
| Đăng ký | `/(auth)/register` | 156 | Form họ tên + email + mật khẩu, Logo SVG |

### Onboarding (4 bước, modal animation)

Route: `/(app)/onboarding` — 695 dòng. Được mở tự động từ Trang chủ nếu người dùng chưa có mục tiêu.

| Bước | Nội dung | Lựa chọn |
|------|----------|----------|
| 0 | Chào mừng | Logo + lời chào |
| 1 | Band mục tiêu | B1 / **B2** (phổ biến) / C1 → gửi `targetBand` |
| 2 | Thời gian học/ngày | 15 / **30** (gợi ý) / 45 / 60+ phút → gửi `dailyStudyTimeMinutes` |
| 3 | Thời hạn | 3 tháng / **6 tháng** (gợi ý) / 1 năm / Không giới hạn → tính `deadline` |

**Chi tiết kỹ thuật**:
- Animation: slide + fade transitions với `Animated.spring` (damping: 20, stiffness: 200)
- Thanh tiến trình (progress bar) hiển thị bước hiện tại
- Chống spam: `isTransitioning` ref khoá mọi điều hướng trong khi animation
- Gửi dữ liệu: `POST /api/progress/goals` (mới) hoặc `PATCH /api/progress/goals/:id` (cập nhật)
- Sau khi gửi: `await progressQuery.refetch()` → `router.replace("/(app)/(tabs)")`

### Bottom Tabs (5 tab)

| # | Tab | Route | Icon (Ionicons) | Dòng mã | Mô tả |
|---|-----|-------|-----------------|---------|-------|
| 1 | Trang chủ | `/(app)/(tabs)/` | `home` | 249 | Hero, nút luyện tập, lưới 4 kỹ năng, thống kê, mục tiêu |
| 2 | Tiến độ | `/(app)/(tabs)/progress` | `analytics` | 181 | Thanh tiến trình kỹ năng, biểu đồ spider, xu hướng, ETA |
| 3 | **Bài thi** | `/(app)/(tabs)/exams` | `document-text` | 90 | **Tab trung tâm** — danh sách đề thi |
| 4 | Lớp học | `/(app)/(tabs)/classes` | `people` | 243 | Danh sách lớp, tham gia bằng mã mời |
| 5 | Hồ sơ | `/(app)/(tabs)/profile` | `person` | 186 | Thông tin, đổi mật khẩu, link bài nộp + mục tiêu, đăng xuất |

**Tab trung tâm** (index 2 — "Bài thi") được render đặc biệt: hình tròn primary 38×38, đổ bóng (shadow), icon trắng.

> **StickyHeader**: Mọi tab đều sử dụng `StickyHeader` ở đầu màn hình với nút thông báo (icon chuông). Badge đỏ hiển thị số thông báo chưa đọc, tự động cập nhật mỗi 30 giây qua `useUnreadCount` (polling).

### Màn hình chi tiết (Stack)

| Màn hình | Route | Dòng mã | Mô tả |
|----------|-------|---------|-------|
| Chi tiết đề thi | `/(app)/exam/[id]` | 98 | Thông tin đề, phân bổ kỹ năng, nút bắt đầu |
| Phiên thi | `/(app)/session/[id]` | 830 | Render câu hỏi thực, tab kỹ năng, timer, tự lưu 30s, nộp bài |
| Chi tiết kỹ năng | `/(app)/skill/[name]` | 117 | Lịch sử điểm, thống kê, xu hướng từ tiến độ |
| Lịch sử bài nộp | `/(app)/submissions/` | 84 | Danh sách bài nộp |
| Chi tiết bài nộp | `/(app)/submissions/[id]` | 119 | Điểm, phản hồi, câu trả lời |
| Chọn kỹ năng luyện tập | `/(app)/practice/` | 125 | Lưới 4 kỹ năng |
| Làm bài luyện tập | `/(app)/practice/[skill]` | 498 | Render 8 loại câu hỏi |
| Kết quả luyện tập | `/(app)/practice/result/[id]` | 208 | Điểm + polling chấm W/S bất đồng bộ |
| Lớp học (stack) | `/(app)/classes/` | 195 | Stack screen cho lớp học |
| Chi tiết lớp | `/(app)/classes/[id]` | 169 | Danh sách thành viên + phản hồi giảng viên |

### Phiên thi — Chi tiết

File `session/[id].tsx` (830 dòng) là màn hình phức tạp nhất:

- **Render câu hỏi thực**: dùng `useQueries` để fetch tất cả câu hỏi theo ID song song
- **Tab kỹ năng**: Listening / Reading / Writing / Speaking (compact sizing)
- **Theo dõi câu trả lời**: `Record<string, SubmissionAnswer>`
- **Tự động lưu**: mỗi 30 giây qua `useSaveAnswers` với dirty tracking
- **Điều hướng**: Prev / Next question
- **Thanh trên cùng**: timer đếm ngược + trạng thái lưu
- **Xác nhận nộp**: Alert dialog

### Luyện tập — 8 loại nội dung câu hỏi

| Loại nội dung | Kỹ năng | View |
|---------------|---------|------|
| `ListeningContent` | Listening | ObjectiveView (MCQ) |
| `ListeningDictationContent` | Listening | ObjectiveView |
| `ReadingContent` | Reading | ObjectiveView (MCQ) |
| `ReadingTNGContent` | Reading | ObjectiveView |
| `ReadingMatchingContent` | Reading | ObjectiveView |
| `ReadingGapFillContent` | Reading | ObjectiveView |
| `WritingContent` | Writing | WritingView (prompt/essay) |
| `SpeakingPart1/2/3Content` | Speaking | SpeakingView (3 phần) |

Sau khi nộp → `POST /api/submissions` → màn hình kết quả polling chấm bất đồng bộ cho Writing/Speaking.

---

## Điều hướng

### Cây điều hướng

```
Root Stack (_layout.tsx)
│
├── index.tsx ─────────────────── Chuyển hướng theo trạng thái xác thực
│
├── (auth) Stack ─────────────── Chưa đăng nhập
│   ├── login.tsx                  Đăng nhập
│   └── register.tsx               Đăng ký
│
└── (app) Stack ──────────────── Đã đăng nhập
    │
    ├── (tabs) Tab Navigator ──── 5 tab dưới cùng
    │   ├── index.tsx              Tab 1: Trang chủ
    │   ├── progress.tsx           Tab 2: Tiến độ
    │   ├── exams.tsx              Tab 3: Bài thi (trung tâm)
    │   ├── classes.tsx            Tab 4: Lớp học
    │   └── profile.tsx            Tab 5: Hồ sơ
    │
    ├── onboarding.tsx ────────── Modal, gestureEnabled: false
    ├── exam/[id].tsx              Chi tiết đề thi
    ├── session/[id].tsx           Phiên thi
    ├── skill/[name].tsx           Chi tiết kỹ năng
    ├── submissions/index.tsx      Lịch sử bài nộp
    ├── submissions/[id].tsx       Chi tiết bài nộp
    ├── practice/index.tsx         Chọn kỹ năng luyện tập
    ├── practice/[skill].tsx       Làm bài luyện tập
    ├── practice/result/[id].tsx   Kết quả luyện tập
    ├── classes/index.tsx          Lớp học (stack)
    └── classes/[id].tsx           Chi tiết lớp
```

### Custom Tab Bar

Component `CustomTabBar` (193 dòng) — tab bar tuỳ chỉnh:

- **Khung viền trượt** (animated border frame): `Animated.spring` di chuyển giữa các tab
  - `damping: 20`, `stiffness: 200`
  - `useNativeDriver: false` (vì animate `left` — layout property)
- **Tab trung tâm** (index 2 — "Bài thi"):
  - Hình tròn 38×38 px, nền `primary`, icon trắng
  - Đổ bóng: iOS `shadowOpacity: 0.25`, Android `elevation: 4`
- **Label**: fontSize 10, fontWeight 600 (700 cho tab trung tâm)
- **Inset**: 4px padding cho khung viền
- **Xử lý safe area**: `paddingBottom: Math.max(insets.bottom, 8)`

---

## Tích hợp API

### URL gốc

```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
```

Khi chạy trên thiết bị thật, dùng IP LAN (ví dụ: `http://192.168.1.102:3000`).

### API Client (`src/lib/api.ts`)

Hai hàm request chính:

| Hàm | Mô tả |
|-----|-------|
| `request<T>(path, options)` | Fetch cơ bản, ném `ApiError` nếu `!res.ok` |
| `authRequest<T>(path, options)` | Tự thêm `Authorization: Bearer`, tự refresh khi 401 |

Đối tượng `api` export 6 phương thức:

```typescript
api.get<T>(path)
api.post<T>(path, body?)
api.put<T>(path, body?)
api.patch<T>(path, body?)
api.delete<T>(path)
api.upload<T>(path, formData)
```

Ngoài ra export 4 hàm không cần auth: `loginApi`, `registerApi`, `logoutApi`, `getMeApi`.

### Bảng endpoint đầy đủ

#### Xác thực

| Phương thức | Endpoint | Hàm / Hook | Màn hình |
|-------------|----------|------------|----------|
| POST | `/api/auth/login` | `loginApi` | Đăng nhập |
| POST | `/api/auth/register` | `registerApi` | Đăng ký |
| POST | `/api/auth/refresh` | `authRequest` (nội bộ) | Tự động |
| POST | `/api/auth/logout` | `logoutApi` | Hồ sơ |
| GET | `/api/auth/me` | `getMeApi` | Khởi động app |

#### Người dùng

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/users/:id` | `useUser` | Hồ sơ |
| PATCH | `/api/users/:id` | `useUpdateUser` | Hồ sơ |
| POST | `/api/users/:id/password` | `useChangePassword` | Hồ sơ |

#### Đề thi

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/exams` | `useExams` | Trang chủ, Bài thi |
| GET | `/api/exams/:id` | `useExamDetail` | Chi tiết đề thi |
| POST | `/api/exams/:id/start` | `useStartExam` | Chi tiết đề thi |

#### Phiên thi

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/exams/sessions/:id` | `useExamSession` | Phiên thi |
| PUT | `/api/exams/sessions/:id` | `useSaveAnswers` | Phiên thi (tự lưu) |
| POST | `/api/exams/sessions/:id/answer` | `useAnswerQuestion` | Phiên thi |
| POST | `/api/exams/sessions/:id/submit` | `useSubmitExam` | Phiên thi |

#### Tiến độ & Mục tiêu

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/progress` | `useProgress` | Trang chủ, Tiến độ |
| GET | `/api/progress/spider-chart` | `useSpiderChart` | Tiến độ |
| GET | `/api/progress/:skill` | `useSkillDetail` | Chi tiết kỹ năng |
| POST | `/api/progress/goals` | `useCreateGoal` | Onboarding |
| PATCH | `/api/progress/goals/:id` | `useUpdateGoal` | Onboarding, Tiến độ |
| DELETE | `/api/progress/goals/:id` | `useDeleteGoal` | Tiến độ |

#### Câu hỏi

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/questions` | `useQuestions` | Luyện tập |
| GET | `/api/questions/:id` | `useQuestion` | Phiên thi, Luyện tập |

#### Bài nộp

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/submissions` | `useSubmissions` | Lịch sử bài nộp |
| GET | `/api/submissions/:id` | `useSubmission` | Chi tiết bài nộp |
| POST | `/api/submissions` | `useCreateSubmission` | Luyện tập |

#### Lớp học

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/classes` | `useClasses` | Lớp học |
| POST | `/api/classes/join` | `useJoinClass` | Lớp học |
| GET | `/api/classes/:id` | `useClassDetail` | Chi tiết lớp |
| POST | `/api/classes/:id/leave` | `useLeaveClass` | Chi tiết lớp |
| GET | `/api/classes/:id/feedback` | `useClassFeedback` | Chi tiết lớp |

#### Thông báo

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/notifications` | `useNotifications` | Thông báo |
| GET | `/api/notifications/unread-count` | `useUnreadCount` | StickyHeader (badge) |
| POST | `/api/notifications/:id/read` | `useMarkRead` | Thông báo |
| POST | `/api/notifications/read-all` | `useMarkAllRead` | Thông báo |

#### Luyện tập (Adaptive)

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/practice/next?skill=&part=` | `usePracticeNext` | Luyện tập |

#### Hoạt động & Lộ trình

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/progress/activity?days=` | `useActivity` | Trang chủ |
| GET | `/api/progress/learning-path` | `useLearningPath` | (Sẵn sàng) |

#### Tải lên

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| POST | `/api/uploads/audio` | `useUploadAudio` | Luyện tập (Nói) |

#### Onboarding

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/onboarding/status` | `useOnboardingStatus` | (Sẵn sàng) |
| POST | `/api/onboarding/self-assess` | `useSelfAssess` | (Sẵn sàng) |
| POST | `/api/onboarding/placement` | `useStartPlacement` | (Sẵn sàng) |
| POST | `/api/onboarding/skip` | `useSkipOnboarding` | (Sẵn sàng) |

#### Từ vựng

| Phương thức | Endpoint | Hook | Màn hình |
|-------------|----------|------|----------|
| GET | `/api/vocabulary/topics` | `useVocabularyTopics` | (Sẵn sàng) |
| GET | `/api/vocabulary/topics/:id` | `useVocabularyTopic` | (Sẵn sàng) |
| GET | `/api/vocabulary/topics/:id/progress` | `useTopicProgress` | (Sẵn sàng) |
| PUT | `/api/vocabulary/words/:id/known` | `useToggleKnown` | (Sẵn sàng) |
---

## Luồng xác thực

### Sơ đồ luồng

```
Khởi động ứng dụng
        │
        ▼
Kiểm tra SecureStore → getStoredUser()
        │
        ├── Có user JSON → setUser(user) → ẩn Splash
        │       │
        │       ▼
        │   useSegments + useEffect theo dõi `user`
        │       │
        │       └── user !== null && ở (auth) → redirect /(app)/(tabs)
        │
        └── Không có → setUser(null) → ẩn Splash
                │
                ▼
            useSegments + useEffect
                │
                └── user === null && không ở (auth) → redirect /(auth)/login
```

### Đăng nhập

```
Nhập email + password
        │
        ▼
loginApi(email, password) → POST /api/auth/login
        │
        ▼
Nhận { user, accessToken, refreshToken, expiresIn }
        │
        ▼
saveTokens(accessToken, refreshToken, user) → SecureStore
        │
        ▼
setUser(user) → auth gate tự chuyển hướng đến /(app)/(tabs)
```

### Đăng xuất

```
Nhấn "Đăng xuất" trên Hồ sơ
        │
        ▼
logoutApi(refreshToken, accessToken) → POST /api/auth/logout
        │
        ▼
clearTokens() → xoá 3 key từ SecureStore
        │
        ▼
setUser(null) + queryClient.clear()
        │
        ▼
Auth gate tự chuyển hướng đến /(auth)/login
```

### Tự động refresh token

```
authRequest gửi request với Bearer token
        │
        ▼
Server trả 401
        │
        ▼
Lấy refreshToken từ SecureStore
        │
        ├── Không có → clearTokens() → ném lỗi 401
        │
        └── Có → POST /api/auth/refresh { refreshToken }
                │
                ├── Thành công → saveTokens(mới) → retry request gốc
                │
                └── Thất bại → clearTokens() → ném lỗi "Session expired"
```

**Lưu ý**: Dùng `refreshPromise` singleton để tránh nhiều request refresh đồng thời.

### Lưu trữ SecureStore

| Key | Giá trị | Mô tả |
|-----|---------|-------|
| `vstep_access_token` | JWT string | Access token hiện tại |
| `vstep_refresh_token` | JWT string | Refresh token |
| `vstep_user` | JSON string | Thông tin user (`AuthUser`) |

---

## Luồng dữ liệu

### Tổng quan

```
Màn hình (Component)
        │
        ▼
Hook tuỳ chỉnh (useExams, useProgress,...)
        │
        ▼
@tanstack/react-query
│  ├── useQuery   → GET request   → cache tự động
│  └── useMutation → POST/PUT/... → invalidateQueries khi thành công
        │
        ▼
API Client (src/lib/api.ts)
│  ├── Thêm Authorization: Bearer header
│  ├── Tự refresh khi gặp 401
│  └── JSON serialization / deserialization
        │
        ▼
Backend REST API (apps/backend)
```

### Cấu hình React Query

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 phút
      retry: 1,                    // thử lại 1 lần khi thất bại
    },
  },
});
```

### Quy ước Query Key

| Query Key | Dữ liệu | Hook |
|-----------|----------|------|
| `["exams"]` | Danh sách đề thi | `useExams` |
| `["exams", params]` | Danh sách đề thi (filter) | `useExams` |
| `["exams", examId]` | Chi tiết đề thi | `useExamDetail` |
| `["exam-sessions", sessionId]` | Phiên thi | `useExamSession` |
| `["exam-sessions", params]` | Danh sách phiên thi | `useExamSessions` |
| `["progress"]` | Tổng quan tiến độ | `useProgress` |
| `["progress", "spider-chart"]` | Biểu đồ spider | `useSpiderChart` |
| `["progress", skill]` | Chi tiết kỹ năng | `useSkillDetail` |
| `["submissions"]` | Danh sách bài nộp | `useSubmissions` |
| `["submissions", params]` | Danh sách (có filter) | `useSubmissions` |
| `["submissions", id]` | Chi tiết bài nộp | `useSubmission` |
| `["users", userId]` | Hồ sơ người dùng | `useUser` |
| `["questions"]` | Câu hỏi (có filter) | `useQuestions` |
| `["questions", id]` | Chi tiết câu hỏi | `useQuestion` |
| `["classes"]` | Danh sách lớp | `useClasses` |
| `["classes", id]` | Chi tiết lớp | `useClassDetail` |
| `["classes", id, "feedback"]` | Phản hồi lớp | `useClassFeedback` |
| `["notifications", page, unreadOnly]` | Danh sách thông báo | `useNotifications` |
| `["notifications-unread"]` | Số thông báo chưa đọc | `useUnreadCount` |
| `["practice-next", skill, part]` | Câu hỏi luyện tập tiếp theo | `usePracticeNext` |
| `["activity", days]` | Hoạt động học tập | `useActivity` |
| `["learning-path"]` | Lộ trình học tập | `useLearningPath` |
| `["onboarding-status"]` | Trạng thái onboarding | `useOnboardingStatus` |
| `["vocabulary-topics", page, limit]` | Danh sách chủ đề từ vựng | `useVocabularyTopics` |
| `["vocabulary-topic", id]` | Chi tiết chủ đề từ vựng | `useVocabularyTopic` |
| `["vocabulary-progress", topicId]` | Tiến độ từ vựng | `useTopicProgress` |

### Invalidation sau mutation

| Mutation | Invalidate |
|----------|------------|
| `useStartExam` | `["exam-sessions"]` |
| `useSubmitExam` | `["exam-sessions", sessionId]`, `["progress"]` |
| `useCreateGoal`, `useUpdateGoal`, `useDeleteGoal` | `["progress"]` |
| `useCreateSubmission` | `["submissions"]`, `["progress"]` |
| `useUpdateUser` | `["users", userId]` |
| `useJoinClass`, `useLeaveClass` | `["classes"]` |
| `useMarkRead`, `useMarkAllRead` | `["notifications"]`, `["notifications-unread"]` |
| `useSelfAssess`, `useSkipOnboarding` | `["onboarding-status"]`, `["progress"]` |
| `useToggleKnown` | `["vocabulary-progress"]` |

---

## Lệnh chạy

```bash
# Di chuyển đến thư mục ứng dụng
cd apps/mobile

# Cài đặt dependencies
npm install

# Khởi động Expo dev server
npx expo start

# Chạy trên thiết bị Android (emulator hoặc thiết bị thật)
npx expo run:android

# Chạy trên iOS simulator (chỉ macOS)
npx expo run:ios

# Kiểm tra TypeScript
npx tsc --noEmit
# hoặc
npm run typecheck

# Kiểm tra ESLint
npx expo lint
# hoặc
npm run lint
```

### Chạy trên thiết bị thật

1. Đảm bảo điện thoại và máy tính cùng mạng WiFi
2. Cập nhật `EXPO_PUBLIC_API_URL` trong `.env` thành IP LAN của máy tính
3. Chạy `npx expo start`
4. Quét mã QR bằng Expo Go (Android) hoặc Camera (iOS)

### Tunnel mode (khi không cùng mạng)

```bash
npx expo start --tunnel
```

Yêu cầu `@expo/ngrok` (đã có trong devDependencies).

---

## Biến môi trường

Tạo file `apps/mobile/.env`:

```bash
# URL backend API — bắt buộc
EXPO_PUBLIC_API_URL=http://192.168.1.102:3000
```

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `EXPO_PUBLIC_API_URL` | URL gốc của backend API | `http://localhost:3000` |

**Lưu ý**:
- Tiền tố `EXPO_PUBLIC_` bắt buộc để Expo expose biến ra client
- Khi dùng emulator Android: `http://10.0.2.2:3000` (alias cho localhost của máy host)
- Khi dùng thiết bị thật: dùng IP LAN thực (ví dụ: `http://192.168.1.102:3000`)
- Khi dùng tunnel: có thể dùng `http://localhost:3000`

---

## Quy ước

### Mã nguồn

- **Giao diện tiếng Việt** — tất cả chuỗi hiển thị cho người dùng bằng tiếng Việt
- **TypeScript strict** — bật `strict: true` trong `tsconfig.json`
- **Path alias** — `@/*` ánh xạ đến `./src/*`
- **Typed routes** — bật `experiments.typedRoutes` trong `app.json`
- **Không sửa backend** — ứng dụng mobile là consumer thuần tuý

### Kiến trúc

- **Expo Router (file-based routing)** — mỗi file trong `app/` là một route
- **Hook pattern** — mỗi domain có hook riêng trong `src/hooks/`
- **Shared types** — tất cả type API tập trung tại `src/types/api.ts`
- **Theme tập trung** — màu, spacing, radius, fontSize trong `src/theme/`
- **Component dùng chung** — Logo, ScreenWrapper, ErrorScreen,... trong `src/components/`

### Quy ước đặt tên

| Loại | Quy ước | Ví dụ |
|------|---------|-------|
| File hook | `use-kebab-case.ts` | `use-exam-session.ts` |
| File component | `PascalCase.tsx` | `CustomTabBar.tsx` |
| File route | `kebab-case.tsx` hoặc `[param].tsx` | `exams.tsx`, `[id].tsx` |
| Hook function | `useCamelCase` | `useExamSession` |
| Type / Interface | `PascalCase` | `ExamSession`, `SkillProgress` |
| Query key | `["kebab-plural", ...params]` | `["exam-sessions", id]` |

### Phụ thuộc

- **Tối thiểu dependencies** — dùng Expo built-ins khi có thể
- **Không thêm dep mới** mà không có sự đồng ý
- **Không có admin/instructor** — chỉ dành cho vai trò learner
- **Tương thích đa nền tảng** — dùng `Platform.select` khi cần, ưu tiên code chung
