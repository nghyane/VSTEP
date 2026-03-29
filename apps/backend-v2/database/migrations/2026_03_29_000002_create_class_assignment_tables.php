<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('classroom_id')->constrained('classrooms')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('skill')->nullable();
            $table->string('type')->default('practice'); // practice | exam
            $table->foreignUuid('exam_id')->nullable()->constrained('exams')->nullOnDelete();
            $table->timestamp('due_date')->nullable();
            $table->timestamps();
        });

        Schema::create('class_assignment_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('assignment_id')->constrained('class_assignments')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending | submitted | graded
            $table->decimal('score', 5, 2)->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['assignment_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_assignment_submissions');
        Schema::dropIfExists('class_assignments');
    }
};
