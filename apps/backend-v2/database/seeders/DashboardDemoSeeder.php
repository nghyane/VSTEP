<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\GradingJob;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\ProfileStreakState;
use App\Models\User;
use App\Models\WritingGradingResult;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Seed dashboard demo data: activity heatmap, exam sessions with grading,
 * và streak được DERIVE từ activity (không hardcode).
 * Run after UserSeeder + ContentSeeder.
 */
class DashboardDemoSeeder extends Seeder
{
    private const DEMO_EMAIL = 'learner@vstep.test';

    private const ACTIVITY_HISTORY_DAYS = 60;

    private const ACTIVITY_PROBABILITY = 0.7;

    /** @var array{0: int, 1: int} Range drill sessions/ngày — chia sẻ với DemoSeedStreakCommand. */
    public const DRILL_SESSIONS_RANGE = [1, 5];

    /** @var array{0: int, 1: int} Range drill duration (giây) — chia sẻ với DemoSeedStreakCommand. */
    public const DRILL_DURATION_RANGE_SECONDS = [300, 2400];

    private const EXAM_SESSION_COUNT = 6;

    private const EXAM_SESSION_GAP_DAYS = 5;

    private const EXAM_DURATION_MINUTES = 120;

    private const MIN_SUBMITTED_SESSIONS_BEFORE_SKIP = 5;

    private const MCQ_OPTION_COUNT = 4;

    private const LISTENING_CORRECT_PROBABILITY = 0.7;

    private const READING_CORRECT_PROBABILITY = 0.6;

    private const WRITING_WORD_COUNT_RANGE = [80, 200];

    private const GRADING_DURATION_RANGE_SECONDS = [5, 30];

    private const RUBRIC_SCORE_RANGE = [1.5, 3.5];

    private const OVERALL_BAND_RANGE = [4.0, 8.0];

    public function run(): void
    {
        // Chỉ seed demo cho user demo cố định — tránh đè data của user thật khi re-seed.
        $demoUser = User::query()->where('email', self::DEMO_EMAIL)->first();
        if (! $demoUser) {
            $this->command->warn('Demo learner not found. Run UserSeeder first.');

            return;
        }

        $profiles = Profile::query()->where('account_id', $demoUser->id)->get();
        if ($profiles->isEmpty()) {
            $this->command->warn('No profiles for demo learner. Run UserSeeder first.');

            return;
        }

        $version = ExamVersion::query()->first();
        if (! $version) {
            $this->command->warn('No exam version found. Run ContentSeeder first.');

            return;
        }

        foreach ($profiles as $profile) {
            $activeDates = $this->seedActivity($profile);
            $this->seedStreakFromActivity($profile, $activeDates);
            $this->seedExamSessions($profile, $version);
        }

        $this->command->info('Dashboard demo data seeded.');
    }

    /**
     * Tạo activity giả cho N ngày gần nhất theo xác suất, trả về list ngày có hoạt động.
     *
     * @return Collection<int, string>
     */
    private function seedActivity(Profile $profile): Collection
    {
        DB::table('profile_daily_activity')
            ->where('profile_id', $profile->id)
            ->delete();

        $today = Carbon::today();
        $activeDates = collect();

        for ($i = 0; $i < self::ACTIVITY_HISTORY_DAYS; $i++) {
            if (mt_rand() / mt_getrandmax() > self::ACTIVITY_PROBABILITY) {
                continue;
            }

            $date = $today->copy()->subDays($i)->toDateString();
            ProfileDailyActivity::create([
                'profile_id' => $profile->id,
                'date_local' => $date,
                'drill_session_count' => rand(...self::DRILL_SESSIONS_RANGE),
                'drill_duration_seconds' => rand(...self::DRILL_DURATION_RANGE_SECONDS),
            ]);
            $activeDates->push($date);
        }

        return $activeDates;
    }

    /**
     * Derive streak từ activity thật:
     * - current_streak: số ngày liên tiếp tính từ hôm nay (hoặc hôm qua nếu chưa active hôm nay)
     * - longest_streak: chuỗi liên tiếp dài nhất trong toàn bộ activity
     *
     * @param  Collection<int, string>  $activeDates
     */
    private function seedStreakFromActivity(Profile $profile, Collection $activeDates): void
    {
        if ($activeDates->isEmpty()) {
            ProfileStreakState::query()->where('profile_id', $profile->id)->delete();

            return;
        }

        $sorted = $activeDates->map(fn (string $d) => Carbon::parse($d))->sort()->values();

        $longest = 1;
        $run = 1;
        for ($i = 1; $i < $sorted->count(); $i++) {
            $diff = $sorted[$i - 1]->diffInDays($sorted[$i]);
            $run = $diff === 1 ? $run + 1 : 1;
            $longest = max($longest, $run);
        }

        $today = Carbon::today();
        $latest = $sorted->last();
        $current = 0;
        if ($latest->equalTo($today) || $latest->equalTo($today->copy()->subDay())) {
            $current = 1;
            $cursor = $latest->copy();
            for ($i = $sorted->count() - 2; $i >= 0; $i--) {
                if ($sorted[$i]->equalTo($cursor->copy()->subDay())) {
                    $current++;
                    $cursor = $sorted[$i];
                } else {
                    break;
                }
            }
        }

        ProfileStreakState::query()->updateOrInsert(
            ['profile_id' => $profile->id],
            [
                'current_streak' => $current,
                'longest_streak' => max($longest, $current),
                'last_active_date_local' => $latest->toDateString(),
                'updated_at' => now(),
            ],
        );
    }

