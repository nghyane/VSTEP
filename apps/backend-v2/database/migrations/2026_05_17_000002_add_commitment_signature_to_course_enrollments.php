<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Học viên ký tên ở enroll dialog (FE signature pad). Lưu SVG để audit/legal
     * trail khi cần đối chứng "user đã thực sự ký xác nhận điều khoản". Nullable
     * vì: (1) admin add tay không có chữ ký, (2) backfill rows cũ.
     */
    public function up(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->text('commitment_signature')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->dropColumn('commitment_signature');
        });
    }
};
