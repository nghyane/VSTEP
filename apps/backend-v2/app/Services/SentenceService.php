<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\SentenceItem;
use App\Models\SentenceTopic;
use App\Models\UserMasteredSentence;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SentenceService
{
    public function list(): LengthAwarePaginator
    {
        return SentenceTopic::query()
            ->withCount('items')
            ->orderBy('sort_order')
            ->paginate();
    }

    public function show(SentenceTopic $topic): SentenceTopic
    {
        $topic->load(['items' => fn ($query) => $query->orderBy('sort_order')]);

        return $topic;
    }

    public function progress(SentenceTopic $topic, string $userId): array
    {
        $totalSentences = $topic->items()->count();

        $masteredSentenceIds = UserMasteredSentence::query()
            ->where('user_id', $userId)
            ->where('mastered', true)
            ->whereHas('sentence', fn ($query) => $query->where('topic_id', $topic->id))
            ->pluck('sentence_id');

        return [
            'mastered_sentence_ids' => $masteredSentenceIds->values()->all(),
            'total_sentences' => $totalSentences,
            'mastered_count' => $masteredSentenceIds->count(),
        ];
    }

    public function toggleMastered(SentenceItem $sentence, string $userId, bool $mastered): UserMasteredSentence
    {
        return UserMasteredSentence::updateOrCreate(
            ['user_id' => $userId, 'sentence_id' => $sentence->id],
            ['mastered' => $mastered, 'last_reviewed_at' => now()],
        );
    }
}
