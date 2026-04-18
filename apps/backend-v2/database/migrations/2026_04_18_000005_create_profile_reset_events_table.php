<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit log cho mỗi lần user reset profile.
 * wiped_entities snapshot counts: {srs: 120, mastery: 30, study_time_seconds: 14400}.
 * Xu và enrollments KHÔNG bị xóa khi reset.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_reset_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('profile_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->text('reason')->nullable();
            $table->json('wiped_entities');
            $table->timestamp('reset_at');

            $table->index('profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_reset_events');
    }
};
