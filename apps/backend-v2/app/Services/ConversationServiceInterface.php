<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PracticeSpeakingConversationSession;
use App\Models\PracticeSpeakingScenario;
use App\Models\Profile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ConversationServiceInterface
{
    /** @return Collection<int,PracticeSpeakingScenario> */
    public function listScenarios(?string $level): Collection;

    public function getScenario(string $id): PracticeSpeakingScenario;

    /** @return array{session: PracticeSpeakingConversationSession, turns: array<int,PracticeSpeakingConversationTurn>} */
    public function startSession(Profile $profile, string $scenarioId): array;

    /** @return array{user_turn: PracticeSpeakingConversationTurn, ai_turn: PracticeSpeakingConversationTurn, session: PracticeSpeakingConversationSession} */
    public function submitTurn(PracticeSpeakingConversationSession $session, string $text): array;

    public function endSession(PracticeSpeakingConversationSession $session): PracticeSpeakingConversationSession;

    public function getSession(PracticeSpeakingConversationSession $session): PracticeSpeakingConversationSession;

    public function listHistory(Profile $profile): LengthAwarePaginator;

    /** @return array{overall_score?: int, strengths: string[], improvements: string[], corrected_sentences: array, tip: string} */
    public function reviewSession(Profile $profile, PracticeSpeakingConversationSession $session): array;

    /** @return array{pronunciation: string, intonation: string, tip: string} */
    public function pronunciationReview(Profile $profile, string $original, string $transcript, ?string $segmentId = null): array;

    public function generateIpa(string $text): ?string;
}
