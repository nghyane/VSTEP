<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\CoinTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read CoinTransaction $resource
 */
class CoinTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'type' => $this->resource->type->value,
            'delta' => $this->resource->delta,
            'balance_after' => $this->resource->balance_after,
            'source_type' => $this->resource->source_type,
            'source_id' => $this->resource->source_id,
            'metadata' => $this->resource->metadata,
            'created_at' => $this->resource->created_at,
        ];
    }
}
