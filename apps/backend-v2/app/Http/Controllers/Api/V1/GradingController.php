<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\GradingJobStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\GradingJobResource;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamWritingSubmission;
use App\Models\GradingJob;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeWritingSubmission;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class GradingController extends Controller
{
    public function showJob(GradingJob $gradingJob): JsonResponse
    {
        Gate::authorize('view', $gradingJob);

        return response()->json(['data' => GradingJobResource::make($gradingJob)]);
    }

    public function jobStatus(GradingJob $gradingJob): JsonResponse
    {
        Gate::authorize('view', $gradingJob);

        $result = null;
        if ($gradingJob->status === GradingJobStatus::Ready) {
            $result = $this->loadActiveResult($gradingJob);
        }

        return response()->json(['data' => [
            'id' => $gradingJob->id,
            'status' => $gradingJob->status,
            'attempts' => $gradingJob->attempts,
            'result' => $result,
            'completed_at' => $gradingJob->completed_at,
        ]]);
    }

    public function writingResult(Request $request, string $submissionType, string $submissionId): JsonResponse
    {
        $submission = $this->loadSubmission($submissionType, $submissionId);
        $this->assertOwnership($request, $submission);

        $result = WritingGradingResult::query()
            ->where('submission_type', $submissionType)
            ->where('submission_id', $submissionId)
            ->where('is_active', true)
            ->first();

        return response()->json(['data' => $result]);
    }

    public function speakingResult(Request $request, string $submissionType, string $submissionId): JsonResponse
    {
        $submission = $this->loadSubmission($submissionType, $submissionId);
        $this->assertOwnership($request, $submission);

        $result = SpeakingGradingResult::query()
            ->where('submission_type', $submissionType)
            ->where('submission_id', $submissionId)
            ->where('is_active', true)
            ->first();

        return response()->json(['data' => $result]);
    }

    private function loadSubmission(string $type, string $id): Model
    {
        $submission = match ($type) {
            'practice_writing' => PracticeWritingSubmission::query()->find($id),
            'practice_speaking' => PracticeSpeakingSubmission::query()->find($id),
            'exam_writing' => ExamWritingSubmission::query()->find($id),
            'exam_speaking' => ExamSpeakingSubmission::query()->find($id),
            default => null,
        };

        if ($submission === null) {
            abort(404, 'Submission not found.');
        }

        return $submission;
    }

    private function assertOwnership(Request $request, Model $submission): void
    {
        if ($submission->profile_id !== $request->profile()->id) {
            abort(403);
        }
    }

    private function loadActiveResult(GradingJob $job): ?Model
    {
        return match ($job->submission_type) {
            'practice_writing', 'exam_writing' => WritingGradingResult::query()
                ->where('job_id', $job->id)
                ->where('is_active', true)
                ->first(),
            'practice_speaking', 'exam_speaking' => SpeakingGradingResult::query()
                ->where('job_id', $job->id)
                ->where('is_active', true)
                ->first(),
            default => null,
        };
    }
}
