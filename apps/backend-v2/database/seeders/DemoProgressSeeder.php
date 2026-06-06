<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Assessment\Enums\AssessmentJobStatus;
use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;
use App\Enums\CoinTransactionType;
use App\Enums\ExamSessionStatus;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentJob;
use App\Models\AssessmentResult;
use App\Models\AssessmentRubric;
use App\Models\CoinTransaction;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamVersion;
use App\Models\ExamWritingSubmission;
use App\Models\ExerciseFeedback;
use App\Models\PracticeListeningExercise;
use App\Models\PracticeReadingExercise;
use App\Models\PracticeVocabExerciseAttempt;
use App\Models\PracticeVocabReview;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\ProfileVocabSrsState;
use App\Models\VocabExercise;
use App\Models\VocabWord;
use App\Services\McqSkillService;
use App\Services\ProgressService;
use App\Services\VocabService;
use App\Services\WalletService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * All demo progress data. Uses real service/module methods where possible
 * to catch bugs (activity, notifications, wallet, practice) and raw inserts
 * only for components requiring external APIs (exam grading, SRS).
 */
final class DemoProgressSeeder extends Seeder
{
    private const MAIN_NICKNAME = 'Minh';

    private const EXAM_SESSION_COUNT = 6;

    private const EXAM_GAP_DAYS = 4;

    private const EXAM_DURATION_MINUTES = 120;

    private const MCQ_OPTION_COUNT = 4;

    private const ACTIVITY_DAYS = 60;

    private const ACTIVITY_PROBABILITY = 0.7;

    /** @var array{listening: float, reading: float, writing: float, speaking: float} */
    private const MAIN_BANDS = ['listening' => 7.8, 'reading' => 7.2, 'writing' => 6.5, 'speaking' => 7.0];

    private const EXTRA_BANDS = [
        'weak_writer' => ['listening' => 7.0, 'reading' => 6.5, 'writing' => 3.5, 'speaking' => 6.0],
        'weak_speaker' => ['listening' => 7.5, 'reading' => 7.0, 'writing' => 6.0, 'speaking' => 3.0],
        'inactive_student' => ['listening' => 5.0, 'reading' => 4.5, 'writing' => 5.5, 'speaking' => 5.0],
    ];

    public function run(McqSkillService $mcqService, WalletService $walletService, ProgressService $progressService, VocabService $vocabService): void
    {
        $profile = Profile::query()->where('nickname', self::MAIN_NICKNAME)->first();
        if (! $profile) {
            $this->command?->warn('Demo learner "Minh" not found. Run DemoAccountSeeder first.');

            return;
        }

        $versions = ExamVersion::query()
            ->with('exam:id,slug,is_published')
            ->where('is_active', true)
            ->whereHas('exam', fn ($query) => $query->where('is_published', true))
            ->get()
            ->sortBy(fn (ExamVersion $version): string => $version->exam?->slug ?? $version->id)
            ->values();
        if ($versions->isEmpty()) {
            $this->command?->warn('No exam version found. Run ContentSeeder first.');

            return;
        }

        // ── Main Profile ──
        $this->seedActivityAndStreak($profile, self::ACTIVITY_DAYS, self::ACTIVITY_PROBABILITY, 12);
        $this->seedExamSessions($profile, $versions, self::MAIN_BANDS);
        $this->seedPracticeHistory($profile, $mcqService);

        // Snapshot today's vocab activity before service calls to revert spurious addActivity()
        $todayLocal = now()->toDateString();
        $todayRow = ProfileDailyActivity::query()
            ->where('profile_id', $profile->id)
            ->where('date_local', $todayLocal)
            ->first();
        $vocabCountBefore = $todayRow ? (int) $todayRow->vocab_review_count : 0;

        $this->seedVocabJourney($profile, $vocabService);

        // Revert spurious today vocab_review_count from VocabService::review() → addActivity()
        // and redistribute across past active dates instead
        $vocabReviewTotal = (int) PracticeVocabReview::query()
            ->where('profile_id', $profile->id)
            ->count();
        if ($vocabReviewTotal > 0) {
            ProfileDailyActivity::query()
                ->where('profile_id', $profile->id)
                ->where('date_local', $todayLocal)
                ->update(['vocab_review_count' => $vocabCountBefore]);

            $pastDates = ProfileDailyActivity::query()
                ->where('profile_id', $profile->id)
                ->where('date_local', '!=', $todayLocal)
                ->orderBy('date_local')
                ->pluck('date_local');

            $remaining = $vocabReviewTotal;
            while ($remaining > 0 && $pastDates->isNotEmpty()) {
                $date = $pastDates->random();
                $count = min(rand(1, 3), $remaining);
                ProfileDailyActivity::query()
                    ->where('profile_id', $profile->id)
                    ->where('date_local', $date)
                    ->increment('vocab_review_count', $count);
                $remaining -= $count;
            }
        }

        $this->seedWalletTransactions($profile, $walletService);
        $this->seedExerciseFeedback($profile);

        // ── Extra Profiles ──
        foreach (self::EXTRA_BANDS as $nickname => $bands) {
            $extra = Profile::query()->where('nickname', $nickname)->first();
            if (! $extra) {
                continue;
            }

            $versionOffset = (int) array_search($nickname, array_keys(self::EXTRA_BANDS), true) + 1;

            if ($nickname !== 'inactive_student') {
                $this->seedActivityAndStreak($extra, 14, 0.5, 3);
            }

            $this->seedExamSessions($extra, $versions, $bands, $versionOffset);
        }

        $this->enrollExtraProfiles();

        $this->command?->info('Demo progress seeded.');
    }

