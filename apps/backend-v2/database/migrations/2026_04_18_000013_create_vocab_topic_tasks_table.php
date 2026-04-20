<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Junction many-to-many topic × VSTEP task.
 * task ∈ (WT1, WT2, SP1, SP2, SP3, READ).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vocab_topic_tasks', function (Blueprint $table) {
            $table->foreignUuid('topic_id')
                ->constrained('vocab_topics')
                ->cascadeOnDelete();
            $table->string('task', 10);

            $table->primary(['topic_id', 'task']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vocab_topic_tasks');
    }
};
