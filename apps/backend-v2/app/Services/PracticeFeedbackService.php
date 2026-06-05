<?php

declare(strict_types=1);

namespace App\Services;

use App\Ai\Contracts\WritingFeedbackGenerator;
use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Enums\CoinTransactionType;
use App\Enums\PracticeFeedbackStatus;
use App\Enums\PracticeFeedbackSubmissionType;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentResult;
use App\Models\PracticeFeedbackRequest;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class PracticeFeedbackService
{
    public function __construct(
        private readonly EconomyConfigService $economyConfig,
        private readonly WalletService $walletService,
        private readonly WritingFeedbackGenerator $writingFeedbackGenerator,
    ) {}

    /** @return array<string,mixed> */
    public function requestWriting(Profile $profile, PracticeWritingSubmission $submission): array
    {
        return $this->request($profile, $submission, PracticeFeedbackSubmissionType::Writing);
    }

    /** @return array<string,mixed> */
    public function requestSpeaking(Profile $profile, PracticeSpeakingSubmission $submission): array
    {
        return $this->request($profile, $submission, PracticeFeedbackSubmissionType::Speaking);
    }

    /** @return array<string,mixed> */
    private function request(Profile $profile, Model $submission, PracticeFeedbackSubmissionType $submissionType): array
    {
        if ($submission->profile_id !== $profile->id) {
            abort(403);
        }

        $attempt = $this->readyAttempt($submission->getKey());

        $cost = $this->economyConfig->practiceFeedbackCost();
        $existing = $this->existingRequest($submissionType, $submission->getKey());
        if ($existing !== null) {
            if (! $submission instanceof PracticeWritingSubmission || $this->hasGeneratedFeedback($attempt)) {
                return $this->payload($existing, $cost, false, $this->resultFeedback($attempt));
            }

            if (! $this->markFeedbackPending($existing)) {
                return $this->payload($existing->refresh(), $cost, false, $this->resultFeedback($attempt));
            }

            $this->completeWritingFeedback($existing, $attempt, $submission);

            return $this->payload($existing->refresh(), $cost, false, $this->resultFeedback($attempt));
        }

        $request = DB::transaction(function () use ($profile, $submission, $submissionType, $cost) {
            $existing = $this->existingRequest($submissionType, $submission->getKey(), true);

            if ($existing !== null) {
                return $existing;
            }

            $request = PracticeFeedbackRequest::create([
                'profile_id' => $profile->id,
                'submission_type' => $submissionType->value,
                'submission_id' => $submission->getKey(),
                'status' => $submission instanceof PracticeWritingSubmission
                    ? PracticeFeedbackStatus::Pending
                    : PracticeFeedbackStatus::Ready,
                'requested_at' => now(),
                'completed_at' => $submission instanceof PracticeWritingSubmission ? null : now(),
            ]);

            $transaction = $this->walletService->spend(
                $profile,
                $cost,
                CoinTransactionType::PracticeFeedback,
                $request,
                ['submission_type' => $submissionType->value, 'submission_id' => $submission->getKey()],
            );

            $request->update(['coin_transaction_id' => $transaction->id]);

            return $request->refresh();
        });

        if ($request->status === PracticeFeedbackStatus::Pending && $submission instanceof PracticeWritingSubmission) {
            $this->completeWritingFeedback($request, $attempt, $submission);
        }

        $charged = $request->wasRecentlyCreated;

        return $this->payload($request->refresh(), $cost, $charged, $this->resultFeedback($attempt));
    }

    private function readyAttempt(int|string $submissionId): AssessmentAttempt
    {
        $attempt = AssessmentAttempt::query()
            ->with(['evidence', 'result'])
            ->where('source_type', AssessmentSourceType::Practice)
            ->where('source_id', $submissionId)
            ->whereHas('result')
            ->first();

        if ($attempt === null) {
            throw ValidationException::withMessages([
                'submission' => ['Submission not graded yet.'],
            ]);
        }

        return $attempt;
    }

    /** @return array{strengths: list<string>, improvements: list<string>, rewrites: list<string>} */
    private function generateWritingFeedback(AssessmentAttempt $attempt, PracticeWritingSubmission $submission): array
    {
        if ($attempt->skill !== AssessmentSkill::Writing) {
            throw new \InvalidArgumentException('Writing feedback requested for a non-writing attempt.');
        }

        $signals = $attempt->evidence?->signals ?? [];
        $metrics = is_array($signals['vocabulary'] ?? null) ? $signals['vocabulary'] : [];
        $grammar = is_array($signals['grammar'] ?? null) ? $signals['grammar'] : [];
        $grammarErrors = is_array($grammar['errors'] ?? null) ? $grammar['errors'] : [];

        return $this->writingFeedbackGenerator->generate(
            text: $submission->text,
            promptText: (string) ($attempt->prompt['prompt'] ?? $submission->prompt?->prompt ?? ''),
            metrics: $metrics,
            grammarErrors: $grammarErrors,
            bandContext: null,
            part: (int) ($attempt->prompt['part'] ?? $submission->prompt?->part ?? 2),
        );
    }

    private function existingRequest(PracticeFeedbackSubmissionType $submissionType, int|string $submissionId, bool $lock = false): ?PracticeFeedbackRequest
    {
        $query = PracticeFeedbackRequest::query()
            ->where('submission_type', $submissionType->value)
            ->where('submission_id', $submissionId);

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    private function markFeedbackPending(PracticeFeedbackRequest $request): bool
    {
        return DB::transaction(function () use ($request) {
            $locked = PracticeFeedbackRequest::query()
                ->whereKey($request->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status === PracticeFeedbackStatus::Pending) {
                return false;
            }

            $locked->update([
                'status' => PracticeFeedbackStatus::Pending,
                'last_error' => null,
                'completed_at' => null,
                'failed_at' => null,
            ]);

            $request->setRawAttributes($locked->getAttributes(), true);

            return true;
        });
    }

    private function completeWritingFeedback(
        PracticeFeedbackRequest $request,
        AssessmentAttempt $attempt,
        PracticeWritingSubmission $submission,
    ): void {
        try {
            $this->persistFeedback($attempt, $this->generateWritingFeedback($attempt, $submission));
            $request->update([
                'status' => PracticeFeedbackStatus::Ready,
                'last_error' => null,
                'completed_at' => now(),
                'failed_at' => null,
            ]);
        } catch (\Throwable $exception) {
            $request->update([
                'status' => PracticeFeedbackStatus::Failed,
                'last_error' => $exception->getMessage(),
                'failed_at' => now(),
            ]);

            throw $exception;
        }
    }

    /** @param array{strengths: list<string>, improvements: list<string>, rewrites: list<string>} $generatedFeedback */
    private function persistFeedback(AssessmentAttempt $attempt, array $generatedFeedback): void
    {
        $result = $attempt->result;
        if (! $result instanceof AssessmentResult) {
            throw new \RuntimeException('Assessment result missing while persisting feedback.');
        }

        $existing = $result->feedback ?? [];
        $result->update([
            'feedback' => [
                ...$existing,
                'strengths' => $generatedFeedback['strengths'],
                'improvements' => $generatedFeedback['improvements'],
                'rewrites' => $generatedFeedback['rewrites'],
            ],
        ]);

        $attempt->setRelation('result', $result->refresh());
    }

    /** @return array<string,mixed> */
    private function payload(PracticeFeedbackRequest $request, int $cost, bool $charged, ?array $feedback): array
    {
        return [
            'submission_id' => $request->submission_id,
            'status' => $request->status->value,
            'cost_coins' => $cost,
            'charged' => $charged,
            'feedback' => $feedback,
        ];
    }

    /** @return array<string,mixed>|null */
    private function resultFeedback(AssessmentAttempt $attempt): ?array
    {
        $feedback = $attempt->result?->feedback;

        return is_array($feedback) ? $feedback : null;
    }

    private function hasGeneratedFeedback(AssessmentAttempt $attempt): bool
    {
        $feedback = $this->resultFeedback($attempt);

        if ($feedback === null) {
            return false;
        }

        foreach (['strengths', 'improvements', 'rewrites'] as $key) {
            if (is_array($feedback[$key] ?? null) && $feedback[$key] !== []) {
                return true;
            }
        }

        return false;
    }
}
