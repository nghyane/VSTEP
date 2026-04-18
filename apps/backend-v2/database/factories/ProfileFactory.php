<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Profile>
 */
class ProfileFactory extends Factory
{
    protected $model = Profile::class;

    public function definition(): array
    {
        return [
            'account_id' => User::factory(),
            'nickname' => fake()->unique()->userName(),
            'target_level' => fake()->randomElement(['B1', 'B2', 'C1']),
            'target_deadline' => now()->addMonths(6)->toDateString(),
            'entry_level' => fake()->randomElement(['A1', 'A2', 'B1']),
            'is_initial_profile' => false,
        ];
    }

    public function initial(): static
    {
        return $this->state(fn () => ['is_initial_profile' => true]);
    }

    public function forAccount(User $user): static
    {
        return $this->state(fn () => ['account_id' => $user->id]);
    }
}
