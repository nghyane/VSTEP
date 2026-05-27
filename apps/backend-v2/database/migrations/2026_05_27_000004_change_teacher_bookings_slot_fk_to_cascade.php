<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Đổi FK slot_id từ RESTRICT sang CASCADE để admin xóa slot khi bookings đã cancelled.
        DB::statement('ALTER TABLE teacher_bookings DROP CONSTRAINT teacher_bookings_slot_id_foreign');
        DB::statement('ALTER TABLE teacher_bookings ADD CONSTRAINT teacher_bookings_slot_id_foreign FOREIGN KEY (slot_id) REFERENCES teacher_slots(id) ON DELETE CASCADE');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE teacher_bookings DROP CONSTRAINT teacher_bookings_slot_id_foreign');
        DB::statement('ALTER TABLE teacher_bookings ADD CONSTRAINT teacher_bookings_slot_id_foreign FOREIGN KEY (slot_id) REFERENCES teacher_slots(id) ON DELETE RESTRICT');
    }
};
