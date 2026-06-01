<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AudioStorageService;
use App\Services\SpeechToText;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Audio presigned URL endpoints for client-side upload/download.
 */
final class AudioController extends Controller
{
    public function __construct(
        private readonly AudioStorageService $audioService,
        private readonly SpeechToText $speechToText,
    ) {}

    /**
     * Generate presigned PUT URL for audio upload.
     */
    public function presignUpload(Request $request): JsonResponse
    {
        $request->validate([
            'context' => ['required', 'string', 'in:practice_speaking,exam_speaking'],
            'content_type' => ['nullable', 'string', 'max:100'],
            'extension' => ['nullable', 'string', 'max:12'],
        ]);

        $profile = $request->profile();
        $result = $this->audioService->presignUpload(
            $profile->id,
            $request->input('context'),
            $request->input('content_type', 'audio/webm'),
            $request->input('extension', 'webm'),
        );

        return response()->json(['data' => $result]);
    }

    /**
     * Generate presigned GET URL for audio playback.
     */
    public function presignDownload(Request $request): JsonResponse
    {
        $request->validate([
            'audio_key' => ['required', 'string', 'max:500'],
        ]);

        $url = $this->audioService->presignDownload($request->input('audio_key'));

        return response()->json(['data' => ['download_url' => $url]]);
    }

    /**
     * Transcribe a short learner recording for Expo Go-compatible speaking flows.
     */
    public function transcribe(Request $request): JsonResponse
    {
        $request->validate([
            'audio' => ['nullable', 'file', 'max:10240'],
            'audio_key' => ['nullable', 'string', 'max:500'],
            'language' => ['nullable', 'string', 'max:20'],
        ]);

        if (! $request->hasFile('audio') && ! $request->filled('audio_key')) {
            return response()->json([
                'message' => 'Thiếu audio hoặc audio_key để nhận diện giọng nói.',
            ], 422);
        }

        $language = $request->input('language', 'en-US');

        if ($request->hasFile('audio')) {
            $file = $request->file('audio');
            $result = $this->speechToText->transcribe(
                (string) file_get_contents($file->getRealPath()),
                $language,
                $file->getMimeType(),
            );
        } else {
            $result = $this->speechToText->transcribeFromStorage(
                $request->input('audio_key'),
                $this->audioService,
            );
        }

        if ($result === null || trim((string) ($result['text'] ?? '')) === '') {
            return response()->json([
                'message' => 'Không nhận diện được giọng nói. Vui lòng thử ghi âm lại.',
            ], 422);
        }

        return response()->json([
            'data' => [
                'transcript' => (string) $result['text'],
                'confidence' => (float) ($result['confidence'] ?? 0),
                'duration_ms' => (int) ($result['duration_ms'] ?? 0),
            ],
        ]);
    }
}
