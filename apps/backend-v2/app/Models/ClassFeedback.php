<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Skill;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['classroom_id', 'from_user_id', 'to_user_id', 'content', 'skill', 'submission_id'])]
#[Hidden(['updated_at'])]
class ClassFeedback extends BaseModel
{
    protected $table = 'class_feedback';

    protected function casts(): array
    {
        return [
            'skill' => Skill::class,
        ];
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class, 'classroom_id');
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }
}
