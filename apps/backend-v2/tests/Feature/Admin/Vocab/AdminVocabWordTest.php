<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Vocab;

use App\Enums\Role;
use App\Models\User;
use App\Models\VocabTopic;
use App\Models\VocabWord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminVocabWordTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_create_word(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $topic = VocabTopic::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/vocab/topics/{$topic->id}/words", [
                'word' => 'consequential',
                'phonetic' => '/ˌkɒnsɪˈkwɛnʃəl/',
                'part_of_speech' => 'adjective',
                'definition' => 'Significant in consequence.',
                'example' => 'A consequential decision.',
                'synonyms' => ['significant', 'important'],
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.word', 'consequential');
        $this->assertSame(['significant', 'important'], $res->json('data.synonyms'));
        $this->assertDatabaseHas('vocab_words', ['topic_id' => $topic->id, 'word' => 'consequential']);
    }

    public function test_auto_assigns_display_order(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $topic = VocabTopic::factory()->create();
        VocabWord::factory()->create(['topic_id' => $topic->id, 'display_order' => 5]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/vocab/topics/{$topic->id}/words", [
                'word' => 'another',
                'part_of_speech' => 'noun',
                'definition' => 'd',
            ]);

        $res->assertCreated();
        $this->assertSame(6, $res->json('data.display_order'));
    }

    public function test_update_word(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $word = VocabWord::factory()->create(['definition' => 'old']);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/vocab/words/{$word->id}", ['definition' => 'new']);

        $res->assertOk();
        $res->assertJsonPath('data.definition', 'new');
    }

    public function test_destroy_word(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $word = VocabWord::factory()->create();

        $token = $this->tokenFor($staff);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/vocab/words/{$word->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('vocab_words', ['id' => $word->id]);
    }

    private function tokenFor(User $user): string
    {
        return JWTAuth::fromUser($user);
    }
}
