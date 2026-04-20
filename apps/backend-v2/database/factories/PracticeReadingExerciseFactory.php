<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PracticeReadingExercise;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PracticeReadingExercise>
 */
class PracticeReadingExerciseFactory extends Factory
{
    protected $model = PracticeReadingExercise::class;

    public function definition(): array
    {
        $title = fake()->unique()->words(3, true);

        return [
            'slug' => Str::slug($title).'-'.Str::random(4),
            'title' => ucfirst($title),
            'description' => fake()->sentence(),
            'part' => fake()->numberBetween(1, 3),
            'passage' => fake()->paragraphs(3, true),
            'vietnamese_translation' => fake()->paragraph(),
            'keywords' => [],
            'estimated_minutes' => 15,
            'is_published' => true,
        ];
    }
}
