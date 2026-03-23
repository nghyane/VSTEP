<?php

namespace App\Models;

use App\Enums\Level;
use App\Enums\Skill;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['skill', 'level', 'part', 'topic', 'content', 'answer_key', 'explanation', 'is_active', 'created_by'])]
class Question extends Model
{
    use HasUuids;

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
}
