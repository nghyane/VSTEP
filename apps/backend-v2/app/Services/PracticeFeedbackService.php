<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinTransactionType;
use App\Enums\PracticeFeedbackStatus;
use App\Jobs\FeedbackJob;
use App\Jobs\SpeakingFeedbackJob;
use App\Models\PracticeFeedbackRequest;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
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
                'status' => PracticeFeedbackStatus::Pending,
                'requested_at' => now(),
            ]);

            $transaction = $this->walletService->spend(
                $profile,
                $cost,
                CoinTransactionType::PracticeFeedback,
                $request,
                ['submission_type' => $submissionType, 'submission_id' => $submission->getKey()],
            );

            $request->update(['coin_transaction_id' => $transaction->id]);

            match ($submissionType) {
                'practice_writing' => FeedbackJob::dispatch($request->id)->afterCommit(),
                'practice_speaking' => SpeakingFeedbackJob::dispatch($request->id)->afterCommit(),
            };

            return $this->payload($request->refresh(), $cost, true);
        });
    }

    private function assertResultReady(string $submissionType, string $submissionId): void
    {
        $query = match ($submissionType) {
            'practice_writing' => WritingGradingResult::query(),
            'practice_speaking' => SpeakingGradingResult::query(),
            default => throw new \InvalidArgumentException("Unsupported feedback type: {$submissionType}."),
        };

        $result = $query->where('submission_type', $submissionType)
            ->where('submission_id', $submissionId)
            ->where('is_active', true)
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
            'status' => $request->status === PracticeFeedbackStatus::Pending ? 'processing' : $request->status->value,
            'channel' => "feedback.{$request->submission_id}",
            'event' => 'feedback.completed',
            'cost_coins' => $cost,
            'charged' => $charged,
        ];
    }
}
