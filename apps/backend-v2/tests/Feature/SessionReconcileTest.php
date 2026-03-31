<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ExamType;
use App\Enums\Level;
use App\Enums\SessionStatus;
use App\Enums\Skill;
use App\Enums\SubmissionStatus;
use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\Submission;
use App\Models\User;
use App\Services\SessionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SessionReconcileTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_marks_subjective_sessions_as_submitted_until_grading_settles(): void
    {
        [$session, $writingQuestion] = $this->makeSubjectiveSession();
        Queue::fake();

        ExamAnswer::create([
            'session_id' => $session->id,
            'question_id' => $writingQuestion->id,
            'answer' => ['text' => 'Draft answer'],
        ]);

        $submitted = app(SessionService::class)->submit($session->fresh());

        $this->assertSame(SessionStatus::Submitted, $submitted->status);
        $this->assertNotNull($submitted->completed_at);
        $this->assertNull($submitted->writing_score);
    }

    #[Test]
    public function it_finalizes_completed_when_subjective_grading_is_terminal(): void
    {
        [$session, $writingQuestion] = $this->makeSubjectiveSession();

        Submission::create([
            'user_id' => $session->user_id,
            'session_id' => $session->id,
            'question_id' => $writingQuestion->id,
            'skill' => Skill::Writing,
            'status' => SubmissionStatus::ReviewPending,
            'score' => 6.5,
            'answer' => ['text' => 'Answer'],
        ]);

        app(SessionService::class)->reconcileSessionResult($session->fresh(['exam', 'submissions.question']));

        $session->refresh();

        $this->assertSame(SessionStatus::Completed, $session->status);
        $this->assertSame(6.5, $session->writing_score);
        $this->assertSame(6.5, $session->overall_score);
    }

    #[Test]
    public function it_clears_overall_score_when_a_required_subjective_skill_fails(): void
    {
        [$session, $writingQuestion, $speakingQuestion] = $this->makeMixedSession();

        $session->update([
            'listening_score' => 7.0,
            'reading_score' => 8.0,
        ]);

        Submission::create([
            'user_id' => $session->user_id,
            'session_id' => $session->id,
            'question_id' => $writingQuestion->id,
            'skill' => Skill::Writing,
            'status' => SubmissionStatus::Completed,
            'score' => 6.5,
            'answer' => ['text' => 'Answer'],
        ]);

        Submission::create([
            'user_id' => $session->user_id,
            'session_id' => $session->id,
            'question_id' => $speakingQuestion->id,
            'skill' => Skill::Speaking,
            'status' => SubmissionStatus::Failed,
            'answer' => ['audio_path' => 'speaking/test.webm'],
        ]);

        app(SessionService::class)->reconcileSessionResult($session->fresh(['exam', 'submissions.question']));

        $session->refresh();

        $this->assertSame(SessionStatus::Completed, $session->status);
        $this->assertSame(6.5, $session->writing_score);
        $this->assertNull($session->speaking_score);
        $this->assertNull($session->overall_score);
        $this->assertNull($session->overall_band);
    }

    private function makeSubjectiveSession(): array
    {
        $user = User::create([
            'full_name' => 'Learner',
            'email' => 'subjective@example.com',
            'password' => 'password',
            'role' => 'learner',
        ]);

        $writingQuestion = Question::create([
            'skill' => Skill::Writing,
            'level' => Level::B1,
            'part' => 1,
            'topic' => 'Writing',
            'content' => ['prompt' => 'Write a paragraph'],
            'is_active' => true,
        ]);

        $exam = Exam::create([
            'title' => 'Writing exam',
            'level' => Level::B1,
            'type' => ExamType::Mock,
            'blueprint' => [['skill' => Skill::Writing->value, 'part' => 1, 'question_ids' => [$writingQuestion->id]]],
            'is_active' => true,
        ]);

        $session = ExamSession::create([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'status' => SessionStatus::InProgress,
            'started_at' => now(),
        ]);

        return [$session, $writingQuestion];
    }

    private function makeMixedSession(): array
    {
        $user = User::create([
            'full_name' => 'Learner 2',
            'email' => 'mixed@example.com',
            'password' => 'password',
            'role' => 'learner',
        ]);

        $listening = Question::create([
            'skill' => Skill::Listening,
            'level' => Level::B1,
            'part' => 1,
            'topic' => 'Listening',
            'content' => ['items' => [['stem' => 'Q1', 'options' => ['A', 'B']]]],
            'answer_key' => ['correctAnswers' => ['1' => 'A']],
            'is_active' => true,
        ]);

        $reading = Question::create([
            'skill' => Skill::Reading,
            'level' => Level::B1,
            'part' => 1,
            'topic' => 'Reading',
            'content' => ['items' => [['stem' => 'Q1', 'options' => ['A', 'B']]]],
            'answer_key' => ['correctAnswers' => ['1' => 'A']],
            'is_active' => true,
        ]);

        $writing = Question::create([
            'skill' => Skill::Writing,
            'level' => Level::B1,
            'part' => 1,
            'topic' => 'Writing',
            'content' => ['prompt' => 'Write'],
            'is_active' => true,
        ]);

        $speaking = Question::create([
            'skill' => Skill::Speaking,
            'level' => Level::B1,
            'part' => 1,
            'topic' => 'Speaking',
            'content' => ['prompt' => 'Speak'],
            'is_active' => true,
        ]);

        $exam = Exam::create([
            'title' => 'Mixed exam',
            'level' => Level::B1,
            'type' => ExamType::Mock,
            'blueprint' => [
                ['skill' => Skill::Listening->value, 'part' => 1, 'question_ids' => [$listening->id]],
                ['skill' => Skill::Reading->value, 'part' => 1, 'question_ids' => [$reading->id]],
                ['skill' => Skill::Writing->value, 'part' => 1, 'question_ids' => [$writing->id]],
                ['skill' => Skill::Speaking->value, 'part' => 1, 'question_ids' => [$speaking->id]],
            ],
            'is_active' => true,
        ]);

        $session = ExamSession::create([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'status' => SessionStatus::Submitted,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return [$session, $writing, $speaking];
    }
}
