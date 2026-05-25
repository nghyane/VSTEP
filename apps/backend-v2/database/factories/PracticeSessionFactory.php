<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PracticeSession;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PracticeSession> */
class PracticeSessionFactory extends Factory
{
    protected $model = PracticeSession::class;

    public function definition(): array
    {
        return [
            'profile_id' => Profile::factory(),
            'module' => 'speaking',
            'started_at' => now(),
            'ended_at' => now(),
            'duration_seconds' => 60,
        ];
    }
}
