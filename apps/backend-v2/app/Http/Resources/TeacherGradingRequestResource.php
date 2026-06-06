<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\AssessmentAttempt;
use App\Models\AssessmentResult;
use App\Models\AssessmentRubric;
use App\Models\Profile;
use App\Models\TeacherGradingResult;
use App\Models\User;
use App\Services\AssessmentDiagnosticsService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class TeacherGradingRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'status' => $this->resource->status?->value ?? $this->resource->status,
            'student_note' => $this->resource->student_note,
            'staff_note' => $this->resource->staff_note,
            'priority' => $this->resource->priority,
            'due_at' => $this->resource->due_at,
            'requested_at' => $this->resource->requested_at,
            'assigned_at' => $this->resource->assigned_at,
            'started_at' => $this->resource->started_at,
            'completed_at' => $this->resource->completed_at,
            'cancelled_at' => $this->resource->cancelled_at,
            'profile' => $this->profile($this->resource->profile),
            'assigned_teacher' => $this->user($this->resource->assignedTeacher),
            'assigned_by' => $this->user($this->resource->assignedBy),
            'attempt' => $this->attempt($this->resource->attempt),
            'teacher_result' => $this->teacherResult($this->resource->teacherResult),
        ];
    }

    private function profile(?Profile $profile): ?array
    {
        if (! $profile instanceof Profile) {
            return null;
        }

        return [
            'id' => $profile->id,
            'nickname' => $profile->nickname,
            'account' => $this->user($profile->account),
        ];
    }

    private function user(?User $user): ?array
    {
        if (! $user instanceof User) {
            return null;
        }

        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
        ];
    }

    private function attempt(?AssessmentAttempt $attempt): ?array
    {
        if (! $attempt instanceof AssessmentAttempt) {
            return null;
        }

        return [
            'id' => $attempt->id,
            'profile_id' => $attempt->profile_id,
            'skill' => $attempt->skill->value,
            'task_type' => $attempt->task_type->value,
            'source_type' => $attempt->source_type->value,
            'source_id' => $attempt->source_id,
            'prompt' => $attempt->prompt,
            'response_payload' => $attempt->response_payload,
            'submitted_at' => $attempt->submitted_at,
            'rubric' => $this->rubric($attempt->rubric),
            'result' => $this->result($attempt->result, $attempt),
        ];
    }

    private function rubric(?AssessmentRubric $rubric): ?array
    {
        if (! $rubric instanceof AssessmentRubric) {
            return null;
        }

        return [
            'id' => $rubric->id,
            'title' => $rubric->title,
            'skill' => $rubric->skill->value,
            'task_type' => $rubric->task_type->value,
            'max_score' => 10,
            'criteria' => $rubric->criteria,
        ];
    }

    private function result(?AssessmentResult $result, AssessmentAttempt $attempt): ?array
    {
        if (! $result instanceof AssessmentResult) {
            return null;
        }

        return [
            'id' => $result->id,
            'overall_band' => $result->overall_band,
            'criterion_scores' => $result->criterion_scores,
            'feedback' => $result->feedback,
            'diagnostics' => app(AssessmentDiagnosticsService::class)->forAttempt($attempt),
            'source' => 'ai',
        ];
    }

    private function teacherResult(?TeacherGradingResult $result): ?array
    {
        if (! $result instanceof TeacherGradingResult) {
            return null;
        }

        return [
            'id' => $result->id,
            'teacher_id' => $result->teacher_id,
            'overall_band' => $result->overall_band,
            'criterion_scores' => $result->criterion_scores,
            'feedback' => $result->feedback,
            'source' => 'teacher',
            'ai_result_snapshot' => $result->ai_result_snapshot,
            'submitted_at' => $result->submitted_at,
        ];
    }
}
