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

    public function ancestorPath(): array
    {
        $path = [$this->name];
        $current = $this;
        $seen = [$this->id];

        while ($parent = $current->parents->first(fn ($p) => $p->category->value === $this->category->value && ! in_array($p->id, $seen))) {
            $path[] = $parent->name;
            $seen[] = $parent->id;
            $current = self::with('parents')->find($parent->id);
        }

        return array_reverse($path);
    }

    public static function enrichGaps(array $gapNames): array
    {
        return collect($gapNames)->map(function ($name) {
            $kp = self::with('parents')->where('name', $name)->first();
            if (! $kp) {
                return null;
            }

            return [
                'name' => $kp->name,
                'category' => $kp->category->value,
                'description' => $kp->description,
                'path' => $kp->ancestorPath(),
            ];
        })->filter()->values()->toArray();
    }
}
