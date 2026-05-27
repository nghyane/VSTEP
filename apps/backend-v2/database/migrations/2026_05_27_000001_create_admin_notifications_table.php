<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->string('title', 200);
            $table->text('body')->nullable();
            $table->string('icon_key', 20)->default('calendar');
            $table->json('payload')->nullable();
            $table->string('dedup_key', 100)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->unique(['user_id', 'dedup_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};
