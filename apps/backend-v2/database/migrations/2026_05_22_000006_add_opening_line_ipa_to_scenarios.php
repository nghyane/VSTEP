<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cache opening line IPA on scenario row.
 *
 * Was: runtime LLM call on every startSession (1000 users × same scenario
 * = 1000 LLM calls for same text).
 * Now: populated by admin scenario create/update flow, read directly.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('practice_speaking_scenarios', function (Blueprint $table) {
            $table->text('opening_line_ipa')->nullable()->after('opening_line');
        });
    }

    public function down(): void
    {
        Schema::table('practice_speaking_scenarios', function (Blueprint $table) {
            $table->dropColumn('opening_line_ipa');
        });
    }
};
