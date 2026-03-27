<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ExamType;
use App\Enums\Level;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['title', 'level', 'type', 'duration_minutes', 'blueprint', 'description', 'is_active', 'created_by'])]
#[Hidden(['created_by', 'blueprint'])]
class Exam extends BaseModel
{
    protected function casts(): array
    {
        return [
            'level' => Level::class,
            'type' => ExamType::class,
            'is_active' => 'boolean',
            'duration_minutes' => 'integer',
        ];
    }

    protected function blueprint(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? json_decode($value, true) : [],
            set: fn ($value) => json_encode($value ?? []),
        );
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ExamSession::class);
    }

    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    public function questionCount(): int
    {
        return collect($this->blueprint)
            ->flatMap(fn ($section) => $section['question_ids'] ?? [])
            ->count();
    }
}
