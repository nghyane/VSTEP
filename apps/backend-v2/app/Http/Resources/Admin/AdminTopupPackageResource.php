<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\WalletTopupPackage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin-facing top-up package resource. Khác user-facing resource ở chỗ
 * expose thêm `is_active`, `created_at`, `updated_at` để admin quản lý.
 *
 * @property-read WalletTopupPackage $resource
 */
final class AdminTopupPackageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'label' => $this->resource->label,
            'amount_vnd' => $this->resource->amount_vnd,
            'coins_base' => $this->resource->coins_base,
            'bonus_coins' => $this->resource->bonus_coins,
            'total_coins' => $this->resource->totalCoins(),
            'display_order' => $this->resource->display_order,
            'is_active' => (bool) $this->resource->is_active,
            'is_best_value' => (bool) $this->resource->is_best_value,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
