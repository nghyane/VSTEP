<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Ai\Contracts\ContentRelevanceAssessor;
use App\Ai\Contracts\SpeakingFeedbackGenerator;
use App\Assessment\Enums\AssessmentJobStatus;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Services\AssessmentProcessingService;
use App\Enums\ExamSessionStatus;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentJob;
use App\Models\AssessmentResult;
use App\Models\ExamSession;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamVersion;
use App\Models\Profile;
use App\Models\User;
use App\Services\Ai\LlmContentRelevanceAssessor;
use App\Services\Ai\LlmSpeakingFeedbackGenerator;
use App\Services\AudioStorageService;
use App\Services\ExamSessionService;
use App\Services\LanguageToolService;
use App\Services\SpeechToText;
use App\Services\SpeechToTextService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

final class DemoSpeakingAssessmentSeeder extends Seeder
{
    private const DEMO_LEARNER_EMAIL = 'learner@vstep.test';

    private const AUDIO_KEY_BASENAME = 'demo-speaking-b2.wav';

    private const DURATION_SECONDS = 60;

    private const TRANSCRIPT = 'I would like to talk about the way technology can support learning outside the classroom. In my opinion, online tools are useful because they give students more control over their study time. For example, when I prepare for an English speaking test, I often record my answers, listen to the mistakes, and then try again with better vocabulary and clearer organization. This process helps me become more confident, especially when I have to explain reasons or give examples under time pressure. However, technology should not completely replace teachers. A good teacher can notice problems that an application may miss, such as whether my ideas are logical or whether my pronunciation sounds natural. Therefore, I think the best solution is to combine digital practice with regular feedback from teachers and classmates. If students use these tools in a disciplined way, they can make steady progress and communicate more effectively in real situations.';

    public function run(): void
    {
        $profile = $this->demoProfile();
        $version = $this->examVersion();
        $part = $version->speakingParts->firstWhere('part', 1) ?? $version->speakingParts->first();
        if ($part === null) {
            throw new \RuntimeException('Demo speaking assessment requires an exam speaking part.');
        }

        $audioKey = 'audio/exam_speaking/'.$profile->id.'/'.self::AUDIO_KEY_BASENAME;
        $existing = $this->existingReadyResult($audioKey);
        if ($existing !== null) {
            $this->command?->info("Demo speaking assessment already seeded: band {$existing->overall_band}.");

            return;
        }

        $this->cleanupIncompleteDemo($audioKey);
        $this->uploadAudioFixture($audioKey);
        $this->abandonActiveDemoSessions($profile, $version);

        $previousQueue = Queue::getDefaultDriver();
        config(['queue.default' => 'sync']);
        Queue::setDefaultDriver('sync');
        $this->bindDeterministicAssessmentDoubles();

        try {
            $session = app(ExamSessionService::class)->startSession(
                profile: $profile,
                version: $version,
                mode: 'custom',
                selectedSkills: ['speaking'],
            );

            $submitResult = app(ExamSessionService::class)->submit(
                profile: $profile,
                session: $session,
                speakingAnswers: [[
                    'part_id' => $part->id,
                    'audio_key' => $audioKey,
                    'duration_seconds' => self::DURATION_SECONDS,
                ]],
            );

            $jobId = $submitResult->speakingJobs[0]['job_id'] ?? null;
            if (! is_string($jobId)) {
                throw new \RuntimeException('Demo speaking submission did not create an assessment job.');
            }

            $job = AssessmentJob::query()->findOrFail($jobId);
            if ($job->status !== AssessmentJobStatus::Ready) {
                app(AssessmentProcessingService::class)->process($job);
            }
        } finally {
            config(['queue.default' => $previousQueue]);
            Queue::setDefaultDriver($previousQueue);
            $this->restoreAssessmentBindings();
        }

        $result = $this->existingReadyResult($audioKey)
            ?? throw new \RuntimeException('Demo speaking assessment result was not created.');

        $this->command?->info("Demo speaking assessment seeded: band {$result->overall_band}.");
    }

    private function demoProfile(): Profile
    {
        $user = User::query()->where('email', self::DEMO_LEARNER_EMAIL)->firstOrFail();
        $profile = $user->initialProfile();

        return $profile ?? throw new \RuntimeException('Demo learner initial profile not found. Run DemoAccountSeeder first.');
    }

    private function examVersion(): ExamVersion
    {
        /** @var ExamVersion|null $version */
        $version = ExamVersion::query()
            ->where('is_active', true)
            ->whereHas('speakingParts')
            ->with(['exam', 'speakingParts'])
            ->orderBy('id')
            ->first();

        return $version ?? throw new \RuntimeException('No active exam version with speaking parts found.');
    }

    private function existingReadyResult(string $audioKey): ?AssessmentResult
    {
        $submission = ExamSpeakingSubmission::query()
            ->with('assessmentAttempt.result')
            ->where('audio_key', $audioKey)
            ->latest('submitted_at')
            ->first();

        return $submission?->assessmentAttempt?->result;
    }

