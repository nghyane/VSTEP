<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ExamSessionStatus;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\Profile;
use App\Services\Contracts\ExamOverviewInterface;
use App\Services\Contracts\ExamSessionExpiryInterface;
use Illuminate\Support\Collection;

final class ExamOverviewService implements ExamOverviewInterface
{
    public function __construct(
        private readonly EconomyConfigService $economyConfig,
        private readonly ExamScoringService $scoringService,
        private readonly ExamSessionExpiryInterface $expiry,
    ) {}

    public function show(Profile $profile, string $examId): array
    {
        $this->expiry->forceSubmitExpired($profile);

        /** @var Exam $exam */
        $exam = Exam::query()
            ->where('is_published', true)
            ->findOrFail($examId);

        $version = $exam->activeVersion();
        if ($version === null) {
            abort(404, 'Đề thi chưa có phiên bản hoạt động.');
        }

        $version->load([
            'listeningSections.items',
            'readingPassages.items',
            'writingTasks',
            'speakingParts',
        ]);

        $sessions = $this->profileSessions($profile, $exam->id);
        $activeSession = $this->activeSession($sessions);
        $activeCurrentVersionSession = $this->activeSession($sessions->where('exam_version_id', $version->id));

        return [
            'exam' => $this->formatExam($exam),
            'version' => $this->formatVersion($version),
            'skill_summaries' => $this->skillSummaries($version),
            'pricing' => [
                'full_test_cost_coins' => $this->economyConfig->examFullTestCost(),
                'custom_per_skill_coins' => $this->economyConfig->examCustomPerSkillCost(),
            ],
            'attempt_state' => [
                'active_session' => $activeSession === null ? null : $this->formatSession($activeSession),
                'active_current_version_session' => $activeCurrentVersionSession === null
                    ? null
                    : $this->formatSession($activeCurrentVersionSession),
                'history' => $sessions
                    ->filter(fn (ExamSession $session): bool => in_array($session->status, ExamSessionStatus::terminalStatuses(), true))
                    ->map(fn (ExamSession $session): array => $this->formatSession($session))
                    ->values()
                    ->all(),
            ],
        ];
    }

    /** @return Collection<int, ExamSession> */
    private function profileSessions(Profile $profile, string $examId): Collection
    {
        return ExamSession::query()
            ->with('examVersion:id,exam_id')
            ->where('profile_id', $profile->id)
            ->whereHas('examVersion', fn ($query) => $query->where('exam_id', $examId))
            ->orderByDesc('started_at')
            ->get();
    }

    /** @param  Collection<int, ExamSession>  $sessions */
    private function activeSession(Collection $sessions): ?ExamSession
    {
        return $sessions->first(
            fn (ExamSession $session): bool => $session->status === ExamSessionStatus::Active
                && $session->server_deadline_at->isFuture()
        );
    }

    /** @return array<string, mixed> */
    private function formatExam(Exam $exam): array
    {
        return [
            'id' => $exam->id,
            'slug' => $exam->slug,
            'title' => $exam->title,
            'source_school' => $exam->source_school,
            'tags' => $exam->tags,
            'total_duration_minutes' => $exam->total_duration_minutes,
            'is_published' => $exam->is_published,
            'created_at' => $exam->created_at,
            'updated_at' => $exam->updated_at,
        ];
    }

    /** @return array<string, mixed> */
    private function formatVersion(ExamVersion $version): array
    {
        return [
            'id' => $version->id,
            'version_number' => $version->version_number,
            'is_active' => $version->is_active,
            'published_at' => $version->published_at,
        ];
    }

    /** @return array<string, array<string, mixed>> */
    private function skillSummaries(ExamVersion $version): array
    {
        return [
            'listening' => [
                'skill' => 'listening',
                'duration_minutes' => (int) $version->listeningSections->sum('duration_minutes'),
                'item_count' => (int) $version->listeningSections->sum(fn ($section) => $section->items->count()),
                'part_count' => $version->listeningSections->pluck('part')->unique()->count(),
            ],
            'reading' => [
                'skill' => 'reading',
                'duration_minutes' => (int) $version->readingPassages->sum('duration_minutes'),
                'item_count' => (int) $version->readingPassages->sum(fn ($passage) => $passage->items->count()),
                'part_count' => $version->readingPassages->count(),
            ],
            'writing' => [
                'skill' => 'writing',
                'duration_minutes' => (int) $version->writingTasks->sum('duration_minutes'),
                'item_count' => $version->writingTasks->count(),
                'part_count' => $version->writingTasks->count(),
            ],
            'speaking' => [
                'skill' => 'speaking',
                'duration_minutes' => (int) $version->speakingParts->sum('duration_minutes'),
                'item_count' => $version->speakingParts->count(),
                'part_count' => $version->speakingParts->count(),
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function formatSession(ExamSession $session): array
    {
        $scores = $session->status->isTerminal()
            ? $this->scoringService->getSessionScores($session)
            : null;
        $resultSummary = $scores === null
            ? null
            : $this->scoringService->sessionScoreSummary($session, $scores);

        return [
            'id' => $session->id,
            'exam_id' => $session->examVersion?->exam_id,
            'exam_version_id' => $session->exam_version_id,
            'mode' => $session->mode,
            'selected_skills' => $session->selected_skills,
            'is_full_test' => $session->is_full_test,
            'status' => $session->status,
            'started_at' => $session->started_at,
            'submitted_at' => $session->submitted_at,
            'server_deadline_at' => $session->server_deadline_at,
            'scores' => $scores,
            'result_summary' => $resultSummary,
        ];
    }
}
