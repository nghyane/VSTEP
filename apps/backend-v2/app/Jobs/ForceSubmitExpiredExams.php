<?php

declare(strict_types=1);

namespace App\Jobs;

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
 * với current answers (MCQ đã save qua auto-save endpoint).
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
            $session->update([
                'status' => 'auto_submitted',
                'submitted_at' => $session->server_deadline_at,
            ]);

            Log::info('Force-submitted expired exam session', [
                'session_id' => $session->id,
                'profile_id' => $session->profile_id,
                'deadline' => $session->server_deadline_at,
            ]);
        }

        if ($expired->isNotEmpty()) {
            Log::info("ForceSubmitExpiredExams: processed {$expired->count()} sessions.");
        }
    }
}
