<?php

declare(strict_types=1);

namespace Tests\Feature\Practice;

use App\Models\PracticeSpeakingDrill;
use App\Models\PracticeSpeakingDrillSentence;
use App\Models\PracticeSpeakingTask;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpeakingPracticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_drills_filter_by_level(): void
    {
        PracticeSpeakingDrill::factory()->create(['level' => 'B1']);
        PracticeSpeakingDrill::factory()->create(['level' => 'B2']);

        $token = $this->loginLearner();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/speaking/drills?level=B1')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_drill_session_attempt_flow(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $drill = PracticeSpeakingDrill::factory()->create();
        $sentence = PracticeSpeakingDrillSentence::create([
            'drill_id' => $drill->id, 'display_order' => 0,
            'text' => 'I usually wake up at seven.', 'translation' => 'Tôi thường dậy lúc 7h.',
        ]);

        $token = $this->tokenFor($user);
        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/drill-sessions', ['exercise_id' => $drill->id])
            ->assertCreated()
            ->json('data.session_id');

        $attempt = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/speaking/drill-sessions/{$sessionId}/attempt", [
                'sentence_id' => $sentence->id,
                'mode' => 'dictation',
                'user_text' => 'I usually wake up at seven.',
                'accuracy_percent' => 95,
            ]);
        $attempt->assertOk();
        $attempt->assertJsonPath('data.accuracy_percent', 95);
    }

    public function test_vstep_practice_submit(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $task = PracticeSpeakingTask::factory()->create();

        $token = $this->tokenFor($user);
        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/vstep-sessions', ['exercise_id' => $task->id])
            ->assertCreated()
            ->json('data.session_id');

        $submit = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/speaking/vstep-sessions/{$sessionId}/submit", [
                'audio_url' => 'https://r2.example.com/audio/test.webm',
                'duration_seconds' => 90,
            ]);
        $submit->assertOk();
        $submit->assertJsonPath('data.grading_status', 'pending');

        $this->assertDatabaseHas('practice_speaking_submissions', [
            'session_id' => $sessionId,
            'task_ref_type' => 'practice_speaking_task',
        ]);
    }

    public function test_list_vstep_tasks(): void
    {
        PracticeSpeakingTask::factory()->create(['part' => 1]);
        PracticeSpeakingTask::factory()->create(['part' => 2]);

        $token = $this->loginLearner();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/speaking/tasks')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    private function loginLearner(): string
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        return $this->tokenFor($user);
    }

    private function tokenFor(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->json('data.access_token');
    }
}
