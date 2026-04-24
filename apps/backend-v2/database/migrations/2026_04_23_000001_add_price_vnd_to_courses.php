<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->integer('price_vnd')->default(0)->after('bonus_coins');
            $table->integer('original_price_vnd')->nullable()->after('price_vnd');
        });

        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->unsignedBigInteger('coin_transaction_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->unsignedBigInteger('coin_transaction_id')->nullable(false)->change();
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['price_vnd', 'original_price_vnd']);
        });
    }
};
