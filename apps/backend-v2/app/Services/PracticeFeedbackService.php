<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Enums\AssessmentSourceType;
use App\Enums\CoinTransactionType;
use App\Enums\PracticeFeedbackStatus;
use App\Models\AssessmentAttempt;
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

        $this->assertResultReady($submissionType, (string) $submission->getKey());

        $cost = $this->economyConfig->practiceFeedbackCost();

        return DB::transaction(function () use ($profile, $submission, $submissionType, $cost) {
            $existing = PracticeFeedbackRequest::query()
                ->where('submission_type', $submissionType)
                ->where('submission_id', $submission->getKey())
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                return $this->payload($existing, $cost, false);
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

            $request->update(['coin_transaction_id' => $transaction->id]);

            return $this->payload($request->refresh(), $cost, true);
        });
    }

    private function assertResultReady(string $submissionType, string $submissionId): void
    {
        if (! in_array($submissionType, ['practice_writing', 'practice_speaking'], true)) {
            throw new \InvalidArgumentException("Unsupported feedback type: {$submissionType}.");
        }

        $result = AssessmentAttempt::query()
            ->where('source_type', AssessmentSourceType::Practice)
            ->where('source_id', $submissionId)
            ->whereHas('result')
            ->exists();

        if (! $result) {
            throw ValidationException::withMessages([
                'submission' => ['Submission not graded yet.'],
            ]);
        }
    }

    /** @return array<string,mixed> */
    private function payload(PracticeFeedbackRequest $request, int $cost, bool $charged): array
    {
        return [
            'submission_id' => $request->submission_id,
            'status' => $request->status->value,
            'cost_coins' => $cost,
            'charged' => $charged,
        ];
    }
}
