<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AudioController extends Controller
{
    private const ALLOWED_PREFIXES = ['listening/', 'reference_audio/'];

    private const PRESIGN_SECONDS = 3600; // 1 hour

    public function presignRead(Request $request)
    {
        $path = $request->validate([
            'path' => ['required', 'string', 'max:255'],
        ])['path'];

        if (! $this->isAllowedPath($path)) {
            throw ValidationException::withMessages([
                'path' => ['Access denied.'],
            ]);
        }

        if (! Storage::disk('s3')->exists($path)) {
            throw ValidationException::withMessages([
                'path' => ['File not found.'],
            ]);
        }

        $url = Storage::disk('s3')->temporaryUrl($path, now()->addSeconds(self::PRESIGN_SECONDS));

        return response()->json(['data' => [
            'url' => $url,
            'expires_in' => self::PRESIGN_SECONDS,
        ]]);
    }

    private function isAllowedPath(string $path): bool
    {
        foreach (self::ALLOWED_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }
}
