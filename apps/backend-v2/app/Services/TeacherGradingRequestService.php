<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Enums\AssessmentSourceType;
use App\Enums\AdminNotificationType;
use App\Enums\CoinTransactionType;
use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Enums\Role;
use App\Enums\TeacherGradingRequestStatus;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentResult;
use App\Models\AssessmentRubric;
use App\Models\Profile;
use App\Models\TeacherGradingRequest;
use App\Models\TeacherGradingResult;
use App\Models\User;
use App\Services\Contracts\TeacherGradingRequestServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class TeacherGradingRequestService implements TeacherGradingRequestServiceInterface
{
    public function __construct(
        private readonly AdminNotificationService $adminNotifications,
        private readonly NotificationService $notifications,
        private readonly EconomyConfigService $economyConfig,
        private readonly WalletService $walletService,
    ) {}

    public function request(Profile $profile, AssessmentAttempt $attempt, ?string $studentNote): TeacherGradingRequest
    {
        $this->authorizeAttemptOwner($profile, $attempt);
        $attempt->loadMissing(['result', 'rubric']);

        if (! $attempt->result instanceof AssessmentResult) {
            throw ValidationException::withMessages([
                'assessment' => ['Submission must be scored before requesting teacher grading.'],
            ]);
        }

        $cost = $this->economyConfig->teacherGradingRequestCost();
        $charged = false;

        $request = DB::transaction(function () use ($profile, $attempt, $studentNote, $cost, &$charged): TeacherGradingRequest {
            $request = TeacherGradingRequest::query()->createOrFirst(
                ['attempt_id' => $attempt->id],
                [
                    'profile_id' => $profile->id,
                    'status' => TeacherGradingRequestStatus::PendingAssignment,
                    'student_note' => $this->nullableTrim($studentNote),
                    'requested_at' => now(),
                ],
            );

            if (! $request->wasRecentlyCreated) {
                return $request;
            }

            $this->walletService->spend(
                $profile,
                $cost,
                CoinTransactionType::TeacherGrading,
                $request,
                [
                    'attempt_id' => $attempt->id,
                    'skill' => $attempt->skill->value,
                    'source_type' => $attempt->source_type->value,
                    'source_id' => $attempt->source_id,
                ],
            );

            $charged = true;

            return $request->refresh();
        });

        if ($charged) {
            $this->notifyStaffRequestCreated($request);
        }

        $request->setAttribute('cost_coins', $cost);
        $request->setAttribute('charged', $charged);

        return $this->loadForResource($request);
    }

    public function showForLearner(Profile $profile, AssessmentAttempt $attempt): ?TeacherGradingRequest
    {
        $this->authorizeAttemptOwner($profile, $attempt);

        $request = TeacherGradingRequest::query()
            ->where('attempt_id', $attempt->id)
            ->first();

        return $request instanceof TeacherGradingRequest ? $this->loadForResource($request) : null;
    }

    public function listForStaff(array $filters, int $perPage): LengthAwarePaginator
    {
        return $this->baseQuery()
            ->when(
                $filters['status'] ?? null,
                fn (Builder $query, string $status) => $query->where('status', $status),
            )
            ->when(
                $filters['teacher_id'] ?? null,
                fn (Builder $query, string $teacherId) => $query->where('assigned_teacher_id', $teacherId),
            )
            ->when(
                $filters['skill'] ?? null,
                fn (Builder $query, string $skill) => $query->whereHas('attempt', fn (Builder $attempt) => $attempt->where('skill', $skill)),
            )
            ->orderByDesc('priority')
            ->orderBy('status')
            ->orderBy('requested_at')
            ->paginate($perPage);
    }

    public function showForStaff(string $requestId): TeacherGradingRequest
    {
        return $this->loadForResource(TeacherGradingRequest::query()->findOrFail($requestId));
    }

    public function assign(
        string $requestId,
        string $teacherId,
        User $staff,
        ?string $staffNote,
        ?string $dueAt,
        ?int $priority,
    ): TeacherGradingRequest {
        $teacher = $this->activeTeacher($teacherId);

        $request = DB::transaction(function () use ($requestId, $teacher, $staff, $staffNote, $dueAt, $priority): TeacherGradingRequest {
            $request = TeacherGradingRequest::query()->lockForUpdate()->findOrFail($requestId);

            if (in_array($request->status, [
                TeacherGradingRequestStatus::Completed,
                TeacherGradingRequestStatus::Cancelled,
                TeacherGradingRequestStatus::Rejected,
            ], true)) {
                throw ValidationException::withMessages([
                    'request' => ['Only open grading requests can be assigned.'],
                ]);
            }

            $request->update([
                'status' => TeacherGradingRequestStatus::Assigned,
                'assigned_teacher_id' => $teacher->id,
                'assigned_by' => $staff->id,
                'staff_note' => $this->nullableTrim($staffNote),
                'due_at' => $dueAt,
                'priority' => $priority ?? $request->priority,
                'assigned_at' => now(),
                'started_at' => null,
            ]);

            return $request->refresh();
        });

        $this->notifyTeacherAssigned($request, $teacher);

        return $this->loadForResource($request);
    }

    public function reject(string $requestId, User $staff, ?string $staffNote): TeacherGradingRequest
    {
        $request = DB::transaction(function () use ($requestId, $staff, $staffNote): TeacherGradingRequest {
            $request = TeacherGradingRequest::query()->lockForUpdate()->findOrFail($requestId);

            if ($request->status === TeacherGradingRequestStatus::Completed) {
                throw ValidationException::withMessages([
                    'request' => ['Completed grading requests cannot be rejected.'],
                ]);
            }

            $request->update([
                'status' => TeacherGradingRequestStatus::Rejected,
                'assigned_by' => $staff->id,
                'staff_note' => $this->nullableTrim($staffNote),
                'cancelled_at' => now(),
            ]);

            return $request->refresh();
        });

        return $this->loadForResource($request);
    }

    public function listForTeacher(User $teacher, array $filters, int $perPage): LengthAwarePaginator
    {
        $this->assertTeacher($teacher);

        return $this->baseQuery()
            ->where('assigned_teacher_id', $teacher->id)
            ->when(
                $filters['status'] ?? null,
                fn (Builder $query, string $status) => $query->where('status', $status),
            )
            ->orderByDesc('priority')
            ->orderBy('status')
            ->orderBy('assigned_at')
            ->paginate($perPage);
    }

    public function showForTeacher(User $teacher, string $requestId): TeacherGradingRequest
    {
        $request = $this->loadForResource(TeacherGradingRequest::query()->findOrFail($requestId));
        $this->authorizeTeacherRequest($teacher, $request);

        return $request;
    }

    public function start(User $teacher, string $requestId): TeacherGradingRequest
    {
        $request = DB::transaction(function () use ($teacher, $requestId): TeacherGradingRequest {
            $request = TeacherGradingRequest::query()->lockForUpdate()->findOrFail($requestId);
            $this->authorizeTeacherRequest($teacher, $request);

            if (! in_array($request->status, [TeacherGradingRequestStatus::Assigned, TeacherGradingRequestStatus::InProgress], true)) {
                throw ValidationException::withMessages([
                    'request' => ['Only assigned grading requests can be started.'],
                ]);
            }

            if ($request->status === TeacherGradingRequestStatus::Assigned) {
                $request->update([
                    'status' => TeacherGradingRequestStatus::InProgress,
                    'started_at' => now(),
                ]);
            }

            return $request->refresh();
        });

        return $this->loadForResource($request);
    }

    public function submitResult(
        User $teacher,
        string $requestId,
        array $criterionScores,
        ?array $feedback,
    ): TeacherGradingRequest {
        $request = DB::transaction(function () use ($teacher, $requestId, $criterionScores, $feedback): TeacherGradingRequest {
            $request = TeacherGradingRequest::query()->lockForUpdate()->findOrFail($requestId);
            $this->authorizeTeacherRequest($teacher, $request);

            if (! in_array($request->status, [TeacherGradingRequestStatus::Assigned, TeacherGradingRequestStatus::InProgress], true)) {
                throw ValidationException::withMessages([
                    'request' => ['Only assigned grading requests can be submitted.'],
                ]);
            }

            $request->loadMissing(['attempt.rubric', 'attempt.result']);
            $attempt = $request->attempt;
            $rubric = $attempt->rubric;
            $scores = $this->normalizeCriterionScores($rubric, $criterionScores);
            $overallBand = $this->overallBand($scores);
            $trace = $this->calculationTrace($scores, $overallBand);
            $aiResultSnapshot = $attempt->result instanceof AssessmentResult
                ? $this->resultSnapshot($attempt->result)
                : null;

            TeacherGradingResult::create([
                'request_id' => $request->id,
                'attempt_id' => $attempt->id,
                'teacher_id' => $teacher->id,
                'rubric_id' => $rubric->id,
                'criterion_scores' => $scores,
                'overall_band' => $overallBand,
                'feedback' => $feedback,
                'calculation_trace' => $trace,
                'ai_result_snapshot' => $aiResultSnapshot,
                'submitted_at' => now(),
            ]);

            $request->update([
                'status' => TeacherGradingRequestStatus::Completed,
                'started_at' => $request->started_at ?? now(),
                'completed_at' => now(),
            ]);

            return $request->refresh();
        });

        $this->notifyCompleted($request);

        return $this->loadForResource($request);
    }

    private function authorizeAttemptOwner(Profile $profile, AssessmentAttempt $attempt): void
    {
        if ($attempt->profile_id !== $profile->id) {
            abort(403);
        }

        if (! in_array($attempt->source_type, [AssessmentSourceType::Practice, AssessmentSourceType::Exam], true)) {
            throw ValidationException::withMessages([
                'assessment' => ['Unsupported assessment source.'],
            ]);
        }
    }

    private function activeTeacher(string $teacherId): User
    {
        $teacher = User::query()->findOrFail($teacherId);
        $this->assertTeacher($teacher);

        if ($teacher->isDeactivated()) {
            throw ValidationException::withMessages([
                'teacher_id' => ['Teacher account is deactivated.'],
            ]);
        }

        return $teacher;
    }

    private function assertTeacher(User $teacher): void
    {
        if ($teacher->role !== Role::Teacher) {
            throw ValidationException::withMessages([
                'teacher_id' => ['A teacher account is required.'],
            ]);
        }
    }

    private function authorizeTeacherRequest(User $teacher, TeacherGradingRequest $request): void
    {
        $this->assertTeacher($teacher);

        if ($request->assigned_teacher_id !== $teacher->id) {
            abort(403);
        }
    }

    /** @return Builder<TeacherGradingRequest> */
    private function baseQuery(): Builder
    {
        return TeacherGradingRequest::query()
            ->with([
                'attempt.rubric',
                'attempt.result',
                'attempt.evidence',
                'profile.account:id,full_name,email',
                'assignedTeacher:id,full_name,email',
                'assignedBy:id,full_name,email',
                'teacherResult',
            ]);
    }

    private function loadForResource(TeacherGradingRequest $request): TeacherGradingRequest
    {
        return $request->loadMissing([
            'attempt.rubric',
            'attempt.result',
            'attempt.evidence',
            'profile.account:id,full_name,email',
            'assignedTeacher:id,full_name,email',
            'assignedBy:id,full_name,email',
            'teacherResult',
        ]);
    }

    /**
     * @param  list<array{key:string, score:int|float, comment?: string|null}>  $submittedScores
     * @return list<array<string,mixed>>
     */
    private function normalizeCriterionScores(AssessmentRubric $rubric, array $submittedScores): array
    {
        $byKey = collect($submittedScores)->keyBy('key');
        $normalized = [];

        foreach ($rubric->criteria as $criterion) {
            $key = (string) $criterion['key'];
            $submitted = $byKey->get($key);

            if (! is_array($submitted)) {
                throw ValidationException::withMessages([
                    'criterion_scores' => ["Missing score for criterion {$key}."],
                ]);
            }

            $score = (float) $submitted['score'];
            if ($score < 0.0 || $score > 10.0) {
                throw ValidationException::withMessages([
                    'criterion_scores' => ["Criterion {$key} score must be between 0 and 10."],
                ]);
            }

            $entry = [
                'key' => $key,
                'score' => $score,
                'weight' => (float) ($criterion['weight'] ?? 1.0),
            ];

            $comment = $this->nullableTrim($submitted['comment'] ?? null);
            if ($comment !== null) {
                $entry['comment'] = $comment;
            }

            $normalized[] = $entry;
        }

        $validKeys = collect($rubric->criteria)->pluck('key')->map(fn (mixed $key): string => (string) $key)->all();
        $unknownKeys = array_values(array_diff($byKey->keys()->all(), $validKeys));
        if ($unknownKeys !== []) {
            throw ValidationException::withMessages([
                'criterion_scores' => ['Unknown criterion: '.implode(', ', $unknownKeys).'.'],
            ]);
        }

        return $normalized;
    }

    /** @param list<array<string,mixed>> $scores */
    private function overallBand(array $scores): float
    {
        $weightTotal = array_sum(array_map(fn (array $score): float => (float) $score['weight'], $scores));
        if ($weightTotal <= 0.0) {
            throw ValidationException::withMessages([
                'criterion_scores' => ['Total rubric weight must be greater than zero.'],
            ]);
        }

        $weighted = array_sum(array_map(
            fn (array $score): float => (float) $score['score'] * (float) $score['weight'],
            $scores,
        ));

        return round(max(0.0, min(10.0, $weighted / $weightTotal)) * 2) / 2;
    }

    /** @param list<array<string,mixed>> $scores */
    private function calculationTrace(array $scores, float $overallBand): array
    {
        return [
            'source' => 'teacher',
            'formula' => 'teacher_weighted_mean_rounded_half',
            'overall_band' => $overallBand,
            'criteria' => $scores,
        ];
    }

    private function resultSnapshot(AssessmentResult $result): array
    {
        return [
            'id' => $result->id,
            'rubric_id' => $result->rubric_id,
            'criterion_scores' => $result->criterion_scores,
            'overall_band' => $result->overall_band,
            'caps_applied' => $result->caps_applied,
            'calculation_trace' => $result->calculation_trace,
            'feedback' => $result->feedback,
            'source' => 'ai',
        ];
    }

    private function notifyStaffRequestCreated(TeacherGradingRequest $request): void
    {
        $request = $this->loadForResource($request);
        $learnerName = $request->profile->account?->full_name ?: $request->profile->nickname;

        User::query()
            ->whereIn('role', [Role::Staff->value, Role::Admin->value])
            ->whereNull('deactivated_at')
            ->get()
            ->each(fn (User $user) => $this->adminNotifications->push(
                user: $user,
                type: AdminNotificationType::TeacherGradingRequestCreated,
                title: 'Yêu cầu giáo viên chấm mới',
                body: "{$learnerName} vừa yêu cầu giáo viên chấm bài {$request->attempt->skill->value}.",
                iconKey: IconKey::Award,
                payload: [
                    'grading_request_id' => $request->id,
                    'attempt_id' => $request->attempt_id,
                    'route' => "/grading-requests/{$request->id}",
                ],
                dedupKey: "tgr:{$request->id}:created",
            ));
    }

    private function notifyTeacherAssigned(TeacherGradingRequest $request, User $teacher): void
    {
        $request = $this->loadForResource($request);
        $learnerName = $request->profile->account?->full_name ?: $request->profile->nickname;

        $this->adminNotifications->push(
            user: $teacher,
            type: AdminNotificationType::TeacherGradingRequestAssigned,
            title: 'Bạn được gán bài cần chấm',
            body: "Bài {$request->attempt->skill->value} của {$learnerName} đang chờ bạn chấm.",
            iconKey: IconKey::Award,
            payload: [
                'grading_request_id' => $request->id,
                'attempt_id' => $request->attempt_id,
                'route' => "/teacher/grading-requests/{$request->id}",
            ],
            dedupKey: "tgr:{$request->id}:assigned:{$teacher->id}",
        );
    }

    private function notifyCompleted(TeacherGradingRequest $request): void
    {
        $request = $this->loadForResource($request);

        $this->notifications->push(
            profile: $request->profile,
            type: NotificationType::TeacherGradingCompleted,
            title: 'Giáo viên đã chấm xong bài của bạn',
            body: 'Kết quả chấm bởi giáo viên đã sẵn sàng để xem lại.',
            iconKey: IconKey::Award,
            payload: [
                'grading_request_id' => $request->id,
                'attempt_id' => $request->attempt_id,
                'route' => "/grading/assessment/{$request->attempt_id}",
            ],
            dedupKey: "tgr:{$request->id}:completed",
        );
    }

    private function nullableTrim(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
