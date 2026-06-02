<?php

declare(strict_types=1);

namespace App\Services;

use App\Ai\Contracts\WritingFeedbackGenerator;
use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Enums\CoinTransactionType;
use App\Enums\PracticeFeedbackStatus;
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
        return $this->request($profile, $submission, 'practice_writing');
    }

    /** @return array<string,mixed> */
    public function requestSpeaking(Profile $profile, PracticeSpeakingSubmission $submission): array
    {
        return $this->request($profile, $submission, 'practice_speaking');
    }

    /** @return array<string,mixed> */
    private function request(Profile $profile, Model $submission, string $submissionType): array
    {
        if ($submission->profile_id !== $profile->id) {
            abort(403);
        }

        $attempt = $this->readyAttempt($submissionType, (string) $submission->getKey());

        $cost = $this->economyConfig->practiceFeedbackCost();
        $existing = $this->existingRequest($submissionType, (string) $submission->getKey());
        if ($existing !== null) {
            if ($submission instanceof PracticeWritingSubmission && $this->resultFeedback($attempt) === null) {
                $this->persistFeedback($attempt, $this->generateWritingFeedback($attempt, $submission));
            }

            return $this->payload($existing, $cost, false, $this->resultFeedback($attempt));
        }

        $generatedFeedback = $submission instanceof PracticeWritingSubmission
            ? $this->generateWritingFeedback($attempt, $submission)
            : null;

        return DB::transaction(function () use ($profile, $submission, $submissionType, $cost, $attempt, $generatedFeedback) {
            $existing = $this->existingRequest($submissionType, (string) $submission->getKey(), true);

            if ($existing !== null) {
                return $this->payload($existing, $cost, false, $this->resultFeedback($attempt));
            }

            $request = PracticeFeedbackRequest::create([
                'profile_id' => $profile->id,
                'submission_type' => $submissionType,
                'submission_id' => $submission->getKey(),
                'status' => PracticeFeedbackStatus::Ready,
                'requested_at' => now(),
                'completed_at' => now(),
            ]);

            $transaction = $this->walletService->spend(
                $profile,
                $cost,
                CoinTransactionType::PracticeFeedback,
                $request,
                ['submission_type' => $submissionType, 'submission_id' => $submission->getKey()],
            );

            if ($generatedFeedback !== null) {
                $this->persistFeedback($attempt, $generatedFeedback);
            }

            $request->update(['coin_transaction_id' => $transaction->id]);

            return $this->payload($request->refresh(), $cost, true, $this->resultFeedback($attempt));
        });
    }

    private function readyAttempt(string $submissionType, string $submissionId): AssessmentAttempt
    {
        if (! in_array($submissionType, ['practice_writing', 'practice_speaking'], true)) {
            throw new \InvalidArgumentException("Unsupported feedback type: {$submissionType}.");
        }

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

    private function existingRequest(string $submissionType, string $submissionId, bool $lock = false): ?PracticeFeedbackRequest
    {
        $query = PracticeFeedbackRequest::query()
            ->where('submission_type', $submissionType)
            ->where('submission_id', $submissionId);

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->first();
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
}
