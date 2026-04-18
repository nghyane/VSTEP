<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grammar_point_levels', function (Blueprint $table) {
            $table->foreignUuid('grammar_point_id')
                ->constrained('grammar_points')
                ->cascadeOnDelete();
            $table->string('level', 2);
            $table->primary(['grammar_point_id', 'level']);
        });

        Schema::create('grammar_point_tasks', function (Blueprint $table) {
            $table->foreignUuid('grammar_point_id')
                ->constrained('grammar_points')
                ->cascadeOnDelete();
            $table->string('task', 10);
            $table->primary(['grammar_point_id', 'task']);
        });

        Schema::create('grammar_point_functions', function (Blueprint $table) {
            $table->foreignUuid('grammar_point_id')
                ->constrained('grammar_points')
                ->cascadeOnDelete();
            $table->string('function', 20);
            $table->primary(['grammar_point_id', 'function']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grammar_point_functions');
        Schema::dropIfExists('grammar_point_tasks');
        Schema::dropIfExists('grammar_point_levels');
    }
};
