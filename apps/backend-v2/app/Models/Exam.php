<?php

namespace App\Models;

use App\Enums\ExamType;
use App\Enums\Level;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['title', 'level', 'type', 'duration_minutes', 'blueprint', 'description', 'is_active', 'created_by'])]
class Exam extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return [
            'level' => Level::class,
            'type' => ExamType::class,
            'blueprint' => 'array',
            'is_active' => 'boolean',
            'duration_minutes' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ExamSession::class);
    }
}
