<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\MasteryLevel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'profile_id',
    'grammar_point_id',
    'attempts',
    'correct',
    'last_practiced_at',
    'computed_level',
])]
class ProfileGrammarMastery extends Model
{
    use HasFactory;

    protected $table = 'profile_grammar_mastery';

    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = null;

    protected function casts(): array
    {
        return [
            'last_practiced_at' => 'datetime',
            'computed_level' => MasteryLevel::class,
            'updated_at' => 'datetime',
        ];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function point(): BelongsTo
    {
        return $this->belongsTo(GrammarPoint::class, 'grammar_point_id');
    }

    public function accuracyPercent(): int
    {
        if ($this->attempts === 0) {
            return 0;
        }

        return (int) round(($this->correct / $this->attempts) * 100);
    }
}
