<?php

declare(strict_types=1);

namespace Tests;

use Database\Seeders\SystemConfigSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // System configs are needed by wallet/onboarding flows in almost every test.
        // Kept light — only scalars, fast seeder.
        $this->seed(SystemConfigSeeder::class);
    }
}
