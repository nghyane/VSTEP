<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grammar_points', function (Blueprint $table): void {
            $table->text('learning_objective')->nullable()->after('summary');
            $table->text('success_criteria')->nullable()->after('learning_objective');
            $table->json('prerequisite_slugs')->nullable()->after('success_criteria');
            $table->text('cefr_descriptor')->nullable()->after('prerequisite_slugs');
            $table->text('vstep_use_case')->nullable()->after('cefr_descriptor');
            $table->json('assessed_by')->nullable()->after('vstep_use_case');
            $table->boolean('is_checkpoint')->default(false)->after('assessed_by');
        });
    }

    public function down(): void
    {
        Schema::table('grammar_points', function (Blueprint $table): void {
            $table->dropColumn([
                'learning_objective',
                'success_criteria',
                'prerequisite_slugs',
                'cefr_descriptor',
                'vstep_use_case',
                'assessed_by',
                'is_checkpoint',
            ]);
        });
    }
};
