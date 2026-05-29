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
 * Unified SSE stream: grading progress → scores → feedback.
 *
 * Single connection handles the entire flow from submission to AI feedback.
 * Pass ?feedback=1 to keep connection alive after grading for feedback delivery.
 */
final class GradingStreamController extends Controller
{
    private const POLL_MS = 200_000;   // 200ms

    private const FEEDBACK_POLL_MS = 2_000_000; // 2s

    private const MAX_ITERATIONS = 300; // 60s

    private const FEEDBACK_TIMEOUT_S = 60;

    public function stream(Request $request, GradingJob $job): StreamedResponse
    {
        return response()->stream(function () use ($request, $job) {
            $lastProgress = 0;
            $iterations = 0;
            $done = false;

            // Phase 1: grading progress
            while ($iterations < self::MAX_ITERATIONS) {
                $iterations++;
                $job->refresh();

                $progress = $job->progress ?? [];
                $newSteps = array_slice($progress, $lastProgress);

                foreach ($newSteps as $step) {
                    $this->sendEvent('progress', $step);
                }
                $lastProgress = count($progress);

                if ($job->status === GradingJobStatus::Ready) {
                    $result = $this->loadGradingResult($job);
                    if ($result !== null) {
                        $this->sendEvent('scores', $result);
                    }
                    $this->sendEvent('completed', ['status' => 'ready']);
                    $done = true;
                    break;
                }

                if ($job->status === GradingJobStatus::Failed) {
                    $this->sendEvent('failed', ['error' => $job->last_error ?? 'Grading failed']);

                    return;
                }

                usleep(self::POLL_MS);
            }

            if (! $done) {
                $this->sendEvent('failed', ['error' => 'Grading timed out']);

                return;
            }

            // Phase 2: feedback (optional)
            if ($request->boolean('feedback')) {
                $this->streamFeedback($job, $request->boolean('speaking'));
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function streamFeedback(GradingJob $job, bool $speaking): void
    {
        $start = time();
        [$type, $id] = [$job->submission_type, $job->submission_id];

        while (time() - $start < self::FEEDBACK_TIMEOUT_S) {
            if ($speaking) {
                $result = SpeakingGradingResult::query()
                    ->where('submission_type', $type)
                    ->where('submission_id', $id)
                    ->where('is_active', true)
                    ->first();

                if ($result !== null && ! empty($result->strengths)) {
                    $this->sendEvent('feedback', ['status' => 'ready']);
                    break;
                }
            } else {
                $result = WritingGradingResult::query()
                    ->where('submission_type', $type)
                    ->where('submission_id', $id)
                    ->where('is_active', true)
                    ->first();

                if ($result !== null && ! empty($result->strengths)) {
                    $this->sendEvent('feedback', ['status' => 'ready']);
                    break;
                }
            }

            usleep(self::FEEDBACK_POLL_MS);
        }
    }

    private function loadGradingResult(GradingJob $job): ?array
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
                    'annotations' => $result->annotations,
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
                    'pronunciation_report' => $result->pronunciation_report,
                ];
            }
        }

        return null;
    }

    private function sendEvent(string $event, array $data): void
    {
        echo "event: {$event}\n";
        echo 'data: '.json_encode($data, JSON_UNESCAPED_UNICODE)."\n\n";

        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
    }
}
