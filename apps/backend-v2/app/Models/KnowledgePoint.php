<?php

namespace App\Models;

use App\Enums\KnowledgePointCategory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['category', 'name'])]
class KnowledgePoint extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return [
            'category' => KnowledgePointCategory::class,
        ];
    }

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'question_knowledge_point');
    }
}
