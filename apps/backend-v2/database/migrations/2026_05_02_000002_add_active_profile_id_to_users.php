<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Persist last-active profile so /auth/refresh sau hard-reload trả đúng profile
            // user đang xem (trước fix, BE luôn trả default profile → mất ngữ cảnh khi F5).
            $table->foreignUuid('active_profile_id')
                ->nullable()
                ->constrained('profiles')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('active_profile_id');
        });
    }
};
