<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Level;
use App\Enums\SessionStatus;
use App\Enums\Skill;
use App\Enums\SubmissionStatus;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class ProgressBySkillSourceTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_filters_recent_scores_by_practice_source(): void
    {
        [$user, $token] = $this->seedProgressFixtures();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/progress/reading?source=practice')
            ->assertOk()
            ->assertJsonPath('data.recent_scores.0.score', 8)
            ->assertJsonCount(1, 'data.recent_scores')
            ->assertJsonPath('data.window_avg', 8);
    }

    #[Test]
    public function it_filters_recent_scores_by_exam_source(): void
    {
        [$user, $token] = $this->seedProgressFixtures();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/progress/reading?source=exam')
            ->assertOk()
            ->assertJsonPath('data.recent_scores.0.score', 6)
            ->assertJsonCount(1, 'data.recent_scores')
            ->assertJsonPath('data.window_avg', 6);
    }

    #[Test]
    public function it_returns_combined_scores_when_source_is_not_provided(): void
    {
        [$user, $token] = $this->seedProgressFixtures();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/progress/reading')
            ->assertOk()
            ->assertJsonCount(2, 'data.recent_scores')
            ->assertJsonPath('data.recent_scores.0.score', 8)
            ->assertJsonPath('data.recent_scores.1.score', 6)
            ->assertJsonPath('data.window_avg', 7);
    }

    private function seedProgressFixtures(): array
    {
        $user = User::create([
            'full_name' => 'Progress Learner',
            'email' => 'progress@example.com',
            'password' => 'password',
            'role' => 'learner',
        ]);

        UserProgress::create([
            'user_id' => $user->id,
            'skill' => Skill::Reading,
            'current_level' => Level::B1,
            'target_level' => Level::B2,
            'attempt_count' => 2,
            'streak_count' => 0,
            'scaffold_level' => 0,
        ]);

        $question = Question::create([
            'skill' => Skill::Reading,
            'level' => Level::B1,
            'part' => 1,
            'topic' => 'Reading',
            'content' => ['prompt' => 'Test'],
            'answer_key' => ['correctAnswers' => ['a' => 'A']],
            'explanation' => 'Test',
            'is_active' => true,
        ]);

        Submission::create([
            'user_id' => $user->id,
            'question_id' => $question->id,
            'skill' => Skill::Reading,
            'status' => SubmissionStatus::Completed,
            'answer' => ['answers' => ['a' => 'A']],
            'score' => 8.0,
            'completed_at' => now()->subHour(),
        ]);

        $exam = Exam::create([
            'title' => 'Reading exam',
            'level' => Level::B1,
            'type' => 'practice',
            'blueprint' => [['skill' => Skill::Reading->value, 'question_ids' => [$question->id]]],
            'is_active' => true,
        ]);

        ExamSession::create([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'status' => SessionStatus::Completed,
            'reading_score' => 6.0,
            'overall_score' => 6.0,
            'completed_at' => now()->subDays(1),
        ]);

        return [$user, JWTAuth::fromUser($user)];
    }
}
