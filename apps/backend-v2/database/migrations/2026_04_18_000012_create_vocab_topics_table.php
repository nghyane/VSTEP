<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vocab_topics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('level', 2);
            $table->string('icon_key', 30);
            $table->integer('display_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'level', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vocab_topics');
    }
};
