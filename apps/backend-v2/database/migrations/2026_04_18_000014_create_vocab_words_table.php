<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 1: 1-n với topic. Nếu cần reuse word cross-topic (phase 2) → chuyển
 * sang many-to-many junction.
 *
 * synonyms/collocations/word_family lưu JSON array để đơn giản. Normalize
 * khi cần lexical graph.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vocab_words', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('topic_id')
                ->constrained('vocab_topics')
                ->cascadeOnDelete();
            $table->string('word', 100);
            $table->string('phonetic', 100)->nullable();
            $table->string('part_of_speech', 30);
            $table->text('definition');
            $table->text('example')->nullable();
            $table->json('synonyms')->nullable();
            $table->json('collocations')->nullable();
            $table->json('word_family')->nullable();
            $table->text('vstep_tip')->nullable();
            $table->integer('display_order')->default(0);
            $table->timestamps();

            $table->unique(['topic_id', 'word']);
            $table->index(['topic_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vocab_words');
    }
};
