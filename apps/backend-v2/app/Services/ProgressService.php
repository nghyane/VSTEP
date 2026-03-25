<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Skill;
use App\Enums\StreakDirection;
use App\Enums\SubmissionStatus;
use App\Models\ExamSession;
use App\Models\Submission;
use App\Models\UserGoal;
use App\Models\UserProgress;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as BaseCollection;

class ProgressService
{
    /**
     * @return array{skills: Collection<int, UserProgress>, goal: UserGoal|null}
     */
    public function overview(string $userId): array
    {
        return [
            'skills' => UserProgress::where('user_id', $userId)->get(),
            'goal' => $this->latestGoal($userId),
        ];
    }

    /**
     * @return array{skills: array<string, array{current: int, trend: string}>, goal: UserGoal|null, eta: array{weeks: null, per_skill: array<string, null>}}
     */
    public function spiderChart(string $userId): array
    {
        $skills = UserProgress::where('user_id', $userId)->get()->keyBy(
            fn (UserProgress $p) => $p->skill->value,
        );

        $allScores = $this->recentScoresBySkill($userId);

        $result = [];
        foreach (Skill::cases() as $skill) {
            $progress = $skills->get($skill->value);
            $scoreValues = $allScores->get($skill->value, collect());
            $result[$skill->value] = [
                'current' => $progress ? $progress->current_level->score() : 0,
                'trend' => $this->computeTrend($scoreValues),
            ];
        }

        $perSkill = collect(Skill::cases())->mapWithKeys(fn ($s) => [$s->value => null])->all();

        return [
            'skills' => $result,
            'goal' => $this->latestGoal($userId),
            'eta' => [
                'weeks' => null,
                'per_skill' => $perSkill,
            ],
        ];
    }

    /**
     * @return array{streak: int, total: int, active_days: list<string>, total_exercises: int, total_study_time_minutes: int}
     */
    public function activity(string $userId, int $days = 30): array
    {
        $since = now()->subDays($days)->startOfDay();

        $sessions = ExamSession::forUser($userId)
            ->where('completed_at', '>=', $since)
            ->get();

        $submissions = Submission::forUser($userId)
            ->completed()
            ->where('created_at', '>=', $since)
            ->get(['created_at']);

        $activeDays = $sessions->pluck('completed_at')
            ->merge($submissions->pluck('created_at'))
            ->map->toDateString()
            ->unique()
            ->sort()
            ->values();

        $streak = $this->computeStreak($activeDays);

        $totalMinutes = $sessions->sum(
            fn ($s) => $s->completed_at?->diffInMinutes($s->started_at) ?? 0,
        );

        return [
            'streak' => $streak,
            'total' => $activeDays->count(),
            'active_days' => $activeDays->all(),
            'total_exercises' => $submissions->count() + $sessions->count(),
            'total_study_time_minutes' => $totalMinutes,
        ];
    }

    /**
     * @return array{progress: UserProgress|null, recent_scores: BaseCollection, trend: string, window_avg: float|null, window_deviation: float|null}
     */
    public function bySkill(string $userId, Skill $skill): array
    {
        $progress = UserProgress::where('user_id', $userId)
            ->where('skill', $skill)
            ->first();

        $recentScores = $this->recentScoresForSkill($userId, $skill);
        $scoreValues = $recentScores->pluck('score');
        $deviation = $this->computeDeviation($scoreValues);

        return [
            'progress' => $progress,
            'recent_scores' => $recentScores,
            'trend' => $this->computeTrend($scoreValues, $deviation),
            'window_avg' => $scoreValues->isNotEmpty() ? round($scoreValues->avg(), 1) : null,
            'window_deviation' => $deviation,
        ];
    }

    /**
     * @return Collection<int, UserProgress>
     */
    public function learningPath(string $userId): Collection
    {
        return UserProgress::where('user_id', $userId)->get();
    }

    // --- Goals ---

    public function createGoal(string $userId, array $data): UserGoal
    {
        return UserGoal::create([...$data, 'user_id' => $userId]);
    }

    public function updateGoal(UserGoal $goal, array $data): UserGoal
    {
        $goal->update($data);

        return $goal;
    }

    public function deleteGoal(UserGoal $goal): void
    {
        $goal->delete();
    }

    // --- Score analysis ---

    private const MIN_SCORES_FOR_TREND = 4;

    private function latestGoal(string $userId): ?UserGoal
    {
        return UserGoal::where('user_id', $userId)->latest()->first();
    }

    private function computeStreak(BaseCollection $activeDays): int
    {
        $daySet = $activeDays->flip();
        $streak = 0;
        $date = now()->subDay();

        while ($daySet->has($date->toDateString())) {
            $streak++;
            $date->subDay();
        }

        if ($daySet->has(now()->toDateString())) {
            $streak++;
        }

        return $streak;
    }

