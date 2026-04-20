<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PracticeListeningExercise;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PracticeListeningExercise>
 */
class PracticeListeningExerciseFactory extends Factory
{
    protected $model = PracticeListeningExercise::class;

    public function definition(): array
    {
        $title = fake()->unique()->words(3, true);

        return [
            'slug' => Str::slug($title).'-'.Str::random(4),
            'title' => ucfirst($title),
            'description' => fake()->sentence(),
            'part' => fake()->numberBetween(1, 3),
            'audio_url' => 'https://example.com/audio/'.Str::random(8).'.mp3',
            'transcript' => fake()->paragraph(),
            'vietnamese_transcript' => fake()->paragraph(),
            'word_timestamps' => [],
            'keywords' => [],
            'estimated_minutes' => 10,
            'is_published' => true,
        ];
    }
}
