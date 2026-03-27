<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'description', 'icon_key', 'sort_order'])]
#[Hidden(['items_count'])]
class SentenceTopic extends BaseModel
{
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(SentenceItem::class, 'topic_id');
    }
}
