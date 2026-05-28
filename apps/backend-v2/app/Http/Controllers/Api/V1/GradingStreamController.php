<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\GradingJobStatus;
use App\Http\Controllers\Controller;
use App\Models\GradingJob;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * SSE stream for grading progress.
 *
 * Client opens one connection when submitting an essay.
 * Server pushes progress → scores → feedback → done.
 * Replaces polling + separate feedback call.
 */
final class GradingStreamController extends Controller
{
    public function stream(Request $request, GradingJob $job): StreamedResponse
    {
        return response()->stream(function () use ($job) {
            $lastProgress = 0;
            $maxIterations = 300; // 60s timeout
            $iterations = 0;

            while ($iterations < $maxIterations) {
                $iterations++;
                $job->refresh();

                $progress = $job->progress ?? [];
                $newSteps = array_slice($progress, $lastProgress);

                foreach ($newSteps as $step) {
                    $this->sendEvent('progress', $step);
                }
                $lastProgress = count($progress);

                // Send scores when ready
                if ($job->status === GradingJobStatus::Ready) {
                    $result = $this->loadResult($job);
                    if ($result !== null) {
                        $this->sendEvent('scores', $result);
                    }

                    $this->sendEvent('completed', ['status' => 'ready']);
                    break;
                }

                // Send failure
                if ($job->status === GradingJobStatus::Failed) {
                    $this->sendEvent('failed', [
                        'error' => $job->last_error ?? 'Grading failed',
                    ]);
                    break;
                }

                // Sleep before next poll
                usleep(200_000); // 200ms
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function sendEvent(string $event, array $data): void
    {
        echo "event: {$event}\n";
        echo 'data: '.json_encode($data)."\n\n";

        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
    }

    private function loadResult(GradingJob $job): ?array
    {
        [$type, $id] = [$job->submission_type, $job->submission_id];

        if (str_contains($type, 'writing')) {
            $result = WritingGradingResult::query()
                ->where('submission_type', $type)
                ->where('submission_id', $id)
                ->where('is_active', true)
                ->first();

            if ($result !== null) {
                return [
                    'overall_band' => $result->overall_band,
                    'rubric_scores' => $result->rubric_scores,
                    'strengths' => $result->strengths,
                    'improvements' => $result->improvements,
                    'rewrites' => $result->rewrites,
                ];
            }
        }

        if (str_contains($type, 'speaking')) {
            $result = SpeakingGradingResult::query()
                ->where('submission_type', $type)
                ->where('submission_id', $id)
                ->where('is_active', true)
                ->first();

            if ($result !== null) {
                return [
                    'overall_band' => $result->overall_band,
                    'rubric_scores' => $result->rubric_scores,
                    'transcript' => $result->transcript,
                ];
            }
        }

        return null;
    }
}
