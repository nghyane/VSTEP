<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Practice;

use App\Enums\Role;
use App\Models\PracticeWritingPrompt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminWritingTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_prompt(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $token = JWTAuth::fromUser($staff);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/practice/writing/prompts', [
                'slug' => 'letter-1',
                'title' => 'Write a complaint letter',
                'part' => 1,
                'prompt' => 'Write to the manager about a problem...',
                'min_words' => 120,
                'max_words' => 150,
                'estimated_minutes' => 20,
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.part', 1);
    }

    public function test_max_words_must_be_gte_min(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $token = JWTAuth::fromUser($staff);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/practice/writing/prompts', [
                'slug' => 'x', 'title' => 'X', 'part' => 1,
                'prompt' => 'p',
                'min_words' => 200,
                'max_words' => 150,
                'estimated_minutes' => 20,
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['max_words']);
    }

    public function test_add_marker(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $prompt = PracticeWritingPrompt::create([
            'slug' => 'p', 'title' => 'P', 'part' => 1, 'prompt' => 'p',
            'min_words' => 100, 'max_words' => 150, 'estimated_minutes' => 20, 'is_published' => false,
        ]);

        $token = JWTAuth::fromUser($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/practice/writing/prompts/{$prompt->id}/markers", [
                'match' => 'Dear Sir/Madam',
                'side' => 'right',
                'color' => 'blue',
                'label' => 'Opening',
                'detail' => 'Formal letter opening.',
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.label', 'Opening');
    }
}
