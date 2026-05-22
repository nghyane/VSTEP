<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\CourseEnrollment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read CourseEnrollment $resource
 */
class AdminEnrollmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = $this->resource->profile;
        $account = $profile?->account;

        return [
            'id' => $this->resource->id,
            'enrolled_at' => $this->resource->enrolled_at,
            'coins_paid' => (int) $this->resource->coins_paid,
            'bonus_coins_received' => (int) $this->resource->bonus_coins_received,
            'acknowledged_commitment' => (bool) $this->resource->acknowledged_commitment,
            'commitment_signature' => $this->resource->commitment_signature,
            'profile' => $profile === null ? null : [
                'id' => $profile->id,
                'nickname' => $profile->nickname,
                'target_level' => $profile->target_level,
                'target_deadline' => $profile->target_deadline,
            ],
            'account' => $account === null ? null : [
                'id' => $account->id,
                'full_name' => $account->full_name,
                'email' => $account->email,
            ],
        ];
    }
}
