<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\CourseEnrollmentOrder;
use App\Models\WalletTopupOrder;
use Illuminate\Console\Command;

final class ExpirePendingPaymentOrders extends Command
{
    protected $signature = 'payments:expire-pending';

    protected $description = 'Expire pending payment orders past their payment window.';

    public function handle(): int
    {
        $walletCount = WalletTopupOrder::query()
            ->where('status', OrderStatus::Pending)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->update(['status' => OrderStatus::Expired]);

        $courseCount = CourseEnrollmentOrder::query()
            ->where('status', OrderStatus::Pending)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->update(['status' => OrderStatus::Expired]);

        $this->components->info("Expired {$walletCount} wallet topup orders and {$courseCount} course enrollment orders.");

        return self::SUCCESS;
    }
}
