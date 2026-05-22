<?php

declare(strict_types=1);

namespace App\Models;

class PracticeShadowingProgress extends BaseModel
{
    public $timestamps = false;

    protected $table = 'practice_shadowing_progress';

    protected $fillable = [
        'profile_id',
        'lesson_id',
        'segment_index',
        'accuracy_percent',
    ];
}
