<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'url' => $this->resolveUrl(),
        ];
    }

    private function resolveUrl(): ?string
    {
        $submissionId = data_get($this->resource, 'data.submission_id');
        $skill = $this->resolveSkill($submissionId);

        if (is_string($submissionId) && $submissionId !== '') {
            if ($skill === 'writing') {
                return "/writing-result/{$submissionId}";
            }

            return "/submissions/{$submissionId}";
        }

        return null;
    }

    private function resolveSkill(mixed $submissionId): ?string
    {
        $skill = data_get($this->resource, 'data.skill');

        if (is_string($skill) && $skill !== '') {
            return $skill;
        }

        if (! is_string($submissionId) || $submissionId === '') {
            return null;
        }

        $submission = Submission::query()->find($submissionId);

        return $submission?->skill?->value;
    }
}
