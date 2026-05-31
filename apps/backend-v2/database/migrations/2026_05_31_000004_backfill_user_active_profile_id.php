<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNull('active_profile_id')
            ->orderBy('id')
            ->chunkById(100, function ($users): void {
                foreach ($users as $user) {
                    $profileId = DB::table('profiles')
                        ->where('account_id', $user->id)
                        ->orderByDesc('is_initial_profile')
                        ->orderBy('created_at')
                        ->value('id');

                    if ($profileId === null) {
                        continue;
                    }

                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['active_profile_id' => $profileId]);
                }
            });
    }

    public function down(): void {}
};
