<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * kind ∈ (mcq, error_correction, fill_blank, rewrite). Payload schemas:
 * - mcq: { prompt, options[4], correct_index }
 * - error_correction: { sentence, error_start, error_end, correction }
 * - fill_blank: { template, accepted_answers[] }
 * - rewrite: { instruction, original, accepted_answers[] }
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grammar_exercises', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('grammar_point_id')
                ->constrained('grammar_points')
                ->cascadeOnDelete();
            $table->string('kind', 30);
            $table->json('payload');
            $table->text('explanation');
            $table->integer('display_order')->default(0);
            $table->timestamps();

            $table->index(['grammar_point_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grammar_exercises');
    }
};
