<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Str;

class SpeakingUploadService
{
    private const PRESIGN_EXPIRES_SECONDS = 900; // 15 minutes

    /**
     * Only formats Azure Speech pronunciation assessment supports.
     */
    private const ALLOWED_TYPES = [
        'audio/wav' => 'wav',
        'audio/ogg' => 'ogg',
        'audio/webm' => 'webm',
    ];

    private const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    public function __construct(
        private readonly AudioStorageService $storage,
    ) {}

    public function presignAudioUpload(string $userId, string $contentType): array
    {
        $ext = self::ALLOWED_TYPES[$contentType]
            ?? throw new \InvalidArgumentException("Unsupported content type: {$contentType}");

        $audioPath = "speaking/{$userId}/".Str::uuid().".{$ext}";

        $uploadUrl = $this->storage->temporaryUploadUrl($audioPath, $contentType, self::PRESIGN_EXPIRES_SECONDS);

        return [
            'upload_url' => $uploadUrl['url'],
            'headers' => $uploadUrl['headers'] ?? [],
            'audio_path' => $audioPath,
            'expires_in' => self::PRESIGN_EXPIRES_SECONDS,
        ];
    }

    public function verifyAudioOwnership(string $audioPath, string $userId): void
    {
        if (! $this->isOwnedByUser($audioPath, $userId)) {
            throw new \InvalidArgumentException('Audio path does not belong to this user.');
        }

        if (! $this->storage->exists($audioPath)) {
            throw new \InvalidArgumentException('Audio file not found. Please upload again.');
        }
    }

    private function isOwnedByUser(string $audioPath, string $userId): bool
    {
        return str_starts_with($audioPath, "speaking/{$userId}/");
    }

    public static function allowedTypes(): array
    {
        return array_keys(self::ALLOWED_TYPES);
    }

    public static function maxFileSize(): int
    {
        return self::MAX_FILE_SIZE;
    }
}
