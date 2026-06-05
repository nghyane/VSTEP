<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Throwable;

final class ReferenceExamListeningAudio
{
    public const CONTENT_TYPE = 'audio/mpeg';

    public static function key(string $examSlug, int $part, int $sectionNumber): string
    {
        $hash = hash('xxh128', sprintf('%s:%d:%d', $examSlug, $part, $sectionNumber));

        return "audio/{$hash}.mp3";
    }

    public static function publicUrl(string $key): string
    {
        return Storage::disk('s3')->url($key);
    }

    public static function publicUrlIfStored(string $key): ?string
    {
        if (! self::hasS3Bucket()) {
            return null;
        }

        try {
            return Storage::disk('s3')->exists($key) ? self::publicUrl($key) : null;
        } catch (Throwable) {
            return null;
        }
    }

    private static function hasS3Bucket(): bool
    {
        return (string) config('filesystems.disks.s3.bucket') !== '';
    }
}
