<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grammar_patterns', function (Blueprint $table): void {
            $table->id();
            $table->string('key', 80)->unique();
            $table->string('label', 120);
            $table->string('level', 3)->nullable();
            $table->string('category', 50);
            $table->string('pattern_type', 20)->default('regex');
            $table->text('pattern');
            $table->string('skill', 20)->default('writing');
            $table->unsignedTinyInteger('weight')->default(1);
            $table->string('source', 80);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['skill', 'category', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grammar_patterns');
    }
};
