<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Teacher-only fields trên users (title, bio) để course detail
 * hiển thị card "Giáo viên phụ trách". Nullable cho mọi role khác.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('title', 100)->nullable()->after('avatar_key');
            $table->text('bio')->nullable()->after('title');
        });

        // Backfill demo teacher để FE thấy data ngay sau migrate.
        DB::table('users')
            ->where('email', 'teacher@vstep.test')
            ->update([
                'title' => 'Tiến sĩ Ngôn ngữ Anh · VSTEP C1',
                'bio' => '12 năm giảng dạy ĐH, chuyên luyện thi VSTEP B2/C1. Chấm thi chính thức tại ĐHSP Hà Nội.',
            ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['title', 'bio']);
        });
    }
};
