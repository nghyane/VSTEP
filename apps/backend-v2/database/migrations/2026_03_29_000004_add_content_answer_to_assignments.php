<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_assignments', function (Blueprint $table) {
            $table->text('content')->nullable()->after('description');
            $table->string('audio_url')->nullable()->after('content');
        });

        Schema::table('class_assignment_submissions', function (Blueprint $table) {
            $table->text('answer')->nullable()->after('exam_session_id');
            $table->text('feedback')->nullable()->after('score');
        });
    }

    public function down(): void
    {
        Schema::table('class_assignments', function (Blueprint $table) {
            $table->dropColumn(['content', 'audio_url']);
        });

        Schema::table('class_assignment_submissions', function (Blueprint $table) {
            $table->dropColumn(['answer', 'feedback']);
        });
    }
};
