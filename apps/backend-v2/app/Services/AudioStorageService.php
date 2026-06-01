<?php

declare(strict_types=1);

namespace App\Services;

use Aws\S3\S3Client;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Audio file storage via R2 (S3-compatible).
 *
 * Upload flow:
 * 1. Client calls POST /audio/presign → gets { upload_url, audio_key, audio_url }
 * 2. Client PUTs file directly to upload_url (presigned)
 * 3. Client sends audio_key back in submission request
 * 4. Backend verifies key ownership/existence and derives public audio_url
 */
final class AudioStorageService
{
    private const UPLOAD_TTL_MINUTES = 15;

    private const DOWNLOAD_TTL_MINUTES = 15;

    private const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

    /**
     * Generate presigned PUT URL for client upload.
     *
     * @return array{upload_url: string, audio_key: string, audio_url: string}
     */
    public function presignUpload(string $profileId, string $context, string $contentType = 'audio/webm', string $extension = 'webm'): array
    {
        $extension = ltrim(strtolower($extension), '.');
        if (! preg_match('/^[a-z0-9]{2,8}$/', $extension)) {
            $extension = 'webm';
        }

        $key = sprintf(
            'audio/%s/%s/%s.%s',
            $context,
            $profileId,
            Str::ulid(),
            $extension,
        );

        $disk = Storage::disk('s3');

        /** @var S3Client $client */
        $client = $disk->getClient();
        $bucket = config('filesystems.disks.s3.bucket');

        $cmd = $client->getCommand('PutObject', [
            'Bucket' => $bucket,
            'Key' => $key,
            'ContentType' => $contentType,
        ]);

        $presigned = $client->createPresignedRequest(
            $cmd,
            sprintf('+%d minutes', self::UPLOAD_TTL_MINUTES),
        );

        return [
            'upload_url' => (string) $presigned->getUri(),
            'audio_key' => $key,
            'audio_url' => $this->publicUrl($key),
        ];
    }

    /**
     * Generate presigned PUT URL for an arbitrary R2 key with explicit content type.
     *
     * Used by admin tooling that needs to upload exam-content audio (listening
     * sections, etc.) where the namespace is not user-scoped and the file
     * format is admin-supplied (mp3, m4a, ...).
     *
     * @return array{upload_url: string, audio_key: string}
     */
    public function presignUploadForKey(string $audioKey, string $contentType): array
    {
        $disk = Storage::disk('s3');

        /** @var S3Client $client */
        $client = $disk->getClient();
        $bucket = config('filesystems.disks.s3.bucket');

        $cmd = $client->getCommand('PutObject', [
            'Bucket' => $bucket,
            'Key' => $audioKey,
            'ContentType' => $contentType,
        ]);

        $presigned = $client->createPresignedRequest(
            $cmd,
            sprintf('+%d minutes', self::UPLOAD_TTL_MINUTES),
        );

        return [
            'upload_url' => (string) $presigned->getUri(),
            'audio_key' => $audioKey,
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
     * Public playback URL for learner-uploaded audio.
     */
    public function publicUrl(string $audioKey): string
    {
        return Storage::disk('s3')->url($audioKey);
    }

    public function assertOwnedUploadedAudio(string $profileId, string $audioKey, string $context): void
    {
        $prefix = sprintf('audio/%s/%s/', $context, $profileId);
        if (! str_starts_with($audioKey, $prefix)) {
            throw ValidationException::withMessages([
                'audio_key' => ['Audio không thuộc hồ sơ hoặc ngữ cảnh hiện tại.'],
            ]);
        }

        if (! $this->exists($audioKey)) {
            throw ValidationException::withMessages([
                'audio_key' => ['Không tìm thấy file audio đã upload. Vui lòng ghi âm lại.'],
            ]);
        }
    }
}
