<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Quét exam sessions quá hạn chưa submit → auto-submit.
 * Chạy mỗi 5 phút qua scheduler.
 *
 * Logic: status='active' AND server_deadline_at < now() → force submit
 * với MCQ answers đã save qua auto-save, tạo grading jobs cho
 * writing/speaking submissions nếu có.
 */
class ForceSubmitExpiredExams implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $expired = ExamSession::query()
            ->where('status', 'active')
            ->where('server_deadline_at', '<', now())
            ->get();

        foreach ($expired as $session) {
            try {
                $this->forceSubmit($session);
            } catch (\Throwable $e) {
                Log::error('Force-submit failed for expired exam session', [
                    'session_id' => $session->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($expired->isNotEmpty()) {
            Log::info("ForceSubmitExpiredExams: processed {$expired->count()} sessions.");
        }
    }

    private function forceSubmit(ExamSession $session): void
    {
        $version = $session->examVersion;
        $version->load(['listeningSections.items', 'readingPassages.items', 'writingTasks', 'speakingParts']);

        // Build MCQ item map for grading
        $itemMap = [];
        foreach ($version->listeningSections as $section) {
            foreach ($section->items as $item) {
                $itemMap["exam_listening_item:{$item->id}"] = $item->correct_index;
            }
        }
        foreach ($version->readingPassages as $passage) {
            foreach ($passage->items as $item) {
                $itemMap["exam_reading_item:{$item->id}"] = $item->correct_index;
            }
        }

        // Grade existing MCQ answers (may have been saved via auto-save)
        $existingAnswers = ExamMcqAnswer::query()->where('session_id', $session->id)->get();
        $mcqScore = 0;
        foreach ($existingAnswers as $answer) {
            $key = "{$answer->item_ref_type}:{$answer->item_ref_id}";
            $correctIndex = $itemMap[$key] ?? null;
            if ($correctIndex !== null) {
                $isCorrect = $answer->selected_index === $correctIndex;
                if (! $answer->is_correct) {
                    $answer->update(['is_correct' => $isCorrect]);
                }
                if ($isCorrect) {
                    $mcqScore++;
                }
            }
        }

        // Update session status
        $session->update([
            'status' => 'auto_submitted',
            'submitted_at' => $session->server_deadline_at,
        ]);

        Log::info('Force-submitted expired exam session', [
            'session_id' => $session->id,
            'profile_id' => $session->profile_id,
            'deadline' => $session->server_deadline_at,
            'mcq_score' => $mcqScore,
            'mcq_total' => $existingAnswers->count(),
        ]);
    }
}
