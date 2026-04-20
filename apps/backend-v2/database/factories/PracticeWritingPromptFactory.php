<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PracticeWritingPrompt;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<PracticeWritingPrompt> */
class PracticeWritingPromptFactory extends Factory
{
    protected $model = PracticeWritingPrompt::class;

    public function definition(): array
    {
        return [
            'slug' => Str::slug(fake()->unique()->words(3, true)).'-'.Str::random(4),
            'title' => ucfirst(fake()->words(3, true)),
            'description' => fake()->sentence(),
            'part' => fake()->randomElement([1, 2]),
            'prompt' => fake()->paragraph(),
            'min_words' => 100,
            'max_words' => 250,
            'required_points' => [],
            'keywords' => [],
            'sentence_starters' => [],
            'estimated_minutes' => 20,
            'is_published' => true,
        ];
    }
}
