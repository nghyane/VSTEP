<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ExamSession;
use App\Services\SessionService;
use Illuminate\Console\Command;

class ReconcileSessionResults extends Command
{
    protected $signature = 'sessions:reconcile-results {--session-id=}';

    protected $description = 'Reconcile exam session statuses and scores from subjective submissions';

    public function handle(SessionService $service): int
    {
        $sessionId = $this->option('session-id');

        $sessions = ExamSession::query()
            ->when($sessionId, fn ($q) => $q->where('id', $sessionId))
            ->whereHas('submissions')
            ->with(['exam', 'submissions.question'])
            ->get();

        foreach ($sessions as $session) {
            $service->reconcileSessionResult($session);
        }

        $this->info("Reconciled {$sessions->count()} sessions.");

        return self::SUCCESS;
    }
}
