<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug',
    'title',
    'description',
    'part',
    'prompt',
    'min_words',
    'max_words',
    'required_points',
    'keywords',
    'sentence_starters',
    'sample_answer',
    'estimated_minutes',
    'is_published',
])]
class PracticeWritingPrompt extends BaseModel
{
    protected function casts(): array
    {
        return [
            'required_points' => 'array',
            'keywords' => 'array',
            'sentence_starters' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function outlineSections(): HasMany
    {
        return $this->hasMany(PracticeWritingOutlineSection::class, 'prompt_id');
    }

    public function templateSections(): HasMany
    {
        return $this->hasMany(PracticeWritingTemplateSection::class, 'prompt_id');
    }

    public function sampleMarkers(): HasMany
    {
        return $this->hasMany(PracticeWritingSampleMarker::class, 'prompt_id');
    }
}
