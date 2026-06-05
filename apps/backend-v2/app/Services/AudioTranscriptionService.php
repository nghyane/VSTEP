<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

final class AudioTranscriptionService
{
    public function __construct(
        private readonly AudioStorageService $audioStorage,
        private readonly SpeechToText $speechToText,
    ) {}

    public function transcribe(?UploadedFile $audio, ?string $audioKey, string $language): array
    {
        if ($audio === null && ($audioKey === null || $audioKey === '')) {
            throw ValidationException::withMessages([
                'audio' => ['Thiếu audio hoặc audio_key để nhận diện giọng nói.'],
            ]);
        }

        $result = $audio !== null
            ? $this->speechToText->transcribe(
                (string) file_get_contents($audio->getRealPath()),
                $language,
                $audio->getMimeType(),
            )
            : $this->speechToText->transcribeFromStorage((string) $audioKey, $this->audioStorage);

        if ($result === null || trim((string) ($result['text'] ?? '')) === '') {
            throw ValidationException::withMessages([
                'audio' => ['Không nhận diện được giọng nói. Vui lòng thử ghi âm lại.'],
            ]);
        }

        return [
            'transcript' => (string) $result['text'],
            'confidence' => (float) ($result['confidence'] ?? 0),
            'duration_ms' => (int) ($result['duration_ms'] ?? 0),
        ];
    }
}
