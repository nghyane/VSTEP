<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ExamSession;
use App\Models\PracticeSession;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\ProfileStreakState;
use App\Models\SystemConfig;
use App\Models\WritingGradingResult;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Progress context: streak, study time, chart data.
 *
 * Streak = consecutive days with ≥ daily_goal drill sessions.
 * Study time = sum drill_duration_seconds.
 * Chart = derive from exam_sessions (custom+full) with grading results.
 */
class ProgressService
{
    /**
     * Record completed practice session → update daily activity + streak.
     */
    public function recordPracticeCompletion(PracticeSession $session): void
    {
        $tz = SystemConfig::get('streak.timezone') ?? 'Asia/Ho_Chi_Minh';
        $dateLocal = Carbon::parse($session->ended_at, 'UTC')->setTimezone($tz)->toDateString();
        $duration = $session->duration_seconds ?? 0;

        DB::transaction(function () use ($session, $dateLocal, $duration) {
            $row = ProfileDailyActivity::query()
                ->where('profile_id', $session->profile_id)
                ->where('date_local', $dateLocal)
                ->first();

            if ($row) {
                ProfileDailyActivity::query()
                    ->where('profile_id', $session->profile_id)
                    ->where('date_local', $dateLocal)
                    ->update([
                        'drill_session_count' => $row->drill_session_count + 1,
                        'drill_duration_seconds' => $row->drill_duration_seconds + $duration,
                        'updated_at' => now(),
                    ]);
            } else {
                ProfileDailyActivity::query()->insert([
                    'profile_id' => $session->profile_id,
                    'date_local' => $dateLocal,
                    'drill_session_count' => 1,
                    'drill_duration_seconds' => $duration,
                    'updated_at' => now(),
                ]);
            }

            $this->updateStreak($session->profile_id, $dateLocal);
        });
    }

    /**
     * Overview data cho dashboard.
     *
     * @return array<string,mixed>
     */
    public function getOverview(Profile $profile): array
    {
        $streak = ProfileStreakState::query()->find($profile->id);
        $totalStudySeconds = (int) ProfileDailyActivity::query()
            ->where('profile_id', $profile->id)
            ->sum('drill_duration_seconds');

        $minTests = (int) (SystemConfig::get('chart.min_tests') ?? 5);
        $windowSize = (int) (SystemConfig::get('chart.sliding_window_size') ?? 10);

        $examCount = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->whereIn('mode', ['custom', 'full'])
            ->where('status', 'submitted')
            ->count();

        $chartData = null;
        if ($examCount >= $minTests) {
            $chartData = $this->computeChart($profile, $windowSize);
        }

        return [
            'profile' => [
                'nickname' => $profile->nickname,
                'target_level' => $profile->target_level,
                'target_deadline' => $profile->target_deadline?->toDateString(),
                'days_until_exam' => $profile->target_deadline
                    ? (int) max(0, now()->diffInDays($profile->target_deadline, false))
                    : null,
            ],
            'stats' => [
                'total_tests' => $examCount,
                'min_tests_required' => $minTests,
                'total_study_minutes' => (int) round($totalStudySeconds / 60),
                'streak' => $streak?->current_streak ?? 0,
                'longest_streak' => $streak?->longest_streak ?? 0,
            ],
            'chart' => $chartData,
        ];
    }

    public function getStreak(Profile $profile): array
    {
        $streak = ProfileStreakState::query()->find($profile->id);
        $dailyGoal = (int) (SystemConfig::get('streak.daily_goal') ?? 1);
        $tz = SystemConfig::get('streak.timezone') ?? 'Asia/Ho_Chi_Minh';
        $todayLocal = now()->setTimezone($tz)->toDateString();

        $todayActivity = ProfileDailyActivity::query()
            ->where('profile_id', $profile->id)
            ->where('date_local', $todayLocal)
            ->first();

        return [
            'current_streak' => $streak?->current_streak ?? 0,
            'longest_streak' => $streak?->longest_streak ?? 0,
            'today_sessions' => $todayActivity?->drill_session_count ?? 0,
            'daily_goal' => $dailyGoal,
            'last_active_date' => $streak?->last_active_date_local?->toDateString(),
        ];
    }

