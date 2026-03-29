<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Level;
use App\Enums\SessionStatus;
use App\Enums\Skill;
use App\Enums\VstepBand;
use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\User;
use App\Services\SessionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SessionScoringTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_uses_partial_credit_for_objective_exam_scoring(): void
    {
        $user = User::create([
            'full_name' => 'Learner',
            'email' => 'learner@example.com',
            'password' => 'password',
            'role' => 'learner',
        ]);

        $question = Question::create([
            'skill' => Skill::Reading,
            'level' => Level::B1,
            'part' => 1,
            'topic' => 'Partial scoring',
            'content' => ['prompt' => 'Choose answers'],
            'answer_key' => ['correctAnswers' => ['a' => 'A', 'b' => 'B']],
            'explanation' => 'Test',
            'is_active' => true,
        ]);

        $exam = Exam::create([
            'title' => 'Reading partial credit',
            'level' => Level::B1,
            'type' => 'practice',
            'blueprint' => [
                ['skill' => Skill::Reading->value, 'question_ids' => [$question->id]],
            ],
            'is_active' => true,
        ]);

        $session = ExamSession::create([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'status' => SessionStatus::InProgress,
        ]);

        ExamAnswer::create([
            'session_id' => $session->id,
            'question_id' => $question->id,
            'answer' => ['answers' => ['a' => 'A', 'b' => 'X']],
        ]);

        $scored = app(SessionService::class)->submit($session->fresh());
        $answer = ExamAnswer::firstOrFail();

        $this->assertFalse($answer->is_correct);
        $this->assertSame(0.5, $answer->raw_ratio);
        $this->assertSame(5.0, $scored->reading_score);
        $this->assertSame(5.0, $scored->overall_score);
        $this->assertSame(VstepBand::B1, $scored->overall_band);
    }
}
