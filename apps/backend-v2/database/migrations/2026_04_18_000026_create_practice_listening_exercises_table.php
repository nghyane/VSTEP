<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Listening drill exercises. audio_url là R2 key hoặc external URL.
 * word_timestamps (JSON array of {word, start, end}) dùng cho subtitle sync.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_listening_exercises', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->tinyInteger('part');
            $table->string('audio_url', 500)->nullable();
            $table->text('transcript');
            $table->text('vietnamese_transcript')->nullable();
            $table->json('word_timestamps')->nullable();
            $table->json('keywords')->nullable();
            $table->smallInteger('estimated_minutes');
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'part']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_listening_exercises');
    }
};
