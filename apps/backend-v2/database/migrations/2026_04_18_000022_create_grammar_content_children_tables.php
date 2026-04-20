<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grammar_structures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('grammar_point_id')
                ->constrained('grammar_points')
                ->cascadeOnDelete();
            $table->text('template');
            $table->text('description')->nullable();
            $table->integer('display_order')->default(0);

            $table->index(['grammar_point_id', 'display_order']);
        });

        Schema::create('grammar_examples', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('grammar_point_id')
                ->constrained('grammar_points')
                ->cascadeOnDelete();
            $table->text('en');
            $table->text('vi');
            $table->text('note')->nullable();
            $table->integer('display_order')->default(0);

            $table->index(['grammar_point_id', 'display_order']);
        });

        Schema::create('grammar_common_mistakes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('grammar_point_id')
                ->constrained('grammar_points')
                ->cascadeOnDelete();
            $table->text('wrong');
            $table->text('correct');
            $table->text('explanation');
            $table->integer('display_order')->default(0);

            $table->index(['grammar_point_id', 'display_order']);
        });

        Schema::create('grammar_vstep_tips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('grammar_point_id')
                ->constrained('grammar_points')
                ->cascadeOnDelete();
            $table->string('task', 10);
            $table->text('tip');
            $table->text('example');
            $table->integer('display_order')->default(0);

            $table->index(['grammar_point_id', 'task']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grammar_vstep_tips');
        Schema::dropIfExists('grammar_common_mistakes');
        Schema::dropIfExists('grammar_examples');
        Schema::dropIfExists('grammar_structures');
    }
};