    // ═══════════════════════════════════════════════════════════════
    // ACTIVITY + STREAK — uses ProfileDailyActivity ACTIVITY_TYPES
    // ═══════════════════════════════════════════════════════════════

    private function seedActivityAndStreak(Profile $profile, int $days, float $probability, int $streakDays): void
    {
        if (ProfileDailyActivity::query()->where('profile_id', $profile->id)->exists()) {
            return;
        }

        $today = Carbon::today();
        $activeDates = collect();
        $typePool = ['listening', 'reading', 'vocab_review', 'writing', 'speaking_drill'];

        // Phase 1: deterministic streak — today + ($streakDays-1) past days are always active
        for ($i = 0; $i < $streakDays; $i++) {
            $date = $today->copy()->subDays($i);
            $this->insertActivity($profile, $date, $typePool[array_rand($typePool)]);
            $activeDates->push($date);
        }

        // Phase 2: random activity for remaining days (skip first $streakDays)
        for ($i = $streakDays; $i < $days; $i++) {
            if (mt_rand() / mt_getrandmax() > $probability) {
                continue;
            }
            $date = $today->copy()->subDays($i);
            $this->insertActivity($profile, $date, $typePool[array_rand($typePool)]);
            $activeDates->push($date);
        }

        // Streak is derived from activity data by ProgressService::computeStreak().
        // No hardcoded ProfileStreakState — computed from ProfileDailyActivity at read time.
    }

