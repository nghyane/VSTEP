<?php

namespace App\Services;

use App\Enums\Skill;
use App\Enums\SubmissionStatus;
use App\Models\ExamSession;
use App\Models\Submission;
use App\Models\UserGoal;
use App\Models\UserProgress;
use App\Support\CamelToSnake;
use Carbon\Carbon;

class ProgressService
{
    public function overview(string $userId): array
    {
        return [
            'skills' => UserProgress::where('user_id', $userId)->get(),
            'goal' => UserGoal::where('user_id', $userId)->latest()->first(),
        ];
    }

    public function spiderChart(string $userId): array
    {
        $skills = UserProgress::where('user_id', $userId)->get()->keyBy('skill');
        $goal = UserGoal::where('user_id', $userId)->latest()->first();

        $result = [];
        foreach (Skill::cases() as $skill) {
            $progress = $skills->get($skill->value);
            $result[$skill->value] = [
                'current' => $progress ? $this->levelToScore($progress->current_level) : 0,
                'trend' => 'insufficient_data',
            ];
        }

        $per_skill = collect(Skill::cases())->mapWithKeys(fn ($s) => [$s->value => null])->all();

        return [
            'skills' => $result,
            'goal' => $goal,
            'eta' => [
                'weeks' => null,
                'per_skill' => $per_skill,
            ],
        ];
    }

    public function activity(string $userId, int $days = 30): array
    {
        $since = Carbon::now()->subDays($days)->startOfDay();

        $sessions = ExamSession::where('user_id', $userId)
            ->where('completed_at', '>=', $since)
            ->get();

        $activeDays = $sessions->map(fn ($s) => $s->completed_at->toDateString())->unique()->values();

        $streak = 0;
        $date = Carbon::today();
        $daySet = $activeDays->flip();
        while ($daySet->has($date->toDateString())) {
            $streak++;
            $date->subDay();
        }

        $submissions = Submission::where('user_id', $userId)
            ->where('created_at', '>=', $since)
            ->count();

        $totalMinutes = $sessions->sum(function ($s) {
            if (!$s->completed_at || !$s->started_at) return 0;
            return $s->completed_at->diffInMinutes($s->started_at);
        });

        return [
            'streak' => $streak,
            'total' => $activeDays->count(),
            'active_days' => $activeDays->all(),
            'total_exercises' => $submissions + $sessions->count(),
            'total_study_time_minutes' => $totalMinutes,
        ];
    }

    public function bySkill(string $userId, string $skill): array
    {
        $progress = UserProgress::where('user_id', $userId)
            ->where('skill', $skill)
            ->first();

        $recentScores = Submission::where('user_id', $userId)
            ->where('skill', $skill)
            ->where('status', SubmissionStatus::Completed)
            ->whereNotNull('score')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn ($s) => [
                'score' => $s->score,
                'created_at' => $s->created_at->toISOString(),
            ]);

        $avg = $recentScores->avg('score');

        return [
            'progress' => $progress,
            'recent_scores' => $recentScores,
            'window_avg' => $avg ? round($avg, 1) : null,
            'window_deviation' => null,
            'trend' => 'insufficient_data',
            'eta' => null,
        ];
    }

    public function learningPath(string $userId): array
    {
        $skills = UserProgress::where('user_id', $userId)->get();

        $weekly_plan = $skills->map(fn ($p) => [
            'skill' => $p->skill,
            'current_level' => $p->current_level,
            'target_level' => $p->target_level ?? 'B2',
            'sessions_per_week' => 3,
            'focus_area' => null,
            'recommended_level' => $p->current_level,
            'estimated_minutes' => 30,
            'weak_topics' => [],
            'priority' => $this->levelToScore($p->current_level),
        ])->sortBy('priority')->values();

        return [
            'weekly_plan' => $weekly_plan,
            'total_minutes_per_week' => $weekly_plan->sum('estimated_minutes'),
            'projected_improvement' => null,
        ];
    }

    // --- Goals ---

    public function createGoal(string $userId, array $data): UserGoal
    {
        return UserGoal::create([
            'user_id' => $userId,
            'target_band' => $data['targetBand'],
            'current_estimated_band' => $data['currentEstimatedBand'] ?? null,
            'deadline' => $data['deadline'] ?? null,
            'daily_study_time_minutes' => $data['dailyStudyTimeMinutes'] ?? null,
        ]);
    }

    public function updateGoal(string $userId, string $goalId, array $data): UserGoal
    {
        $goal = UserGoal::where('user_id', $userId)->findOrFail($goalId);

        $fields = CamelToSnake::auto($data, [
            'targetBand', 'currentEstimatedBand', 'deadline', 'dailyStudyTimeMinutes',
        ]);

        $goal->update($fields);

        return $goal;
    }

    public function deleteGoal(string $userId, string $goalId): void
    {
        UserGoal::where('user_id', $userId)->findOrFail($goalId)->delete();
    }

    private function levelToScore(string $level): int
    {
        return match ($level) {
            'A2' => 1, 'B1' => 2, 'B2' => 3, 'C1' => 4, default => 0,
        };
    }
}
