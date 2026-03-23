<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('skill');       // listening, reading, writing, speaking
            $table->string('level');       // A2, B1, B2, C1
            $table->integer('part');
            $table->string('topic')->nullable();
            $table->jsonb('content');
            $table->jsonb('answer_key')->nullable();
            $table->text('explanation')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['skill', 'level']);
            $table->index(['skill', 'topic']);
        });

        Schema::create('question_knowledge_point', function (Blueprint $table) {
            $table->foreignUuid('question_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('knowledge_point_id')->constrained()->cascadeOnDelete();
            $table->primary(['question_id', 'knowledge_point_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_knowledge_point');
        Schema::dropIfExists('questions');
    }
};
