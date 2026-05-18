<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Grammar;

use App\Enums\Role;
use App\Models\GrammarPoint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminGrammarChildTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_structure_auto_orders(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();
        $point->structures()->create(['template' => 'S + V + O', 'display_order' => 0]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/structures", [
                'template' => 'S + V-ed + O',
                'description' => 'Past simple structure.',
            ]);

        $res->assertCreated();
        $this->assertSame(1, $res->json('data.display_order'));
        $this->assertDatabaseHas('grammar_structures', ['grammar_point_id' => $point->id, 'template' => 'S + V-ed + O']);
    }

    public function test_create_example(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/examples", [
                'en' => 'I went home.',
                'vi' => 'Tôi đã về nhà.',
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.en', 'I went home.');
    }

    public function test_create_mistake_requires_all_fields(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/mistakes", [
                'wrong' => 'I goed',
                // missing correct + explanation
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['correct', 'explanation']);
    }

    public function test_create_tip_validates_task(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/tips", [
                'task' => 'INVALID',
                'tip' => 'x',
                'example' => 'y',
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['task']);
    }

    public function test_update_and_delete_structure(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();
        $row = $point->structures()->create(['template' => 'old', 'display_order' => 0]);

        $token = $this->tokenFor($staff);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/grammar/structures/{$row->id}", ['template' => 'new'])
            ->assertOk()
            ->assertJsonPath('data.template', 'new');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/grammar/structures/{$row->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('grammar_structures', ['id' => $row->id]);
    }

    public function test_reorder_examples(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();
        $e1 = $point->examples()->create(['en' => 'a', 'vi' => 'a', 'display_order' => 0]);
        $e2 = $point->examples()->create(['en' => 'b', 'vi' => 'b', 'display_order' => 1]);
        $e3 = $point->examples()->create(['en' => 'c', 'vi' => 'c', 'display_order' => 2]);

        $token = $this->tokenFor($staff);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/examples/reorder", [
                'ids' => [$e3->id, $e1->id, $e2->id],
            ])
            ->assertNoContent();

        $this->assertSame(0, $e3->fresh()->display_order);
        $this->assertSame(1, $e1->fresh()->display_order);
        $this->assertSame(2, $e2->fresh()->display_order);
    }

    private function tokenFor(User $user): string
    {
        return JWTAuth::fromUser($user);
    }
}