    /**
     * Activity heatmap — drill duration per day for last N weeks.
     *
     * @return array<int, array{date: string, minutes: int}>
     */
    public function getActivityHeatmap(Profile $profile, int $weeks = 12): array
    {
        $tz = SystemConfig::get('streak.timezone') ?? 'Asia/Ho_Chi_Minh';
        $endDate = Carbon::now($tz)->toDateString();
        $startDate = Carbon::now($tz)->subWeeks($weeks)->startOfWeek(Carbon::MONDAY)->toDateString();

        return ProfileDailyActivity::query()
            ->where('profile_id', $profile->id)
            ->whereBetween('date_local', [$startDate, $endDate])
            ->orderBy('date_local')
            ->get(['date_local', 'drill_duration_seconds'])
            ->map(fn ($row) => [
                'date' => $row->date_local,
                'minutes' => (int) round($row->drill_duration_seconds / 60),
            ])
            ->all();
    }

    private function updateStreak(string $profileId, string $dateLocal): void
    {
        $dailyGoal = (int) (SystemConfig::get('streak.daily_goal') ?? 1);
        $todayCount = (int) ProfileDailyActivity::query()
            ->where('profile_id', $profileId)
            ->where('date_local', $dateLocal)
            ->value('drill_session_count');

        if ($todayCount < $dailyGoal) {
            return;
        }

        $state = ProfileStreakState::query()->find($profileId);
        $lastDate = $state?->last_active_date_local?->toDateString();
        $yesterday = Carbon::parse($dateLocal)->subDay()->toDateString();

        if ($lastDate === $dateLocal) {
            return; // already counted today
        }

        $newStreak = ($lastDate === $yesterday)
            ? ($state?->current_streak ?? 0) + 1
            : 1;

        $longest = max($newStreak, $state?->longest_streak ?? 0);

        ProfileStreakState::query()->updateOrInsert(
            ['profile_id' => $profileId],
            [
                'current_streak' => $newStreak,
                'longest_streak' => $longest,
                'last_active_date_local' => $dateLocal,
                'updated_at' => now(),
            ],
        );
    }

    /**
     * @return array<string,float|null>
     */
    private function computeChart(Profile $profile, int $windowSize): array
    {
        $sessions = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->whereIn('mode', ['custom', 'full'])
            ->where('status', 'submitted')
            ->orderByDesc('submitted_at')
            ->limit($windowSize)
            ->pluck('id');

        $writingSubIds = DB::table('exam_writing_submissions')
            ->whereIn('session_id', $sessions)
            ->pluck('id');

        $avgWriting = WritingGradingResult::query()
            ->where('submission_type', 'exam_writing')
            ->whereIn('submission_id', $writingSubIds)
            ->where('is_active', true)
            ->avg('overall_band');

        $listeningAvg = $this->mcqAvgBand($sessions, 'listening');
        $readingAvg = $this->mcqAvgBand($sessions, 'reading');

        return [
            'listening' => $listeningAvg,
            'reading' => $readingAvg,
            'writing' => $avgWriting ? round((float) $avgWriting, 1) : null,
            'speaking' => null,
            'sample_size' => $sessions->count(),
        ];
    }

    private function mcqAvgBand(\Illuminate\Support\Collection $sessionIds, string $skill): ?float
    {
        if ($sessionIds->isEmpty()) {
            return null;
        }

        $results = DB::table('exam_mcq_answers')
            ->whereIn('session_id', $sessionIds)
            ->where('item_ref_type', $skill)
            ->selectRaw('session_id, count(*) as total, sum(case when is_correct then 1 else 0 end) as correct')
            ->groupBy('session_id')
            ->get();

        if ($results->isEmpty()) {
            return null;
        }

        $bands = $results->map(fn ($r) => round($r->correct / $r->total * 10, 1));

        return round($bands->avg(), 1);
    }
}
