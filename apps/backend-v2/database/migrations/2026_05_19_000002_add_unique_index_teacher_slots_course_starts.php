<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_slots', function (Blueprint $table) {
            // Hai admin bulk-create slot cùng giờ trên cùng course có thể race → insert
            // trùng. Service đã dedupe in-memory nhưng giữa SELECT existing và INSERT có
            // window. DB-level unique để chốt chặn cuối, service catch QueryException
            // map về ValidationException friendly.
            $table->unique(['course_id', 'starts_at'], 'teacher_slots_course_starts_unique');
        });
    }

    public function down(): void
    {
        Schema::table('teacher_slots', function (Blueprint $table) {
            $table->dropUnique('teacher_slots_course_starts_unique');
        });
    }
};
