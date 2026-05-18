<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add shadowing-specific fields to speaking drills.
 * - audio_url on drills (main audio file)
 * - ipa, word_count, audio_start, audio_end on sentences (segment timing)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('practice_speaking_drills', function (Blueprint $table) {
            $table->string('audio_url', 500)->nullable()->after('estimated_minutes');
        });

        Schema::table('practice_speaking_drill_sentences', function (Blueprint $table) {
            $table->string('ipa', 500)->nullable()->after('text');
            $table->smallInteger('word_count')->default(0)->after('translation');
            $table->decimal('audio_start', 8, 3)->nullable()->after('word_count');
            $table->decimal('audio_end', 8, 3)->nullable()->after('audio_start');
        });
    }

    public function down(): void
    {
        Schema::table('practice_speaking_drill_sentences', function (Blueprint $table) {
            $table->dropColumn(['ipa', 'word_count', 'audio_start', 'audio_end']);
        });

        Schema::table('practice_speaking_drills', function (Blueprint $table) {
            $table->dropColumn('audio_url');
        });
    }
};
