<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_schedule_items', function (Blueprint $table) {
            $table->string('status', 20)->default('scheduled')->after('topic');
            $table->string('cancel_reason', 500)->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('course_schedule_items', function (Blueprint $table) {
            $table->dropColumn(['status', 'cancel_reason']);
        });
    }
};
