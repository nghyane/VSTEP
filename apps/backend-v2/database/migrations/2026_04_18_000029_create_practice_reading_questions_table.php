<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_reading_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exercise_id')
                ->constrained('practice_reading_exercises')
                ->cascadeOnDelete();
            $table->integer('display_order');
            $table->text('question');
            $table->json('options');
            $table->tinyInteger('correct_index');
            $table->text('explanation');

            $table->index(['exercise_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_reading_questions');
    }
};
