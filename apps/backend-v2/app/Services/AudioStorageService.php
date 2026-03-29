<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

class AudioStorageService
{
    public function exists(string $path): bool
    {
        try {
            return Storage::disk('s3')->exists($path);
        } catch (\Throwable $e) {
            throw new ServiceUnavailableHttpException(null, 'Audio storage is temporarily unavailable.', $e);
        }
    }

    /**
     * @return array{url: string, headers?: array<string, string>}
     */
    public function temporaryUploadUrl(string $path, string $contentType, int $expiresInSeconds): array
    {
        try {
            return Storage::disk('s3')->temporaryUploadUrl(
                $path,
                now()->addSeconds($expiresInSeconds),
                ['ContentType' => $contentType],
            );
        } catch (\Throwable $e) {
            throw new ServiceUnavailableHttpException(null, 'Audio storage is temporarily unavailable.', $e);
        }
    }

    public function temporaryUrl(string $path, int $expiresInSeconds): string
    {
        try {
            return Storage::disk('s3')->temporaryUrl($path, now()->addSeconds($expiresInSeconds));
        } catch (\Throwable $e) {
            throw new ServiceUnavailableHttpException(null, 'Audio storage is temporarily unavailable.', $e);
        }
    }
}
