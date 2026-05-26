<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `is_best_value` flag — admin tự đánh dấu gói "Best value" thay vì FE tự
 * tính savings. Partial unique index đảm bảo tối đa 1 gói đang `is_best_value=true`
 * tại 1 thời điểm; trường hợp multi-true → DB throw 23505, service catch và
 * unset cái cũ trước khi set cái mới.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wallet_topup_packages', function (Blueprint $table) {
            $table->boolean('is_best_value')->default(false)->after('is_active');
        });

        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('
            CREATE UNIQUE INDEX uq_topup_package_best_value
            ON wallet_topup_packages ((is_best_value))
            WHERE is_best_value = true
        ');
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS uq_topup_package_best_value');
        }

        Schema::table('wallet_topup_packages', function (Blueprint $table) {
            $table->dropColumn('is_best_value');
        });
    }
};
