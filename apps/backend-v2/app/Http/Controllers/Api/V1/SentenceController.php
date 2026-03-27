<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sentence\ToggleSentenceMasteredRequest;
use App\Http\Resources\SentenceTopicDetailResource;
use App\Http\Resources\SentenceTopicResource;
use App\Models\SentenceItem;
use App\Models\SentenceTopic;
use App\Services\SentenceService;
use Illuminate\Http\Request;

class SentenceController extends Controller
{
    public function __construct(
        private readonly SentenceService $service,
    ) {}

    public function topics()
    {
        return SentenceTopicResource::collection($this->service->list());
    }

    public function showTopic(SentenceTopic $topic)
    {
        return new SentenceTopicDetailResource($this->service->show($topic));
    }

    public function topicProgress(Request $request, SentenceTopic $topic)
    {
        return response()->json([
            'data' => $this->service->progress($topic, $request->user()->id),
        ]);
    }

    public function toggleMastered(ToggleSentenceMasteredRequest $request, SentenceItem $sentence)
    {
        $record = $this->service->toggleMastered(
            $sentence,
            $request->user()->id,
            $request->validated('mastered'),
        );

        return response()->json(['data' => [
            'sentence_id' => $record->sentence_id,
            'mastered' => $record->mastered,
            'last_reviewed_at' => $record->last_reviewed_at,
        ]]);
    }
}