    private function cleanupIncompleteDemo(string $audioKey): void
    {
        $submissions = ExamSpeakingSubmission::query()
            ->where('audio_key', $audioKey)
            ->get(['id', 'session_id']);

        if ($submissions->isEmpty()) {
            return;
        }

        AssessmentAttempt::query()
            ->where('source_type', AssessmentSourceType::Exam->value)
            ->whereIn('source_id', $submissions->pluck('id')->all())
            ->delete();

        ExamSession::query()
            ->whereIn('id', $submissions->pluck('session_id')->all())
            ->delete();
    }

    private function uploadAudioFixture(string $audioKey): void
    {
        $path = (string) env('DEMO_SPEAKING_AUDIO_PATH', 'public/e2e-speaking-sample.wav');
        $fixture = str_starts_with($path, '/') ? $path : base_path($path);
        if (! is_file($fixture)) {
            throw new \RuntimeException("Demo speaking audio fixture not found: {$fixture}");
        }

        Storage::disk('s3')->put($audioKey, (string) file_get_contents($fixture));
    }

    private function abandonActiveDemoSessions(Profile $profile, ExamVersion $version): void
    {
        ExamSession::query()
            ->where('profile_id', $profile->id)
            ->where('exam_version_id', $version->id)
            ->where('status', ExamSessionStatus::Active->value)
            ->update([
                'status' => ExamSessionStatus::Abandoned->value,
                'submitted_at' => now(),
            ]);
    }

    private function bindDeterministicAssessmentDoubles(): void
    {
        $transcript = self::TRANSCRIPT;
        $durationSeconds = self::DURATION_SECONDS;

        app()->bind(SpeechToText::class, fn () => new class($transcript, $durationSeconds) implements SpeechToText
        {
            public function __construct(
                private readonly string $transcript,
                private readonly int $durationSeconds,
            ) {}

            public function transcribe(string $audioContent, string $language = 'en-US', ?string $contentType = null): ?array
            {
                return $this->result();
            }

            public function transcribeFromStorage(string $audioKey, AudioStorageService $storage): ?array
            {
                return $this->result();
            }

            /** @return array<string,mixed> */
            private function result(): array
            {
                $wordCount = str_word_count($this->transcript);

                return [
                    'text' => $this->transcript,
                    'confidence' => 0.96,
                    'duration_ms' => $this->durationSeconds * 1000,
                    'word_count' => $wordCount,
                    'pause_count' => 4,
                    'speaking_rate' => round($wordCount / $this->durationSeconds * 60, 1),
                    'pronunciation' => [
                        'accuracy' => 9.2,
                        'fluency' => 8.6,
                        'prosody' => 8.8,
                        'completeness' => 9.3,
                        'overall' => 9.0,
                        'mispronunciation_count' => 1,
                        'unexpected_break_count' => 1,
                        'missing_break_count' => 0,
                        'monotone_count' => 0,
                        'low_accuracy_words' => [],
                    ],
                ];
            }
        });

        app()->bind(ContentRelevanceAssessor::class, fn () => new class implements ContentRelevanceAssessor
        {
            public function assess(string $transcript, string $prompt, array $requirements): float
            {
                return 0.9;
            }
        });

        app()->bind(SpeakingFeedbackGenerator::class, fn () => new class implements SpeakingFeedbackGenerator
        {
            public function generate(string $transcript, string $promptText, array $scores, array $metrics, ?array $bandContext = null): array
            {
                return [
                    'strengths' => [
                        'Bài nói phát triển ý rõ ràng với ví dụ cụ thể về việc tự ghi âm và sửa lỗi.',
                        'Từ vựng phù hợp trình độ B2, có các cụm như outside the classroom, under time pressure, và regular feedback.',
                        'Cách tổ chức câu trả lời mạch lạc, có quan điểm, ví dụ, nhượng bộ và kết luận.',
                    ],
                    'improvements' => [
                        'Có thể thêm một ví dụ cá nhân ngắn hơn để phần mở đầu tự nhiên hơn.',
                        'Luyện nối âm và ngữ điệu ở các câu dài để bài nói nghe linh hoạt hơn.',
                        'Giảm mật độ ý ở phần giữa bài để người nghe dễ theo dõi hơn.',
                    ],
                ];
            }
        });

        app()->bind(LanguageToolService::class, fn () => new class extends LanguageToolService
        {
            public function check(string $text, string $language = 'en-US'): array
            {
                return [];
            }
        });
    }

    private function restoreAssessmentBindings(): void
    {
        app()->bind(SpeechToText::class, SpeechToTextService::class);
        app()->bind(ContentRelevanceAssessor::class, LlmContentRelevanceAssessor::class);
        app()->bind(SpeakingFeedbackGenerator::class, LlmSpeakingFeedbackGenerator::class);
        app()->bind(LanguageToolService::class, LanguageToolService::class);
    }
}
