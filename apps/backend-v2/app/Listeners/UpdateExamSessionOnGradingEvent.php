<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\GradingCompleted;
use App\Events\GradingFailed;
use App\Models\ExamSession;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamWritingSubmission;
use App\Models\GradingJob;
use Illuminate\Support\Facades\Log;

/**
 * Cập nhật exam session status khi grading job kết thúc (completed hoặc failed).
 *
 * Exam session chuyển sang 'graded' khi tất cả writing/speaking grading jobs
 * đã ở trạng thái terminal (ready hoặc failed).
 */
final class UpdateExamSessionOnGradingEvent
{
    public function handle(GradingCompleted|GradingFailed $event): void
    {
        $job = $event->job;
        if (! str_starts_with($job->submission_type, 'exam_')) {
            return;
        }

        $session = $this->resolveExamSession($job);
        if ($session === null) {
            return;
        }

        if (! in_array($session->status, ['submitted', 'grading'], true)) {
            return;
        }

        if ($this->allJobsTerminal($session)) {
            $session->update(['status' => 'graded']);
            Log::info('Exam session marked as graded', [
                'session_id' => $session->id,
                'trigger' => $event::class,
            ]);
        } elseif ($session->status !== 'grading') {
            $session->update(['status' => 'grading']);
        }
    }

    private function resolveExamSession(GradingJob $job): ?ExamSession
    {
        $sessionId = match ($job->submission_type) {
            'exam_writing' => ExamWritingSubmission::query()
                ->where('id', $job->submission_id)
                ->value('session_id'),
            'exam_speaking' => ExamSpeakingSubmission::query()
                ->where('id', $job->submission_id)
                ->value('session_id'),
            default => null,
        };

        return $sessionId !== null
            ? ExamSession::query()->find($sessionId)
            : null;
    }

    private function allJobsTerminal(ExamSession $session): bool
    {
        $writingCount = ExamWritingSubmission::query()
            ->where('session_id', $session->id)
            ->count();

        $speakingCount = ExamSpeakingSubmission::query()
            ->where('session_id', $session->id)
            ->count();

        if ($writingCount + $speakingCount === 0) {
            return true;
        }

        return $this->terminalJobCount('exam_writing', 'exam_writing_submissions', $session) >= $writingCount
            && $this->terminalJobCount('exam_speaking', 'exam_speaking_submissions', $session) >= $speakingCount;
    }

    private function terminalJobCount(string $submissionType, string $table, ExamSession $session): int
    {
        return GradingJob::query()
            ->where('submission_type', $submissionType)
            ->whereIn('submission_id', function ($q) use ($table, $session) {
                $q->select('id')->from($table)->where('session_id', $session->id);
            })
            ->whereIn('status', ['ready', 'failed'])
            ->count();
    }
}