    private function seedExamSessions(Profile $profile, ExamVersion $version): void
    {
        $existing = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->where('status', 'submitted')
            ->count();

        if ($existing >= self::MIN_SUBMITTED_SESSIONS_BEFORE_SKIP) {
            return;
        }

        $writingTaskId = DB::table('exam_version_writing_tasks')
            ->where('exam_version_id', $version->id)
            ->value('id');

        $listeningItemIds = DB::table('exam_version_listening_items')
            ->join('exam_version_listening_sections', 'exam_version_listening_sections.id', '=', 'exam_version_listening_items.section_id')
            ->where('exam_version_listening_sections.exam_version_id', $version->id)
            ->pluck('exam_version_listening_items.id');

        $readingItemIds = DB::table('exam_version_reading_items')
            ->join('exam_version_reading_passages', 'exam_version_reading_passages.id', '=', 'exam_version_reading_items.passage_id')
            ->where('exam_version_reading_passages.exam_version_id', $version->id)
            ->pluck('exam_version_reading_items.id');

        for ($i = 0; $i < self::EXAM_SESSION_COUNT; $i++) {
            $submittedAt = now()
                ->subDays($i * self::EXAM_SESSION_GAP_DAYS)
                ->subHours(rand(1, 12));

            $session = ExamSession::create([
                'profile_id' => $profile->id,
                'exam_version_id' => $version->id,
                'mode' => 'full',
                'selected_skills' => ['listening', 'reading', 'writing', 'speaking'],
                'is_full_test' => true,
                'time_extension_factor' => 1.0,
                'started_at' => $submittedAt->copy()->subMinutes(self::EXAM_DURATION_MINUTES),
                'server_deadline_at' => $submittedAt->copy()->addMinutes(10),
                'submitted_at' => $submittedAt,
                'status' => 'submitted',
                'coins_charged' => 0,
            ]);

            $this->seedMcqAnswers($session->id, 'listening', $listeningItemIds, $submittedAt, self::LISTENING_CORRECT_PROBABILITY);
            $this->seedMcqAnswers($session->id, 'reading', $readingItemIds, $submittedAt, self::READING_CORRECT_PROBABILITY);

            if ($writingTaskId) {
                $this->seedWritingResult($session->id, $profile->id, $writingTaskId, $submittedAt);
            }
        }
    }

    /**
     * @param  Collection<int, mixed>  $itemIds
     */
    private function seedMcqAnswers(
        string $sessionId,
        string $itemType,
        Collection $itemIds,
        Carbon $answeredAt,
        float $correctProbability,
    ): void {
        foreach ($itemIds as $itemId) {
            DB::table('exam_mcq_answers')->insert([
                'session_id' => $sessionId,
                'item_ref_type' => $itemType,
                'item_ref_id' => $itemId,
                'selected_index' => rand(0, self::MCQ_OPTION_COUNT - 1),
                'is_correct' => mt_rand() / mt_getrandmax() < $correctProbability,
                'answered_at' => $answeredAt,
            ]);
        }
    }

    private function seedWritingResult(string $sessionId, string $profileId, string $taskId, Carbon $submittedAt): void
    {
        $subId = Str::uuid7();
        DB::table('exam_writing_submissions')->insert([
            'id' => $subId,
            'session_id' => $sessionId,
            'profile_id' => $profileId,
            'task_id' => $taskId,
            'text' => 'Demo writing submission for seed data.',
            'word_count' => rand(...self::WRITING_WORD_COUNT_RANGE),
            'submitted_at' => $submittedAt,
        ]);

        $job = GradingJob::create([
            'submission_type' => 'exam_writing',
            'submission_id' => $subId,
            'status' => 'ready',
            'started_at' => $submittedAt,
            'completed_at' => $submittedAt->copy()->addSeconds(rand(...self::GRADING_DURATION_RANGE_SECONDS)),
        ]);

        WritingGradingResult::create([
            'job_id' => $job->id,
            'submission_type' => 'exam_writing',
            'submission_id' => $subId,
            'version' => 1,
            'is_active' => true,
            'rubric_scores' => [
                'task_achievement' => $this->randomFloat(self::RUBRIC_SCORE_RANGE),
                'coherence' => $this->randomFloat(self::RUBRIC_SCORE_RANGE),
                'lexical' => $this->randomFloat(self::RUBRIC_SCORE_RANGE),
                'grammar' => $this->randomFloat(self::RUBRIC_SCORE_RANGE),
            ],
            'overall_band' => $this->randomFloat(self::OVERALL_BAND_RANGE),
            'strengths' => ['Good structure'],
            'improvements' => [['message' => 'Expand vocabulary', 'explanation' => 'Use more varied words']],
            'rewrites' => [],
            'annotations' => [],
            'paragraph_feedback' => [],
        ]);
    }

    /**
     * @param  array{0: float, 1: float}  $range
     */
    private function randomFloat(array $range): float
    {
        [$min, $max] = $range;
        $scaled = rand((int) ($min * 10), (int) ($max * 10));

        return round($scaled / 10, 1);
    }
}
