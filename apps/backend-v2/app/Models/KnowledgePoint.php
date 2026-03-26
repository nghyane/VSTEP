<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\KnowledgePointCategory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['category', 'name', 'description'])]
class KnowledgePoint extends BaseModel
{
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

    public function parents(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'knowledge_point_edges', 'child_id', 'parent_id')
            ->withPivot('relation');
    }

    public function children(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'knowledge_point_edges', 'parent_id', 'child_id')
            ->withPivot('relation');
    }
}
