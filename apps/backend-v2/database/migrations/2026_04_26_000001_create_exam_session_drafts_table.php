<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lưu trạng thái làm bài dở (autosave) để user resume sau khi đóng tab / refresh.
 * 1 row/session. Cascade delete khi session bị xóa. Row bị xóa thủ công khi submit/abandon
 * (xem ExamSessionService::submit/abandon).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_session_drafts', function (Blueprint $table) {
            $table->foreignUuid('session_id')
                ->primary()
                ->constrained('exam_sessions')
                ->cascadeOnDelete();
            $table->smallInteger('skill_idx')->default(0);
            $table->json('mcq_answers');
            $table->json('writing_answers');
            $table->json('speaking_marks');
            $table->timestamp('saved_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_session_drafts');
    }
};
