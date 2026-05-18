<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Grammar;

use App\Enums\Role;
use App\Models\GrammarPoint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminGrammarPointTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_cannot_access(): void
    {
        $user = User::factory()->create(['role' => Role::Learner]);
        $token = $this->tokenFor($user);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/grammar/points')
            ->assertStatus(403);
    }

    public function test_staff_can_list_with_pagination(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        GrammarPoint::factory()->count(3)->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/grammar/points?per_page=2');

        $res->assertOk();
        $res->assertJsonCount(2, 'data');
        $res->assertJsonStructure(['data', 'meta' => ['current_page', 'total', 'per_page', 'last_page']]);
    }

    public function test_filter_by_published_and_category(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        GrammarPoint::factory()->create(['is_published' => true, 'category' => 'foundation', 'name' => 'A']);
        GrammarPoint::factory()->create(['is_published' => false, 'category' => 'foundation', 'name' => 'B']);
        GrammarPoint::factory()->create(['is_published' => true, 'category' => 'sentence', 'name' => 'C']);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/grammar/points?is_published=true&category=foundation');

        $res->assertOk();
        $res->assertJsonCount(1, 'data');
        $res->assertJsonPath('data.0.name', 'A');
    }

    public function test_create_with_junctions(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/grammar/points', [
                'slug' => 'past-simple',
                'name' => 'Past simple',
                'vietnamese_name' => 'Quá khứ đơn',
                'summary' => 'Used for completed actions in the past.',
                'category' => 'foundation',
                'levels' => ['A2', 'B1'],
                'tasks' => ['WT1', 'SP2'],
                'functions' => ['expressing past', 'narration'],
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.slug', 'past-simple');
        $res->assertJsonPath('data.is_published', false);
        $this->assertEqualsCanonicalizing(['A2', 'B1'], $res->json('data.levels'));
        $this->assertEqualsCanonicalizing(['WT1', 'SP2'], $res->json('data.tasks'));
        $this->assertEqualsCanonicalizing(['expressing past', 'narration'], $res->json('data.functions'));

        $this->assertDatabaseHas('grammar_points', ['slug' => 'past-simple', 'is_published' => false]);
        $this->assertDatabaseCount('grammar_point_levels', 2);
        $this->assertDatabaseCount('grammar_point_tasks', 2);
        $this->assertDatabaseCount('grammar_point_functions', 2);
    }

    public function test_duplicate_slug_rejected(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        GrammarPoint::factory()->create(['slug' => 'dup-slug']);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/grammar/points', [
                'slug' => 'dup-slug',
                'name' => 'X',
                'summary' => 'X',
                'category' => 'foundation',
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['slug']);
    }

    public function test_invalid_category_rejected(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/grammar/points', [
                'slug' => 'x',
                'name' => 'X',
                'summary' => 'X',
                'category' => 'not-a-real-category',
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['category']);
    }

    public function test_update_syncs_junctions(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();
        $point->levels()->createMany([['level' => 'A2'], ['level' => 'B1']]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/grammar/points/{$point->id}", [
                'levels' => ['C1'],
            ]);

        $res->assertOk();
        $this->assertEqualsCanonicalizing(['C1'], $res->json('data.levels'));
        $this->assertDatabaseMissing('grammar_point_levels', ['grammar_point_id' => $point->id, 'level' => 'A2']);
    }

    public function test_publish_unpublish(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create(['is_published' => false]);

        $token = $this->tokenFor($staff);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.is_published', true);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/unpublish")
            ->assertOk()
            ->assertJsonPath('data.is_published', false);
    }

    public function test_destroy_cascades_children(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();
        $point->examples()->create(['en' => 'I am.', 'vi' => 'Tôi.', 'display_order' => 0]);
        $point->levels()->create(['level' => 'B1']);

        $token = $this->tokenFor($staff);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/grammar/points/{$point->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('grammar_points', ['id' => $point->id]);
        $this->assertDatabaseMissing('grammar_examples', ['grammar_point_id' => $point->id]);
        $this->assertDatabaseMissing('grammar_point_levels', ['grammar_point_id' => $point->id]);
    }

    private function tokenFor(User $user): string
    {
        return JWTAuth::fromUser($user);
    }
}
