<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('skill');
            $table->string('mode');
            $table->string('level');
            $table->jsonb('config')->default('{}');
            $table->foreignUuid('current_question_id')->nullable()->constrained('questions')->nullOnDelete();
            $table->jsonb('summary')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'skill', 'mode']);
            $table->index(['user_id', 'completed_at']);
        });

        Schema::create('user_weak_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('knowledge_point_id')->constrained()->cascadeOnDelete();
            $table->string('skill');
            $table->float('ease_factor')->default(2.5);
            $table->integer('repetition_count')->default(0);
            $table->integer('interval_days')->default(1);
            $table->timestamp('last_practiced_at')->nullable();
            $table->timestamp('next_review_at');
            $table->boolean('is_mastered')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'knowledge_point_id', 'skill']);
            $table->index(['user_id', 'skill', 'next_review_at']);
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->foreignUuid('practice_session_id')->nullable()->after('session_id')
                ->constrained('practice_sessions')->nullOnDelete();
            $table->index('practice_session_id');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('practice_session_id');
        });
        Schema::dropIfExists('user_weak_points');
        Schema::dropIfExists('practice_sessions');
    }
};
