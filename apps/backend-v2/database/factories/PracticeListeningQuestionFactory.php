<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PracticeListeningExercise;
use App\Models\PracticeListeningQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PracticeListeningQuestion>
 */
class PracticeListeningQuestionFactory extends Factory
{
    protected $model = PracticeListeningQuestion::class;

    public function definition(): array
    {
        return [
            'exercise_id' => PracticeListeningExercise::factory(),
            'display_order' => 0,
            'question' => fake()->sentence().'?',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => fake()->numberBetween(0, 3),
            'explanation' => fake()->sentence(),
        ];
    }
}
