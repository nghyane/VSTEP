<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('knowledge_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('category'); // grammar, vocabulary, strategy
            $table->string('name');
            $table->timestamps();

            $table->unique(['category', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_points');
    }
};
