<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Profiles: learner's learning unit.
 * 1 account có n profiles. Mỗi profile gắn 1 target_level + target_deadline.
 * Wallet, streak, progress, enrollments đều gắn vào profile.
 *
 * is_initial_profile = true cho profile đầu của account → cấp 100 xu onboarding.
 * App-level check: chỉ 1 profile có is_initial_profile = true per account.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('nickname', 50);
            $table->string('target_level', 2);
            $table->date('target_deadline');
            $table->string('entry_level', 2)->nullable();
            $table->string('avatar_color', 7)->nullable();
            $table->boolean('is_initial_profile')->default(false);
            $table->timestamps();

            $table->unique(['account_id', 'nickname']);
            $table->index('account_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
