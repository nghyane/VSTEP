<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Vocabulary\ToggleKnownRequest;
use App\Http\Resources\VocabularyTopicDetailResource;
use App\Http\Resources\VocabularyTopicResource;
use App\Models\VocabularyTopic;
use App\Models\VocabularyWord;
use App\Services\VocabularyService;
use Illuminate\Http\Request;

class VocabularyController extends Controller
{
    public function __construct(
        private readonly VocabularyService $service,
    ) {}

    public function topics()
    {
        return VocabularyTopicResource::collection(
            $this->service->list(),
        );
    }

    public function showTopic(VocabularyTopic $topic)
    {
        return new VocabularyTopicDetailResource(
            $this->service->show($topic),
        );
    }

    public function topicProgress(Request $request, VocabularyTopic $topic)
    {
        return response()->json([
            'data' => $this->service->progress($topic, $request->user()->id),
        ]);
    }

    public function toggleKnown(ToggleKnownRequest $request, VocabularyWord $word)
    {
        $record = $this->service->toggleKnown(
            $word,
            $request->user()->id,
            $request->validated('known'),
        );

        return response()->json(['data' => $record]);
    }
}
