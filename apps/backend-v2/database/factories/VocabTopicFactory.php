<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\VocabTopic;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<VocabTopic>
 */
class VocabTopicFactory extends Factory
{
    protected $model = VocabTopic::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'slug' => Str::slug($name).'-'.Str::random(4),
            'name' => ucfirst($name),
            'description' => fake()->sentence(),
            'level' => fake()->randomElement(['B1', 'B2', 'C1']),
            'icon_key' => fake()->randomElement(['family', 'sun', 'briefcase', 'heart', 'leaf', 'graduation']),
            'display_order' => 0,
            'is_published' => true,
        ];
    }
}
