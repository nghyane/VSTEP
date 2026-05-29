<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ExamSessionStatus;
use App\Models\ExamSession;
use App\Models\GrammarPoint;
use App\Models\PracticeListeningExercise;
use App\Models\PracticeReadingExercise;
use App\Models\PracticeSession;
use App\Models\PracticeWritingPrompt;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\ProfileGrammarMastery;
use App\Models\ProfileStreakLog;
use App\Models\ProfileStreakState;
use App\Models\ProfileVocabSrsState;
use App\Models\SpeakingGradingResult;
use App\Models\SystemConfig;
use App\Models\VocabWord;
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
    /**
     * Record completed practice session → update daily activity by skill module.
     * Uses ACTIVITY_TYPES columns for correct heatmap per-skill breakdown.
     */
    public function recordPracticeCompletion(PracticeSession $session): void
    {
        // Map session module to activity type
        $activityType = match ($session->module) {
            'listening' => 'listening',
            'reading' => 'reading',
            'writing' => 'writing',
            'speaking' => 'speaking_submission',
            default => 'mcq',
        };

        ProfileDailyActivity::addActivity(
            profileId: $session->profile_id,
            activityType: $activityType,
            count: 1,
            durationSeconds: $session->duration_seconds ?? 0,
        );
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

    /**
     * Raw chart data for a profile, no minimum-test gate.
     * Returns null if no exam sessions with grading exist.
     *
     * @return array<string,float|int|null>|null
     */
    public function chart(Profile $profile): ?array
    {
        return $this->computeChart($profile, 10);
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
            ->whereIn('status', ExamSessionStatus::terminalValues())
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

    /**
     * Compact progress summary for the practice hub page.
     * Returns practiced/total counts per section.
     */
    public function getPracticeSummary(Profile $profile): array
    {
        $grammarPracticed = ProfileGrammarMastery::query()
            ->where('profile_id', $profile->id)
            ->count();
        $grammarTotal = GrammarPoint::query()
            ->where('is_published', true)
            ->where('is_checkpoint', false)
            ->count();

        $vocabLearned = ProfileVocabSrsState::query()
            ->where('profile_id', $profile->id)
            ->where('state_kind', '!=', 'new')
            ->count();
        $vocabTotal = VocabWord::query()
            ->whereHas('topic', fn ($q) => $q->where('is_published', true))
            ->count();

        $listeningPracticed = PracticeSession::query()
            ->where('profile_id', $profile->id)
            ->where('module', 'listening')
            ->whereNotNull('ended_at')
            ->distinct('content_ref_id')
            ->count('content_ref_id');
        $listeningTotal = PracticeListeningExercise::query()
            ->where('is_published', true)->count();

        $readingPracticed = PracticeSession::query()
            ->where('profile_id', $profile->id)
            ->where('module', 'reading')
            ->whereNotNull('ended_at')
            ->distinct('content_ref_id')
            ->count('content_ref_id');
        $readingTotal = PracticeReadingExercise::query()
            ->where('is_published', true)->count();

        $writingSubmitted = PracticeSession::query()
            ->where('profile_id', $profile->id)
            ->where('module', 'writing')
            ->whereNotNull('ended_at')
            ->count();
        $writingTotal = PracticeWritingPrompt::query()
            ->where('is_published', true)->count();

        $speakingDone = PracticeSession::query()
            ->where('profile_id', $profile->id)
            ->whereIn('module', ['speaking', 'speaking_conversation'])
            ->whereNotNull('ended_at')
            ->count();

        return [
            'grammar' => ['practiced' => $grammarPracticed, 'total' => $grammarTotal],
            'vocabulary' => ['practiced' => $vocabLearned, 'total' => $vocabTotal],
            'listening' => ['practiced' => $listeningPracticed, 'total' => $listeningTotal],
            'reading' => ['practiced' => $readingPracticed, 'total' => $readingTotal],
            'writing' => ['practiced' => $writingSubmitted, 'total' => $writingTotal],
            'speaking' => ['practiced' => $speakingDone],
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
            ->whereIn('status', ExamSessionStatus::terminalValues())
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
            ->whereIn('status', ExamSessionStatus::terminalValues())
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
     * @return array{0: Carbon, 1: Carbon}
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
            ->whereIn('status', ExamSessionStatus::terminalValues())
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
            ->whereIn('status', ExamSessionStatus::terminalValues())
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

        $speakingSubIds = DB::table('exam_speaking_submissions')
            ->whereIn('session_id', $sessions)
            ->pluck('id');

        $avgSpeaking = SpeakingGradingResult::query()
            ->where('submission_type', 'exam_speaking')
            ->whereIn('submission_id', $speakingSubIds)
            ->where('is_active', true)
            ->avg('overall_band');

        $listeningAvg = $this->mcqAvgBand($sessions, 'exam_listening_item');
        $readingAvg = $this->mcqAvgBand($sessions, 'exam_reading_item');

        return [
            'listening' => $listeningAvg,
            'reading' => $readingAvg,
            'writing' => $avgWriting ? round((float) $avgWriting, 1) : null,
            'speaking' => $avgSpeaking ? round((float) $avgSpeaking, 1) : null,
            'sample_size' => $sessions->count(),
        ];
    }

    /**
     * Suy đoán band hiện tại → VSTEP level. Khi chưa đủ data (chart=null),
     * fallback về entry_level user tự đánh giá lúc onboarding.
     *
     * @param  array<string, float|int|null>|null  $chart
     */
    public function predictLevel(?array $chart, ?string $entryLevel): ?string
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

    private function mcqAvgBand(Collection $sessionIds, string $itemRefType): ?float
    {
        if ($sessionIds->isEmpty()) {
            return null;
        }

        $results = DB::table('exam_mcq_answers')
            ->whereIn('session_id', $sessionIds)
            ->where('item_ref_type', $itemRefType)
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
