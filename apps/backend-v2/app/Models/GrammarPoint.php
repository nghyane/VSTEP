<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug',
    'name',
    'vietnamese_name',
    'summary',
    'category',
    'display_order',
    'is_published',
])]
class GrammarPoint extends BaseModel
{
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    public function levels(): HasMany
    {
        return $this->hasMany(GrammarPointLevel::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(GrammarPointTask::class);
    }

    public function functions(): HasMany
    {
        return $this->hasMany(GrammarPointFunction::class);
    }

    public function structures(): HasMany
    {
        return $this->hasMany(GrammarStructure::class);
    }

    public function examples(): HasMany
    {
        return $this->hasMany(GrammarExample::class);
    }

    public function commonMistakes(): HasMany
    {
        return $this->hasMany(GrammarCommonMistake::class);
    }

    public function vstepTips(): HasMany
    {
        return $this->hasMany(GrammarVstepTip::class);
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(GrammarExercise::class);
    }
}
