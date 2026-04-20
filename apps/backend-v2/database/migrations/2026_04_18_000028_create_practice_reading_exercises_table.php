<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_reading_exercises', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->tinyInteger('part');
            $table->text('passage');
            $table->text('vietnamese_translation')->nullable();
            $table->json('keywords')->nullable();
            $table->smallInteger('estimated_minutes');
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'part']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_reading_exercises');
    }
};
