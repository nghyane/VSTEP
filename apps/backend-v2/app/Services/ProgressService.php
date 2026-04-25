<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ExamSession;
use App\Models\PracticeSession;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\ProfileStreakLog;
use App\Models\ProfileStreakState;
use App\Models\SystemConfig;
use App\Models\WritingGradingResult;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Progress context: streak, study time, chart data.
 *
 * Streak = consecutive days với ≥ daily_goal **full-test exam sessions**
 *   (is_full_test=true, status submitted|auto_submitted).
 *   Drill practice KHÔNG tính streak — chỉ tính study time.
 * Heatmap = số exam session (full + custom) hoàn thành mỗi ngày.
 * Chart = derive from exam_sessions (custom+full) with grading results.
 */
class ProgressService
{
    public function __construct(
        private readonly StreakMilestoneService $streakMilestoneService,
    ) {}

    /**
     * Record completed practice session → chỉ update study time + heatmap drill,
     * KHÔNG còn driver streak.
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
        });
    }

    /**
     * Record completed exam session → update streak nếu là full test.
     * Gọi sau khi `status` chuyển sang submitted hoặc auto_submitted.
     * Caller phải defer ra ngoài transaction (DB::afterCommit) — RFC 0017.
     */
    public function recordExamCompletion(ExamSession $session): void
    {
        if (! $session->is_full_test) {
            return; // streak chỉ tính full test
        }

        $tz = SystemConfig::get('streak.timezone') ?? 'Asia/Ho_Chi_Minh';
        $submittedAt = $session->submitted_at ?? now();
        $dateLocal = Carbon::parse($submittedAt, 'UTC')->setTimezone($tz)->toDateString();

        $this->updateStreak($session->profile_id, $dateLocal);
    }

    /**
     * Overview data cho dashboard.
     *
     * @return array<string,mixed>
     */
    /**
     * Effective streak = giá trị DB nếu last_active_date là hôm nay hoặc hôm qua;
     * ngược lại 0 (streak đã đứt do không hoạt động).
     */
    private function effectiveStreak(?ProfileStreakState $state): int
    {
        if (! $state) {
            return 0;
        }
        $tz = SystemConfig::get('streak.timezone') ?? 'Asia/Ho_Chi_Minh';
        $today = Carbon::now($tz)->toDateString();
        $yesterday = Carbon::now($tz)->subDay()->toDateString();
        $last = $state->last_active_date_local?->toDateString();

        return ($last === $today || $last === $yesterday) ? (int) $state->current_streak : 0;
    }

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
            ->whereIn('status', ['submitted', 'auto_submitted', 'grading', 'graded'])
            ->count();

        $chartData = null;
        if ($examCount >= $minTests) {
            $chartData = $this->computeChart($profile, $windowSize);
        }

        $predictedLevel = $this->predictLevel($chartData, $profile->entry_level);

