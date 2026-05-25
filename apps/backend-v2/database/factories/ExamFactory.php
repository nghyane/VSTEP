<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Exam;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Exam> */
class ExamFactory extends Factory
{
    protected $model = Exam::class;

    public function definition(): array
    {
        return [
            'slug' => Str::slug($this->faker->unique()->sentence(3)),
            'title' => $this->faker->sentence(4),
            'source_school' => $this->faker->company(),
            'tags' => [],
            'total_duration_minutes' => 120,
            'is_published' => true,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => ['is_published' => true]);
    }

    public function draft(): static
    {
        return $this->state(fn () => ['is_published' => false]);
    }
}
