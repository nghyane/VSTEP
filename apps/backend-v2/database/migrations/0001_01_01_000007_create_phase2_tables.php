<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vocabulary_topics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->default('');
            $table->string('icon_key')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('vocabulary_words', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('topic_id')->constrained('vocabulary_topics')->cascadeOnDelete();
            $table->string('word');
            $table->string('phonetic')->nullable();
            $table->string('audio_url')->nullable();
            $table->string('part_of_speech');
            $table->text('definition');
            $table->text('explanation')->default('');
            $table->jsonb('examples')->default('[]');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('user_known_words', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('word_id')->constrained('vocabulary_words')->cascadeOnDelete();
            $table->boolean('known')->default(true);
            $table->timestamp('last_reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'word_id']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // NotificationType enum
            $table->string('title');
            $table->text('body')->nullable();
            $table->jsonb('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });

        Schema::create('devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('token')->unique();
            $table->string('platform'); // Platform enum
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('user_known_words');
        Schema::dropIfExists('vocabulary_words');
        Schema::dropIfExists('vocabulary_topics');
    }
};
