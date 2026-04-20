<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('title', 200);
            $table->string('source_school', 100)->nullable();
            $table->json('tags')->nullable();
            $table->smallInteger('total_duration_minutes');
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        Schema::create('exam_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_id')->constrained()->cascadeOnDelete();
            $table->smallInteger('version_number');
            $table->timestamp('published_at')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['exam_id', 'version_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_versions');
        Schema::dropIfExists('exams');
    }
};
