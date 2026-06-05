<?php

declare(strict_types=1);

namespace Tests\Unit\Assessment;

use App\Assessment\Validation\WritingE2EValidator;
use Tests\TestCase;

final class WritingE2EValidatorTest extends TestCase
{
    public function test_writing_e2e_golden_probes_stay_within_one_band(): void
    {
        $validation = $this->app->make(WritingE2EValidator::class)->validate();

        $this->assertTrue($validation['passed']);
        $this->assertSame(9, $validation['summary']['total']);
        $this->assertSame(9, $validation['summary']['within_one_band']);
        $this->assertSame(9, $validation['summary']['signal_passes']);
        $this->assertGreaterThanOrEqual(0.85, $validation['summary']['within_half_band_rate']);
        $this->assertLessThanOrEqual(0.5, $validation['summary']['mean_absolute_error']);
    }
}
