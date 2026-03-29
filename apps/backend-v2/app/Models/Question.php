<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BloomLevel;
use App\Enums\Level;
use App\Enums\Skill;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['skill', 'level', 'part', 'topic', 'bloom_level', 'content', 'answer_key', 'explanation', 'is_active', 'verified_at', 'created_by'])]
#[Hidden(['created_by'])]
class Question extends BaseModel
{
    protected function casts(): array
    {
        return [
            'skill' => Skill::class,
            'level' => Level::class,
            'bloom_level' => BloomLevel::class,
            'content' => 'array',
            'answer_key' => 'array',
            'is_active' => 'boolean',
            'verified_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function knowledgePoints(): BelongsToMany
    {
        return $this->belongsToMany(KnowledgePoint::class, 'question_knowledge_point');
    }

    /**
     * @return array{correct: int, total: int, score: float, all_correct: bool}|null
     */
    public function gradeObjective(array $userAnswers): ?array
    {
        $correctAnswers = $this->answer_key['correctAnswers'] ?? null;
        if (! $correctAnswers) {
            return null;
        }

        // Normalize both to 0-indexed arrays so comparison is positional.
        // correctAnswers may be {"1":"A","2":"B"} (1-indexed) or ["A","B"] (0-indexed).
        // userAnswers may be {"1":"A","2":"B"} (1-indexed from FE) or [0=>"A",1=>"B"].
        $expected = array_values((array) $correctAnswers);
        $given = array_values((array) $userAnswers);

        $correct = 0;
        $total = count($expected);

        for ($i = 0; $i < $total; $i++) {
            if (($given[$i] ?? null) === $expected[$i]) {
                $correct++;
            }
        }

        return [
            'correct' => $correct,
            'total' => $total,
            'raw_ratio' => $total > 0 ? $correct / $total : 0.0,
            'all_correct' => $correct === $total,
        ];
    }
}
