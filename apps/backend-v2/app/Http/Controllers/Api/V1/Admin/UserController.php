<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\CourseEnrollment;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Picker dropdown — danh sách giáo viên để gán vào course/slot.
     * Trả tối thiểu để tránh leak PII.
     */
    public function teachers(): JsonResponse
    {
        $teachers = User::query()
            ->where('role', Role::Teacher->value)
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'email']);

        return response()->json(['data' => $teachers]);
    }

    /**
     * Picker để admin tìm học viên thêm vào khóa.
     * - Trả về list user (role=learner) kèm danh sách profile của họ.
     *   1 user có thể có nhiều profile → group theo user để giảm noise.
     * - Yêu cầu q ≥ 2 ký tự (BE-side guard); ngắn hơn → trả mảng rỗng.
     * - Nếu q là email hợp lệ → exact match (btree fast path), không ILIKE.
     * - Còn lại → ILIKE %q% trên email + full_name + nickname (đã có GIN trgm
     *   index, scale 1M+ rows).
     * - course_id (optional) → đánh dấu `is_enrolled` từng profile để FE
     *   disable dòng đã ghi danh.
     */
    public function searchProfiles(Request $request): JsonResponse
    {
        $q = trim((string) $request->string('q'));
        $courseId = $request->string('course_id')->toString() ?: null;

        if (mb_strlen($q) < 2) {
            return response()->json(['data' => []]);
        }

        $userQuery = User::query()
            ->where('role', Role::Learner->value)
            ->orderBy('full_name')
            ->limit(20);

        $isEmail = filter_var($q, FILTER_VALIDATE_EMAIL) !== false;
        if ($isEmail) {
            // Exact match — dùng btree index trên users.email (unique).
            $userQuery->where('email', $q);
        } else {
            $like = '%'.$q.'%';
            $userQuery->where(function ($b) use ($like) {
                $b->where('email', 'ilike', $like)
                    ->orWhere('full_name', 'ilike', $like)
                    ->orWhereHas('profiles', fn ($p) => $p->where('nickname', 'ilike', $like));
            });
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, User> $users */
        $users = $userQuery->get(['id', 'full_name', 'email']);

        if ($users->isEmpty()) {
            return response()->json(['data' => []]);
        }

        $profiles = Profile::query()
            ->whereIn('account_id', $users->pluck('id'))
            ->orderBy('account_id')
            ->orderByDesc('updated_at')
            ->get(['id', 'account_id', 'nickname', 'target_level', 'target_deadline']);

        $enrolledSet = [];
        if ($courseId !== null && $profiles->isNotEmpty()) {
            $enrolledSet = array_flip(
                CourseEnrollment::query()
                    ->where('course_id', $courseId)
                    ->whereIn('profile_id', $profiles->pluck('id'))
                    ->pluck('profile_id')
                    ->all()
            );
        }

        $profilesByAccount = $profiles->groupBy('account_id');

        $data = $users->map(function (User $u) use ($profilesByAccount, $enrolledSet) {
            $userProfiles = $profilesByAccount[$u->id] ?? collect();
            // Domain centric profile: tên hiển thị ưu tiên users.full_name (Google
            // login mới có), fallback nickname profile đầu. Register email/password
            // không bắt full_name → luôn cần fallback này.
            $displayName = $u->full_name ?: ($userProfiles->first()?->nickname);

            return [
                'id' => $u->id,
                'display_name' => $displayName,
                'email' => $u->email,
                'profiles' => $userProfiles
                    ->map(fn (Profile $p) => [
                        'id' => $p->id,
                        'nickname' => $p->nickname,
                        'target_level' => $p->target_level,
                        'target_deadline' => $p->target_deadline,
                        'is_enrolled' => isset($enrolledSet[$p->id]),
                    ])
                    ->values(),
            ];
        })->values();

        return response()->json(['data' => $data]);
    }
}
