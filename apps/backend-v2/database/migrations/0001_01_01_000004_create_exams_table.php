<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('level')->default('B1');
            $table->string('type')->default('practice');
            $table->integer('duration_minutes')->nullable();
            $table->jsonb('blueprint')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['type', 'is_active']);
        });

        Schema::create('exam_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('exam_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('in_progress');
            $table->float('listening_score')->nullable();
            $table->float('reading_score')->nullable();
            $table->float('writing_score')->nullable();
            $table->float('speaking_score')->nullable();
            $table->float('overall_score')->nullable();
            $table->string('overall_band')->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('exam_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->foreignUuid('question_id')->constrained()->cascadeOnDelete();
            $table->jsonb('answer')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->timestamps();

            $table->unique(['session_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_answers');
        Schema::dropIfExists('exam_sessions');
        Schema::dropIfExists('exams');
    }
};
