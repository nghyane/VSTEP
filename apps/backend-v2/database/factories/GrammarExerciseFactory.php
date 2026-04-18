<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\GrammarExercise;
use App\Models\GrammarPoint;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GrammarExercise>
 */
class GrammarExerciseFactory extends Factory
{
    protected $model = GrammarExercise::class;

    public function definition(): array
    {
        return [
            'grammar_point_id' => GrammarPoint::factory(),
            'kind' => 'mcq',
            'payload' => [
                'prompt' => fake()->sentence(),
                'options' => ['A', 'B', 'C', 'D'],
                'correct_index' => 0,
            ],
            'explanation' => fake()->sentence(),
            'display_order' => 0,
        ];
    }

    public function mcq(int $correctIndex = 0): static
    {
        return $this->state(fn () => [
            'kind' => 'mcq',
            'payload' => [
                'prompt' => fake()->sentence(),
                'options' => ['A', 'B', 'C', 'D'],
                'correct_index' => $correctIndex,
            ],
        ]);
    }

    public function errorCorrection(string $sentence = 'I has a book.', string $correction = 'I have a book.'): static
    {
        return $this->state(fn () => [
            'kind' => 'error_correction',
            'payload' => [
                'sentence' => $sentence,
                'error_start' => 2,
                'error_end' => 5,
                'correction' => $correction,
            ],
        ]);
    }

    public function fillBlank(array $accepted = ['was']): static
    {
        return $this->state(fn () => [
            'kind' => 'fill_blank',
            'payload' => [
                'template' => 'He ___ there.',
                'accepted_answers' => $accepted,
            ],
        ]);
    }

    public function rewrite(string $original = 'She is tall.', array $accepted = ['How tall she is!']): static
    {
        return $this->state(fn () => [
            'kind' => 'rewrite',
            'payload' => [
                'instruction' => 'Rewrite as exclamation.',
                'original' => $original,
                'accepted_answers' => $accepted,
            ],
        ]);
    }
}
