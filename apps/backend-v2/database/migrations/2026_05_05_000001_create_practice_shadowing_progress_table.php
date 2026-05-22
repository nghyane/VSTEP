<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_shadowing_progress', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->string('lesson_id', 64);
            $table->smallInteger('segment_index');
            $table->smallInteger('accuracy_percent')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['profile_id', 'lesson_id', 'segment_index']);
            $table->index(['profile_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_shadowing_progress');
    }
};
