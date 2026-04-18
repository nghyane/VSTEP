<?php

declare(strict_types=1);

namespace App\Services;

use Aws\S3\S3Client;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Audio file storage via R2 (S3-compatible).
 *
 * Upload flow:
 * 1. Client calls POST /audio/presign → gets { upload_url, audio_key }
 * 2. Client PUTs file directly to upload_url (presigned)
 * 3. Client sends audio_key back in submission request
 * 4. Backend verifies key exists before accepting submission
 *
 * Download: presigned GET URL scoped per profile (15 min TTL).
 */
class AudioStorageService
{
    private const UPLOAD_TTL_MINUTES = 15;

    private const DOWNLOAD_TTL_MINUTES = 15;

    private const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

    /**
     * Generate presigned PUT URL for client upload.
     *
     * @return array{upload_url: string, audio_key: string}
     */
    public function presignUpload(string $profileId, string $context = 'speaking'): array
    {
        $key = sprintf(
            'audio/%s/%s/%s.webm',
            $context,
            $profileId,
            Str::ulid(),
        );

        $disk = Storage::disk('s3');

        /** @var S3Client $client */
        $client = $disk->getClient();
        $bucket = config('filesystems.disks.s3.bucket');

        $cmd = $client->getCommand('PutObject', [
            'Bucket' => $bucket,
            'Key' => $key,
            'ContentType' => 'audio/webm',
        ]);

        $presigned = $client->createPresignedRequest(
            $cmd,
            sprintf('+%d minutes', self::UPLOAD_TTL_MINUTES),
        );

        return [
            'upload_url' => (string) $presigned->getUri(),
            'audio_key' => $key,
        ];
    }

    /**
     * Generate presigned GET URL for audio playback.
     */
    public function presignDownload(string $audioKey): string
    {
        return Storage::disk('s3')->temporaryUrl(
            $audioKey,
            now()->addMinutes(self::DOWNLOAD_TTL_MINUTES),
        );
    }

    /**
     * Check if audio key exists in R2.
     */
    public function exists(string $audioKey): bool
    {
        return Storage::disk('s3')->exists($audioKey);
    }

    /**
     * Get raw audio content (for STT processing).
     */
    public function getContent(string $audioKey): string
    {
        return Storage::disk('s3')->get($audioKey);
    }

    /**
     * Get full URL (non-presigned, for internal use).
     */
    public function url(string $audioKey): string
    {
        return Storage::disk('s3')->url($audioKey);
    }
}
