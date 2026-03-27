<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'description', 'icon_key', 'sort_order'])]
#[Hidden(['words_count'])]
class VocabularyTopic extends BaseModel
{
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function words(): HasMany
    {
        return $this->hasMany(VocabularyWord::class, 'topic_id');
    }
}
