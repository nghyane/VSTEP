<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class EnrollmentOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_code' => $this->order_code,
            'course_id' => $this->course_id,
            'course_title' => $this->course?->title,
            'amount_vnd' => $this->amount_vnd,
            'status' => $this->status,
            'payment_provider' => $this->payment_provider,
            'payment_url' => $this->payment_url,
            'provider_ref' => $this->provider_ref,
            'paid_at' => $this->paid_at,
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
        ];
    }
}
