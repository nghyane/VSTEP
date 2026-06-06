<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\Contracts\ExamSessionExpiryInterface;
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
 * với MCQ answers đã save qua auto-save. Writing/speaking không có
 * submission rows (draft chỉ lưu text/marks) nên chỉ grade MCQ.
 */
final class ForceSubmitExpiredExams implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(ExamSessionExpiryInterface $expiry): void
    {
        $processed = $expiry->forceSubmitExpired();
        if ($processed > 0) {
            Log::info("ForceSubmitExpiredExams: processed {$processed} sessions.");
        }
    }
}
