<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('practice_speaking_conversation_turns', function (Blueprint $table) {
            $table->text('ipa')->nullable()->after('suggested_words');
        });
    }

    public function down(): void
    {
        Schema::table('practice_speaking_conversation_turns', function (Blueprint $table) {
            $table->dropColumn('ipa');
        });
    }
};
