<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\GrammarPoint;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<GrammarPoint>
 */
class GrammarPointFactory extends Factory
{
    protected $model = GrammarPoint::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'slug' => Str::slug($name).'-'.Str::random(4),
            'name' => ucfirst($name),
            'vietnamese_name' => fake()->words(3, true),
            'summary' => fake()->sentence(),
            'category' => fake()->randomElement(['foundation', 'sentence', 'task', 'error-clinic']),
            'display_order' => 0,
            'is_published' => true,
        ];
    }
}
