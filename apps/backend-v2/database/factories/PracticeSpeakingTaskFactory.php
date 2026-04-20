<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PracticeSpeakingTask;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<PracticeSpeakingTask> */
class PracticeSpeakingTaskFactory extends Factory
{
    protected $model = PracticeSpeakingTask::class;

    public function definition(): array
    {
        return [
            'slug' => Str::slug(fake()->unique()->words(3, true)).'-'.Str::random(4),
            'title' => ucfirst(fake()->words(3, true)),
            'part' => 1,
            'task_type' => 'social',
            'content' => ['topics' => [['name' => 'Test', 'questions' => ['Q1?']]]],
            'estimated_minutes' => 4,
            'speaking_seconds' => 120,
            'is_published' => true,
        ];
    }
}
