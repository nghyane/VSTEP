<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Role;
use App\Events\ProfileCreated;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seed one demo user per role for local dev / first deploy.
 * All passwords: password
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['email' => 'learner@vstep.test', 'full_name' => 'Demo Learner', 'role' => Role::Learner],
            [
                'email' => 'teacher@vstep.test',
                'full_name' => 'Demo Teacher',
                'role' => Role::Teacher,
                'title' => 'Tiến sĩ Ngôn ngữ Anh · VSTEP C1',
                'bio' => '12 năm giảng dạy ĐH, chuyên luyện thi VSTEP B2/C1. Chấm thi chính thức tại ĐHSP Hà Nội.',
            ],
            ['email' => 'staff@vstep.test',   'full_name' => 'Demo Staff',   'role' => Role::Staff],
            ['email' => 'admin@vstep.test',   'full_name' => 'Demo Admin',   'role' => Role::Admin],
        ];

        foreach ($users as $u) {
            $user = User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'full_name' => $u['full_name'],
                    'role' => $u['role'],
                    'password' => Hash::make('password'),
                    'title' => $u['title'] ?? null,
                    'bio' => $u['bio'] ?? null,
                ],
            );

            if ($u['role'] === Role::Learner && ! $user->initialProfile()) {
                $profile = Profile::create([
                    'account_id' => $user->id,
                    'nickname' => 'learner_demo',
                    'target_level' => 'B2',
                    'target_deadline' => now()->addYear()->toDateString(),
                    'entry_level' => 'B1',
                    'is_initial_profile' => true,
                ]);
                ProfileCreated::dispatch($profile);
            }
        }
    }
}
