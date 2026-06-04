<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCourseServiceDecompositionTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): string
    {
        $user = User::factory()->admin()->create();

        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->json('data.access_token');
    }

    // ── Domain 1: Course CRUD ──

    public function test_admin_can_list_courses(): void
    {
        $token = $this->actingAsAdmin();
        Course::factory()->count(3)->create();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/courses')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_create_and_show_course(): void
    {
        $token = $this->actingAsAdmin();

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/courses', [
                'slug' => 'test-course-'.uniqid(),
                'title' => 'Test Course',
                'target_level' => 'B2',
                'teacher_id' => User::factory()->teacher()->create()->id,
                'start_date' => now()->toDateString(),
                'end_date' => now()->addMonths(1)->toDateString(),
                'price_vnd' => 299000,
                'max_slots' => 20,
                'required_full_tests' => 0,
                'commitment_window_days' => 7,
            ]);

        $create->assertCreated();
        $courseId = $create->json('data.id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/courses/{$courseId}")
            ->assertOk()
            ->assertJsonPath('data.title', 'Test Course');
    }

    public function test_admin_can_publish_and_unpublish_course(): void
    {
        $token = $this->actingAsAdmin();
        $course = Course::factory()->unpublished()->create();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/courses/{$course->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.is_published', true);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/courses/{$course->id}/unpublish")
            ->assertOk()
            ->assertJsonPath('data.is_published', false);
    }

    public function test_admin_can_create_duplicate_title_as_draft_but_cannot_publish_it(): void
    {
        $token = $this->actingAsAdmin();
        Course::factory()->create(['title' => 'B2 Intensive']);

        $draft = Course::factory()->unpublished()->create(['title' => 'B2 Intensive']);

        $this->assertDatabaseHas('courses', [
            'id' => $draft->id,
            'title' => 'B2 Intensive',
            'is_published' => false,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/courses/{$draft->id}/publish")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    // ── Domain 2: Schedule Items ──

    public function test_admin_can_manage_schedule_items(): void
    {
        $token = $this->actingAsAdmin();
        $course = Course::factory()->create();

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/courses/{$course->id}/schedule-items", [
                'date' => now()->addDays(3)->toDateString(),
                'start_time' => '09:00',
                'end_time' => '11:00',
                'topic' => 'Session 1',
            ]);

        $create->assertCreated();
        $itemId = $create->json('data.id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/courses/{$course->id}/schedule-items")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/schedule-items/{$itemId}", ['topic' => 'Updated Session'])
            ->assertOk()
            ->assertJsonPath('data.topic', 'Updated Session');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/schedule-items/{$itemId}")
            ->assertNoContent();
    }

    // ── Domain 3: Enrollments ──

    public function test_admin_can_list_enrollments(): void
    {
        $token = $this->actingAsAdmin();
        $course = Course::factory()->create();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/courses/{$course->id}/enrollments")
            ->assertOk();
    }

    // ── Domain 4: Slots ──

    public function test_admin_can_create_and_update_slots(): void
    {
        $token = $this->actingAsAdmin();
        $course = Course::factory()->create();

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/courses/{$course->id}/slots", [
                'starts_at' => now()->addDays(7)->toDateTimeString(),
                'ends_at' => now()->addDays(7)->addHours(1)->toDateTimeString(),
            ]);

        $create->assertCreated();
        $slotId = $create->json('data.id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/courses/{$course->id}/slots")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/slots/{$slotId}", [
                'starts_at' => now()->addDays(8)->toDateTimeString(),
                'ends_at' => now()->addDays(8)->addHours(1)->toDateTimeString(),
            ])
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/slots/{$slotId}")
            ->assertNoContent();
    }

    // ── Domain 5: Bookings ──

    public function test_admin_can_list_bookings(): void
    {
        $token = $this->actingAsAdmin();
        $course = Course::factory()->create();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/courses/{$course->id}/bookings")
            ->assertOk();
    }
}
