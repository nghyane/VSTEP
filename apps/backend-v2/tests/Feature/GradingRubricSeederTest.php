<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\GradingRubric;
use Database\Seeders\GradingRubricSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class GradingRubricSeederTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_seeds_an_a2_writing_rubric(): void
    {
        app(GradingRubricSeeder::class)->run();

        $rubric = GradingRubric::query()
            ->where('skill', 'writing')
            ->where('level', 'A2')
            ->where('is_active', true)
            ->first();

        $this->assertNotNull($rubric);
        $this->assertCount(4, $rubric->criteria);
    }
}
