<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Mark existing users as email-verified.
 *
 * Before A4-B fix, register() did not set email_verified_at. Existing users
 * have null verification, which would block Google login merge by email.
 *
 * Backfill: assume registered-with-password users implicitly own their email
 * (they typed the password during registration). Set verified_at = created_at.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        // Irreversible — we don't know which were originally null vs backfilled.
    }
};
