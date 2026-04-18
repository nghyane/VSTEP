<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * category ∈ (foundation, sentence, task, error-clinic).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grammar_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('name', 150);
            $table->string('vietnamese_name', 150)->nullable();
            $table->text('summary');
            $table->string('category', 30);
            $table->integer('display_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'category', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grammar_points');
    }
};
