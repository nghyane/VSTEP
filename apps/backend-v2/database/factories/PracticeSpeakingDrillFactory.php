<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PracticeSpeakingDrill;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<PracticeSpeakingDrill> */
class PracticeSpeakingDrillFactory extends Factory
{
    protected $model = PracticeSpeakingDrill::class;

    public function definition(): array
    {
        return [
            'slug' => Str::slug(fake()->unique()->words(3, true)).'-'.Str::random(4),
            'title' => ucfirst(fake()->words(3, true)),
            'description' => fake()->sentence(),
            'level' => fake()->randomElement(['A2', 'B1', 'B2', 'C1']),
            'estimated_minutes' => 5,
            'is_published' => true,
        ];
    }
}
