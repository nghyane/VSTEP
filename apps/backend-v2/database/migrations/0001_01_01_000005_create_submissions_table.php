<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('question_id')->constrained()->cascadeOnDelete();
            $table->string('skill');
            $table->string('status')->default('pending'); // pending, processing, completed, review_pending, failed
            $table->jsonb('answer')->nullable();
            $table->jsonb('result')->nullable();
            $table->float('score')->nullable();
            $table->string('band')->nullable();
            $table->text('feedback')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'skill']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