    private function insertActivity(Profile $profile, \DateTimeInterface $date, string $type): void
    {
        $config = ProfileDailyActivity::ACTIVITY_TYPES[$type];
        $count = rand(1, 5);
        $duration = $type === 'exam_session' ? rand(60, 120) * 60 : rand(300, 1800);

        ProfileDailyActivity::query()->insert([
            'profile_id' => $profile->id,
            'date_local' => $date->format('Y-m-d'),
            $config['count'] => $count,
            'total_duration_seconds' => $duration,
            'updated_at' => now(),
            ...(isset($config['duration']) ? [$config['duration'] => $duration] : []),
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // EXAM SESSIONS + GRADING — raw (requires external API)
    // ═══════════════════════════════════════════════════════════════

    /**
     * @param  array{listening: float, reading: float, writing: float, speaking: float}  $bands
     * @param  Collection<int, ExamVersion>  $versions
     */
    private function seedExamSessions(Profile $profile, Collection $versions, array $bands, int $versionOffset = 0): void
    {
        if ($this->hasCompleteExamSessionSeed($profile, $versions)) {
            return;
        }

        $this->resetExamSessions($profile);

        for ($i = 0; $i < self::EXAM_SESSION_COUNT; $i++) {
            /** @var ExamVersion $version */
            $version = $versions->get(($i + $versionOffset) % $versions->count());
            $submittedAt = now()->subDays($i * self::EXAM_GAP_DAYS + 1)->subHours(rand(1, 12));

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
                'status' => ExamSessionStatus::Submitted,
                'coins_charged' => 0,
            ]);

            $listeningItems = $this->listeningItems($version);
            $readingItems = $this->readingItems($version);
            $listeningProb = $bands['listening'] / 10;
            $readingProb = $bands['reading'] / 10;
            $this->seedMcqAnswers($session->id, 'exam_listening_item', $listeningItems, $submittedAt, $listeningProb);
            $this->seedMcqAnswers($session->id, 'exam_reading_item', $readingItems, $submittedAt, $readingProb);

            foreach ($this->writingTasks($version) as $task) {
                $this->seedWritingResult($session->id, $profile->id, $task->id, (int) $task->part, $submittedAt, $bands['writing']);
            }

            foreach ($this->speakingParts($version) as $part) {
                $this->seedSpeakingResult($session->id, $profile->id, $part->id, (int) $part->part, $submittedAt, $bands['speaking']);
            }

            // Record real activity for this exam session (not fake random data)
            $dateLocal = $submittedAt->toDateString();
            $existing = ProfileDailyActivity::query()
                ->where('profile_id', $profile->id)
                ->where('date_local', $dateLocal)
                ->first();

            if ($existing) {
                $existing->increment('exam_session_count');
                $existing->increment('total_duration_seconds', 7200);
                $existing->update(['updated_at' => now()]);
            } else {
                ProfileDailyActivity::query()->insert([
                    'profile_id' => $profile->id,
                    'date_local' => $dateLocal,
                    'exam_session_count' => 1,
                    'total_duration_seconds' => 7200,
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /** @param Collection<int, ExamVersion> $versions */
    private function hasCompleteExamSessionSeed(Profile $profile, Collection $versions): bool
    {
        $sessions = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->whereIn('status', ExamSessionStatus::countableValues())
            ->with('examVersion')
            ->get();

        if ($sessions->count() !== self::EXAM_SESSION_COUNT) {
            return false;
        }

        $activeVersionIds = $versions->pluck('id');
        if ($sessions->pluck('exam_version_id')->diff($activeVersionIds)->isNotEmpty()) {
            return false;
        }

        $expectedDistinctVersions = min(self::EXAM_SESSION_COUNT, $versions->count());
        if ($sessions->pluck('exam_version_id')->unique()->count() < $expectedDistinctVersions) {
            return false;
        }

        foreach ($sessions as $session) {
            $version = $session->examVersion;
            if (! $version instanceof ExamVersion) {
                return false;
            }

            $expectedMcqCount = $this->listeningItems($version)->count() + $this->readingItems($version)->count();
            $actualMcqCount = ExamMcqAnswer::query()->where('session_id', $session->id)->count();
            if ($actualMcqCount < $expectedMcqCount) {
                return false;
            }

            $expectedWritingCount = $this->writingTasks($version)->count();
            $actualWritingCount = ExamWritingSubmission::query()->where('session_id', $session->id)->count();
            if ($actualWritingCount < $expectedWritingCount) {
                return false;
            }

            $expectedSpeakingCount = $this->speakingParts($version)->count();
            $actualSpeakingCount = ExamSpeakingSubmission::query()->where('session_id', $session->id)->count();
            if ($actualSpeakingCount < $expectedSpeakingCount) {
                return false;
            }
        }

        return true;
    }

    private function resetExamSessions(Profile $profile): void
    {
        $sessionIds = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->pluck('id');

        if ($sessionIds->isEmpty()) {
            return;
        }

        $sourceIds = ExamWritingSubmission::query()
            ->whereIn('session_id', $sessionIds)
            ->pluck('id')
            ->merge(ExamSpeakingSubmission::query()
                ->whereIn('session_id', $sessionIds)
                ->pluck('id'));

        if ($sourceIds->isNotEmpty()) {
            AssessmentAttempt::query()
                ->where('profile_id', $profile->id)
                ->where('source_type', AssessmentSourceType::Exam->value)
                ->whereIn('source_id', $sourceIds)
                ->delete();
        }

        ExamSession::query()->whereIn('id', $sessionIds)->delete();
    }

    private function listeningItems(ExamVersion $version): Collection
    {
        return DB::table('exam_version_listening_items')
            ->join('exam_version_listening_sections', 'exam_version_listening_sections.id', '=', 'exam_version_listening_items.section_id')
            ->where('exam_version_listening_sections.exam_version_id', $version->id)
            ->orderBy('exam_version_listening_sections.part')
            ->orderBy('exam_version_listening_sections.display_order')
            ->orderBy('exam_version_listening_items.display_order')
            ->get(['exam_version_listening_items.id', 'exam_version_listening_items.correct_index']);
    }

    private function readingItems(ExamVersion $version): Collection
    {
        return DB::table('exam_version_reading_items')
            ->join('exam_version_reading_passages', 'exam_version_reading_passages.id', '=', 'exam_version_reading_items.passage_id')
            ->where('exam_version_reading_passages.exam_version_id', $version->id)
            ->orderBy('exam_version_reading_passages.part')
            ->orderBy('exam_version_reading_passages.display_order')
            ->orderBy('exam_version_reading_items.display_order')
            ->get(['exam_version_reading_items.id', 'exam_version_reading_items.correct_index']);
    }

    private function writingTasks(ExamVersion $version): Collection
    {
        return DB::table('exam_version_writing_tasks')
            ->where('exam_version_id', $version->id)
            ->orderBy('part')
            ->orderBy('display_order')
            ->get(['id', 'part']);
    }

    private function speakingParts(ExamVersion $version): Collection
    {
        return DB::table('exam_version_speaking_parts')
            ->where('exam_version_id', $version->id)
            ->orderBy('part')
            ->orderBy('display_order')
            ->get(['id', 'part']);
    }

    private function seedMcqAnswers(string $sessionId, string $itemType, Collection $items, \DateTimeInterface $answeredAt, float $correctProb): void
    {
        foreach ($items as $item) {
            $correctIndex = (int) $item->correct_index;
            $isCorrect = mt_rand() / mt_getrandmax() < $correctProb;

            ExamMcqAnswer::create([
                'session_id' => $sessionId,
                'item_ref_type' => $itemType,
                'item_ref_id' => $item->id,
                'selected_index' => $isCorrect ? $correctIndex : $this->wrongIndex($correctIndex),
                'is_correct' => $isCorrect,
                'answered_at' => $answeredAt,
            ]);
        }
    }

    private function seedWritingResult(string $sessionId, string $profileId, string $taskId, int $part, \DateTimeInterface $submittedAt, float $band): void
    {
        $taskType = $part === 1
            ? AssessmentTaskType::WritingTask1Letter
            : AssessmentTaskType::WritingTask2Essay;

        $submission = ExamWritingSubmission::create([
            'session_id' => $sessionId,
            'profile_id' => $profileId,
            'task_id' => $taskId,
            'text' => "Seed writing part {$part} submission.",
            'word_count' => $part === 1 ? rand(120, 180) : rand(250, 320),
            'submitted_at' => $submittedAt,
        ]);

        $rubric = $this->rubric($taskType);
        $attempt = AssessmentAttempt::create([
            'profile_id' => $profileId,
            'rubric_id' => $rubric->id,
            'skill' => AssessmentSkill::Writing,
            'task_type' => $taskType,
            'source_type' => AssessmentSourceType::Exam,
            'source_id' => $submission->id,
            'prompt' => ['requirements' => ["Demo writing task {$part}"]],
            'response_payload' => ['text' => $submission->text, 'metadata' => ['word_count' => $submission->word_count]],
            'submitted_at' => $submittedAt,
        ]);
        $this->seedAssessmentJob($attempt, $submittedAt);

        AssessmentResult::create([
            'attempt_id' => $attempt->id,
            'rubric_id' => $rubric->id,
            'criterion_scores' => [
                ['key' => 'task_fulfillment', 'score' => $band, 'weight' => 0.25],
                ['key' => 'organization', 'score' => $band, 'weight' => 0.25],
                ['key' => 'vocabulary', 'score' => $band, 'weight' => 0.25],
                ['key' => 'grammar', 'score' => $band, 'weight' => 0.25],
            ],
            'overall_band' => $band,
            'calculation_trace' => ['source' => 'demo_seed'],
            'feedback' => ['strengths' => ['Demo seed data']],
        ]);
    }

    private function seedSpeakingResult(string $sessionId, string $profileId, string $partId, int $part, \DateTimeInterface $submittedAt, float $band): void
    {
        $taskType = match ($part) {
            1 => AssessmentTaskType::SpeakingPart1Personal,
            2 => AssessmentTaskType::SpeakingPart2Solution,
            default => AssessmentTaskType::SpeakingPart3Discussion,
        };

        $audioKey = 'audio/exam_speaking/'.$profileId.'/demo-part-'.$part.'-'.uniqid().'.mp3';
        $audioUrl = 'https://demo.vstep.test/'.$audioKey;
        $submission = ExamSpeakingSubmission::create([
            'session_id' => $sessionId,
            'profile_id' => $profileId,
            'part_id' => $partId,
            'audio_key' => $audioKey,
            'audio_url' => $audioUrl,
            'duration_seconds' => rand(60, 180),
            'transcript' => "Seed speaking part {$part} transcript.",
            'submitted_at' => $submittedAt,
        ]);

        $rubric = $this->rubric($taskType);
        $attempt = AssessmentAttempt::create([
            'profile_id' => $profileId,
            'rubric_id' => $rubric->id,
            'skill' => AssessmentSkill::Speaking,
            'task_type' => $taskType,
            'source_type' => AssessmentSourceType::Exam,
            'source_id' => $submission->id,
            'prompt' => ['requirements' => ["Demo speaking part {$part}"]],
            'response_payload' => [
                'audio_key' => $submission->audio_key,
                'audio_url' => $submission->audio_url,
                'metadata' => ['duration_seconds' => $submission->duration_seconds],
            ],
            'submitted_at' => $submittedAt,
        ]);
        $this->seedAssessmentJob($attempt, $submittedAt);

        AssessmentResult::create([
            'attempt_id' => $attempt->id,
            'rubric_id' => $rubric->id,
            'criterion_scores' => [
                ['key' => 'grammar', 'score' => $band, 'weight' => 0.20],
                ['key' => 'vocabulary', 'score' => $band, 'weight' => 0.20],
                ['key' => 'pronunciation', 'score' => $band, 'weight' => 0.20],
                ['key' => 'fluency', 'score' => $band, 'weight' => 0.20],
                ['key' => 'discourse_management', 'score' => $band, 'weight' => 0.20],
            ],
            'overall_band' => $band,
            'calculation_trace' => ['source' => 'demo_seed'],
            'feedback' => ['strengths' => ['Demo seed data']],
        ]);
    }

    private function seedAssessmentJob(AssessmentAttempt $attempt, \DateTimeInterface $submittedAt): void
    {
        AssessmentJob::create([
            'attempt_id' => $attempt->id,
            'status' => AssessmentJobStatus::Ready,
            'attempts' => 1,
            'progress' => ['source' => 'demo_seed'],
            'started_at' => $submittedAt,
            'completed_at' => $submittedAt,
        ]);
    }

    private function rubric(AssessmentTaskType $taskType): AssessmentRubric
    {
        return AssessmentRubric::query()
            ->where('task_type', $taskType)
            ->where('is_active', true)
            ->firstOrFail();
    }

    // ═══════════════════════════════════════════════════════════════
    // PRACTICE SESSIONS — uses McqSkillService (real module)
    // ═══════════════════════════════════════════════════════════════

    private function seedPracticeHistory(Profile $profile, McqSkillService $mcqService): void
    {
        if (DB::table('practice_sessions')->where('profile_id', $profile->id)->exists()) {
            return;
        }

        $this->seedMcqPractice($profile, $mcqService, 'listening', PracticeListeningExercise::class, 4);
        $this->seedMcqPractice($profile, $mcqService, 'reading', PracticeReadingExercise::class, 3);
    }

    private function seedMcqPractice(Profile $profile, McqSkillService $mcqService, string $skill, string $exerciseClass, int $count): void
    {
        $exercises = $exerciseClass::query()
            ->where('is_published', true)
            ->orderBy('created_at')
            ->take($count)
            ->get();

        if ($exercises->isEmpty()) {
            return;
        }

        foreach ($exercises as $i => $exercise) {
            // Use real McqSkillService — validates skill type, exercise existence, answer format
            $session = $mcqService->startSession($profile, $skill, $exercise->id);

            // Set session timestamps to a past date
            $daysAgo = rand($i * 3 + 1, $i * 3 + 3);
            $startedAt = now()->subDays($daysAgo)->subHours(rand(1, 4));
            $session->update(['started_at' => $startedAt]);

            $questions = $exercise->questions()->orderBy('display_order')->get();
            if ($questions->isEmpty()) {
                continue;
            }

            $correctProb = $skill === 'listening' ? 0.75 : 0.65;
            $answers = [];
            foreach ($questions as $q) {
                $isCorrect = mt_rand() / mt_getrandmax() < $correctProb;
                $answers[] = [
                    'question_id' => $q->id,
                    'selected_index' => $isCorrect ? $q->correct_index : $this->wrongIndex($q->correct_index),
                ];
            }

            // Raw insert answers — skip service chain to avoid addActivity() spurious today record
            foreach ($answers as $a) {
                DB::table('practice_mcq_answers')->insert([
                    'session_id' => $session->id,
                    'question_type' => "practice_{$skill}_question",
                    'question_id' => $a['question_id'],
                    'selected_index' => $a['selected_index'],
                    'is_correct' => $a['selected_index'] === $questions->firstWhere('id', $a['question_id'])?->correct_index,
                    'answered_at' => $startedAt,
                ]);
            }

            // Manual session completion without service chain side effects
            $durationSeconds = rand(600, 1500);
            $session->update([
                'started_at' => $startedAt,
                'ended_at' => $startedAt->copy()->addSeconds($durationSeconds),
                'duration_seconds' => $durationSeconds,
            ]);

            // Activity record for this practice
            $this->recordActivityForDate($profile, $skill, $startedAt);
        }
    }

    private function wrongIndex(int $correctIndex): int
    {
        $options = array_values(array_diff(range(0, self::MCQ_OPTION_COUNT - 1), [$correctIndex]));

        return (int) $options[array_rand($options)];
    }

    private function recordActivityForDate(Profile $profile, string $skill, \DateTimeInterface $date): void
    {
        $config = ProfileDailyActivity::ACTIVITY_TYPES[$skill];
        $dateLocal = $date->toDateString();
        $duration = rand(300, 1500);
        $now = now();

        $existing = ProfileDailyActivity::query()
            ->where('profile_id', $profile->id)
            ->where('date_local', $dateLocal)
            ->first();

        if ($existing) {
            $existing->increment($config['count']);
            $existing->increment('total_duration_seconds', $duration);
            if (isset($config['duration'])) {
                $existing->increment($config['duration'], $duration);
            }
            $existing->update(['updated_at' => $now]);
        } else {
            ProfileDailyActivity::query()->insert([
                'profile_id' => $profile->id,
                'date_local' => $dateLocal,
                $config['count'] => 1,
                'total_duration_seconds' => $duration,
                'updated_at' => $now,
                ...(isset($config['duration']) ? [$config['duration'] => $duration] : []),
            ]);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // VOCAB — real service flow: review + exercise attempts
    // ═══════════════════════════════════════════════════════════════

    private function seedVocabJourney(Profile $profile, VocabService $vocabService): void
    {
        if ($this->hasCompleteVocabJourney($profile)) {
            return;
        }

        if (! $this->hasCompleteVocabReviewCore($profile)) {
            $this->resetVocabJourney($profile);

            $words = VocabWord::query()
                ->whereHas('topic', fn ($query) => $query->where('is_published', true))
                ->with('topic:id,slug,display_order')
                ->get()
                ->sortBy(fn (VocabWord $word): string => sprintf(
                    '%04d-%s-%04d-%s',
                    (int) ($word->topic?->display_order ?? 0),
                    $word->topic?->slug ?? '',
                    (int) $word->display_order,
                    $word->word,
                ))
                ->take(60)
                ->values();

            if ($words->isEmpty()) {
                return;
            }

            foreach ($words as $index => $word) {
                foreach ($this->reviewRatingsForWord($index) as $rating) {
                    $vocabService->review($profile, $word, $rating);
                }
            }
        }

        if (PracticeVocabExerciseAttempt::query()->where('profile_id', $profile->id)->exists()) {
            return;
        }

        $this->seedVocabExerciseAttempts($profile, $vocabService);
    }

    private function seedVocabExerciseAttempts(Profile $profile, VocabService $vocabService): void
    {
        $exercises = VocabExercise::query()
            ->whereHas('topic', fn ($query) => $query->where('is_published', true))
            ->orderBy('display_order')
            ->limit(8)
            ->get();

        foreach ($exercises as $index => $exercise) {
            $vocabService->attemptExercise(
                $profile,
                $exercise,
                $this->answerForVocabExercise($exercise, $index % 4 !== 3),
            );
        }
    }

    private function hasCompleteVocabJourney(Profile $profile): bool
    {
        $hasExercises = VocabExercise::query()
            ->whereHas('topic', fn ($query) => $query->where('is_published', true))
            ->exists();

        return $this->hasCompleteVocabReviewCore($profile)
            && (! $hasExercises || PracticeVocabExerciseAttempt::query()->where('profile_id', $profile->id)->exists());
    }

    private function hasCompleteVocabReviewCore(Profile $profile): bool
    {
        return PracticeVocabReview::query()->where('profile_id', $profile->id)->count() >= 60
            && ProfileVocabSrsState::query()->where('profile_id', $profile->id)->count() >= 40;
    }

    private function resetVocabJourney(Profile $profile): void
    {
        PracticeVocabExerciseAttempt::query()->where('profile_id', $profile->id)->delete();
        PracticeVocabReview::query()->where('profile_id', $profile->id)->delete();
        ProfileVocabSrsState::query()->where('profile_id', $profile->id)->delete();
    }

    /** @return list<int> */
    private function reviewRatingsForWord(int $index): array
    {
        return match (true) {
            $index < 20 => [3],
            $index < 40 => [3, 3],
            $index < 50 => [4],
            default => [1],
        };
    }

    /** @return array<string, mixed> */
    private function answerForVocabExercise(VocabExercise $exercise, bool $correct): array
    {
        $payload = $exercise->payload ?? [];

        if ($exercise->kind === 'mcq') {
            $correctIndex = (int) ($payload['correct_index'] ?? 0);
            $optionCount = max(2, count((array) ($payload['options'] ?? [])));
            $wrongOptions = array_values(array_diff(range(0, $optionCount - 1), [$correctIndex]));

            return ['selected_index' => $correct ? $correctIndex : (int) $wrongOptions[array_rand($wrongOptions)]];
        }

        $accepted = (array) ($payload['accepted_answers'] ?? []);
        $answer = (string) ($accepted[0] ?? 'demo');

        return ['text' => $correct ? $answer : "{$answer}-incorrect"];
    }

    // ═══════════════════════════════════════════════════════════════
    // WALLET — uses WalletService (real module)
    // ═══════════════════════════════════════════════════════════════

    private function seedWalletTransactions(Profile $profile, WalletService $walletService): void
    {
        // Only seed if no topup transaction exists yet (onboarding + course
        // bonuses are already credited by GrantOnboardingBonus + DemoCourseSeeder).
        $hasTopup = CoinTransaction::query()
            ->where('profile_id', $profile->id)
            ->where('type', 'topup')
            ->exists();

        if (! $hasTopup) {
            $walletService->credit($profile, 300, CoinTransactionType::OnboardingBonus);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EXERCISE FEEDBACK — uses Eloquent model
    // ═══════════════════════════════════════════════════════════════

    private function seedExerciseFeedback(Profile $profile): void
    {
        if (ExerciseFeedback::query()->where('profile_id', $profile->id)->exists()) {
            return;
        }

        $exercise = PracticeReadingExercise::query()
            ->where('is_published', true)
            ->first();

        if ($exercise) {
            ExerciseFeedback::create([
                'profile_id' => $profile->id,
                'content_type' => 'practice_reading_exercise',
                'content_id' => $exercise->id,
                'rating' => 5,
                'comment' => null,
            ]);
        }

        $exercise2 = PracticeListeningExercise::query()
            ->where('is_published', true)
            ->first();

        if ($exercise2) {
            ExerciseFeedback::create([
                'profile_id' => $profile->id,
                'content_type' => 'practice_listening_exercise',
                'content_id' => $exercise2->id,
                'rating' => 4,
                'comment' => null,
            ]);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    // ENROLL EXTRA PROFILES
    // ═══════════════════════════════════════════════════════════════

    private function enrollExtraProfiles(): void
    {
        $k101 = Course::query()->where('slug', 'b1-cap-toc-k101')->first();
        if (! $k101) {
            return;
        }

        $extraNicknames = ['weak_writer', 'weak_speaker', 'inactive_student'];
        foreach ($extraNicknames as $nickname) {
            $profile = Profile::query()->where('nickname', $nickname)->first();
            if (! $profile) {
                continue;
            }

            $exists = CourseEnrollment::query()
                ->where('profile_id', $profile->id)
                ->where('course_id', $k101->id)
                ->exists();

            if (! $exists) {
                CourseEnrollment::create([
                    'profile_id' => $profile->id,
                    'course_id' => $k101->id,
                    'enrolled_at' => now()->subDays(16),
                    'coins_paid' => 0,
                    'bonus_coins_received' => 0,
                ]);
            }
        }
    }
}
