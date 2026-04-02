<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Level;
use App\Enums\PracticeMode;
use App\Enums\Skill;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PracticeSubmissionValidationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_rejects_blob_audio_urls_for_speaking_submissions(): void
    {
        [$user, $session] = $this->makeSpeakingSession();

        $this->actingAs($user, 'api')
            ->postJson("/api/v1/practice/sessions/{$session->id}/submit", [
                'answer' => [
                    'audio_path' => 'blob:http://localhost:5173/demo',
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['answer.audio_path']);
    }

    #[Test]
    public function it_requires_uploaded_storage_paths_for_speaking_submissions(): void
    {
        [$user, $session] = $this->makeSpeakingSession();

        $this->actingAs($user, 'api')
            ->postJson("/api/v1/practice/sessions/{$session->id}/submit", [
                'answer' => [
                    'audio_path' => 'tmp/local-file.webm',
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['answer.audio_path']);
    }

    #[Test]
    public function it_returns_objective_breakdown_for_reading_practice_submission(): void
    {
        $user = User::create([
            'full_name' => 'Reader',
            'email' => 'reader@example.com',
            'password' => 'password',
            'role' => 'learner',
        ]);

        $question = Question::create([
            'skill' => Skill::Reading,
            'level' => Level::B1,
            'part' => 3,
            'topic' => 'Reading breakdown',
            'content' => [
                'title' => 'Sample passage',
                'passage' => 'A short passage.',
                'items' => [
                    ['stem' => 'Question 1', 'options' => ['Option A', 'Option B']],
                    ['stem' => 'Question 2', 'options' => ['Option A', 'Option B']],
                ],
            ],
            'answer_key' => ['correctAnswers' => ['1' => 'A', '2' => 'B']],
            'is_active' => true,
        ]);

        $session = PracticeSession::create([
            'user_id' => $user->id,
            'skill' => Skill::Reading,
            'mode' => PracticeMode::Free,
            'level' => Level::B1,
            'current_question_id' => $question->id,
            'config' => ['items_count' => 1],
            'started_at' => now(),
        ]);

        $this->actingAs($user, 'api')
            ->postJson("/api/v1/practice/sessions/{$session->id}/submit", [
                'answer' => [
                    'answers' => ['1' => 'A', '2' => 'A'],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.result.correct', false)
            ->assertJsonPath('data.result.score', 5.0)
            ->assertJsonPath('data.result.user_answers.1', 'A')
            ->assertJsonPath('data.result.correct_answers.2', 'B')
            ->assertJsonPath('data.result.items.0.question_number', 1)
            ->assertJsonPath('data.result.items.0.is_correct', true)
            ->assertJsonPath('data.result.items.1.question_number', 2)
            ->assertJsonPath('data.result.items.1.user_answer', 'A')
            ->assertJsonPath('data.result.items.1.correct_answer', 'B')
            ->assertJsonPath('data.result.items.1.is_correct', false);

        $submission = Submission::query()->latest()->firstOrFail();

        $this->assertSame('A', $submission->result['user_answers']['1']);
        $this->assertSame('B', $submission->result['correct_answers']['2']);
        $this->assertFalse($submission->result['items'][1]['is_correct']);
    }

    private function makeSpeakingSession(): array
    {
        $user = User::create([
            'full_name' => 'Speaker',
            'email' => 'speaker@example.com',
            'password' => 'password',
            'role' => 'learner',
        ]);

        $question = Question::create([
            'skill' => Skill::Speaking,
            'level' => Level::B1,
            'part' => 1,
            'topic' => 'Speaking validation',
            'content' => ['prompt' => 'Talk about your hobby'],
            'is_active' => true,
        ]);

        $session = PracticeSession::create([
            'user_id' => $user->id,
            'skill' => Skill::Speaking,
            'mode' => PracticeMode::Drill,
            'level' => Level::B1,
            'current_question_id' => $question->id,
            'config' => ['items_count' => 1],
            'started_at' => now(),
        ]);

        return [$user, $session];
    }
}
