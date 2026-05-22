<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DeactivateUserRequest;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\Admin\AdminUserResource;
use App\Models\CourseEnrollment;
use App\Models\Profile;
use App\Models\User;
use App\Services\Admin\AdminUserService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Request;

final class UserController extends Controller
{
    public function __construct(private readonly AdminUserService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $q = $request->string('q')->toString() ?: null;
        $role = $request->string('role')->toString() ?: null;
        $perPage = min(100, max(1, (int) $request->integer('per_page', 20)));

        return AdminUserResource::collection($this->service->list($q, $role)->paginate($perPage));
    }

    public function show(string $id): AdminUserResource
    {
        $user = $this->service->show($id);
        if ($user->role === Role::Teacher) {
            // Gắn collection lên model như virtual attr để Resource đọc qua
            // $this->when() — tránh response shape khác biệt giữa show/list.
            $user->setAttribute('active_courses', $this->service->activeCoursesOf($user)->values());
        }

        return new AdminUserResource($user);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->service->create($request->validated());

        return (new AdminUserResource($user))->response()->setStatusCode(201);
    }

    public function update(UpdateUserRequest $request, string $id): AdminUserResource
    {
        $user = $this->service->show($id);
        $this->service->update($user, $request->validated());

        return new AdminUserResource($user);
    }

    public function deactivate(DeactivateUserRequest $request, string $id): JsonResponse
    {
        $target = $this->service->show($id);
        /** @var User $actor */
        $actor = $request->user();
        /** @var list<array{course_id:string,new_teacher_id:string}> $reassignments */
        $reassignments = $request->input('reassignments', []);
        $this->service->deactivate($actor, $target, $reassignments);

        return response()->json(['data' => ['success' => true]]);
    }

    public function activate(string $id): JsonResponse
    {
        $target = $this->service->show($id);
        $this->service->activate($target);

        return response()->json(['data' => ['success' => true]]);
    }

    public function resetPassword(string $id): JsonResponse
    {
        $target = $this->service->show($id);
        $newPassword = $this->service->resetPassword($target);

        return response()->json(['data' => ['new_password' => $newPassword]]);
    }

    public function teacherActiveCourses(string $id): JsonResponse
    {
        $target = $this->service->show($id);
        if ($target->role !== Role::Teacher) {
            return response()->json(['data' => []]);
        }

        return response()->json(['data' => $this->service->activeCoursesOf($target)->values()]);
    }

    /**
     * Picker dropdown — danh sách giáo viên để gán vào course/slot.
     * Trả tối thiểu để tránh leak PII.
     */
    public function teachers(): JsonResponse
    {
        $teachers = User::query()
            ->where('role', Role::Teacher->value)
            ->whereNull('deactivated_at')
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
            ->whereNull('deactivated_at')
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

        /** @var Collection<int, User> $users */
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
