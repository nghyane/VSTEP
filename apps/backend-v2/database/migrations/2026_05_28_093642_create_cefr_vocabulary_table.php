<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cefr_vocabulary', function (Blueprint $table) {
            $table->id();
            $table->string('word', 100);
            $table->string('lemmatized', 100)->nullable();
            $table->string('level', 3);  // A1, A2, B1, B2, C1
            $table->string('pos', 20)->nullable();  // noun, verb, adj, adv, prep...
            $table->string('topic', 50)->nullable();  // environment, education, technology...
            $table->string('source', 50)->default('oxford_3000_5000');
            $table->timestamps();

            $table->index('word');
            $table->index('level');
            $table->index('lemmatized');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cefr_vocabulary');
    }
};
