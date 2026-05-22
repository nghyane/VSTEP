<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Normalize all existing users.email to lowercase. Going forward the User
 * model casts email via a setter mutator (Str::lower), so this one-shot
 * backfill is what unblocks every existing row written before the mutator
 * existed.
 *
 * No dual-path lookup ever ships: query layer assumes data is already
 * lowercase. This migration makes that assumption true.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->update([
            'email' => DB::raw('LOWER(email)'),
        ]);
    }

    public function down(): void
    {
        // No-op: lowercasing is not reversible without backup, and there
        // is no harm in leaving emails lowercase.
    }
};
