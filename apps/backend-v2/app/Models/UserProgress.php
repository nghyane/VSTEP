<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Level;
use App\Enums\Skill;
use App\Enums\StreakDirection;
use App\Enums\WritingTier;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'skill', 'current_level', 'target_level', 'scaffold_level', 'streak_count', 'streak_direction', 'attempt_count'])]
class UserProgress extends BaseModel
{
    protected $table = 'user_progress';

    protected function casts(): array
    {
        return [
            'skill' => Skill::class,
            'current_level' => Level::class,
            'target_level' => Level::class,
            'streak_direction' => StreakDirection::class,
            'scaffold_level' => 'integer',
            'streak_count' => 'integer',
            'attempt_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function writingTier(): WritingTier
    {
        return WritingTier::fromScaffoldLevel($this->scaffold_level);
    }

    public static function findOrInitialize(string $userId, Skill|string $skill): self
    {
        return self::firstOrCreate(
            ['user_id' => $userId, 'skill' => $skill],
            [
                'current_level' => Level::A2,
                'scaffold_level' => 0,
                'streak_count' => 0,
                'streak_direction' => StreakDirection::Neutral,
                'attempt_count' => 0,
            ],
        );
    }
}
