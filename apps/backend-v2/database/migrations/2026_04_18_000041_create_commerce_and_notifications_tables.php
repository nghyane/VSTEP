<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('title', 200);
            $table->string('target_level', 2);
            $table->string('target_exam_school', 100)->nullable();
            $table->text('description')->nullable();
            $table->integer('price_coins');
            $table->integer('bonus_coins')->default(0);
            $table->integer('max_slots');
            $table->smallInteger('max_slots_per_student')->default(2);
            $table->date('start_date');
            $table->date('end_date');
            $table->smallInteger('required_full_tests');
            $table->smallInteger('commitment_window_days');
            $table->smallInteger('exam_cooldown_days')->default(0);
            $table->string('livestream_url', 500)->nullable();
            $table->foreignUuid('teacher_id')->constrained('users')->restrictOnDelete();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        Schema::create('course_schedule_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('course_id')->constrained()->cascadeOnDelete();
            $table->smallInteger('session_number');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('topic', 100);
        });

        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_id')->constrained()->restrictOnDelete();
            $table->timestamp('enrolled_at');
            $table->integer('coins_paid');
            $table->integer('bonus_coins_received');
            $table->boolean('acknowledged_commitment')->default(true);
            $table->unsignedBigInteger('coin_transaction_id');

            $table->foreign('coin_transaction_id')
                ->references('id')->on('coin_transactions')->restrictOnDelete();
            $table->unique(['profile_id', 'course_id']);
            $table->index('course_id');
        });

        Schema::create('teacher_slots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('course_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('teacher_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('starts_at');
            $table->smallInteger('duration_minutes')->default(30);
            $table->string('status', 20)->default('open');
            $table->timestamps();

            $table->index(['course_id', 'starts_at']);
        });

        Schema::create('teacher_bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('slot_id')->constrained('teacher_slots')->restrictOnDelete();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->string('submission_type', 40)->nullable();
            $table->uuid('submission_id')->nullable();
            $table->string('meet_url', 500)->nullable();
            $table->string('status', 20)->default('booked');
            $table->timestamp('booked_at');
            $table->timestamps();

            $table->index(['profile_id', 'booked_at']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->string('title', 200);
            $table->text('body')->nullable();
            $table->string('icon_key', 20)->default('coin');
            $table->json('payload')->nullable();
            $table->string('dedup_key', 100)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['profile_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('teacher_bookings');
        Schema::dropIfExists('teacher_slots');
        Schema::dropIfExists('course_enrollments');
        Schema::dropIfExists('course_schedule_items');
        Schema::dropIfExists('courses');
    }
};
