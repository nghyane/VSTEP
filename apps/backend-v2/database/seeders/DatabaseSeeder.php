<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'full_name' => 'Admin',
            'email' => 'admin@vstep.local',
            'password' => 'password',
            'role' => Role::Admin,
        ]);

        User::create([
            'full_name' => 'Instructor Demo',
            'email' => 'instructor@vstep.local',
            'password' => 'password',
            'role' => Role::Instructor,
        ]);

        User::create([
            'full_name' => 'Learner Demo',
            'email' => 'learner@vstep.local',
            'password' => 'password',
            'role' => Role::Learner,
        ]);
    }
}
