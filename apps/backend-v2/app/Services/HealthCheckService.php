<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class HealthCheckService
{
    /** @return array{status:string,db:string,redis:string} */
    public function check(): array
    {
        $checks = [
            'db' => $this->databaseStatus(),
            'redis' => $this->redisStatus(),
        ];

        return [
            'status' => in_array('fail', $checks, true) ? 'degraded' : 'ok',
            ...$checks,
        ];
    }

    private function databaseStatus(): string
    {
        try {
            DB::connection()->getPdo();

            return 'ok';
        } catch (\Throwable) {
            return 'fail';
        }
    }

    private function redisStatus(): string
    {
        try {
            Cache::store('redis')->get('health');

            return 'ok';
        } catch (\Throwable) {
            return 'fail';
        }
    }
}
