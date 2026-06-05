<?php

declare(strict_types=1);

namespace Tests\Feature\Feedback;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class FeedbackFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_profile_can_store_and_list_feedback_for_content(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $token = $this->loginToken($user);
        $contentId = (string) Str::uuid();

        $storeResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/feedback', [
                'content_type' => 'practice_reading_question',
                'content_id' => $contentId,
                'rating' => 4,
                'comment' => 'Useful but difficult.',
            ]);

        $storeResponse->assertCreated()
            ->assertJsonPath('data.content_id', $contentId)
            ->assertJsonPath('data.rating', 4);

        $listResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/feedback?content_type=practice_reading_question&content_id={$contentId}");

        $listResponse->assertOk()
            ->assertJsonPath('data.0.content_id', $contentId)
            ->assertJsonPath('data.0.comment', 'Useful but difficult.');
    }

    private function loginToken(User $user): string
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk();

        return (string) $response->json('data.access_token');
    }
}
