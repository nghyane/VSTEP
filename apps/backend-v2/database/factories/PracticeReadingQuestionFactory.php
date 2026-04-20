<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PracticeReadingExercise;
use App\Models\PracticeReadingQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PracticeReadingQuestion>
 */
class PracticeReadingQuestionFactory extends Factory
{
    protected $model = PracticeReadingQuestion::class;

    public function definition(): array
    {
        return [
            'exercise_id' => PracticeReadingExercise::factory(),
            'display_order' => 0,
            'question' => fake()->sentence().'?',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => fake()->numberBetween(0, 3),
            'explanation' => fake()->sentence(),
        ];
    }
}
