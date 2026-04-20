<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PracticeSession;
use App\Models\PracticeWritingPrompt;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Writing drill orchestration. Grading sẽ dispatch ở Slice 8.
 */
class WritingPracticeService
{
    public function __construct(
        private readonly PracticeSessionService $sessionService,
        private readonly GradingService $gradingService,
    ) {}

    /**
     * @return Collection<int,PracticeWritingPrompt>
     */
    public function listPrompts(?int $part = null): Collection
    {
        $query = PracticeWritingPrompt::query()->where('is_published', true);
        if ($part !== null) {
            $query->where('part', $part);
        }

        return $query->orderBy('part')->orderBy('created_at')->get();
    }

    public function getPromptWithChildren(string $id): PracticeWritingPrompt
    {
        /** @var PracticeWritingPrompt $prompt */
        $prompt = PracticeWritingPrompt::query()
            ->with(['outlineSections', 'templateSections', 'sampleMarkers'])
            ->findOrFail($id);

        return $prompt;
    }

    public function startSession(Profile $profile, string $promptId): PracticeSession
    {
        /** @var PracticeWritingPrompt $prompt */
        $prompt = PracticeWritingPrompt::query()->findOrFail($promptId);

        return $this->sessionService->start($profile, 'writing', $prompt);
    }

    public function submit(
        Profile $profile,
        PracticeSession $session,
        string $text,
    ): PracticeWritingSubmission {
        if ($session->profile_id !== $profile->id) {
            abort(403, 'Session does not belong to active profile.');
        }
        if ($session->module !== 'writing') {
            throw ValidationException::withMessages([
                'session' => ['Session module is not writing.'],
            ]);
        }
        if ($session->ended_at !== null) {
            throw ValidationException::withMessages([
                'session' => ['Session already submitted.'],
            ]);
        }

        $wordCount = $this->countWords($text);
        $submission = PracticeWritingSubmission::create([
            'session_id' => $session->id,
            'profile_id' => $profile->id,
            'prompt_id' => $session->content_ref_id,
            'text' => $text,
            'word_count' => $wordCount,
            'submitted_at' => now(),
        ]);

        $this->sessionService->complete($session);

        $this->gradingService->enqueueWritingGrading('practice_writing', $submission->id);

        return $submission;
    }

    private function countWords(string $text): int
    {
        $trimmed = trim(preg_replace('/\s+/', ' ', $text) ?? '');
        if ($trimmed === '') {
            return 0;
        }

        return count(explode(' ', $trimmed));
    }
}
