<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

final class HealthCheckService
{
    /** @return array{status:string,db:string,redis:string,bifrost?:string,languagetool?:string} */
    public function check(): array
    {
        $checks = [
            'db' => $this->databaseStatus(),
            'redis' => $this->redisStatus(),
            'bifrost' => $this->bifrostStatus(),
            'languagetool' => $this->languageToolStatus(),
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

    private function bifrostStatus(): string
    {
        try {
            $url = rtrim((string) config('ai.providers.bifrost.url'), '/');
            $response = Http::timeout(3)->get($url.'/models');

            return $response->successful() ? 'ok' : 'degraded';
        } catch (\Throwable) {
            return 'degraded';
        }
    }

    private function languageToolStatus(): string
    {
        try {
            $url = rtrim((string) config('services.languagetool.url'), '/');
            $response = Http::timeout(2)->get($url.'/v2/languages');

            return $response->successful() ? 'ok' : 'degraded';
        } catch (\Throwable) {
            return 'degraded';
        }
    }
}
