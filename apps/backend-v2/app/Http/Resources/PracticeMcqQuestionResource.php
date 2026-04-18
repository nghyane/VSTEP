<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * MCQ question resource — HIDE correct_index + explanation until submission.
 * Caller quyết định có include correct_index không (showAnswer flag).
 */
class PracticeMcqQuestionResource extends JsonResource
{
    /**
     * @var Model
     */
    public $resource;

    public function __construct(Model $question, private readonly bool $showAnswer = false)
    {
        parent::__construct($question);
    }

    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->resource->id,
            'display_order' => $this->resource->display_order,
            'question' => $this->resource->question,
            'options' => $this->resource->options,
        ];

        if ($this->showAnswer) {
            $data['correct_index'] = $this->resource->correct_index;
            $data['explanation'] = $this->resource->explanation;
        }

        return $data;
    }
}
