<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\UserKnownWord;
use App\Models\VocabularyTopic;
use App\Models\VocabularyWord;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class VocabularyService
{
    public function list(): LengthAwarePaginator
    {
        return VocabularyTopic::withCount('words')
            ->orderBy('sort_order')
            ->paginate();
    }

    public function show(VocabularyTopic $topic): VocabularyTopic
    {
        $topic->load(['words' => fn ($q) => $q->orderBy('sort_order')]);

        return $topic;
    }

    public function progress(VocabularyTopic $topic, string $userId): array
    {
        $totalWords = $topic->words()->count();

        $knownWordIds = UserKnownWord::where('user_id', $userId)
            ->where('known', true)
            ->whereHas('word', fn ($q) => $q->where('topic_id', $topic->id))
            ->pluck('word_id');

        return [
            'known_word_ids' => $knownWordIds->values()->all(),
            'total_words' => $totalWords,
            'known_count' => $knownWordIds->count(),
        ];
    }

    public function toggleKnown(VocabularyWord $word, string $userId, bool $known): UserKnownWord
    {
        return UserKnownWord::updateOrCreate(
            ['user_id' => $userId, 'word_id' => $word->id],
            ['known' => $known, 'last_reviewed_at' => now()],
        );
    }
}
