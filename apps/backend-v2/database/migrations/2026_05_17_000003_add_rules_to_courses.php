<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Nội quy khóa do admin nhập (free-text). Hiển thị trong enroll dialog
     * để học viên đọc trước khi ký xác nhận. Bổ sung — không thay đoạn cam
     * kết kỷ luật cứng (X bài / Y ngày), đó là policy hệ thống.
     */
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->text('rules')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('rules');
        });
    }
};
