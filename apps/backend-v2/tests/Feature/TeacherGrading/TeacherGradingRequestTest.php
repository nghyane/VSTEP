<?php

declare(strict_types=1);

namespace Tests\Feature\TeacherGrading;

use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;
use App\Enums\AdminNotificationType;
use App\Enums\NotificationType;
use App\Enums\Role;
use App\Enums\TeacherGradingRequestStatus;
use App\Models\AdminNotification;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentEvidence;
use App\Models\AssessmentResult;
use App\Models\AssessmentRubric;
use App\Models\PracticeSession;
use App\Models\PracticeWritingPrompt;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use App\Models\TeacherGradingRequest;
use App\Models\TeacherGradingResult;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class TeacherGradingRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_requests_teacher_grading_once_and_staff_is_notified(): void
    {
        User::factory()->create(['role' => Role::Staff]);
        [$learner, , $attempt] = $this->gradedWritingAttempt();

        $this->withTokenFor($learner)
            ->postJson("/api/v1/assessment-attempts/{$attempt->id}/teacher-grading-request", [
                'student_note' => 'Please review my task response.',
            ])
            ->assertAccepted()
            ->assertJsonPath('data.status', TeacherGradingRequestStatus::PendingAssignment->value)
            ->assertJsonPath('data.attempt.id', $attempt->id);

        $this->assertSame(1, TeacherGradingRequest::query()->where('attempt_id', $attempt->id)->count());
        $this->assertSame(1, AdminNotification::query()
            ->where('type', AdminNotificationType::TeacherGradingRequestCreated->value)
            ->count());

        $this->withTokenFor($learner)
            ->postJson("/api/v1/assessment-attempts/{$attempt->id}/teacher-grading-request")
            ->assertAccepted()
            ->assertJsonPath('data.status', TeacherGradingRequestStatus::PendingAssignment->value);

        $this->assertSame(1, TeacherGradingRequest::query()->where('attempt_id', $attempt->id)->count());
        $this->assertSame(1, AdminNotification::query()
            ->where('type', AdminNotificationType::TeacherGradingRequestCreated->value)
            ->count());
    }

    public function test_staff_assigns_request_and_teacher_can_list_it(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $teacher = User::factory()->teacher()->create();
        [$learner, , $attempt] = $this->gradedWritingAttempt();
        $requestId = $this->createTeacherGradingRequest($learner, $attempt);

        $this->withTokenFor($staff)
            ->postJson("/api/v1/admin/teacher-grading-requests/{$requestId}/assign", [
                'teacher_id' => $teacher->id,
                'staff_note' => 'Priority learner.',
                'priority' => 5,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TeacherGradingRequestStatus::Assigned->value)
            ->assertJsonPath('data.assigned_teacher.id', $teacher->id);

        $this->assertDatabaseHas('admin_notifications', [
            'user_id' => $teacher->id,
            'type' => AdminNotificationType::TeacherGradingRequestAssigned->value,
        ]);

        $this->withTokenFor($teacher)
            ->getJson('/api/v1/teacher/grading-requests')
            ->assertOk()
            ->assertJsonPath('data.0.id', $requestId)
            ->assertJsonPath('data.0.assigned_teacher.id', $teacher->id);
    }

    public function test_teacher_submit_stores_teacher_result_separately_and_notifies_learner(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $teacher = User::factory()->teacher()->create();
        [$learner, $profile, $attempt] = $this->gradedWritingAttempt();
        $requestId = $this->createTeacherGradingRequest($learner, $attempt);

        $this->withTokenFor($staff)
            ->postJson("/api/v1/admin/teacher-grading-requests/{$requestId}/assign", [
                'teacher_id' => $teacher->id,
            ])
            ->assertOk();

        $this->withTokenFor($teacher)
            ->postJson("/api/v1/teacher/grading-requests/{$requestId}/submit", [
                'criterion_scores' => [
                    ['key' => 'task_fulfillment', 'score' => 8, 'comment' => 'Addresses the prompt.'],
                    ['key' => 'organization', 'score' => 7],
                    ['key' => 'grammar', 'score' => 7],
                    ['key' => 'vocabulary', 'score' => 6],
                ],
                'feedback' => [
                    'strengths' => ['Clear position.'],
                    'improvements' => ['Use more precise vocabulary.'],
                    'overall_comment' => 'Good B2-level response.',
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TeacherGradingRequestStatus::Completed->value)
            ->assertJsonPath('data.teacher_result.overall_band', 7);

        $result = $attempt->result()->firstOrFail();
        $this->assertSame(6.0, $result->overall_band);

        $teacherResult = TeacherGradingResult::query()->where('attempt_id', $attempt->id)->firstOrFail();
        $this->assertSame(7.0, $teacherResult->overall_band);
        $this->assertSame($teacher->id, $teacherResult->teacher_id);
        $this->assertSame(6.0, (float) $teacherResult->ai_result_snapshot['overall_band']);

        $this->assertDatabaseHas('notifications', [
            'profile_id' => $profile->id,
            'type' => NotificationType::TeacherGradingCompleted->value,
        ]);

        $this->withTokenFor($learner)
            ->getJson("/api/v1/assessment-attempts/{$attempt->id}/view")
            ->assertOk()
            ->assertJsonPath('data.result.source', 'ai')
            ->assertJsonPath('data.result.overall_band', 6)
            ->assertJsonPath('data.teacher_grading_request.status', TeacherGradingRequestStatus::Completed->value)
            ->assertJsonPath('data.teacher_grading_request.teacher_result.source', 'teacher')
            ->assertJsonPath('data.teacher_grading_request.teacher_result.overall_band', 7);
    }

    public function test_unassigned_teacher_cannot_submit_request(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $teacher = User::factory()->teacher()->create();
        $otherTeacher = User::factory()->teacher()->create();
        [$learner, , $attempt] = $this->gradedWritingAttempt();
        $requestId = $this->createTeacherGradingRequest($learner, $attempt);

        $this->withTokenFor($staff)
            ->postJson("/api/v1/admin/teacher-grading-requests/{$requestId}/assign", [
                'teacher_id' => $teacher->id,
            ])
            ->assertOk();

        $this->withTokenFor($otherTeacher)
            ->postJson("/api/v1/teacher/grading-requests/{$requestId}/submit", [
                'criterion_scores' => [['key' => 'task_fulfillment', 'score' => 8]],
            ])
            ->assertForbidden();
    }

    private function createTeacherGradingRequest(User $learner, AssessmentAttempt $attempt): string
    {
        return (string) $this->withTokenFor($learner)
            ->postJson("/api/v1/assessment-attempts/{$attempt->id}/teacher-grading-request")
            ->assertAccepted()
            ->json('data.id');
    }

    /** @return array{User, Profile, AssessmentAttempt} */
    private function gradedWritingAttempt(): array
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $prompt = PracticeWritingPrompt::factory()->create(['part' => 2]);
        $session = PracticeSession::factory()->create([
            'profile_id' => $profile->id,
            'module' => 'writing',
            'content_ref_type' => 'practice_writing_prompt',
            'content_ref_id' => $prompt->id,
        ]);

        $submission = PracticeWritingSubmission::create([
            'session_id' => $session->id,
            'profile_id' => $profile->id,
            'prompt_id' => $prompt->id,
            'text' => 'This is a practice writing answer with a clear position.',
            'word_count' => 10,
            'submitted_at' => now(),
        ]);
        $rubric = AssessmentRubric::query()
            ->where('task_type', AssessmentTaskType::WritingTask2Essay)
            ->firstOrFail();

        $attempt = AssessmentAttempt::create([
            'profile_id' => $profile->id,
            'rubric_id' => $rubric->id,
            'skill' => AssessmentSkill::Writing,
            'task_type' => AssessmentTaskType::WritingTask2Essay,
            'source_type' => AssessmentSourceType::Practice,
            'source_id' => $submission->id,
            'prompt' => ['part' => 2, 'prompt' => $prompt->prompt, 'requirements' => ['Write clearly']],
            'response_payload' => ['text' => $submission->text, 'metadata' => ['word_count' => $submission->word_count]],
            'submitted_at' => now(),
        ]);

        AssessmentResult::create([
            'attempt_id' => $attempt->id,
            'rubric_id' => $rubric->id,
            'criterion_scores' => [['key' => 'grammar', 'score' => 6.0, 'weight' => 0.25]],
            'overall_band' => 6.0,
            'calculation_trace' => ['formula' => 'test'],
            'feedback' => ['strengths' => ['Good attempt.']],
        ]);

        AssessmentEvidence::create([
            'attempt_id' => $attempt->id,
            'rubric_id' => $rubric->id,
            'signals' => ['vocabulary' => ['word_count' => 10]],
            'evidence' => ['task' => ['points_covered' => 1, 'points_required' => 1]],
            'validation' => ['passed' => true],
            'extraction_trace' => ['strategy' => 'test'],
        ]);

        return [$user, $profile, $attempt];
    }

    private function withTokenFor(User $user): self
    {
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');

        return $this->withHeader('Authorization', "Bearer {$token}");
    }
}
