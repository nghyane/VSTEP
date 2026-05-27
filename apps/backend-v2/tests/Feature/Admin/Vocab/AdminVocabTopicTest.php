<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Vocab;

use App\Enums\Role;
use App\Models\User;
use App\Models\VocabTopic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminVocabTopicTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_cannot_access_admin_vocab(): void
    {
        $learner = User::factory()->create(['role' => Role::Learner]);

        $token = $this->tokenFor($learner);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/vocab/topics')
            ->assertStatus(403);
    }

    public function test_staff_can_list_topics_with_pagination(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        VocabTopic::factory()->count(3)->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/vocab/topics?per_page=2');

        $res->assertOk();
        $res->assertJsonCount(2, 'data');
        $res->assertJsonStructure(['data', 'meta' => ['current_page', 'total', 'per_page', 'last_page']]);
    }

    public function test_staff_can_filter_topics_by_published_status(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        VocabTopic::factory()->create(['is_published' => true, 'name' => 'Pub']);
        VocabTopic::factory()->create(['is_published' => false, 'name' => 'Draft']);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/vocab/topics?is_published=false');

        $res->assertOk();
        $res->assertJsonCount(1, 'data');
        $res->assertJsonPath('data.0.name', 'Draft');
    }

    public function test_staff_can_create_topic_with_tasks(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/vocab/topics', [
                'slug' => 'family-life',
                'name' => 'Family life',
                'description' => 'Topic about family relationships.',
                'level' => 'B1',
                'icon_key' => 'family',
                'tasks' => ['WT1', 'SP2'],
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.slug', 'family-life');
        $res->assertJsonPath('data.is_published', false);
        $this->assertEqualsCanonicalizing(['WT1', 'SP2'], $res->json('data.tasks'));

        $this->assertDatabaseHas('vocab_topics', ['slug' => 'family-life', 'is_published' => false]);
        $this->assertDatabaseCount('vocab_topic_tasks', 2);
    }

    public function test_store_topic_rejects_duplicate_slug(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        VocabTopic::factory()->create(['slug' => 'dup-slug']);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/vocab/topics', [
                'slug' => 'dup-slug',
                'name' => 'Anything',
                'level' => 'B1',
                'icon_key' => 'sun',
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['slug']);
    }

    public function test_staff_can_create_a1_topic(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/vocab/topics', [
                'slug' => 'family-basics',
                'name' => 'Family basics',
                'level' => 'A1',
                'icon_key' => 'family',
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.level', 'A1');
    }

    public function test_update_topic_syncs_tasks(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $topic = VocabTopic::factory()->create();
        $topic->tasks()->createMany([['task' => 'WT1'], ['task' => 'WT2']]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/vocab/topics/{$topic->id}", [
                'tasks' => ['SP1', 'SP3'],
            ]);

        $res->assertOk();
        $this->assertEqualsCanonicalizing(['SP1', 'SP3'], $res->json('data.tasks'));
        $this->assertDatabaseMissing('vocab_topic_tasks', ['topic_id' => $topic->id, 'task' => 'WT1']);
    }

    public function test_publish_and_unpublish_endpoints(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $topic = VocabTopic::factory()->create(['is_published' => false]);

        $token = $this->tokenFor($staff);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/vocab/topics/{$topic->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.is_published', true);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/vocab/topics/{$topic->id}/unpublish")
            ->assertOk()
            ->assertJsonPath('data.is_published', false);
    }

    public function test_destroy_topic_cascades_children(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $topic = VocabTopic::factory()->create();
        $topic->words()->createMany([
            ['word' => 'one', 'part_of_speech' => 'n', 'definition' => 'd', 'display_order' => 0],
        ]);

        $token = $this->tokenFor($staff);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/vocab/topics/{$topic->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('vocab_topics', ['id' => $topic->id]);
        $this->assertDatabaseMissing('vocab_words', ['topic_id' => $topic->id]);
    }

    private function tokenFor(User $user): string
    {
        return JWTAuth::fromUser($user);
    }
}
