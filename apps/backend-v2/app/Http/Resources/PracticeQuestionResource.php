<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PracticeQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        unset($data['answer_key'], $data['explanation'], $data['created_by']);

        return $data;
    }
}
