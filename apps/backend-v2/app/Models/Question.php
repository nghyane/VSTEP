<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Level;
use App\Enums\Skill;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['skill', 'level', 'part', 'topic', 'content', 'answer_key', 'explanation', 'is_active', 'created_by'])]
class Question extends BaseModel
{
    protected function casts(): array
    {
        return [
            'skill' => Skill::class,
            'level' => Level::class,
            'content' => 'array',
            'answer_key' => 'array',
            'is_active' => 'boolean',
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

        $correct = 0;
        $total = count($correctAnswers);

        foreach ($correctAnswers as $key => $expected) {
            if (($userAnswers[$key] ?? null) === $expected) {
                $correct++;
            }
        }

        return [
            'correct' => $correct,
            'total' => $total,
            'score' => $total > 0 ? round(($correct / $total) * 10, 1) : 0.0,
            'all_correct' => $correct === $total,
        ];
    }
}
