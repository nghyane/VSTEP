<?php

declare(strict_types=1);

namespace Tests\Feature\Exam;

use App\Enums\ExamSessionStatus;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ExamCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_exam_catalog_is_paginated(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        for ($i = 1; $i <= 13; $i++) {
            $this->createPublishedExam("Mock {$i}");
        }

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->getJson('/api/v1/exams?per_page=5')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonPath('meta.total', 13)
            ->assertJsonPath('meta.last_page', 3);
    }

    public function test_learner_exam_catalog_sorts_by_popularity(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $otherProfile = Profile::factory()->create();

        [$popularExam, $popularVersion] = $this->createPublishedExam('Popular Mock');
        [$quietExam] = $this->createPublishedExam('Quiet Mock');

        for ($i = 0; $i < 3; $i++) {
            $this->createSession($otherProfile, $popularVersion, ExamSessionStatus::Submitted);
        }

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->getJson('/api/v1/exams?sort=popular&per_page=2')
            ->assertOk()
            ->assertJsonPath('data.0.id', $popularExam->id)
            ->assertJsonPath('data.0.attempts_count', 3)
            ->assertJsonPath('data.1.id', $quietExam->id);
    }

    public function test_learner_exam_catalog_prioritizes_active_exam_before_requested_sort(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $otherProfile = Profile::factory()->create();

        [$activeExam, $activeVersion] = $this->createPublishedExam('Older Active Mock', [
            'created_at' => now()->subDay(),
        ]);
        [$popularExam, $popularVersion] = $this->createPublishedExam('Newer Popular Mock');

        $this->createSession($profile, $activeVersion, ExamSessionStatus::Active);
        for ($i = 0; $i < 3; $i++) {
            $this->createSession($otherProfile, $popularVersion, ExamSessionStatus::Submitted);
        }

        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/exams?per_page=2')
            ->assertOk()
            ->assertJsonPath('data.0.id', $activeExam->id)
            ->assertJsonPath('data.0.user_state.status', 'in_progress')
            ->assertJsonMissingPath('data.0.has_active_session')
            ->assertJsonMissingPath('data.0.active_session_started_at')
            ->assertJsonPath('data.1.id', $popularExam->id);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/exams?sort=popular&per_page=2')
            ->assertOk()
            ->assertJsonPath('data.0.id', $activeExam->id)
            ->assertJsonPath('data.0.user_state.status', 'in_progress')
            ->assertJsonPath('data.1.id', $popularExam->id);
    }

    public function test_learner_exam_catalog_filters_by_user_state(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();

        [$activeExam, $activeVersion] = $this->createPublishedExam('Active Mock');
        [$submittedExam, $submittedVersion] = $this->createPublishedExam('Submitted Mock');
        [$untouchedExam] = $this->createPublishedExam('Fresh Mock');

        $this->createSession($profile, $activeVersion, ExamSessionStatus::Active);
        $this->createSession($profile, $submittedVersion, ExamSessionStatus::Submitted);

        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/exams?status=in_progress')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeExam->id)
            ->assertJsonPath('data.0.user_state.status', 'in_progress');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/exams?status=submitted')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $submittedExam->id)
            ->assertJsonPath('data.0.user_state.status', 'submitted');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/exams?status=not_started')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $untouchedExam->id)
            ->assertJsonPath('data.0.user_state.status', 'not_started');
    }

    public function test_learner_exam_catalog_auto_submits_expired_active_sessions_before_state_resolution(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        [$exam, $version] = $this->createPublishedExam('Expired Active Mock');
        $session = $this->createSession($profile, $version, ExamSessionStatus::Active, [
            'started_at' => now()->subHours(3),
            'server_deadline_at' => now()->subHour(),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->getJson('/api/v1/exams?per_page=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', $exam->id)
            ->assertJsonPath('data.0.user_state.status', 'submitted')
            ->assertJsonPath('data.0.user_state.session_count', 1);

        $this->assertDatabaseHas('exam_sessions', [
            'id' => $session->id,
            'status' => ExamSessionStatus::AutoSubmitted->value,
        ]);
    }

    public function test_exam_overview_includes_expired_active_sessions_after_auto_submit(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        [$exam, $version] = $this->createPublishedExam('Expired Detail Mock');
        $session = $this->createSession($profile, $version, ExamSessionStatus::Active, [
            'started_at' => now()->subHours(3),
            'server_deadline_at' => now()->subHour(),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->getJson("/api/v1/exams/{$exam->id}")
            ->assertOk()
            ->assertJsonPath('data.attempt_state.active_session', null)
            ->assertJsonPath('data.attempt_state.history.0.id', $session->id)
            ->assertJsonPath('data.attempt_state.history.0.status', ExamSessionStatus::AutoSubmitted->value);
    }

    private function createPublishedExam(string $title, array $attributes = []): array
    {
        $exam = Exam::factory()->create([
            'title' => $title,
            'is_published' => true,
            ...$attributes,
        ]);

        $version = ExamVersion::factory()->create([
            'exam_id' => $exam->id,
            'is_active' => true,
            'published_at' => now(),
        ]);

        return [$exam, $version];
    }

    private function createSession(Profile $profile, ExamVersion $version, ExamSessionStatus $status, array $attributes = []): ExamSession
    {
        return ExamSession::create([
            'profile_id' => $profile->id,
            'exam_version_id' => $version->id,
            'mode' => 'full',
            'selected_skills' => ['listening', 'reading', 'writing', 'speaking'],
            'is_full_test' => true,
            'started_at' => now(),
            'server_deadline_at' => now()->addHours(2),
            'submitted_at' => $status === ExamSessionStatus::Active ? null : now(),
            'status' => $status,
            'coins_charged' => 0,
            ...$attributes,
        ]);
    }

    private function tokenFor(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');
    }
}
