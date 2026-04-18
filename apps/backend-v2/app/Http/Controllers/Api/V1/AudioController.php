<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Services\AudioStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Audio presigned URL endpoints for client-side upload/download.
 */
class AudioController extends Controller
{
    public function __construct(
        private readonly AudioStorageService $audioService,
    ) {}

    /**
     * Generate presigned PUT URL for audio upload.
     */
    public function presignUpload(Request $request): JsonResponse
    {
        $request->validate([
            'context' => ['nullable', 'string', 'in:speaking,exam_speaking'],
        ]);

        $profile = $this->profile($request);
        $result = $this->audioService->presignUpload(
            $profile->id,
            $request->input('context', 'speaking'),
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

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }
}
