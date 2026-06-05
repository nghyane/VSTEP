<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Audio\PresignDownloadRequest;
use App\Http\Requests\Audio\PresignUploadRequest;
use App\Http\Requests\Audio\TranscribeAudioRequest;
use App\Services\AudioStorageService;
use App\Services\AudioTranscriptionService;
use Illuminate\Http\JsonResponse;

/**
 * Audio presigned URL endpoints for client-side upload/download.
 */
final class AudioController extends Controller
{
    public function __construct(
        private readonly AudioStorageService $audioService,
        private readonly AudioTranscriptionService $transcriptionService,
    ) {}

    public function presignUpload(PresignUploadRequest $request): JsonResponse
    {
        $profile = $request->profile();
        $result = $this->audioService->presignUpload(
            $profile->id,
            (string) $request->validated('context'),
            (string) ($request->validated('content_type') ?? 'audio/webm'),
            (string) ($request->validated('extension') ?? 'webm'),
        );

        return response()->json(['data' => $result]);
    }

    public function presignDownload(PresignDownloadRequest $request): JsonResponse
    {
        $url = $this->audioService->presignDownload((string) $request->validated('audio_key'));

        return response()->json(['data' => ['download_url' => $url]]);
    }

    public function transcribe(TranscribeAudioRequest $request): JsonResponse
    {
        $result = $this->transcriptionService->transcribe(
            $request->file('audio'),
            $request->string('audio_key')->toString() ?: null,
            $request->string('language', 'en-US')->toString(),
        );

        return response()->json(['data' => $result]);
    }
}
