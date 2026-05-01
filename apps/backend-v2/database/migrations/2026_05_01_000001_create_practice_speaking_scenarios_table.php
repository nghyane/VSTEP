<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_speaking_scenarios', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('title', 200);
            $table->string('level', 2);
            $table->string('character_name', 80);
            $table->string('character_voice_label', 40);
            $table->text('description');
            $table->text('system_prompt');
            $table->text('opening_line');
            $table->json('target_vocab');
            $table->smallInteger('estimated_minutes');
            $table->smallInteger('expected_turns');
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_speaking_scenarios');
    }
};
