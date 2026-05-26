<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('avatar_key')->nullable()->after('avatar_color');
            $table->string('avatar_url')->nullable()->after('avatar_key');
        });

        DB::table('profiles')
            ->join('users', 'users.id', '=', 'profiles.account_id')
            ->select(['profiles.id', 'users.avatar_key', 'users.avatar_url'])
            ->orderBy('profiles.id')
            ->chunk(100, function ($profiles): void {
                foreach ($profiles as $profile) {
                    DB::table('profiles')
                        ->where('id', $profile->id)
                        ->update([
                            'avatar_key' => $profile->avatar_key,
                            'avatar_url' => $profile->avatar_url,
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['avatar_key', 'avatar_url']);
        });
    }
};