        return [
            'profile' => [
                'nickname' => $profile->nickname,
                'target_level' => $profile->target_level,
                'target_deadline' => $profile->target_deadline?->toDateString(),
                'days_until_exam' => $profile->target_deadline
                    ? (int) max(0, now()->diffInDays($profile->target_deadline, false))
                    : null,
                'entry_level' => $profile->entry_level,
                'predicted_level' => $predictedLevel,
            ],
            'stats' => [
                'total_tests' => $examCount,
                'min_tests_required' => $minTests,
                'total_study_minutes' => (int) round($totalStudySeconds / 60),
                'streak' => $this->effectiveStreak($streak),
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
        [$startUtc, $endUtc] = $this->localDayBoundsUtc(Carbon::now($tz)->toDateString(), $tz);

        $todayCount = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->where('is_full_test', true)
            ->whereIn('status', ['submitted', 'auto_submitted', 'grading', 'graded'])
            ->whereBetween('submitted_at', [$startUtc, $endUtc])
            ->count();

        return [
            'current_streak' => $this->effectiveStreak($streak),
            'longest_streak' => $streak?->longest_streak ?? 0,
            'today_sessions' => $todayCount,
            'daily_goal' => $dailyGoal,
            'last_active_date' => $streak?->last_active_date_local?->toDateString(),
            'milestones' => $this->streakMilestoneService->listForProfile($profile),
        ];
    }

    /**
     * Activity heatmap — số bài exam (full + custom) hoàn thành mỗi ngày.
     *
     * @return array<int, array{date: string, count: int}>
     */
    public function getActivityHeatmap(Profile $profile, int $weeks = 12): array
    {
        $tz = SystemConfig::get('streak.timezone') ?? 'Asia/Ho_Chi_Minh';
        $endDate = Carbon::now($tz)->toDateString();
        $startDate = Carbon::now($tz)->subWeeks($weeks)->startOfWeek(Carbon::MONDAY)->toDateString();
        [$startUtc] = $this->localDayBoundsUtc($startDate, $tz);
        [, $endUtc] = $this->localDayBoundsUtc($endDate, $tz);

        $rows = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->whereIn('status', ['submitted', 'auto_submitted', 'grading', 'graded'])
            ->whereBetween('submitted_at', [$startUtc, $endUtc])
            ->orderBy('submitted_at')
            ->get(['submitted_at']);

        $byDay = [];
        foreach ($rows as $row) {
            $date = Carbon::parse($row->submitted_at, 'UTC')->setTimezone($tz)->toDateString();
            $byDay[$date] = ($byDay[$date] ?? 0) + 1;
        }

        $out = [];
        foreach ($byDay as $date => $count) {
            $out[] = ['date' => $date, 'count' => $count];
        }
        usort($out, fn ($a, $b) => strcmp($a['date'], $b['date']));

        return $out;
    }

    /**
     * @return array{0: \Carbon\Carbon, 1: \Carbon\Carbon}
     */
    private function localDayBoundsUtc(string $dateLocal, string $tz): array
    {
        return [
            Carbon::parse($dateLocal, $tz)->startOfDay()->utc(),
            Carbon::parse($dateLocal, $tz)->endOfDay()->utc(),
        ];
    }

    private function updateStreak(string $profileId, string $dateLocal): void
    {
        $dailyGoal = (int) (SystemConfig::get('streak.daily_goal') ?? 1);
        $tz = SystemConfig::get('streak.timezone') ?? 'Asia/Ho_Chi_Minh';
        [$startUtc, $endUtc] = $this->localDayBoundsUtc($dateLocal, $tz);

        // Đếm full test đã hoàn thành trong ngày local (theo submitted_at).
        $todayCount = ExamSession::query()
            ->where('profile_id', $profileId)
            ->where('is_full_test', true)
            ->whereIn('status', ['submitted', 'auto_submitted', 'grading', 'graded'])
            ->whereBetween('submitted_at', [$startUtc, $endUtc])
            ->count();

        if ($todayCount < $dailyGoal) {
            return;
        }

        DB::transaction(function () use ($profileId, $dateLocal) {
            // Streak log entry (RFC 0019 §3 — append-only daily log cho contribution graph).
            ProfileStreakLog::query()->updateOrInsert(
                ['profile_id' => $profileId, 'date_local' => $dateLocal],
                ['active' => true, 'created_at' => now()],
            );

            $state = ProfileStreakState::query()->lockForUpdate()->find($profileId);
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
        });
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

    /**
     * Suy đoán band hiện tại → VSTEP level. Khi chưa đủ data (chart=null),
     * fallback về entry_level user tự đánh giá lúc onboarding.
     *
     * @param  array<string, float|int|null>|null  $chart
     */
    private function predictLevel(?array $chart, ?string $entryLevel): ?string
    {
        if ($chart === null) {
            return $entryLevel;
        }

        $bands = array_filter([
            $chart['listening'] ?? null,
            $chart['reading'] ?? null,
            $chart['writing'] ?? null,
            $chart['speaking'] ?? null,
        ], fn ($v) => $v !== null);

        if (empty($bands)) {
            return $entryLevel;
        }

        $avg = array_sum($bands) / count($bands);

        return match (true) {
            $avg >= 8.5 => 'C1',
            $avg >= 6.0 => 'B2',
            $avg >= 4.0 => 'B1',
            $avg >= 3.5 => 'A2',
            default => 'A1',
        };
    }

    private function mcqAvgBand(Collection $sessionIds, string $skill): ?float
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
