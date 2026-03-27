<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\SessionService;
use Illuminate\Console\Command;

class AbandonExpiredSessions extends Command
{
    protected $signature = 'sessions:abandon-expired';

    protected $description = 'Mark expired in-progress sessions as abandoned';

    public function handle(SessionService $service): int
    {
        $count = $service->abandonExpired();

        $this->info("Abandoned {$count} expired sessions.");

        return self::SUCCESS;
    }
}
