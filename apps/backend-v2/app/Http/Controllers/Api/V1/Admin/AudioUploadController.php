<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\AudioStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Admin-only audio upload presign endpoint.
 *
 * Used to upload audio files for exam content (listening sections),
 * speaking drills, etc. Files go directly to R2 via presigned PUT URL —
 * the Laravel server only signs the request.
 */
final class AudioUploadController extends Controller
{
    /** @var array<string,string> Allowed MIME types -> R2-friendly extension. */
    private const ALLOWED = [
        'audio/mpeg' => 'mp3',
        'audio/mp3' => 'mp3',
        'audio/mp4' => 'm4a',
        'audio/x-m4a' => 'm4a',
        'audio/wav' => 'wav',
        'audio/webm' => 'webm',
        'audio/ogg' => 'ogg',
    ];

    /** @var array<string,bool> Whitelisted contexts → folder prefix in R2. */
    private const CONTEXTS = [
        'exam_listening' => true,
        'exam_speaking_prompt' => true,
        'speaking_drill' => true,
        'listening_drill' => true,
    ];

    public function __construct(
        private readonly AudioStorageService $audioService,
    ) {}

    public function presignUpload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'context' => ['required', 'string'],
            'content_type' => ['required', 'string'],
            'filename' => ['nullable', 'string', 'max:255'],
        ]);

        if (! isset(self::CONTEXTS[$validated['context']])) {
            return response()->json([
                'message' => 'Invalid context.',
                'errors' => ['context' => ['Context "'.$validated['context'].'" is not allowed.']],
            ], 422);
        }

        $contentType = strtolower($validated['content_type']);
        if (! isset(self::ALLOWED[$contentType])) {
            return response()->json([
                'message' => 'Unsupported audio type.',
                'errors' => ['content_type' => ['Type "'.$contentType.'" is not allowed.']],
            ], 422);
        }

        $extension = self::ALLOWED[$contentType];
        $key = sprintf(
            'audio/admin/%s/%s.%s',
            $validated['context'],
            Str::ulid(),
            $extension,
        );

        $result = $this->audioService->presignUploadForKey($key, $contentType);

        return response()->json(['data' => $result]);
    }
}
