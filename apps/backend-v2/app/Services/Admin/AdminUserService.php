<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\Role;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Quản trị users theo policy:
 *  - Hard delete bị chặn → chỉ deactivate/activate.
 *  - Teacher có khóa active (end_date >= today) phải reassign trước khi deactivate.
 *  - Admin không tự deactivate chính mình (tránh khoá hệ thống).
 *  - Role chỉ set lúc create, không update.
 *  - Reset password trả về plain text 1 lần — chưa có email/SMS.
 */
final class AdminUserService
{
    /**
     * Builder để admin list users — controller chịu trách nhiệm paginate.
     * Convention thống nhất với AdminCourseService::list.
     */
    public function list(?string $q, ?string $role): Builder
    {
        $query = User::query()
            ->select(['id', 'email', 'full_name', 'role', 'avatar_key', 'title', 'bio', 'deactivated_at', 'created_at']);

        if ($role !== null && Role::tryFrom($role) !== null) {
            $query->where('role', $role);
        }

        if ($q !== null && $q !== '') {
            $like = '%'.$q.'%';
            $query->where(function (Builder $b) use ($like, $q): void {
                $b->where('email', 'ilike', $like)
                    ->orWhere('full_name', 'ilike', $like);
                if (filter_var($q, FILTER_VALIDATE_EMAIL) !== false) {
                    $b->orWhere('email', $q);
                }
            });
        }

        return $query->orderByDesc('created_at');
    }

    public function show(string $id): User
    {
        return User::query()->findOrFail($id);
    }

    /**
     * @param  array{email:string, password:string, role:string, full_name?:?string, title?:?string, bio?:?string}  $input
     */
    public function create(array $input): User
    {
        return User::create([
            'email' => $input['email'],
            'password' => $input['password'], // model cast 'hashed'
            'role' => $input['role'],
            'full_name' => $input['full_name'] ?? null,
            'title' => $input['title'] ?? null,
            'bio' => $input['bio'] ?? null,
            'email_verified_at' => now(),
        ]);
    }

    /**
     * Update info — không đụng email/role/password.
     *
     * @param  array<string, mixed>  $input
     */
    public function update(User $user, array $input): User
    {
        $user->fill(array_intersect_key($input, array_flip(['full_name', 'title', 'bio', 'avatar_key'])));
        $user->save();

        return $user;
    }

    /**
     * Activate: clear deactivated_at.
     */
    public function activate(User $target): void
    {
        if ($target->deactivated_at === null) {
            return;
        }
        $target->deactivated_at = null;
        $target->save();
    }

    /**
     * Deactivate với reassign teacher cho course active.
     *
     * @param  list<array{course_id:string,new_teacher_id:string}>  $reassignments
     */
    public function deactivate(User $actor, User $target, array $reassignments): void
    {
        if ($actor->id === $target->id) {
            throw ValidationException::withMessages([
                'user' => ['Không thể vô hiệu hoá tài khoản của chính bạn.'],
            ]);
        }

        if ($target->isDeactivated()) {
            return;
        }

        if ($target->role === Role::Teacher) {
            $this->deactivateTeacher($target, $reassignments);

            return;
        }

        $target->deactivated_at = now();
        $target->save();
    }

    /**
     * Trả về list khóa active mà teacher đang phụ trách.
     * Course active = end_date >= today.
     *
     * @return Collection<int, Course>
     */
    public function activeCoursesOf(User $teacher): Collection
    {
        return Course::query()
            ->where('teacher_id', $teacher->id)
            ->whereDate('end_date', '>=', now()->toDateString())
            ->orderBy('end_date')
            ->get(['id', 'title', 'slug', 'start_date', 'end_date']);
    }

    /**
     * Generate password mới (16 ký tự), set vào user, return plain text.
     * Caller chịu trách nhiệm hiện 1 lần và không log.
     */
    public function resetPassword(User $target): string
    {
        $plain = Str::password(length: 16, letters: true, numbers: true, symbols: false, spaces: false);
        $target->password = $plain; // cast 'hashed'
        $target->save();

        return $plain;
    }

    /**
     * @param  list<array{course_id:string,new_teacher_id:string}>  $reassignments
     */
    private function deactivateTeacher(User $teacher, array $reassignments): void
    {
        $activeCourses = $this->activeCoursesOf($teacher);

        if ($activeCourses->isNotEmpty()) {
            $providedCourseIds = array_column($reassignments, 'course_id');
            $missing = $activeCourses->pluck('id')->diff($providedCourseIds)->values();

            if ($missing->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'reassignments' => [
                        'Cần chuyển '.$missing->count().' khóa đang chạy sang giáo viên khác trước khi vô hiệu hoá.',
                    ],
                ])->status(422);
            }

            // Validate new teachers tồn tại, role=teacher, không bị deactivate, khác teacher đang xóa.
            $newTeacherIds = collect($reassignments)->pluck('new_teacher_id')->unique()->values();
            $validNewTeachers = User::query()
                ->whereIn('id', $newTeacherIds)
                ->where('role', Role::Teacher->value)
                ->whereNull('deactivated_at')
                ->where('id', '!=', $teacher->id)
                ->pluck('id')
                ->all();

            $invalid = $newTeacherIds->diff($validNewTeachers);
            if ($invalid->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'reassignments' => ['Một số giáo viên mới không hợp lệ (đã bị khoá hoặc không phải giáo viên).'],
                ])->status(422);
            }
        }

        DB::transaction(function () use ($teacher, $reassignments): void {
            foreach ($reassignments as $r) {
                Course::query()
                    ->where('id', $r['course_id'])
                    ->where('teacher_id', $teacher->id)
                    ->update(['teacher_id' => $r['new_teacher_id']]);
            }
            $teacher->deactivated_at = now();
            $teacher->save();
        });
    }
}
