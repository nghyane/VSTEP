<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ExamSessionStatus;
use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamSessionDraft;
use App\Models\Profile;
use App\Services\Contracts\ExamSessionExpiryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class ExamSessionExpiryService implements ExamSessionExpiryInterface
{
    public function __construct(
        private readonly ExamScoringService $scoringService,
        private readonly ProgressService $progressService,
    ) {}

    public function forceSubmitExpired(?Profile $profile = null): int
    {
        $query = ExamSession::query()
            ->where('status', ExamSessionStatus::Active)
            ->where('server_deadline_at', '<', now());

        if ($profile !== null) {
            $query->where('profile_id', $profile->id);
        }

        $processed = 0;
        foreach ($query->get() as $session) {
            try {
                if ($this->forceSubmitIfExpired($session)) {
                    $processed++;
                }
            } catch (\Throwable $e) {
                if ($profile !== null) {
                    throw $e;
                }

                Log::error('Force-submit failed for expired exam session', [
                    'session_id' => $session->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $processed;
    }

    public function forceSubmitIfExpired(ExamSession $session): bool
    {
        return DB::transaction(function () use ($session): bool {
            /** @var ExamSession|null $locked */
            $locked = ExamSession::query()
                ->whereKey($session->id)
                ->lockForUpdate()
                ->first();

            if ($locked === null
                || $locked->status !== ExamSessionStatus::Active
                || $locked->server_deadline_at->isFuture()
            ) {
                return false;
            }

            $itemMap = $this->scoringService->loadMcqItemMap($locked);
            $answers = ExamMcqAnswer::query()->where('session_id', $locked->id)->get();

            foreach ($answers as $answer) {
                $correctIndex = $itemMap["{$answer->item_ref_type}:{$answer->item_ref_id}"] ?? null;
                if ($correctIndex === null) {
                    continue;
                }

                $isCorrect = (int) $answer->selected_index === (int) $correctIndex;
                if ((bool) $answer->is_correct !== $isCorrect) {
                    $answer->update(['is_correct' => $isCorrect]);
                }
            }

            $locked->update([
                'status' => ExamSessionStatus::AutoSubmitted,
                'submitted_at' => $locked->server_deadline_at,
            ]);

            ExamSessionDraft::query()->where('session_id', $locked->id)->delete();

            DB::afterCommit(fn () => $this->progressService->recordExamCompletion($locked->fresh()));

            return true;
        });
    }
}
