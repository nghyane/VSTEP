<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Writing submission — 1 session → 1 submission → N grading results (Slice 8).
 * text snapshot immutable sau submit. Re-submit tạo submission mới.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_writing_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')
                ->constrained('practice_sessions')
                ->cascadeOnDelete();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('prompt_id')
                ->constrained('practice_writing_prompts')
                ->restrictOnDelete();
            $table->longText('text');
            $table->integer('word_count');
            $table->timestamp('submitted_at');

            $table->index(['profile_id', 'submitted_at']);
            $table->index('prompt_id');
            $table->index('session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_writing_submissions');
    }
};
