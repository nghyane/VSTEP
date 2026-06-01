# Decision Record — Profile Learning Target Policy

## Mục đích

Ghi lại quyết định về quan hệ giữa tài khoản, hồ sơ học tập và mục tiêu học để thống nhất backend, frontend, mobile, báo cáo và demo bảo vệ.

## Quyết định

### 1. Một profile là một mục tiêu/lộ trình học độc lập

```text
1 User → nhiều Profile
1 Profile = 1 target level + 1 target deadline + 1 learning history
```

Profile là đơn vị gắn với tiến trình học, lịch sử luyện tập, kết quả thi thử, gợi ý học tập, ví/xu và enrollment liên quan. Vì vậy không đổi nghĩa của profile sau khi đã có dữ liệu học tập.

### 2. `target_level` là immutable

Sau khi tạo profile, không cho đổi `target_level`.

Nếu học viên muốn đổi mục tiêu từ B1 sang B2/C1 hoặc ngược lại, tạo profile mới để tách dữ liệu học tập.

### 3. `entry_level` là immutable

`entry_level` là baseline ban đầu dùng để gợi ý lộ trình và deadline tối thiểu. Không cho sửa sau khi tạo profile để tránh làm sai ngữ cảnh của dữ liệu học tập đã phát sinh.

### 4. Deadline chỉ được gia hạn

Cho phép dời `target_deadline` xa hơn khi kế hoạch thi thay đổi.

Không cho rút ngắn deadline vì việc này có thể làm sai các tính toán kế hoạch học, nhịp học và diễn giải tiến độ đã có.

### 5. Giới hạn số profile là cấu hình hệ thống

Giới hạn số profile mỗi account được đọc từ system config:

```text
profile.max_profiles_per_account
```

Giá trị mặc định hiện tại là `5`. Admin có thể chỉnh qua system config để phù hợp chính sách sản phẩm.

## Lý do

- Tránh trộn dữ liệu của nhiều mục tiêu học khác nhau vào cùng một profile.
- Dễ giải thích trong bảo vệ: mỗi profile là một learning plan độc lập.
- Giữ biểu đồ tiến độ, learning path, exam history và course/enrollment có ngữ cảnh rõ ràng.
- Ít rủi ro hơn so với cho đổi mục tiêu nhưng không snapshot/recompute toàn bộ dữ liệu liên quan.

## Cách trình bày khi bảo vệ

Nên nói:

```text
Hồ sơ học tập là một lộ trình độc lập. Nếu học viên đổi mục tiêu lớn, hệ thống tạo hồ sơ mới để không làm nhiễu dữ liệu tiến độ cũ.
```

Không nên nói:

```text
Người học có thể đổi mục tiêu bất kỳ lúc nào trên cùng một hồ sơ và toàn bộ dữ liệu vẫn tương đương.
```

## Implementation reference

- Backend validation: `apps/backend-v2/app/Http/Requests/Profile/UpdateProfileRequest.php`
- Backend service rule: `apps/backend-v2/app/Services/ProfileService.php`
- Profile limit config: `apps/backend-v2/app/Services/ProfileConfigService.php`
- Learner UI: `apps/frontend-v3/src/routes/_app/ho-so.tsx`
- Mobile UI: `apps/mobile-v2/src/features/profile/EditProfileSheet.tsx`
