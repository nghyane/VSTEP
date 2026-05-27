<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_bookings', function (Blueprint $table) {
            $table->timestamp('cancelled_at')->nullable()->after('booked_at');
        });
    }

    public function down(): void
    {
        Schema::table('teacher_bookings', function (Blueprint $table) {
            $table->dropColumn('cancelled_at');
        });
    }
};
