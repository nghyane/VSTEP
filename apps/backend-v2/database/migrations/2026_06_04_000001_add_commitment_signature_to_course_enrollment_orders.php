<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_enrollment_orders', function (Blueprint $table) {
            $table->text('commitment_signature')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('course_enrollment_orders', function (Blueprint $table) {
            $table->dropColumn('commitment_signature');
        });
    }
};
