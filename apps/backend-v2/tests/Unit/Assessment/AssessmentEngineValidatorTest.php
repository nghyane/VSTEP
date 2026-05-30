<?php

declare(strict_types=1);

namespace Tests\Unit\Assessment;

use App\Assessment\Validation\AssessmentEngineValidator;
use Tests\TestCase;

final class AssessmentEngineValidatorTest extends TestCase
{
    public function test_golden_samples_match_expected_levels(): void
    {
        $validation = $this->app->make(AssessmentEngineValidator::class)->validate();

        $this->assertGreaterThanOrEqual(0.85, $validation['summary']['level_alignment']);
        $this->assertGreaterThanOrEqual(0.85, $validation['summary']['within_half_band_rate']);
    }
}
