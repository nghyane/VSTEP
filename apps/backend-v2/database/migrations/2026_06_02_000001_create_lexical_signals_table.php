<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lexical_signals', function (Blueprint $table): void {
            $table->id();
            $table->string('phrase', 120);
            $table->string('type', 30);
            $table->string('category', 50);
            $table->string('level', 3)->nullable();
            $table->unsignedTinyInteger('weight')->default(1);
            $table->string('skill', 20)->default('writing');
            $table->string('task_type', 40)->nullable();
            $table->string('source', 80);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['phrase', 'type', 'skill', 'task_type']);
            $table->index(['skill', 'type', 'is_active']);
            $table->index(['skill', 'type', 'task_type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lexical_signals');
    }
};
