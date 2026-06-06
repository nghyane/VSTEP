<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\AssessmentAttempt;
use App\Models\Profile;
use App\Models\TeacherGradingRequest;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TeacherGradingRequestServiceInterface
{
    public function request(Profile $profile, AssessmentAttempt $attempt, ?string $studentNote): TeacherGradingRequest;

    public function showForLearner(Profile $profile, AssessmentAttempt $attempt): ?TeacherGradingRequest;

    /** @param array{status?: string|null, teacher_id?: string|null, skill?: string|null} $filters */
    public function listForStaff(array $filters, int $perPage): LengthAwarePaginator;

    public function showForStaff(string $requestId): TeacherGradingRequest;

    public function assign(
        string $requestId,
        string $teacherId,
        User $staff,
        ?string $staffNote,
        ?string $dueAt,
        ?int $priority,
    ): TeacherGradingRequest;

    public function reject(string $requestId, User $staff, ?string $staffNote): TeacherGradingRequest;

    /** @param array{status?: string|null} $filters */
    public function listForTeacher(User $teacher, array $filters, int $perPage): LengthAwarePaginator;

    public function showForTeacher(User $teacher, string $requestId): TeacherGradingRequest;

    public function start(User $teacher, string $requestId): TeacherGradingRequest;

    /**
     * @param  list<array{key:string, score:int|float, comment?: string|null}>  $criterionScores
     * @param  array<string,mixed>|null  $feedback
     */
    public function submitResult(
        User $teacher,
        string $requestId,
        array $criterionScores,
        ?array $feedback,
    ): TeacherGradingRequest;
}
