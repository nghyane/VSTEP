<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classrooms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('invite_code', 20)->unique();
            $table->foreignUuid('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('class_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('classroom_id')->constrained('classrooms')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->unique(['classroom_id', 'user_id']);
        });

        Schema::create('class_feedback', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('classroom_id')->constrained('classrooms')->cascadeOnDelete();
            $table->foreignUuid('from_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('to_user_id')->constrained('users')->cascadeOnDelete();
            $table->text('content');
            $table->string('skill')->nullable();
            $table->foreignUuid('submission_id')->nullable()->constrained('submissions')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_feedback');
        Schema::dropIfExists('class_members');
        Schema::dropIfExists('classrooms');
    }
};
