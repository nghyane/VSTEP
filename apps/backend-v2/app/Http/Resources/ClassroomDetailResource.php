<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassroomDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isOwner = $request->user()?->id === $this->instructor_id;

        return [
            ...parent::toArray($request),
            'invite_code' => $isOwner ? $this->invite_code : null,
            'members' => ClassMemberResource::collection($this->whenLoaded('members')),
            'member_count' => $this->whenCounted('members'),
        ];
    }
}
