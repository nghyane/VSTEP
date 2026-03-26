<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\GradingConsumer;
use Illuminate\Console\Command;

class ConsumeGradingResults extends Command
{
    protected $signature = 'grading:consume {--once : Process pending messages and exit}';

    protected $description = 'Consume grading results from Redis stream';

    public function handle(GradingConsumer $consumer): int
    {
        $consumer->ensureGroup();

        if ($this->option('once')) {
            $count = $consumer->poll(100, 0);
            $this->info("Processed {$count} results.");

            return self::SUCCESS;
        }

        $this->info('Listening for grading results...');

        while (true) {
            $consumer->poll();
        }
    }
}
