<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\Role;
use App\Models\GradingRubric;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

final class AdminGradingRubricTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_rubric_policy_summary_and_lifecycle(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin]);
        $rubric = GradingRubric::query()->where('skill', 'writing')->where('is_active', true)->firstOrFail();

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->getJson("/api/v1/admin/grading-rubrics/{$rubric->id}")
            ->assertOk()
            ->assertJsonPath('data.lifecycle.status', 'active')
            ->assertJsonPath('data.lifecycle.is_editable', false)
            ->assertJsonPath('data.admin_actions.can_clone', true)
            ->assertJsonPath('data.admin_actions.can_edit', false)
            ->assertJsonPath('data.policy_summary.assessment_gates.severe_minimum_words_task1', 60)
            ->assertJsonPath('data.policy_summary.assessment_gates.severe_minimum_words_task2', 125)
            ->assertJsonPath('data.policy_summary.assessment_gates.minimum_covered_points', 1);
    }

    public function test_admin_can_clone_active_rubric_to_editable_draft(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin]);
        $rubric = GradingRubric::query()->where('skill', 'writing')->where('is_active', true)->firstOrFail();

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->postJson("/api/v1/admin/grading-rubrics/{$rubric->id}/clone")
            ->assertCreated()
            ->assertJsonPath('data.skill', 'writing')
            ->assertJsonPath('data.version', $rubric->version + 1)
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.lifecycle.status', 'draft')
            ->assertJsonPath('data.lifecycle.is_editable', true)
            ->assertJsonPath('data.admin_actions.can_edit', true)
            ->assertJsonPath('data.admin_actions.can_activate', true);

        $this->assertDatabaseHas('grading_rubrics', [
            'skill' => 'writing',
            'version' => $rubric->version + 1,
            'is_active' => false,
        ]);
    }

    public function test_admin_can_update_draft_policy_and_activate_it(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin]);
        $rubric = GradingRubric::query()->where('skill', 'writing')->where('is_active', true)->firstOrFail();
        $token = $this->tokenFor($admin);
        $draftId = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/v1/admin/grading-rubrics/{$rubric->id}/clone")
            ->assertCreated()
            ->json('data.id');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson("/api/v1/admin/grading-rubrics/{$draftId}", [
                'name' => 'VSTEP Writing v2',
                'policy' => [
                    'assessment_gates' => [
                        'severe_minimum_words_task1' => 70,
                        'minimum_covered_points' => 2,
                    ],
                    'word_rules' => [
                        'official_minimum_task1' => 130,
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'VSTEP Writing v2')
            ->assertJsonPath('data.policy_summary.assessment_gates.severe_minimum_words_task1', 70)
            ->assertJsonPath('data.policy_summary.assessment_gates.minimum_covered_points', 2)
            ->assertJsonPath('data.policy_summary.word_rules.official_minimum_task1', 130);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/v1/admin/grading-rubrics/{$draftId}/activate")
            ->assertOk()
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.lifecycle.status', 'active')
            ->assertJsonPath('data.lifecycle.is_editable', false);

        $this->assertDatabaseHas('grading_rubrics', ['id' => $rubric->id, 'is_active' => false]);
        $this->assertDatabaseHas('grading_rubrics', ['id' => $draftId, 'is_active' => true]);
    }

    public function test_admin_cannot_update_active_rubric_directly(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin]);
        $rubric = GradingRubric::query()->where('skill', 'writing')->where('is_active', true)->firstOrFail();

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->patchJson("/api/v1/admin/grading-rubrics/{$rubric->id}", ['name' => 'Edited active'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('rubric');
    }

    private function tokenFor(User $user): string
    {
        return JWTAuth::fromUser($user);
    }
}
