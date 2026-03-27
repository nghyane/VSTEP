<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sentence_topics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->default('');
            $table->string('icon_key')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('sentence_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('topic_id')->constrained('sentence_topics')->cascadeOnDelete();
            $table->text('sentence');
            $table->string('audio_url')->nullable();
            $table->text('translation');
            $table->text('explanation')->default('');
            $table->text('writing_usage')->default('');
            $table->string('difficulty');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('user_mastered_sentences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('sentence_id')->constrained('sentence_items')->cascadeOnDelete();
            $table->boolean('mastered')->default(true);
            $table->timestamp('last_reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'sentence_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_mastered_sentences');
        Schema::dropIfExists('sentence_items');
        Schema::dropIfExists('sentence_topics');
    }
};
