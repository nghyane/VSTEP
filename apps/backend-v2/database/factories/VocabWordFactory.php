<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\VocabTopic;
use App\Models\VocabWord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VocabWord>
 */
class VocabWordFactory extends Factory
{
    protected $model = VocabWord::class;

    public function definition(): array
    {
        return [
            'topic_id' => VocabTopic::factory(),
            'word' => fake()->unique()->word(),
            'phonetic' => '/'.fake()->lexify('????').'/',
            'part_of_speech' => fake()->randomElement(['noun', 'verb', 'adjective', 'adverb']),
            'definition' => fake()->sentence(),
            'example' => fake()->sentence(),
            'synonyms' => [],
            'collocations' => [],
            'word_family' => [],
            'display_order' => 0,
        ];
    }
}
