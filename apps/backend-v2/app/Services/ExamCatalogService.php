<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ExamSessionStatus;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Profile;
use App\Services\Contracts\ExamCatalogInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection as SupportCollection;

final class ExamCatalogService implements ExamCatalogInterface
{
    /**
     * @param  array{q?: string, status?: string, sort?: string}  $filters
     */
    public function listForProfile(Profile $profile, array $filters = [], int $perPage = 12): LengthAwarePaginator
    {
        $query = Exam::query()
            ->where('is_published', true)
            ->whereHas('versions', fn ($q) => $q->where('is_active', true))
            ->withCount(['sessions as attempts_count' => fn ($q) => $q->whereIn('status', ExamSessionStatus::countableValues())]);

        $this->applySearch($query, $filters['q'] ?? null);
        $this->applyStatusFilter($query, $profile, $filters['status'] ?? null);
        $this->applySort($query, $filters['sort'] ?? 'newest');

        $paginator = $query->paginate($perPage);
        $exams = $paginator->getCollection();

        if ($exams->isEmpty()) {
            return $paginator;
        }

        $sessionsByExamId = $this->profileSessions($profile, $exams->pluck('id')->all())
            ->groupBy(fn (ExamSession $session): ?string => $session->examVersion?->exam_id);

        foreach ($exams as $exam) {
            $exam->setAttribute('user_state', $this->stateForExam($sessionsByExamId->get($exam->id)));
        }

        return $paginator;
    }

    private function applySearch(Builder $query, ?string $search): void
    {
        if ($search === null || $search === '') {
            return;
        }

        $query->where(function (Builder $q) use ($search): void {
            $q->where('title', 'ilike', "%{$search}%")
                ->orWhere('source_school', 'ilike', "%{$search}%");
        });
    }

    private function applyStatusFilter(Builder $query, Profile $profile, ?string $status): void
    {
        if ($status === null || $status === 'all') {
            return;
        }

        $activeSession = fn (Builder $q) => $q
            ->where('profile_id', $profile->id)
            ->where('status', ExamSessionStatus::Active->value)
            ->where('server_deadline_at', '>', now());

        $countableSession = fn (Builder $q) => $q
            ->where('profile_id', $profile->id)
            ->whereIn('status', ExamSessionStatus::countableValues());

        match ($status) {
            'in_progress' => $query->whereHas('sessions', $activeSession),
            'submitted' => $query
                ->whereDoesntHave('sessions', $activeSession)
                ->whereHas('sessions', $countableSession),
            'not_started' => $query
                ->whereDoesntHave('sessions', $activeSession)
                ->whereDoesntHave('sessions', $countableSession),
            default => null,
        };
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'popular' => $query->orderByDesc('attempts_count')->orderByDesc('created_at'),
            default => $query->orderByDesc('created_at'),
        };
    }

    private function profileSessions(Profile $profile, array $examIds): Collection
    {
        return ExamSession::query()
            ->with('examVersion:id,exam_id')
            ->where('profile_id', $profile->id)
            ->whereHas('examVersion', fn ($q) => $q->whereIn('exam_id', $examIds))
            ->orderByDesc('started_at')
            ->get(['id', 'exam_version_id', 'status', 'selected_skills', 'server_deadline_at', 'submitted_at', 'started_at']);
    }

    private function stateForExam(?SupportCollection $sessions): array
    {
        if ($sessions === null || $sessions->isEmpty()) {
            return $this->notStartedState();
        }

        $active = $sessions->first(
            fn (ExamSession $session): bool => $session->status === ExamSessionStatus::Active
                && $session->server_deadline_at > now()
        );

        if ($active instanceof ExamSession) {
            return [
                'status' => 'in_progress',
                'status_label' => 'Đang làm dở',
                'status_tone' => 'warning',
                'primary_action' => 'continue',
                'primary_action_label' => 'Tiếp tục',
                'active_session_id' => $active->id,
                'deadline_at' => $active->server_deadline_at,
                'selected_skills' => $active->selected_skills,
                'progress_label' => count($active->selected_skills).'/4 kỹ năng',
                'session_count' => 0,
            ];
        }

        $countable = $sessions->filter(
            fn (ExamSession $session): bool => in_array($session->status, ExamSessionStatus::countableStatuses(), true)
        );

        if ($countable->isEmpty()) {
            return $this->notStartedState();
        }

        $count = $countable->count();

        return [
            'status' => 'submitted',
            'status_label' => "Đã làm {$count} lần",
            'status_tone' => 'primary',
            'primary_action' => 'restart',
            'primary_action_label' => 'Làm lại',
            'active_session_id' => null,
            'deadline_at' => null,
            'selected_skills' => null,
            'progress_label' => null,
            'session_count' => $count,
        ];
    }

    private function notStartedState(): array
    {
        return [
            'status' => 'not_started',
            'status_label' => 'Chưa bắt đầu',
            'status_tone' => 'success',
            'primary_action' => 'start',
            'primary_action_label' => 'Bắt đầu',
            'active_session_id' => null,
            'deadline_at' => null,
            'selected_skills' => null,
            'progress_label' => null,
            'session_count' => 0,
        ];
    }
}
