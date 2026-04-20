<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\WalletTopupPackage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read WalletTopupPackage $resource
 */
class WalletTopupPackageResource extends JsonResource
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
        ];
    }
}