    /**
     * Batch-load recent scores for ALL skills in 2 queries (1 Submission + 1 ExamSession).
     * Returns score values sorted newest-first per skill (required for correct trend computation).
     *
     * @return BaseCollection<string, BaseCollection<int, float>> keyed by skill value
     */
    private function recentScoresBySkill(string $userId): BaseCollection
    {
        $practiceScores = Submission::forUser($userId)
            ->scored()
            ->orderByDesc('created_at')
            ->limit(80)
            ->get(['skill', 'score', 'completed_at', 'created_at']);

        $examSessions = ExamSession::forUser($userId)
            ->completed()
            ->orderByDesc('completed_at')
            ->limit(20)
            ->get(['listening_score', 'reading_score', 'writing_score', 'speaking_score', 'completed_at']);

        $result = collect();

        foreach (Skill::cases() as $skill) {
            $fromPractice = $practiceScores
                ->where('skill', $skill)
                ->map(fn ($s) => ['score' => $s->score, 'at' => $s->completed_at ?? $s->created_at]);

            $column = $skill->scoreColumn();
            $fromExam = $examSessions
                ->whereNotNull($column)
                ->map(fn ($s) => ['score' => $s->{$column}, 'at' => $s->completed_at]);

            $result[$skill->value] = $fromPractice->merge($fromExam)
                ->sortByDesc('at')
                ->take(20)
                ->pluck('score')
                ->values();
        }

        return $result;
    }

    /**
     * Load recent scores for a single skill from both sources.
     *
     * @return BaseCollection<int, array{score: float, created_at: Carbon}>
     */
    private function recentScoresForSkill(string $userId, Skill $skill): BaseCollection
    {
        $practiceScores = Submission::forUser($userId)
            ->scored()
            ->where('skill', $skill)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn (Submission $s) => [
                'score' => $s->score,
                'created_at' => $s->completed_at ?? $s->created_at,
            ]);

        $scoreColumn = $skill->scoreColumn();
        $examScores = ExamSession::forUser($userId)
            ->completed()
            ->whereNotNull($scoreColumn)
            ->orderByDesc('completed_at')
            ->limit(20)
            ->get()
            ->map(fn (ExamSession $s) => [
                'score' => $s->{$scoreColumn},
                'created_at' => $s->completed_at,
            ]);

        return $practiceScores->merge($examScores)
            ->sortByDesc('created_at')
            ->take(20)
            ->values();
    }

    /**
     * Compare avg of recent half vs older half.
     * improving: recent > older by ≥0.5  |  declining: recent < older by ≥0.5
     * inconsistent: std dev > 2.0        |  stable: otherwise
     */
    private function computeTrend(BaseCollection $scores, ?float $deviation = null): string
    {
        if ($scores->count() < self::MIN_SCORES_FOR_TREND) {
            return 'insufficient_data';
        }

        $deviation ??= $this->computeDeviation($scores);
        if ($deviation !== null && $deviation > 2.0) {
            return 'inconsistent';
        }

        $mid = intdiv($scores->count(), 2);
        $recentAvg = $scores->take($mid)->avg();
        $olderAvg = $scores->skip($mid)->avg();
        $diff = $recentAvg - $olderAvg;

        return match (true) {
            $diff >= 0.5 => 'improving',
            $diff <= -0.5 => 'declining',
            default => 'stable',
        };
    }

    private function computeDeviation(BaseCollection $scores): ?float
    {
        if ($scores->count() < 2) {
            return null;
        }

        $mean = $scores->avg();
        $variance = $scores->reduce(fn (float $carry, $s) => $carry + ($s - $mean) ** 2, 0.0) / $scores->count();

        return round(sqrt($variance), 2);
    }

    // --- Adaptive progress ---

    private const STREAK_THRESHOLD = 3;

    public const SCAFFOLD_PER_LEVEL = 3;

    public function applyScore(string $userId, Skill $skill, float $score): void
    {
        $progress = UserProgress::findOrInitialize($userId, $skill);

        $this->updateAdaptiveProgress($progress, $score);
    }

    public function applySubmission(Submission $submission): void
    {
        if ($submission->status !== SubmissionStatus::Completed || $submission->score === null) {
            return;
        }

        $progress = UserProgress::findOrInitialize($submission->user_id, $submission->skill);

        $this->updateAdaptiveProgress($progress, $submission->score);
    }

    private function updateAdaptiveProgress(UserProgress $progress, float $score): void
    {
        $passed = $score >= $progress->current_level->passThreshold();

        $progress->attempt_count++;

        if ($passed) {
            $progress->streak_count++;
            $progress->streak_direction = StreakDirection::Up;

            if ($progress->streak_count >= self::STREAK_THRESHOLD) {
                $progress->scaffold_level++;
                $progress->streak_count = 0;

                if ($progress->scaffold_level >= self::SCAFFOLD_PER_LEVEL) {
                    $nextLevel = $progress->current_level->next();
                    if ($nextLevel) {
                        $progress->current_level = $nextLevel;
                        $progress->scaffold_level = 0;
                    }
                }
            }
        } else {
            $progress->streak_direction = $progress->streak_count > 0 ? StreakDirection::Down : StreakDirection::Neutral;
            $progress->streak_count = 0;
            $progress->scaffold_level--;
        }

        $progress->save();
    }
}
