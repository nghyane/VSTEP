<?php

declare(strict_types=1);

namespace Tests\Feature\Exam;

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
use App\Models\Exam;
use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamSessionDraft;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamVersion;
use App\Models\ExamVersionListeningItem;
use App\Models\ExamVersionListeningSection;
use App\Models\ExamVersionReadingItem;
use App\Models\ExamVersionReadingPassage;
use App\Models\ExamVersionSpeakingPart;
use App\Models\ExamVersionWritingTask;
use App\Models\ExamWritingSubmission;
use App\Models\Profile;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
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

    public function test_start_session_applies_time_extension_factor(): void
    {
        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);

        $fastSessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", [
                'mode' => 'full',
                'time_extension_factor' => 0.8,
            ])
            ->assertCreated()
            ->json('data.session_id');

        $fastSession = ExamSession::query()->findOrFail($fastSessionId);
        $this->assertSame(0.8, $fastSession->time_extension_factor);
        $this->assertSame(40, (int) $fastSession->started_at->diffInMinutes($fastSession->server_deadline_at, false));

        $otherUser = User::factory()->create();
        Profile::factory()->initial()->forAccount($otherUser)->create();
        $slowToken = $this->tokenFor($otherUser);

        $slowSessionId = $this->withHeader('Authorization', "Bearer {$slowToken}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", [
                'mode' => 'full',
                'time_extension_factor' => 1.4,
            ])
            ->assertCreated()
            ->json('data.session_id');

        $slowSession = ExamSession::query()->findOrFail($slowSessionId);
        $this->assertSame(1.4, $slowSession->time_extension_factor);
        $this->assertSame(70, (int) $slowSession->started_at->diffInMinutes($slowSession->server_deadline_at, false));
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

    public function test_submit_blank_productive_answers_scores_zero(): void
    {
        Queue::fake();

        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $task = ExamVersionWritingTask::query()->firstOrFail();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/submit", [
                'writing_answers' => [[
                    'task_id' => $task->id,
                    'text' => '',
                    'word_count' => 0,
                ]],
            ])
            ->assertOk()
            ->assertJsonPath('data.writing_jobs', [])
            ->assertJsonPath('data.speaking_jobs', []);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/exam-sessions/{$sessionId}/results")
            ->assertOk()
            ->assertJsonPath('data.summary.score_status', 'ready')
            ->assertJsonPath('data.summary.has_pending_jobs', false)
            ->assertJsonPath('data.summary.overall.band', 0)
            ->assertJsonPath('data.session.scores.listening', 0)
            ->assertJsonPath('data.session.scores.reading', 0)
            ->assertJsonPath('data.session.scores.writing', 0)
            ->assertJsonPath('data.session.scores.speaking', 0)
            ->assertJsonPath('data.writing_feedback.0.score_status', 'ready')
            ->assertJsonPath('data.writing_feedback.0.feedback_status', 'none')
            ->assertJsonPath('data.writing_feedback.0.overall_band', 0)
            ->assertJsonPath('data.speaking_feedback.0.score_status', 'ready')
            ->assertJsonPath('data.speaking_feedback.0.feedback_status', 'none')
            ->assertJsonPath('data.speaking_feedback.0.overall_band', 0)
            ->assertJsonPath('data.review.skills.2.score_label', 'Band 0')
            ->assertJsonPath('data.review.skills.3.score_label', 'Band 0');

        $this->assertDatabaseHas('exam_writing_submissions', [
            'session_id' => $sessionId,
            'task_id' => $task->id,
            'text' => '',
            'word_count' => 0,
        ]);
    }

    public function test_submit_empty_full_test_scores_zero(): void
    {
        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/submit")
            ->assertOk()
            ->assertJsonPath('data.mcq.score', 0)
            ->assertJsonPath('data.mcq.total', 2)
            ->assertJsonPath('data.writing_jobs', [])
            ->assertJsonPath('data.speaking_jobs', []);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/exam-sessions/{$sessionId}/results")
            ->assertOk()
            ->assertJsonPath('data.summary.score_status', 'ready')
            ->assertJsonPath('data.summary.overall.band', 0)
            ->assertJsonPath('data.session.scores.listening', 0)
            ->assertJsonPath('data.session.scores.reading', 0)
            ->assertJsonPath('data.session.scores.writing', 0)
            ->assertJsonPath('data.session.scores.speaking', 0)
            ->assertJsonPath('data.writing_feedback.0.submission_id', null)
            ->assertJsonPath('data.writing_feedback.0.score_status', 'ready')
            ->assertJsonPath('data.writing_feedback.0.overall_band', 0)
            ->assertJsonPath('data.speaking_feedback.0.submission_id', null)
            ->assertJsonPath('data.speaking_feedback.0.score_status', 'ready')
            ->assertJsonPath('data.speaking_feedback.0.overall_band', 0);
    }

    public function test_session_results_returns_server_read_model(): void
    {
        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $listeningItem = ExamVersionListeningItem::query()->firstOrFail();
        $listeningSection = ExamVersionListeningSection::query()->firstOrFail();
        $readingPassage = ExamVersionReadingPassage::query()->firstOrFail();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/listening-played", ['section_id' => $listeningSection->id])
            ->assertOk();

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

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/exam-sessions/{$sessionId}/results")
            ->assertOk()
            ->assertJsonPath('data.summary.score_status', 'ready')
            ->assertJsonPath('data.session.scores.listening', 10)
            ->assertJsonPath('data.session.scores.reading', 0)
            ->assertJsonPath('data.session.scores.writing', 0)
            ->assertJsonPath('data.session.scores.speaking', 0)
            ->assertJsonPath('data.summary.feedback_status', 'none')
            ->assertJsonPath('data.summary.has_pending_jobs', false)
            ->assertJsonPath('data.summary.display.band_title', 'Band VSTEP thi thử')
            ->assertJsonPath('data.summary.display.band_value', '2.5/10')
            ->assertJsonPath('data.summary.display.total_score_title', 'Điểm tổng theo công thức')
            ->assertJsonPath('data.summary.display.total_score_value', '2.5/10')
            ->assertJsonPath('data.summary.display.pending_badge_label', null)
            ->assertJsonPath('data.summary.overall.applicable', true)
            ->assertJsonPath('data.summary.overall.band', 2.5)
            ->assertJsonPath('data.summary.overall.score_on_10', 2.5)
            ->assertJsonPath('data.summary.overall.vstep_level', 'Không đạt')
            ->assertJsonPath('data.summary.overall.cefr_level', null)
            ->assertJsonPath('data.summary.overall.result_label', 'Không đạt')
            ->assertJsonPath('data.summary.mcq.correct', 1)
            ->assertJsonPath('data.summary.mcq.unanswered', 1)
            ->assertJsonPath('data.review.skills.0.key', 'listening')
            ->assertJsonPath('data.review.skills.0.status_label', 'Đã có kết quả')
            ->assertJsonPath('data.review.skills.0.score_label', '1/1')
            ->assertJsonPath('data.review.skills.2.score_label', 'Band 0')
            ->assertJsonPath('data.review.skills.3.score_label', 'Band 0')
            ->assertJsonPath('data.review.sections.0.status', 'ready')
            ->assertJsonPath('data.review.sections.0.status_label', 'Đã có kết quả')
            ->assertJsonPath('data.review.sections.0.source_type', 'exam_listening_part')
            ->assertJsonPath('data.review.sections.0.source_id', $listeningSection->id)
            ->assertJsonPath('data.review.sections.0.part', 1)
            ->assertJsonPath('data.review.sections.0.display_order', (int) $listeningSection->display_order)
            ->assertJsonPath('data.review.sections.0.short_label', 'P1')
            ->assertJsonPath('data.review.sections.1.source_type', 'exam_reading_passage')
            ->assertJsonPath('data.review.sections.1.source_id', $readingPassage->id)
            ->assertJsonPath('data.review.sections.1.short_label', 'Đ1')
            ->assertJsonPath('data.review.sections.2.status', 'ready')
            ->assertJsonPath('data.review.sections.2.score_label', 'Band 0')
            ->assertJsonPath('data.review.sections.3.status', 'ready')
            ->assertJsonPath('data.review.sections.3.score_label', 'Band 0')
            ->assertJsonPath('data.mcq_detail.0.answered', true)
            ->assertJsonPath('data.mcq_detail.0.answer_status', 'correct')
            ->assertJsonPath('data.mcq_detail.0.answer_status_label', 'Đúng')
            ->assertJsonPath('data.mcq_detail.0.answer_tone', 'correct')
            ->assertJsonPath('data.mcq_detail.0.selected_label', 'A')
            ->assertJsonPath('data.mcq_detail.0.correct_label', 'A')
            ->assertJsonPath('data.mcq_detail.0.selected_summary_label', 'Bạn chọn A')
            ->assertJsonPath('data.mcq_detail.0.correct_summary_label', 'Đáp án đúng A')
            ->assertJsonPath('data.mcq_detail.1.selected_index', null)
            ->assertJsonPath('data.mcq_detail.1.answered', false)
            ->assertJsonPath('data.mcq_detail.1.answer_status', 'unanswered')
            ->assertJsonPath('data.mcq_detail.1.answer_status_label', 'Chưa làm')
            ->assertJsonPath('data.mcq_detail.1.answer_tone', null)
            ->assertJsonPath('data.mcq_detail.1.selected_summary_label', 'Bạn chưa trả lời')
            ->assertJsonPath('data.version.id', ExamVersion::query()->firstOrFail()->id)
            ->assertJsonCount(1, 'data.version.listening_sections')
            ->assertJsonPath('data.listening_play_summary.0.played', true)
            ->assertJsonMissingPath('data.scores')
            ->assertJsonMissingPath('data.performance_rows')
            ->assertJsonMissingPath('data.overall_band')
            ->assertJsonMissingPath('data.level')
            ->assertJsonMissingPath('data.mcq')
            ->assertJsonMissingPath('data.summary.score_on_10')
            ->assertJsonMissingPath('data.summary.overall_score_on_10')
            ->assertJsonMissingPath('data.summary.has_pending_ai');

        $this->assertNotNull($response->json('data.listening_play_summary.0.played_at'));
    }

    public function test_session_results_exposes_pending_feedback_state(): void
    {
        Queue::fake();

        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $task = ExamVersionWritingTask::query()->firstOrFail();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/submit", [
                'writing_answers' => [[
                    'task_id' => $task->id,
                    'text' => 'This is my exam writing response.',
                    'word_count' => 6,
                ]],
            ])
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/exam-sessions/{$sessionId}/results")
            ->assertOk()
            ->assertJsonPath('data.summary.score_status', 'pending')
            ->assertJsonPath('data.summary.feedback_status', 'pending')
            ->assertJsonPath('data.summary.has_pending_jobs', true)
            ->assertJsonPath('data.summary.display.band_value', 'Đang chấm')
            ->assertJsonPath('data.summary.display.total_score_value', 'Đang chờ')
            ->assertJsonPath('data.summary.display.pending_badge_label', 'Đang chấm')
            ->assertJsonPath('data.writing_feedback.0.score_status', 'pending')
            ->assertJsonPath('data.writing_feedback.0.feedback_status', 'pending')
            ->assertJsonPath('data.review.skills.2.key', 'writing')
            ->assertJsonPath('data.review.skills.2.status_label', 'Đang chấm')
            ->assertJsonPath('data.review.skills.2.score_label', 'Đang chấm')
            ->assertJsonPath('data.review.sections.2.status', 'pending');
    }

    public function test_session_results_returns_ready_overall_and_feedback(): void
    {
        [$user, $profile, $exam, $version] = $this->seedExam();
        $this->createSecondWritingTask($version);
        $session = $this->createSession($profile, $version, ExamSessionStatus::Submitted);

        $listeningItem = ExamVersionListeningItem::query()->firstOrFail();
        $readingItem = ExamVersionReadingItem::query()->firstOrFail();
        $this->createMcqAnswer($session, 'exam_listening_item', $listeningItem->id, $listeningItem->correct_index);
        $this->createMcqAnswer($session, 'exam_reading_item', $readingItem->id, $readingItem->correct_index);

        $writingTasks = ExamVersionWritingTask::query()->orderBy('part')->get();
        $this->createAssessedWriting($profile, $session, $writingTasks->get(0), 6.0, $this->feedbackPayload());
        $this->createAssessedWriting($profile, $session, $writingTasks->get(1), 7.0, $this->feedbackPayload());
        $this->createAssessedSpeaking(
            $profile,
            $session,
            ExamVersionSpeakingPart::query()->firstOrFail(),
            6.0,
            $this->feedbackPayload(),
        );

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->getJson("/api/v1/exam-sessions/{$session->id}/results")
            ->assertOk()
            ->assertJsonPath('data.summary.score_status', 'ready')
            ->assertJsonPath('data.summary.feedback_status', 'ready')
            ->assertJsonPath('data.summary.has_pending_jobs', false)
            ->assertJsonPath('data.summary.has_failed_jobs', false)
            ->assertJsonPath('data.summary.display.band_value', '8/10')
            ->assertJsonPath('data.summary.display.total_score_value', '8/10')
            ->assertJsonPath('data.summary.overall.applicable', true)
            ->assertJsonPath('data.summary.overall.band', 8)
            ->assertJsonPath('data.summary.overall.score_on_10', 8)
            ->assertJsonPath('data.summary.overall.vstep_level', 'B2')
            ->assertJsonPath('data.summary.overall.cefr_level', null)
            ->assertJsonPath('data.summary.overall.result_label', 'B2')
            ->assertJsonPath('data.summary.mcq.correct', 2)
            ->assertJsonPath('data.review.skills.2.key', 'writing')
            ->assertJsonPath('data.review.skills.2.status', 'ready')
            ->assertJsonPath('data.review.skills.2.score_label', 'Band 6.5')
            ->assertJsonPath('data.review.skills.3.score_label', 'Band 6')
            ->assertJsonPath('data.review.sections.2.status', 'ready')
            ->assertJsonPath('data.review.sections.2.source_type', 'exam_writing_task')
            ->assertJsonPath('data.review.sections.2.source_id', $writingTasks->get(0)->id)
            ->assertJsonPath('data.review.sections.4.status', 'ready');
    }

    public function test_session_results_returns_failed_feedback_state(): void
    {
        [$user, $profile, , $version] = $this->seedExam();
        $session = $this->createSession($profile, $version, ExamSessionStatus::Submitted);
        $task = ExamVersionWritingTask::query()->orderBy('part')->firstOrFail();

        $this->createAssessedWriting($profile, $session, $task, null, null, AssessmentJobStatus::Failed);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->getJson("/api/v1/exam-sessions/{$session->id}/results")
            ->assertOk()
            ->assertJsonPath('data.summary.score_status', 'failed')
            ->assertJsonPath('data.summary.feedback_status', 'failed')
            ->assertJsonPath('data.summary.has_pending_jobs', false)
            ->assertJsonPath('data.summary.has_failed_jobs', true)
            ->assertJsonPath('data.summary.display.band_value', 'Chấm lỗi')
            ->assertJsonPath('data.summary.display.total_score_value', 'Chấm lỗi')
            ->assertJsonPath('data.writing_feedback.0.score_status', 'failed')
            ->assertJsonPath('data.writing_feedback.0.feedback_status', 'failed')
            ->assertJsonPath('data.review.skills.2.status', 'failed')
            ->assertJsonPath('data.review.skills.2.score_label', 'Chấm lỗi')
            ->assertJsonPath('data.review.sections.2.status', 'failed');
    }

    public function test_session_results_keeps_feedback_none_when_score_is_ready_without_feedback(): void
    {
        [$user, $profile, , $version] = $this->seedExam();
        $this->createSecondWritingTask($version);
        $session = $this->createSession($profile, $version, ExamSessionStatus::Submitted, ['writing']);

        $writingTasks = ExamVersionWritingTask::query()->orderBy('part')->get();
        $this->createAssessedWriting($profile, $session, $writingTasks->get(0), 6.0);
        $this->createAssessedWriting($profile, $session, $writingTasks->get(1), 7.0);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->getJson("/api/v1/exam-sessions/{$session->id}/results")
            ->assertOk()
            ->assertJsonPath('data.summary.score_status', 'not_applicable')
            ->assertJsonPath('data.summary.feedback_status', 'none')
            ->assertJsonPath('data.summary.overall.applicable', false)
            ->assertJsonPath('data.writing_feedback.0.score_status', 'ready')
            ->assertJsonPath('data.writing_feedback.0.feedback_status', 'none')
            ->assertJsonPath('data.review.skills.0.key', 'writing')
            ->assertJsonPath('data.review.skills.0.status', 'ready')
            ->assertJsonPath('data.review.skills.0.score_label', 'Band 6.5')
            ->assertJsonPath('data.review.sections.0.status', 'ready')
            ->assertJsonPath('data.review.sections.0.score_label', 'Band 6');
    }

    public function test_session_results_custom_skill_session_is_not_applicable_for_overall(): void
    {
        [$user, $profile, , $version] = $this->seedExam();
        $session = $this->createSession($profile, $version, ExamSessionStatus::Submitted, ['reading']);
        $readingItem = ExamVersionReadingItem::query()->firstOrFail();

        $this->createMcqAnswer($session, 'exam_reading_item', $readingItem->id, $readingItem->correct_index);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->getJson("/api/v1/exam-sessions/{$session->id}/results")
            ->assertOk()
            ->assertJsonPath('data.summary.score_status', 'not_applicable')
            ->assertJsonPath('data.summary.feedback_status', 'none')
            ->assertJsonPath('data.summary.overall.applicable', false)
            ->assertJsonPath('data.summary.overall.reason', 'Bài thi chưa đủ 4 kỹ năng để xếp bậc VSTEP tham khảo.')
            ->assertJsonPath('data.summary.mcq.correct', 1)
            ->assertJsonPath('data.summary.mcq.total', 1)
            ->assertJsonCount(1, 'data.review.skills')
            ->assertJsonPath('data.review.skills.0.key', 'reading')
            ->assertJsonPath('data.review.skills.0.score_label', '1/1')
            ->assertJsonCount(1, 'data.review.sections')
            ->assertJsonPath('data.review.sections.0.id', 'read-1')
            ->assertJsonCount(1, 'data.mcq_detail');
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

    public function test_room_endpoint_returns_exam_version_session_and_draft(): void
    {
        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        ExamSessionDraft::create([
            'session_id' => $sessionId,
            'skill_idx' => 1,
            'mcq_answers' => [],
            'writing_answers' => [],
            'speaking_marks' => [],
            'saved_at' => now(),
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/exam-sessions/{$sessionId}/room")
            ->assertOk()
            ->assertJsonPath('data.exam.id', $exam->id)
            ->assertJsonPath('data.session.id', $sessionId)
            ->assertJsonPath('data.session.status', 'active')
            ->assertJsonPath('data.draft.skill_idx', 1)
            ->assertJsonPath('data.actions.can_answer', true)
            ->assertJsonPath('data.listening_play_summary.0.played', false)
            ->assertJsonMissingPath('data.version.listening_sections.0.items.0.correct_index')
            ->assertJsonMissingPath('data.version.reading_passages.0.items.0.correct_index')
            ->assertJsonCount(1, 'data.version.listening_sections')
            ->assertJsonCount(1, 'data.version.reading_passages');
    }

    public function test_save_draft_normalizes_empty_writing_text(): void
    {
        [$user, , $exam] = $this->seedExam();
        $task = ExamVersionWritingTask::query()->firstOrFail();
        $token = $this->tokenFor($user);

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/exam-sessions/{$sessionId}/draft", [
                'skill_idx' => 2,
                'mcq_answers' => [],
                'writing_answers' => [[
                    'task_id' => $task->id,
                    'text' => null,
                ]],
                'speaking_marks' => [],
            ])
            ->assertOk()
            ->assertJsonPath('data.writing_answers.0.text', '');
    }

    public function test_listening_played_is_idempotent_and_reflected_in_room(): void
    {
        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);
        $section = ExamVersionListeningSection::query()->firstOrFail();

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/listening-played", ['section_id' => $section->id])
            ->assertOk()
            ->assertJsonPath('data.played', true)
            ->assertJsonPath('data.already_played', false);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/listening-played", ['section_id' => $section->id])
            ->assertOk()
            ->assertJsonPath('data.played', true)
            ->assertJsonPath('data.already_played', true);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/exam-sessions/{$sessionId}/room")
            ->assertOk()
            ->assertJsonPath('data.listening_play_summary.0.played', true)
            ->assertJsonPath('data.listening_play_summary.0.section_id', $section->id);
    }

    public function test_listening_played_rejects_section_outside_session_version(): void
    {
        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);

        $otherExam = Exam::create([
            'slug' => 'vstep-test-other', 'title' => 'Other Exam', 'total_duration_minutes' => 10,
            'is_published' => true,
        ]);
        $otherVersion = ExamVersion::create([
            'exam_id' => $otherExam->id, 'version_number' => 1, 'is_active' => true,
            'published_at' => now(),
        ]);
        $otherSection = ExamVersionListeningSection::create([
            'exam_version_id' => $otherVersion->id, 'part' => 1, 'part_title' => 'Other Part',
            'duration_minutes' => 10,
        ]);

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/listening-played", ['section_id' => $otherSection->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('section_id');
    }

    public function test_listening_played_rejects_wrong_owner(): void
    {
        [$user, , $exam] = $this->seedExam();
        $section = ExamVersionListeningSection::query()->firstOrFail();

        $sessionId = $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $otherUser = User::factory()->create();
        Profile::factory()->initial()->forAccount($otherUser)->create();

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($otherUser))
            ->postJson("/api/v1/exam-sessions/{$sessionId}/listening-played", ['section_id' => $section->id])
            ->assertForbidden();
    }

    public function test_listening_played_rejects_expired_session(): void
    {
        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);
        $section = ExamVersionListeningSection::query()->firstOrFail();

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        ExamSession::query()->whereKey($sessionId)->update(['server_deadline_at' => now()->subMinute()]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/listening-played", ['section_id' => $section->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('session');
    }

    public function test_listening_played_rejects_when_listening_not_selected(): void
    {
        [$user, , $exam] = $this->seedExam();
        $token = $this->tokenFor($user);
        $section = ExamVersionListeningSection::query()->firstOrFail();

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", [
                'mode' => 'custom',
                'selected_skills' => ['reading'],
            ])
            ->json('data.session_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exam-sessions/{$sessionId}/listening-played", ['section_id' => $section->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('section_id');
    }

    public function test_restart_abandons_old_session_and_charges_new_attempt_atomically(): void
    {
        [$user, $profile, $exam] = $this->seedExam();
        $token = $this->tokenFor($user);

        $oldSessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions", ['mode' => 'full'])
            ->json('data.session_id');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/exams/{$exam->id}/sessions/restart", [
                'abandon_session_id' => $oldSessionId,
                'mode' => 'custom',
                'selected_skills' => ['reading'],
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.coins_charged', 8);

        $newSessionId = $response->json('data.session_id');

        $this->assertNotSame($oldSessionId, $newSessionId);
        $this->assertDatabaseHas('exam_sessions', [
            'id' => $oldSessionId,
            'status' => 'abandoned',
        ]);
        $this->assertSame(67, $this->app->make(WalletService::class)->getBalance($profile));
    }

    public function test_exam_overview_returns_summaries_attempt_state_without_version_content(): void
    {
        [$user, $profile, $exam, $version] = $this->seedExam();
        $submitted = $this->createSession($profile, $version, ExamSessionStatus::Submitted);
        $active = $this->createSession($profile, $version, ExamSessionStatus::Active);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->getJson("/api/v1/exams/{$exam->id}")
            ->assertOk()
            ->assertJsonPath('data.exam.id', $exam->id)
            ->assertJsonPath('data.version.id', $version->id)
            ->assertJsonMissingPath('data.version.listening_sections')
            ->assertJsonPath('data.skill_summaries.listening.duration_minutes', 10)
            ->assertJsonPath('data.skill_summaries.listening.item_count', 1)
            ->assertJsonPath('data.skill_summaries.reading.item_count', 1)
            ->assertJsonPath('data.pricing.full_test_cost_coins', 25)
            ->assertJsonPath('data.attempt_state.active_session.id', $active->id)
            ->assertJsonPath('data.attempt_state.active_current_version_session.id', $active->id)
            ->assertJsonPath('data.attempt_state.history.0.id', $submitted->id)
            ->assertJsonCount(1, 'data.attempt_state.history');
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

    private function createSecondWritingTask(ExamVersion $version): ExamVersionWritingTask
    {
        return ExamVersionWritingTask::create([
            'exam_version_id' => $version->id,
            'part' => 2,
            'task_type' => 'essay',
            'duration_minutes' => 30,
            'prompt' => 'Write an essay...',
            'min_words' => 250,
        ]);
    }

    /** @param  list<string>  $selectedSkills */
    private function createSession(
        Profile $profile,
        ExamVersion $version,
        ExamSessionStatus $status,
        array $selectedSkills = ['listening', 'reading', 'writing', 'speaking'],
    ): ExamSession {
        $isFullTest = $selectedSkills === ['listening', 'reading', 'writing', 'speaking'];

        return ExamSession::create([
            'profile_id' => $profile->id,
            'exam_version_id' => $version->id,
            'mode' => $isFullTest ? 'full' : 'custom',
            'selected_skills' => $selectedSkills,
            'is_full_test' => $isFullTest,
            'time_extension_factor' => 1.0,
            'started_at' => now(),
            'server_deadline_at' => now()->addHours(2),
            'submitted_at' => $status === ExamSessionStatus::Active ? null : now(),
            'status' => $status,
            'coins_charged' => 0,
        ]);
    }

    private function createMcqAnswer(ExamSession $session, string $itemRefType, string $itemRefId, int $selectedIndex): void
    {
        ExamMcqAnswer::create([
            'session_id' => $session->id,
            'item_ref_type' => $itemRefType,
            'item_ref_id' => $itemRefId,
            'selected_index' => $selectedIndex,
            'is_correct' => true,
            'answered_at' => now(),
        ]);
    }

    private function createAssessedWriting(
        Profile $profile,
        ExamSession $session,
        ExamVersionWritingTask $task,
        ?float $band,
        ?array $feedback = null,
        AssessmentJobStatus $jobStatus = AssessmentJobStatus::Ready,
    ): void {
        $submission = ExamWritingSubmission::create([
            'session_id' => $session->id,
            'profile_id' => $profile->id,
            'task_id' => $task->id,
            'text' => "Writing response for part {$task->part}.",
            'word_count' => $task->part === 1 ? 120 : 260,
            'submitted_at' => now(),
        ]);
        $taskType = $task->part === 1
            ? AssessmentTaskType::WritingTask1Letter
            : AssessmentTaskType::WritingTask2Essay;
        $attempt = $this->createAssessmentAttempt(
            $profile,
            AssessmentSkill::Writing,
            $taskType,
            $submission->id,
            ['prompt' => $task->prompt],
            ['text' => $submission->text],
        );

        $this->createAssessmentJob($attempt, $jobStatus);
        if ($band !== null) {
            $this->createAssessmentResult($attempt, $band, $feedback);
        }
    }

    private function createAssessedSpeaking(
        Profile $profile,
        ExamSession $session,
        ExamVersionSpeakingPart $part,
        ?float $band,
        ?array $feedback = null,
        AssessmentJobStatus $jobStatus = AssessmentJobStatus::Ready,
    ): void {
        $submission = ExamSpeakingSubmission::create([
            'session_id' => $session->id,
            'profile_id' => $profile->id,
            'part_id' => $part->id,
            'audio_key' => "audio/exam_speaking/{$profile->id}/part-{$part->part}.webm",
            'audio_url' => "https://example.test/part-{$part->part}.webm",
            'duration_seconds' => 60,
            'transcript' => 'This is my speaking answer.',
            'submitted_at' => now(),
        ]);
        $taskType = match ($part->part) {
            1 => AssessmentTaskType::SpeakingPart1Personal,
            2 => AssessmentTaskType::SpeakingPart2Solution,
            default => AssessmentTaskType::SpeakingPart3Discussion,
        };
        $attempt = $this->createAssessmentAttempt(
            $profile,
            AssessmentSkill::Speaking,
            $taskType,
            $submission->id,
            ['content' => $part->content],
            ['transcript' => $submission->transcript],
        );

        $this->createAssessmentJob($attempt, $jobStatus);
        if ($band !== null) {
            $this->createAssessmentResult($attempt, $band, $feedback);
        }
    }

    private function createAssessmentAttempt(
        Profile $profile,
        AssessmentSkill $skill,
        AssessmentTaskType $taskType,
        string $sourceId,
        array $prompt,
        array $responsePayload,
    ): AssessmentAttempt {
        $rubric = $this->assessmentRubric($skill, $taskType);

        return AssessmentAttempt::create([
            'profile_id' => $profile->id,
            'rubric_id' => $rubric->id,
            'skill' => $skill,
            'task_type' => $taskType,
            'source_type' => AssessmentSourceType::Exam,
            'source_id' => $sourceId,
            'prompt' => $prompt,
            'response_payload' => $responsePayload,
            'submitted_at' => now(),
        ]);
    }

    private function assessmentRubric(AssessmentSkill $skill, AssessmentTaskType $taskType): AssessmentRubric
    {
        return AssessmentRubric::query()->firstOrCreate(
            ['task_type' => $taskType->value, 'version' => 1],
            [
                'skill' => $skill->value,
                'title' => $taskType->value,
                'criteria' => [],
                'evidence_schema' => [],
                'scoring_policy' => [],
                'is_active' => true,
                'effective_from' => now(),
            ],
        );
    }

    private function createAssessmentJob(AssessmentAttempt $attempt, AssessmentJobStatus $status): void
    {
        AssessmentJob::create([
            'attempt_id' => $attempt->id,
            'status' => $status,
            'attempts' => 1,
            'progress' => [],
            'started_at' => now(),
            'completed_at' => $status === AssessmentJobStatus::Ready ? now() : null,
        ]);
    }

    private function createAssessmentResult(AssessmentAttempt $attempt, float $band, ?array $feedback): void
    {
        AssessmentResult::create([
            'attempt_id' => $attempt->id,
            'rubric_id' => $attempt->rubric_id,
            'criterion_scores' => [[
                'key' => 'vocabulary',
                'score' => $band,
                'explanation' => 'Fixture score.',
            ]],
            'overall_band' => $band,
            'caps_applied' => [],
            'calculation_trace' => ['source' => 'test'],
            'insights' => [],
            'feedback' => $feedback,
        ]);
    }

    /** @return array<string, list<string>> */
    private function feedbackPayload(): array
    {
        return [
            'strengths' => ['Clear response.'],
            'improvements' => ['Add more detail.'],
            'warnings' => [],
            'rewrites' => [],
        ];
    }

    private function tokenFor(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->json('data.access_token');
    }
}
