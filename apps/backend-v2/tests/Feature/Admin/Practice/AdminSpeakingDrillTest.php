<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Practice;

use App\Enums\Role;
use App\Models\PracticeSpeakingDrill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminSpeakingDrillTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_drill(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $token = JWTAuth::fromUser($staff);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/practice/speaking-drills', [
                'slug' => 'tongue-twisters-1',
                'title' => 'Tongue twisters',
                'level' => 'B1',
                'estimated_minutes' => 10,
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.level', 'B1');
    }

    public function test_add_sentence_auto_orders(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $drill = PracticeSpeakingDrill::create([
            'slug' => 'd', 'title' => 'D', 'level' => 'B1',
            'estimated_minutes' => 10, 'is_published' => false,
        ]);
        $drill->sentences()->create(['text' => 'first', 'display_order' => 0]);

        $token = JWTAuth::fromUser($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/practice/speaking-drills/{$drill->id}/sentences", [
                'text' => 'She sells seashells.',
                'translation' => 'Cô ấy bán vỏ sò.',
            ]);

        $res->assertCreated();
        $this->assertSame(1, $res->json('data.display_order'));
    }
}
