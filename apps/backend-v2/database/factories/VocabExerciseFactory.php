<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\VocabExercise;
use App\Models\VocabTopic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VocabExercise>
 */
class VocabExerciseFactory extends Factory
{
    protected $model = VocabExercise::class;

    public function definition(): array
    {
        return [
            'topic_id' => VocabTopic::factory(),
            'kind' => 'mcq',
            'payload' => [
                'prompt' => fake()->sentence(),
                'options' => ['A', 'B', 'C', 'D'],
                'correct_index' => 2,
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

    public function fillBlank(array $accepted = ['happy']): static
    {
        return $this->state(fn () => [
            'kind' => 'fill_blank',
            'payload' => [
                'sentence' => 'She feels ___.',
                'accepted_answers' => $accepted,
            ],
        ]);
    }

    public function wordForm(string $root = 'happy', array $accepted = ['happiness']): static
    {
        return $this->state(fn () => [
            'kind' => 'word_form',
            'payload' => [
                'instruction' => 'Change to noun form.',
                'sentence' => 'Everyone wants ___.',
                'root_word' => $root,
                'accepted_answers' => $accepted,
            ],
        ]);
    }
}
