<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Level;
use App\Enums\Skill;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['skill', 'level', 'is_active'])]
class GradingRubric extends BaseModel
{
    protected function casts(): array
    {
        return [
            'skill' => Skill::class,
            'level' => Level::class,
            'is_active' => 'boolean',
        ];
    }

    public function criteria(): HasMany
    {
        return $this->hasMany(GradingCriterion::class, 'rubric_id')->orderBy('sort_order');
    }

    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    #[Scope]
    protected function forSkillAndLevel(Builder $query, Skill $skill, Level $level): void
    {
        $query->where('skill', $skill)->where('level', $level);
    }
}
