<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PracticeSpeakingScenario;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<PracticeSpeakingScenario> */
class PracticeSpeakingScenarioFactory extends Factory
{
    protected $model = PracticeSpeakingScenario::class;

    public function definition(): array
    {
        return [
            'slug' => Str::slug($this->faker->unique()->words(3, true)),
            'title' => $this->faker->sentence(3),
            'level' => $this->faker->randomElement(['B1', 'B2', 'C1']),
            'character_name' => $this->faker->firstName(),
            'character_voice_label' => 'default',
            'description' => $this->faker->sentence(),
            'system_prompt' => 'You are a friendly conversation partner.',
            'opening_line' => 'Hello! How are you today?',
            'target_vocab' => [],
            'estimated_minutes' => 5,
            'expected_turns' => 6,
            'is_published' => true,
        ];
    }
}
