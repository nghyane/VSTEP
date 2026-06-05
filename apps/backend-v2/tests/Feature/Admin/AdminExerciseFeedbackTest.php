<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\ExerciseFeedback;
use App\Models\PracticeListeningExercise;
use App\Models\PracticeReadingExercise;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

final class AdminExerciseFeedbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_exercise_feedback_with_content_title(): void
    {
        $admin = User::factory()->admin()->create();
        $profile = Profile::factory()
            ->initial()
            ->forAccount(User::factory()->create())
            ->create(['nickname' => 'learner-one']);
        $listening = PracticeListeningExercise::factory()->create(['title' => 'Listening feedback target']);
        $reading = PracticeReadingExercise::factory()->create(['title' => 'Reading feedback target']);

        ExerciseFeedback::create([
            'profile_id' => $profile->id,
            'content_type' => 'practice_listening_exercise',
            'content_id' => $listening->id,
            'rating' => 5,
            'comment' => 'Audio rõ, bài hữu ích.',
        ]);
        ExerciseFeedback::create([
            'profile_id' => $profile->id,
            'content_type' => 'practice_reading_exercise',
            'content_id' => $reading->id,
            'rating' => 2,
            'comment' => 'Đoạn đọc hơi dài.',
        ]);

        $this->withHeader('Authorization', 'Bearer '.JWTAuth::fromUser($admin))
            ->getJson('/api/v1/admin/feedback?content_type=practice_listening_exercise')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.content_title', 'Listening feedback target')
            ->assertJsonPath('data.0.profile.nickname', 'learner-one')
            ->assertJsonPath('data.0.rating', 5);
    }

    public function test_learner_cannot_list_admin_feedback(): void
    {
        $learner = User::factory()->create();

        $this->withHeader('Authorization', 'Bearer '.JWTAuth::fromUser($learner))
            ->getJson('/api/v1/admin/feedback')
            ->assertForbidden();
    }

    public function test_empty_feedback_comment_is_stored_as_null(): void
    {
        $learner = User::factory()->create();
        $profile = Profile::factory()
            ->initial()
            ->forAccount($learner)
            ->create();
        $reading = PracticeReadingExercise::factory()->create();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $learner->email,
            'password' => 'password',
        ])->json('data.access_token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/feedback', [
                'content_type' => 'practice_reading_exercise',
                'content_id' => $reading->id,
                'rating' => 4,
                'comment' => '   ',
            ])
            ->assertCreated()
            ->assertJsonPath('data.comment', null);

        $this->assertDatabaseHas('exercise_feedbacks', [
            'profile_id' => $profile->id,
            'content_id' => $reading->id,
            'comment' => null,
        ]);
    }
}
