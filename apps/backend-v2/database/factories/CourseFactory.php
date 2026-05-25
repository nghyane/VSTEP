<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Course> */
class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        return [
            'slug' => Str::slug($this->faker->unique()->words(3, true)),
            'title' => $this->faker->sentence(3),
            'target_level' => 'B2',
            'target_exam_school' => 'VSTEP',
            'description' => $this->faker->paragraph(),
            'start_date' => now(),
            'end_date' => now()->addMonths(2),
            'price_coins' => 300,
            'bonus_coins' => 50,
            'max_slots' => 20,
            'max_slots_per_student' => 2,
            'required_full_tests' => 0,
            'commitment_window_days' => 7,
            'booking_coin_cost' => 50,
            'teacher_id' => User::factory()->teacher(),
            'is_published' => true,
            'rules' => 'Complete all sessions',
        ];
    }

    public function unpublished(): static
    {
        return $this->state(fn () => ['is_published' => false]);
    }
}
