<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

final class HealthCheckService
{
    /** @return array{status:string,db:string,redis:string,ai?:string,languagetool?:string} */
    public function check(): array
    {
        $checks = [
            'db' => $this->databaseStatus(),
            'redis' => $this->redisStatus(),
            'ai' => $this->aiStatus(),
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

    private function aiStatus(): string
    {
        try {
            $url = rtrim((string) config('ai.connections.packy.url'), '/');
            $response = Http::timeout(3)->get($url.'/v1/models');

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
