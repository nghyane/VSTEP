<?php

declare(strict_types=1);

namespace Tests\Feature\Exam;

use App\Enums\CoinTransactionType;
use App\Enums\ExamSessionStatus;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\ExamVersionListeningItem;
use App\Models\ExamVersionListeningSection;
use App\Models\ExamVersionReadingItem;
use App\Models\ExamVersionReadingPassage;
use App\Models\ExamVersionSpeakingPart;
use App\Models\ExamVersionWritingTask;
use App\Models\Profile;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExamSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_start_full_session_charges_coins(): void
    {
        [$user, $profile, $exam, $version] = $this->seedExam();
        $token = $this->tokenFor($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", [
                'mode' => 'full',
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'active');
        $response->assertJsonPath('data.coins_charged', 25);

        $balance = $this->app->make(WalletService::class)->getBalance($profile);
        $this->assertSame(75, $balance); // 100 onboarding - 25
    }

    public function test_start_custom_session_charges_per_skill(): void
    {
        [$user, $profile, $exam] = $this->seedExam();
        $token = $this->tokenFor($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", [
                'mode' => 'custom',
                'selected_skills' => ['listening'],
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.coins_charged', 8);
    }

    public function test_start_session_rejects_insufficient_balance(): void
    {
        [$user, $profile, $exam] = $this->seedExam();
        $wallet = $this->app->make(WalletService::class);
        $wallet->spend($profile, 90, CoinTransactionType::ExamCustom);

        $token = $this->tokenFor($user);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->assertStatus(422);
    }

    public function test_submit_scores_mcq_correctly(): void
    {
        [$user, $profile, $exam, $version] = $this->seedExam();
        $token = $this->tokenFor($user);

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $listeningItem = ExamVersionListeningItem::query()->first();
        $readingItem = ExamVersionReadingItem::query()->first();

        $submit = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/submit", [
                'mcq_answers' => [
                    ['item_ref_type' => 'exam_listening_item', 'item_ref_id' => $listeningItem->id, 'selected_index' => $listeningItem->correct_index],
                    ['item_ref_type' => 'exam_reading_item', 'item_ref_id' => $readingItem->id, 'selected_index' => 3],
                ],
            ]);

        $submit->assertOk();
        $submit->assertJsonPath('data.status', 'submitted');
        $submit->assertJsonPath('data.mcq.score', 1);
        $submit->assertJsonPath('data.mcq.total', 2);
    }

    public function test_session_results_returns_server_read_model(): void
    {
        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $listeningItem = ExamVersionListeningItem::query()->firstOrFail();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/submit", [
                'mcq_answers' => [
                    [
                        'item_ref_type' => 'exam_listening_item',
                        'item_ref_id' => $listeningItem->id,
                        'selected_index' => $listeningItem->correct_index,
                    ],
                ],
            ])
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/exam-sessions/{$sessionId}/results")
            ->assertOk()
            ->assertJsonPath('data.summary.mcq_score', 1)
            ->assertJsonPath('data.summary.mcq_total', 2)
            ->assertJsonPath('data.summary.has_pending_ai', false)
            ->assertJsonPath('data.performance_rows.0.label', 'Nghe · Part 1')
            ->assertJsonPath('data.performance_rows.0.correct', 1)
            ->assertJsonPath('data.performance_rows.1.label', 'Đọc · Passage 1')
            ->assertJsonPath('data.performance_rows.1.wrong', 1)
            ->assertJsonPath('data.performance_rows.2.status', 'not_submitted')
            ->assertJsonPath('data.performance_rows.3.status', 'not_submitted')
            ->assertJsonPath('data.mcq_detail.1.selected_index', null);
    }

    public function test_submit_rejects_already_submitted(): void
    {
        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/submit")->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/submit")->assertStatus(422);
    }

    public function test_my_sessions_submitted_filter_includes_terminal_statuses(): void
    {
        [$user, $profile, , $version] = $this->seedExam();
        $token = $this->tokenFor($user);

        foreach ([
            ExamSessionStatus::Submitted,
            ExamSessionStatus::AutoSubmitted,
            ExamSessionStatus::Grading,
            ExamSessionStatus::Graded,
        ] as $index => $status) {
            ExamSession::create([
                'profile_id' => $profile->id,
                'exam_version_id' => $version->id,
                'mode' => 'full',
                'selected_skills' => ['listening', 'reading', 'writing', 'speaking'],
                'is_full_test' => true,
                'status' => $status,
                'started_at' => now()->subMinutes($index + 1),
                'submitted_at' => now()->subMinutes($index),
                'server_deadline_at' => now()->addHour(),
                'coins_charged' => 25,
            ]);
        }
        ExamSession::create([
            'profile_id' => $profile->id,
            'exam_version_id' => $version->id,
            'mode' => 'full',
            'selected_skills' => ['listening', 'reading', 'writing', 'speaking'],
            'is_full_test' => true,
            'status' => ExamSessionStatus::Active,
            'started_at' => now(),
            'submitted_at' => null,
            'server_deadline_at' => now()->addHour(),
            'coins_charged' => 25,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/exam-sessions?status=submitted')
            ->assertOk()
            ->assertJsonCount(4, 'data');

        $this->assertEqualsCanonicalizing(
            ['submitted', 'auto_submitted', 'grading', 'graded'],
            array_column($response->json('data'), 'status'),
        );
    }

    public function test_submit_speaking_uses_audio_key_and_stores_public_url(): void
    {
        [$user, $profile, $exam] = $this->seedExam();
        $part = ExamVersionSpeakingPart::query()->firstOrFail();
        $audioKey = "audio/exam_speaking/{$profile->id}/part-1.webm";
        Storage::fake('s3');
        Storage::disk('s3')->put($audioKey, 'fake audio');

        $token = $this->tokenFor($user);
        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/submit", [
                'speaking_answers' => [[
                    'part_id' => $part->id,
                    'audio_key' => $audioKey,
                    'duration_seconds' => 60,
                ]],
            ])
            ->assertOk()
            ->assertJsonPath('data.speaking_jobs.0.status', 'pending');

        $this->assertDatabaseHas('exam_speaking_submissions', [
            'session_id' => $sessionId,
            'audio_key' => $audioKey,
        ]);
    }

    private function seedExam(): array
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();

        $exam = Exam::create([
            'slug' => 'vstep-test-1', 'title' => 'Test Exam', 'total_duration_minutes' => 60,
            'is_published' => true,
        ]);
        $version = ExamVersion::create([
            'exam_id' => $exam->id, 'version_number' => 1, 'is_active' => true,
            'published_at' => now(),
        ]);
        $section = ExamVersionListeningSection::create([
            'exam_version_id' => $version->id, 'part' => 1, 'part_title' => 'Part 1',
            'duration_minutes' => 10,
        ]);
        ExamVersionListeningItem::create([
            'section_id' => $section->id, 'display_order' => 0,
            'stem' => 'Q1?', 'options' => ['A', 'B', 'C', 'D'], 'correct_index' => 0,
        ]);
        $passage = ExamVersionReadingPassage::create([
            'exam_version_id' => $version->id, 'part' => 1, 'title' => 'Passage 1',
            'duration_minutes' => 15, 'passage' => 'Text...',
        ]);
        ExamVersionReadingItem::create([
            'passage_id' => $passage->id, 'display_order' => 0,
            'stem' => 'Q2?', 'options' => ['A', 'B', 'C', 'D'], 'correct_index' => 1,
        ]);
        ExamVersionWritingTask::create([
            'exam_version_id' => $version->id, 'part' => 1, 'task_type' => 'letter',
            'duration_minutes' => 20, 'prompt' => 'Write...', 'min_words' => 100,
        ]);
        ExamVersionSpeakingPart::create([
            'exam_version_id' => $version->id,
            'part' => 1,
            'type' => 'social',
            'duration_minutes' => 5,
            'speaking_seconds' => 60,
            'content' => ['questions' => ['Introduce yourself.']],
            'display_order' => 0,
        ]);

        return [$user, $profile, $exam, $version];
    }

    private function tokenFor(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->json('data.access_token');
    }
}
