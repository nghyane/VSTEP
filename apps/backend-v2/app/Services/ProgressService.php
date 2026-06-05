<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ExamSessionStatus;
use App\Models\ExamSession;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamWritingSubmission;
use App\Models\GrammarPoint;
use App\Models\PracticeListeningExercise;
use App\Models\PracticeReadingExercise;
use App\Models\PracticeSession;
use App\Models\PracticeWritingPrompt;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\ProfileGrammarMastery;
use App\Models\ProfileVocabSrsState;
use App\Models\SystemConfig;
use App\Models\VocabWord;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Progress tracking: 3 pillars from single source of truth.
 *
 *  STREAK  = consecutive days of ANY activity → discipline proxy
 *  HEATMAP = per-skill daily breakdown → coverage detection
 *  SCORES  = per-session band timeline → improvement measurement
 *
 * All derived from ProfileDailyActivity (activity) + GradingResult (scores).
 */
class ProgressService
{
    private const ROBUST_MIN_SAMPLES = 5;

    private const OUTLIER_DROP_THRESHOLD = 3.0;

    public function __construct(
        private readonly StreakMilestoneService $streakMilestoneService,
    ) {}

    // ═══════════════════════════════════════════════════════════════
    // ACTIVITY RECORDING
    // ═══════════════════════════════════════════════════════════════

    /**
     * Record completed practice session → activity by skill module.
     */
    public function recordPracticeCompletion(PracticeSession $session): void
    {
        $activityType = match ($session->module) {
            'listening' => 'listening',
            'reading' => 'reading',
            'writing' => 'writing',
            'speaking_drill' => 'speaking_drill',
            'speaking_vstep_practice' => 'speaking_submission',
            default => 'mcq',
        };

        ProfileDailyActivity::addActivity(
            profileId: $session->profile_id,
            activityType: $activityType,
            count: 1,
            durationSeconds: $session->duration_seconds ?? 0,
        );
    }

    public function recordSpeakingConversationCompletion(string $profileId, int $durationSeconds): void
    {
        ProfileDailyActivity::addActivity(
            profileId: $profileId,
            activityType: 'speaking_submission',
            count: 1,
            durationSeconds: $durationSeconds,
        );
    }

    public function recordSpeakingDrillActivity(string $profileId): void
    {
        ProfileDailyActivity::addActivity(
            profileId: $profileId,
            activityType: 'speaking_drill',
            count: 1,
        );
    }

