<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\PromoCode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PromoCode $resource
 */
final class AdminPromoCodeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'code' => $this->resource->code,
            'partner_name' => $this->resource->partner_name,
            'amount_coins' => (int) $this->resource->amount_coins,
            'max_total_uses' => $this->resource->max_total_uses !== null
                ? (int) $this->resource->max_total_uses
                : null,
            'per_account_limit' => (int) $this->resource->per_account_limit,
            'expires_at' => $this->resource->expires_at,
            'is_active' => (bool) $this->resource->is_active,
            'redemptions_count' => $this->when(
                isset($this->resource->redemptions_count),
                fn () => (int) $this->resource->redemptions_count,
            ),
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
