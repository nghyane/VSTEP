<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;
use App\Enums\CoinTransactionType;
use App\Models\AssessmentAttempt;
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
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\ProfileVocabSrsState;
use App\Models\VocabWord;
use App\Services\McqSkillService;
use App\Services\ProgressService;
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

    public function run(McqSkillService $mcqService, WalletService $walletService, ProgressService $progressService): void
    {
        $profile = Profile::query()->where('nickname', self::MAIN_NICKNAME)->first();
        if (! $profile) {
            $this->command?->warn('Demo learner "Minh" not found. Run DemoAccountSeeder first.');

            return;
        }

        $version = ExamVersion::query()->first();
        if (! $version) {
            $this->command?->warn('No exam version found. Run ContentSeeder first.');

            return;
        }

        // ── Main Profile ──
        $this->seedActivityAndStreak($profile, self::ACTIVITY_DAYS, self::ACTIVITY_PROBABILITY, 12);
        $this->seedExamSessions($profile, $version, self::MAIN_BANDS);
        $this->seedPracticeHistory($profile, $mcqService);
        $this->seedVocabSrs($profile);
        $this->seedWalletTransactions($profile, $walletService);
        $this->seedExerciseFeedback($profile);

        // ── Extra Profiles ──
        foreach (self::EXTRA_BANDS as $nickname => $bands) {
            $extra = Profile::query()->where('nickname', $nickname)->first();
            if (! $extra) {
                continue;
            }

            $this->seedExamSessions($extra, $version, $bands);

            if ($nickname !== 'inactive_student') {
                $this->seedActivityAndStreak($extra, 14, 0.5, 3);
            }
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
        $typePool = ['listening', 'reading', 'vocab_review', 'exam_session'];

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
     */
    private function seedExamSessions(Profile $profile, ExamVersion $version, array $bands): void
    {
        $existing = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->where('status', 'submitted')
            ->count();

        if ($existing >= 6) {
            return;
        }

        $writingTaskId = DB::table('exam_version_writing_tasks')
            ->where('exam_version_id', $version->id)
            ->value('id');

        $speakingPartId = DB::table('exam_version_speaking_parts')
            ->where('exam_version_id', $version->id)
            ->value('id');

        $listeningItems = DB::table('exam_version_listening_items')
            ->join('exam_version_listening_sections', 'exam_version_listening_sections.id', '=', 'exam_version_listening_items.section_id')
            ->where('exam_version_listening_sections.exam_version_id', $version->id)
            ->pluck('exam_version_listening_items.id');

        $readingItems = DB::table('exam_version_reading_items')
            ->join('exam_version_reading_passages', 'exam_version_reading_passages.id', '=', 'exam_version_reading_items.passage_id')
            ->where('exam_version_reading_passages.exam_version_id', $version->id)
            ->pluck('exam_version_reading_items.id');

        for ($i = 0; $i < self::EXAM_SESSION_COUNT; $i++) {
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
                'status' => 'submitted',
                'coins_charged' => 0,
            ]);

            $listeningProb = $bands['listening'] / 10;
            $readingProb = $bands['reading'] / 10;
            $this->seedMcqAnswers($session->id, 'exam_listening_item', $listeningItems, $submittedAt, $listeningProb);
            $this->seedMcqAnswers($session->id, 'exam_reading_item', $readingItems, $submittedAt, $readingProb);

            if ($writingTaskId) {
                $this->seedWritingResult($session->id, $profile->id, $writingTaskId, $submittedAt, $bands['writing']);
            }
            if ($speakingPartId) {
                $this->seedSpeakingResult($session->id, $profile->id, $speakingPartId, $submittedAt, $bands['speaking']);
            }
        }
    }

    private function seedMcqAnswers(string $sessionId, string $itemType, Collection $itemIds, \DateTimeInterface $answeredAt, float $correctProb): void
    {
        foreach ($itemIds as $itemId) {
            ExamMcqAnswer::create([
                'session_id' => $sessionId,
                'item_ref_type' => $itemType,
                'item_ref_id' => $itemId,
                'selected_index' => rand(0, self::MCQ_OPTION_COUNT - 1),
                'is_correct' => mt_rand() / mt_getrandmax() < $correctProb,
                'answered_at' => $answeredAt,
            ]);
        }
    }

    private function seedWritingResult(string $sessionId, string $profileId, string $taskId, \DateTimeInterface $submittedAt, float $band): void
    {
        $submission = ExamWritingSubmission::create([
            'session_id' => $sessionId,
            'profile_id' => $profileId,
            'task_id' => $taskId,
            'text' => 'Seed writing submission.',
            'word_count' => rand(120, 250),
            'submitted_at' => $submittedAt,
        ]);

        $rubric = $this->rubric(AssessmentTaskType::WritingTask2Essay);
        $attempt = AssessmentAttempt::create([
            'profile_id' => $profileId,
            'rubric_id' => $rubric->id,
            'skill' => AssessmentSkill::Writing,
            'task_type' => AssessmentTaskType::WritingTask2Essay,
            'source_type' => AssessmentSourceType::Exam,
            'source_id' => $submission->id,
            'prompt' => ['requirements' => ['Demo writing task']],
            'response_payload' => ['text' => $submission->text, 'metadata' => ['word_count' => $submission->word_count]],
            'submitted_at' => $submittedAt,
        ]);

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

    private function seedSpeakingResult(string $sessionId, string $profileId, string $partId, \DateTimeInterface $submittedAt, float $band): void
    {
        $audioKey = 'audio/exam_speaking/'.$profileId.'/demo-'.uniqid().'.mp3';
        $audioUrl = 'https://demo.vstep.test/'.$audioKey;
        $submission = ExamSpeakingSubmission::create([
            'session_id' => $sessionId,
            'profile_id' => $profileId,
            'part_id' => $partId,
            'audio_key' => $audioKey,
            'audio_url' => $audioUrl,
            'duration_seconds' => rand(60, 180),
            'transcript' => 'Seed speaking transcript.',
            'submitted_at' => $submittedAt,
        ]);

        $rubric = $this->rubric(AssessmentTaskType::SpeakingPart1Personal);
        $attempt = AssessmentAttempt::create([
            'profile_id' => $profileId,
            'rubric_id' => $rubric->id,
            'skill' => AssessmentSkill::Speaking,
            'task_type' => AssessmentTaskType::SpeakingPart1Personal,
            'source_type' => AssessmentSourceType::Exam,
            'source_id' => $submission->id,
            'prompt' => ['requirements' => ['Demo speaking task']],
            'response_payload' => [
                'audio_key' => $submission->audio_key,
                'audio_url' => $submission->audio_url,
                'metadata' => ['duration_seconds' => $submission->duration_seconds],
            ],
            'submitted_at' => $submittedAt,
        ]);

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

            // Submit qua service — validates session state, question mapping, score calc
            $result = $mcqService->submitSession($session, $skill, $answers);

            // Backdate completion time
            $session->update([
                'started_at' => $startedAt,
                'ended_at' => $startedAt->copy()->addMinutes(rand(10, 25)),
            ]);

            // Activity record for this practice
            $this->recordActivityForDate($profile, $skill, $startedAt);
        }
    }

    private function wrongIndex(int $correctIndex): int
    {
        $options = [0, 1, 2, 3];
        unset($options[$correctIndex]);

        return (int) array_rand(array_values($options));
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
    // VOCAB SRS — raw (FSRS scheduler is complex, tested separately)
    // ═══════════════════════════════════════════════════════════════

    private function seedVocabSrs(Profile $profile): void
    {
        if (ProfileVocabSrsState::query()->where('profile_id', $profile->id)->exists()) {
            return;
        }

        $words = VocabWord::query()->orderBy('id')->limit(60)->get();
        if ($words->isEmpty()) {
            return;
        }

        $now = now();

        foreach ($words as $i => $word) {
            if ($i < 20) {
                ProfileVocabSrsState::create([
                    'profile_id' => $profile->id,
                    'word_id' => $word->id,
                    'state_kind' => 'new',
                    'difficulty' => 0.3,
                    'stability' => 0,
                    'lapses' => 0,
                    'remaining_steps' => 1,
                    'due_at' => $now,
                    'last_review_at' => null,
                ]);
            } elseif ($i < 40) {
                ProfileVocabSrsState::create([
                    'profile_id' => $profile->id,
                    'word_id' => $word->id,
                    'state_kind' => 'learning',
                    'difficulty' => 0.5,
                    'stability' => 2.0,
                    'lapses' => 1,
                    'remaining_steps' => 0,
                    'due_at' => $now->copy()->subMinutes(rand(1, 60)),
                    'last_review_at' => $now->copy()->subHours(rand(4, 24)),
                ]);
            } else {
                ProfileVocabSrsState::create([
                    'profile_id' => $profile->id,
                    'word_id' => $word->id,
                    'state_kind' => 'review',
                    'difficulty' => 0.7,
                    'stability' => 15.0,
                    'lapses' => 0,
                    'remaining_steps' => 0,
                    'due_at' => $now->copy()->addDays(rand(1, 14)),
                    'last_review_at' => $now->copy()->subDays(rand(1, 10)),
                ]);
            }
        }
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
            $walletService->credit($profile, 300, CoinTransactionType::AdminGrant);
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
                'comment' => 'Bài đọc rất sát với đề thi VSTEP thật. Phần giải thích rõ ràng, dễ hiểu!',
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
                'comment' => 'Audio chất lượng tốt, nhưng tốc độ hơi nhanh. Nên có thêm phần tua lại.',
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
