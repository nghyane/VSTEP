<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Services\AssessmentIntakeService;
use App\Models\PracticeSession;
use App\Models\PracticeWritingPrompt;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class WritingPracticeService
{
    public function __construct(
        private readonly PracticeSessionService $sessionService,
        private readonly AssessmentIntakeService $assessments,
    ) {}

    /** @return Collection<int,PracticeWritingPrompt> */
    public function listPrompts(?int $part = null, ?Profile $profile = null): Collection
    {
        return $this->promptQuery($part, $profile)
            ->orderBy('part')
            ->orderBy('created_at')
            ->orderBy('slug')
            ->get();
    }

    public function paginatePrompts(?int $part, int $perPage, int $page, ?Profile $profile = null): LengthAwarePaginator
    {
        return $this->promptQuery($part, $profile)
            ->orderBy('part')
            ->orderBy('created_at')
            ->orderBy('slug')
            ->paginate($perPage, ['*'], 'page', $page);
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

    /**
     * @return array{submission: PracticeWritingSubmission, attempt_id: string, job_id: string}
     */
    public function submit(
        PracticeSession $session,
        string $text,
    ): array {
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

        $submission = DB::transaction(function () use ($session, $text, $wordCount) {
            $locked = PracticeSession::query()
                ->whereKey($session->id)
                ->lockForUpdate()
                ->first();

            if ($locked->ended_at !== null) {
                throw ValidationException::withMessages([
                    'session' => ['Session already submitted.'],
                ]);
            }

            $submission = PracticeWritingSubmission::create([
                'session_id' => $locked->id,
                'profile_id' => $locked->profile_id,
                'prompt_id' => $locked->content_ref_id,
                'text' => $text,
                'word_count' => $wordCount,
                'submitted_at' => now(),
            ]);

            $this->sessionService->complete($locked);

            $job = $this->assessments->submitPracticeWriting($submission);

            return ['submission' => $submission, 'attempt_id' => $job->attempt_id, 'job_id' => $job->id];
        });

        return $submission;
    }

    public function history(Profile $profile, ?int $part = null, int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        return PracticeWritingSubmission::query()
            ->where('profile_id', $profile->id)
            ->with(['prompt:id,slug,title,part', 'assessmentAttempt.result'])
            ->when($part !== null, fn ($q) => $q->whereHas(
                'prompt', fn ($q) => $q->where('part', $part),
            ))
            ->orderByDesc('submitted_at')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /** @return Builder<PracticeWritingPrompt> */
    private function promptQuery(?int $part = null, ?Profile $profile = null): Builder
    {
        $query = PracticeWritingPrompt::query()->where('is_published', true);

        if ($profile !== null) {
            $query->withExists([
                'submissions as has_submitted' => fn (Builder $query) => $query->where('profile_id', $profile->id),
            ]);
        }

        if ($part !== null) {
            $query->where('part', $part);
        }

        return $query;
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
