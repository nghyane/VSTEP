<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_assignment_submissions', function (Blueprint $table) {
            $table->foreignUuid('exam_session_id')
                ->nullable()
                ->after('user_id')
                ->constrained('exam_sessions')
                ->nullOnDelete();
        });

        Schema::table('class_assignments', function (Blueprint $table) {
            $table->boolean('allow_retry')->default(false)->after('due_date');
        });
    }

    public function down(): void
    {
        Schema::table('class_assignment_submissions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('exam_session_id');
        });

        Schema::table('class_assignments', function (Blueprint $table) {
            $table->dropColumn('allow_retry');
        });
    }
};
