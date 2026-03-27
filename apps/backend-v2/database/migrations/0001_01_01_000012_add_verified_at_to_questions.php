<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->timestamp('verified_at')->nullable()->after('is_active');
        });

        // Mark all existing questions as verified (seeded/human-written)
        DB::table('questions')->whereNull('verified_at')->update(['verified_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('verified_at');
        });
    }
};
