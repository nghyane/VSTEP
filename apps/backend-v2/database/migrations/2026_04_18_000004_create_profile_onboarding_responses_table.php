<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Onboarding responses: raw answers từ wizard 5 bước.
 * Cho phép redo khi reset profile.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_onboarding_responses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->json('weaknesses');
            $table->string('motivation', 30)->nullable();
            $table->json('raw_answers');
            $table->timestamp('completed_at');

            $table->index('profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_onboarding_responses');
    }
};
