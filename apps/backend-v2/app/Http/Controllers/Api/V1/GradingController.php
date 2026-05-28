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
use App\Services\Grading\RubricResolver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class GradingController extends Controller
{
    public function __construct(
        private readonly RubricResolver $rubricResolver,
    ) {}

    /**
     * SSE stream — real-time grading progress.
     */
    public function stream(GradingJob $gradingJob): StreamedResponse
    {
        Gate::authorize('view', $gradingJob);

        return response()->stream(function () use ($gradingJob) {
            $seenCount = 0;
            $timeout = 60;
            $startedAt = time();

            while (time() - $startedAt < $timeout) {
                // Read progress directly from DB — shared between processes
                $progress = DB::table('grading_jobs')
                    ->where('id', $gradingJob->id)
                    ->value('progress');

                $steps = is_string($progress) ? json_decode($progress, true) : ($progress ?? []);
                $newSteps = array_slice($steps, $seenCount);

                foreach ($newSteps as $step) {
                    $this->emitSSE('progress', $step);
                }
                $seenCount = count($steps);

                // Check terminal state
                $status = DB::table('grading_jobs')
                    ->where('id', $gradingJob->id)
                    ->value('status');

                if (in_array($status, ['ready', 'failed'])) {
                    $completedAt = DB::table('grading_jobs')
                        ->where('id', $gradingJob->id)
                        ->value('completed_at');

                    $this->emitSSE('done', [
                        'status' => $status,
                        'completed_at' => $completedAt,
                    ]);

                    return;
                }

                sleep(1);
            }

            $this->emitSSE('error', ['message' => 'Grading timed out']);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function emitSSE(string $event, array $data): void
    {
        echo "event: {$event}\n";
        echo 'data: '.json_encode($data, JSON_UNESCAPED_UNICODE)."\n\n";
        if (ob_get_level()) {
            ob_flush();
        }
        flush();
    }

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

        return response()->json([
            'data' => $result,
            'rubric' => $this->rubricMeta('writing'),
        ]);
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

        return response()->json([
            'data' => $result,
            'rubric' => $this->rubricMeta('speaking'),
        ]);
    }

    /**
     * @return array{max_score: int, criteria: list<array{key: string, label: string, max: int}>}
     */
    private function rubricMeta(string $skill): array
    {
        try {
            $rubric = $this->rubricResolver->active($skill);

            return [
                'max_score' => (int) ($rubric->criteria[0]['max_score'] ?? 10),
                'criteria' => array_map(fn (array $c) => [
                    'key' => $c['key'],
                    'label' => $c['name_vi'] ?? $c['name'] ?? $c['key'],
                    'max' => (int) ($c['max_score'] ?? 10),
                ], $rubric->criteria),
            ];
        } catch (\RuntimeException) {
            return ['max_score' => 10, 'criteria' => []];
        }
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
