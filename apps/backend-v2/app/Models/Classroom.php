<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'description', 'invite_code', 'instructor_id'])]
#[Hidden(['updated_at'])]
class Classroom extends BaseModel
{
    protected $table = 'classrooms';

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ClassMember::class, 'classroom_id');
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(ClassFeedback::class, 'classroom_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ClassAssignment::class, 'classroom_id');
    }
}
