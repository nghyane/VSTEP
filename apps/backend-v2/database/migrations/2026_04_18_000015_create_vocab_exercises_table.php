<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * kind ∈ (mcq, fill_blank, word_form). Payload JSONB schema theo kind:
 * - mcq: { prompt, options[4], correct_index }
 * - fill_blank: { sentence, accepted_answers[] }
 * - word_form: { instruction, sentence, root_word, accepted_answers[] }
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vocab_exercises', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('topic_id')
                ->constrained('vocab_topics')
                ->cascadeOnDelete();
            $table->string('kind', 20);
            $table->json('payload');
            $table->text('explanation');
            $table->integer('display_order')->default(0);
            $table->timestamps();

            $table->index(['topic_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vocab_exercises');
    }
};
