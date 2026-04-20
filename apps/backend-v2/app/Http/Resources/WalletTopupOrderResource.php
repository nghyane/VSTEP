<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\WalletTopupOrder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read WalletTopupOrder $resource
 */
class WalletTopupOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'profile_id' => $this->resource->profile_id,
            'package_id' => $this->resource->package_id,
            'amount_vnd' => $this->resource->amount_vnd,
            'coins_to_credit' => $this->resource->coins_to_credit,
            'status' => $this->resource->status,
            'payment_provider' => $this->resource->payment_provider,
            'provider_ref' => $this->resource->provider_ref,
            'paid_at' => $this->resource->paid_at,
            'created_at' => $this->resource->created_at,
        ];
    }
}
