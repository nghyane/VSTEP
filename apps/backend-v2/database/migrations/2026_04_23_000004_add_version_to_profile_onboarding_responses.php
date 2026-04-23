<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Thêm cột version vào profile_onboarding_responses để hỗ trợ
 * onboarding re-take. User có thể làm lại onboarding nhiều lần,
 * mỗi lần increment version.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profile_onboarding_responses', function (Blueprint $table) {
            $table->unsignedInteger('version')->default(1)->after('profile_id');
        });

        // Set version=1 cho tất cả records hiện có
        DB::table('profile_onboarding_responses')
            ->whereNull('version')
            ->update(['version' => 1]);
    }

    public function down(): void
    {
        Schema::table('profile_onboarding_responses', function (Blueprint $table) {
            $table->dropColumn('version');
        });
    }
};