    /**
     * Record completed exam session → activity + streak.
     * Caller must defer outside transaction (DB::afterCommit).
     */
    public function recordExamCompletion(ExamSession $session): void
    {
        ProfileDailyActivity::addActivity(
            profileId: $session->profile_id,
            activityType: 'exam_session',
            count: 1,
            durationSeconds: 7200, // exam session ≈ 2 hours
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // OVERVIEW — 3 pillars
    // ═══════════════════════════════════════════════════════════════

    public function getOverview(Profile $profile): array
    {
        $chart = $this->computeChart($profile, 10);
        $predictedLevel = $this->predictLevel($chart, $profile->entry_level);

        return [
            'profile' => [
                'nickname' => $profile->nickname,
                'entry_level' => $profile->entry_level,
                'target_level' => $profile->target_level,
                'target_deadline' => $profile->target_deadline?->toDateString(),
                'days_until_exam' => $profile->target_deadline
                    ? (int) max(0, now()->diffInDays($profile->target_deadline, false))
                    : null,
                'predicted_level' => $predictedLevel,
            ],
            'streak' => $this->computeStreak($profile),
            'heatmap' => $this->computeHeatmap($profile),
            'scores' => [
                'spider' => $chart,
                'timeline' => $this->computeScoreTimeline($profile),
                'quality' => $this->computeScoreQuality($profile),
                'growth' => $this->computeGrowth($profile),
            ],
            'stats' => [
                'total_study_minutes' => (int) round(ProfileDailyActivity::query()
                    ->where('profile_id', $profile->id)
                    ->sum('total_duration_seconds') / 60),
                'total_tests' => ExamSession::query()
                    ->where('profile_id', $profile->id)
                    ->whereIn('mode', ['custom', 'full'])
                    ->whereIn('status', ExamSessionStatus::terminalValues())
                    ->count(),
            ],
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // TRỤ 1: STREAK — consecutive days from activity
    // ═══════════════════════════════════════════════════════════════

    private function computeStreak(Profile $profile): array
    {
        $tz = SystemConfig::get('streak.timezone') ?? 'Asia/Ho_Chi_Minh';
        $today = Carbon::now($tz)->toDateString();
        $yesterday = Carbon::now($tz)->subDay()->toDateString();

        // Get all active dates sorted DESC
        $dates = ProfileDailyActivity::query()
            ->where('profile_id', $profile->id)
            ->orderByDesc('date_local')
            ->pluck('date_local')
            ->map(fn ($d) => $d instanceof \DateTimeInterface ? $d->format('Y-m-d') : $d)
            ->toArray();

        if ($dates === []) {
            return [
                'current' => 0,
                'longest' => 0,
                'last_active_date' => null,
                'today_active' => false,
            ];
        }

        // Current streak: count consecutive days from latest backwards
        $current = 0;
        $cursor = null;
        foreach ($dates as $date) {
            if ($cursor === null) {
                $cursor = $date;
                $current = 1;

                continue;
            }
            if ($this->isConsecutiveDay($cursor, $date)) {
                $current++;
                $cursor = $date;
            } else {
                break;
            }
        }

        // Today active = latest date is today
        $todayActive = $dates[0] === $today;

        // If latest date is older than yesterday → streak broken
        if ($dates[0] !== $today && $dates[0] !== $yesterday) {
            $current = 0;
        }

        // Longest streak: scan consecutive runs
        $longest = $current;
        $run = 1;
        for ($i = 1; $i < count($dates); $i++) {
            if ($this->isConsecutiveDay($dates[$i - 1], $dates[$i])) {
                $run++;
            } else {
                $run = 1;
            }
            $longest = max($longest, $run);
        }

        return [
            'current' => $current,
            'longest' => $longest,
            'last_active_date' => $dates[0],
            'today_active' => $todayActive,
        ];
    }

    private function isConsecutiveDay(string $newer, string $older): bool
    {
        return Carbon::parse($newer)->subDay()->toDateString() === $older;
    }

    public function getStreak(Profile $profile): array
    {
        return [
            ...$this->computeStreak($profile),
            'daily_goal' => (int) (SystemConfig::get('streak.daily_goal') ?? 1),
            'milestones' => $this->streakMilestoneService->listForProfile($profile),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // TRỤ 2: HEATMAP — per-skill daily breakdown
    // ═══════════════════════════════════════════════════════════════

    public function getActivityHeatmap(Profile $profile, int $weeks = 12): array
    {
        $tz = SystemConfig::get('streak.timezone') ?? 'Asia/Ho_Chi_Minh';
        $endDate = Carbon::now($tz)->toDateString();
        $startDate = Carbon::now($tz)->subWeeks($weeks)->startOfWeek(Carbon::MONDAY)->toDateString();

        $rows = ProfileDailyActivity::query()
            ->where('profile_id', $profile->id)
            ->whereBetween('date_local', [$startDate, $endDate])
            ->orderBy('date_local')
            ->get();

        return $rows->map(fn (ProfileDailyActivity $row) => [
            'date' => $row->date_local->toDateString(),
            'listening' => (int) $row->listening_exercise_count,
            'reading' => (int) $row->reading_exercise_count,
            'writing' => (int) $row->writing_submission_count,
            'speaking' => (int) $row->speaking_submission_count + (int) $row->drill_session_count,
            'vocab' => (int) $row->vocab_review_count,
            'exam' => (int) $row->exam_session_count,
        ])->values()->toArray();
    }

    private function computeHeatmap(Profile $profile): array
    {
        return [
            'weeks' => 12,
            'days' => $this->getActivityHeatmap($profile),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // TRỤ 3: SCORES — per-session timeline + growth
    // ═══════════════════════════════════════════════════════════════

    /**
     * Per-session band progression, sorted by date ASC.
     *
     * @return list<array{date: string, listening: float|null, reading: float|null, writing: float|null, speaking: float|null}>
     */
    private function computeScoreTimeline(Profile $profile): array
    {
        $sessions = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->whereIn('mode', ['custom', 'full'])
            ->whereIn('status', ExamSessionStatus::terminalValues())
            ->orderBy('submitted_at')
            ->limit(20)
            ->get();

        if ($sessions->isEmpty()) {
            return [];
        }

        $timeline = [];
        foreach ($sessions as $session) {
            $timeline[] = [
                'date' => $session->submitted_at->toDateString(),
                'listening' => $this->sessionListeningBand($session->id),
                'reading' => $this->sessionReadingBand($session->id),
                'writing' => $this->sessionWritingBand($session->id),
                'speaking' => $this->sessionSpeakingBand($session->id),
            ];
        }

        return $timeline;
    }

    /**
     * First vs latest band per skill with delta.
     *
     * @return array<string, array{first: float|null, latest: float|null, change: float|null, trend: string}>
     */
    private function computeGrowth(Profile $profile): array
    {
        $timeline = $this->computeScoreTimeline($profile);
        if (count($timeline) < 2) {
            return $this->emptyGrowth();
        }

        $first = $timeline[0];
        $last = $timeline[count($timeline) - 1];
        $trends = $this->perSkillTrend($timeline);

        $skills = ['listening', 'reading', 'writing', 'speaking'];
        $growth = [];
        foreach ($skills as $skill) {
            $f = $first[$skill];
            $l = $last[$skill];
            $growth[$skill] = [
                'first' => $f,
                'latest' => $l,
                'change' => ($f !== null && $l !== null) ? round($l - $f, 1) : null,
                'trend' => $trends[$skill] ?? 'insufficient_data',
            ];
        }

        return $growth;
    }

    /** @return array<string, string> */
    private function perSkillTrend(array $timeline): array
    {
        if (count($timeline) < 3) {
            return [];
        }

        $skills = ['listening', 'reading', 'writing', 'speaking'];
        $trends = [];
        foreach ($skills as $skill) {
            $recent = array_slice($timeline, -3);
            $values = array_filter(array_column($recent, $skill), fn ($v) => $v !== null);
            if (count($values) < 2) {
                $trends[$skill] = 'insufficient_data';

                continue;
            }
            $latest = end($values);
            $prevAvg = (array_sum(array_slice($values, 0, -1)) / (count($values) - 1));

            if ($latest > $prevAvg + 0.3) {
                $trends[$skill] = 'improving';
            } elseif ($latest < $prevAvg - 0.3) {
                $trends[$skill] = 'declining';
            } else {
                $trends[$skill] = 'stable';
            }
        }

        return $trends;
    }

    /** @return array<string, array{first: null, latest: null, change: null, trend: string}> */
    private function emptyGrowth(): array
    {
        $empty = ['first' => null, 'latest' => null, 'change' => null, 'trend' => 'insufficient_data'];

        return [
            'listening' => $empty,
            'reading' => $empty,
            'writing' => $empty,
            'speaking' => $empty,
        ];
    }

    private function sessionListeningBand(string $sessionId): ?float
    {
        return $this->mcqBand($sessionId, 'exam_listening_item');
    }

    private function sessionReadingBand(string $sessionId): ?float
    {
        return $this->mcqBand($sessionId, 'exam_reading_item');
    }

    private function mcqBand(string $sessionId, string $itemRefType): ?float
    {
        $row = DB::table('exam_mcq_answers')
            ->where('session_id', $sessionId)
            ->where('item_ref_type', $itemRefType)
            ->selectRaw('count(*) as total, sum(case when is_correct then 1 else 0 end) as correct')
            ->first();

        if (! $row || $row->total === 0) {
            return null;
        }

        return round(((int) $row->correct / (int) $row->total) * 10, 1);
    }

    private function sessionWritingBand(string $sessionId): ?float
    {
        $submission = ExamWritingSubmission::query()
            ->with('assessmentAttempt.result')
            ->where('session_id', $sessionId)
            ->first();

        return $submission?->assessmentAttempt?->result?->overall_band;
    }

    private function sessionSpeakingBand(string $sessionId): ?float
    {
        $submission = ExamSpeakingSubmission::query()
            ->with('assessmentAttempt.result')
            ->where('session_id', $sessionId)
            ->first();

        return $submission?->assessmentAttempt?->result?->overall_band;
    }

    // ═══════════════════════════════════════════════════════════════
    // PRACTICE SUMMARY
    // ═══════════════════════════════════════════════════════════════

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

    // ═══════════════════════════════════════════════════════════════
    // CHART (spider) + LEVEL PREDICTION
    // ═══════════════════════════════════════════════════════════════

    public function chart(Profile $profile): ?array
    {
        return $this->computeChart($profile, 10);
    }

    /**
     * @return array{listening: float|null, reading: float|null, writing: float|null, speaking: float|null, sample_size: int, skill_sample_sizes: array<string, int>}|null
     */
    private function computeChart(Profile $profile, int $windowSize): ?array
    {
        $sessions = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->whereIn('mode', ['custom', 'full'])
            ->whereIn('status', ExamSessionStatus::terminalValues())
            ->orderByDesc('submitted_at')
            ->limit($windowSize)
            ->pluck('id');

        if ($sessions->isEmpty()) {
            return null;
        }

        $writingBandsBySession = ExamWritingSubmission::query()
            ->with('assessmentAttempt.result')
            ->whereIn('session_id', $sessions)
            ->get()
            ->mapWithKeys(fn (ExamWritingSubmission $submission): array => [
                $submission->session_id => $submission->assessmentAttempt?->result?->overall_band,
            ]);

        $speakingBandsBySession = ExamSpeakingSubmission::query()
            ->with('assessmentAttempt.result')
            ->whereIn('session_id', $sessions)
            ->get()
            ->mapWithKeys(fn (ExamSpeakingSubmission $submission): array => [
                $submission->session_id => $submission->assessmentAttempt?->result?->overall_band,
            ]);

        $writingBands = $this->bandsInSessionOrder($sessions, $writingBandsBySession);
        $speakingBands = $this->bandsInSessionOrder($sessions, $speakingBandsBySession);

        $listeningBands = $this->mcqBands($sessions, 'exam_listening_item');
        $readingBands = $this->mcqBands($sessions, 'exam_reading_item');

        return [
            'listening' => $this->robustAvgBand($listeningBands),
            'reading' => $this->robustAvgBand($readingBands),
            'writing' => $this->robustAvgBand($writingBands),
            'speaking' => $this->robustAvgBand($speakingBands),
            'sample_size' => $sessions->count(),
            'skill_sample_sizes' => [
                'listening' => $listeningBands->count(),
                'reading' => $readingBands->count(),
                'writing' => $writingBands->count(),
                'speaking' => $speakingBands->count(),
            ],
        ];
    }

    /**
     * @param  Collection<int, string>  $sessionIds
     * @param  Collection<string, float|int|null>  $bandsBySession
     * @return Collection<int, float>
     */
    private function bandsInSessionOrder(Collection $sessionIds, Collection $bandsBySession): Collection
    {
        return $sessionIds
            ->map(fn (string $sessionId): ?float => $bandsBySession->get($sessionId) !== null
                ? (float) $bandsBySession->get($sessionId)
                : null)
            ->filter(fn (?float $band): bool => $band !== null)
            ->values();
    }

    /** @param Collection<int, float> $bands Latest first. */
    private function robustAvgBand(Collection $bands): ?float
    {
        if ($bands->isEmpty()) {
            return null;
        }

        return round((float) $this->dropIsolatedOutliers($bands)->avg(), 1);
    }

    /** @param Collection<int, float> $bands Latest first. */
    private function dropIsolatedOutliers(Collection $bands): Collection
    {
        if ($bands->count() < self::ROBUST_MIN_SAMPLES) {
            return $bands;
        }

        return $bands
            ->reject(fn (float $band, int $index): bool => $this->isIsolatedLowOutlier($bands, $index, $band))
            ->values();
    }

    /** @param Collection<int, float> $values */
    private function median(Collection $values): ?float
    {
        if ($values->isEmpty()) {
            return null;
        }

        $sorted = $values->sort()->values();
        $count = $sorted->count();
        $middle = intdiv($count, 2);

        if ($count % 2 === 1) {
            return (float) $sorted->get($middle);
        }

        return ((float) $sorted->get($middle - 1) + (float) $sorted->get($middle)) / 2;
    }

    /**
     * @return array{status: string, has_outlier: bool, consecutive_low: bool, outlier_skills: list<string>}
     */
    private function computeScoreQuality(Profile $profile): array
    {
        $sessions = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->whereIn('mode', ['custom', 'full'])
            ->whereIn('status', ExamSessionStatus::terminalValues())
            ->orderByDesc('submitted_at')
            ->limit(10)
            ->pluck('id');

        if ($sessions->isEmpty()) {
            return $this->emptyScoreQuality();
        }

        $writingBandsBySession = ExamWritingSubmission::query()
            ->with('assessmentAttempt.result')
            ->whereIn('session_id', $sessions)
            ->get()
            ->mapWithKeys(fn (ExamWritingSubmission $submission): array => [
                $submission->session_id => $submission->assessmentAttempt?->result?->overall_band,
            ]);

        $speakingBandsBySession = ExamSpeakingSubmission::query()
            ->with('assessmentAttempt.result')
            ->whereIn('session_id', $sessions)
            ->get()
            ->mapWithKeys(fn (ExamSpeakingSubmission $submission): array => [
                $submission->session_id => $submission->assessmentAttempt?->result?->overall_band,
            ]);

        $skillBands = [
            'listening' => $this->mcqBands($sessions, 'exam_listening_item'),
            'reading' => $this->mcqBands($sessions, 'exam_reading_item'),
            'writing' => $this->bandsInSessionOrder($sessions, $writingBandsBySession),
            'speaking' => $this->bandsInSessionOrder($sessions, $speakingBandsBySession),
        ];

        $outlierSkills = [];
        $consecutiveLow = false;
        foreach ($skillBands as $skill => $bands) {
            $status = $this->latestOutlierStatus($bands);
            if (! $status['is_outlier']) {
                continue;
            }

            $outlierSkills[] = $skill;
            $consecutiveLow = $consecutiveLow || $status['consecutive_low'];
        }

        if ($outlierSkills === []) {
            return $this->emptyScoreQuality();
        }

        return [
            'status' => $consecutiveLow ? 'consecutive_low' : 'single_outlier',
            'has_outlier' => true,
            'consecutive_low' => $consecutiveLow,
            'outlier_skills' => array_values($outlierSkills),
        ];
    }

    /** @return array{status: 'normal', has_outlier: false, consecutive_low: false, outlier_skills: list<string>} */
    private function emptyScoreQuality(): array
    {
        return [
            'status' => 'normal',
            'has_outlier' => false,
            'consecutive_low' => false,
            'outlier_skills' => [],
        ];
    }

    /**
     * @param  Collection<int, float>  $bands Latest first.
     * @return array{is_outlier: bool, consecutive_low: bool}
     */
    private function latestOutlierStatus(Collection $bands): array
    {
        if ($bands->count() < self::ROBUST_MIN_SAMPLES) {
            return ['is_outlier' => false, 'consecutive_low' => false];
        }

        $latest = (float) $bands->first();
        $historyMedian = $this->median($bands->slice(1)->values());
        if ($historyMedian === null) {
            return ['is_outlier' => false, 'consecutive_low' => false];
        }

        $outlierLimit = $historyMedian - self::OUTLIER_DROP_THRESHOLD;
        if ($latest >= $outlierLimit) {
            return ['is_outlier' => false, 'consecutive_low' => false];
        }

        $secondLatest = $bands->get(1);

        return [
            'is_outlier' => true,
            'consecutive_low' => $secondLatest !== null && (float) $secondLatest < $outlierLimit,
        ];
    }

    /** @param Collection<int, float> $bands Latest first. */
    private function isIsolatedLowOutlier(Collection $bands, int $index, float $band): bool
    {
        $comparison = $bands->except([$index])->values();
        if ($comparison->count() < self::ROBUST_MIN_SAMPLES - 1) {
            return false;
        }

        $median = $this->median($comparison);
        if ($median === null || $band >= $median - self::OUTLIER_DROP_THRESHOLD) {
            return false;
        }

        $previous = $bands->get($index + 1);
        $next = $bands->get($index - 1);

        return ! $this->isLowAgainstMedian($previous, $median)
            && ! $this->isLowAgainstMedian($next, $median);
    }

    private function isLowAgainstMedian(mixed $value, float $median): bool
    {
        return $value !== null && (float) $value < $median - self::OUTLIER_DROP_THRESHOLD;
    }

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

        if ($bands === []) {
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

        $bands = $this->mcqBands($sessionIds, $itemRefType);

        return $this->robustAvgBand($bands);
    }

    /** @param Collection<int, string> $sessionIds */
    private function mcqBands(Collection $sessionIds, string $itemRefType): Collection
    {
        $results = DB::table('exam_mcq_answers')
            ->whereIn('session_id', $sessionIds)
            ->where('item_ref_type', $itemRefType)
            ->selectRaw('session_id, count(*) as total, sum(case when is_correct then 1 else 0 end) as correct')
            ->groupBy('session_id')
            ->get();

        if ($results->isEmpty()) {
            return collect();
        }

        $bandsBySession = $results->mapWithKeys(fn ($r): array => [
            $r->session_id => round($r->correct / $r->total * 10, 1),
        ]);

        return $this->bandsInSessionOrder($sessionIds, $bandsBySession);
    }
}
