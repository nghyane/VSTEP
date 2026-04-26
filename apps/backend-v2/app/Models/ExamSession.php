<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'profile_id', 'exam_version_id', 'mode', 'selected_skills', 'is_full_test',
    'time_extension_factor', 'started_at', 'server_deadline_at', 'submitted_at',
    'status', 'coins_charged',
])]
class ExamSession extends BaseModel
{
    protected function casts(): array
    {
        return [
            'selected_skills' => 'array',
            'is_full_test' => 'boolean',
            'time_extension_factor' => 'float',
            'started_at' => 'datetime',
            'server_deadline_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function examVersion(): BelongsTo
    {
        return $this->belongsTo(ExamVersion::class);
    }

    public function mcqAnswers(): HasMany
    {
        return $this->hasMany(ExamMcqAnswer::class, 'session_id');
    }

    public function writingSubmissions(): HasMany
    {
        return $this->hasMany(ExamWritingSubmission::class, 'session_id');
    }

    public function speakingSubmissions(): HasMany
    {
        return $this->hasMany(ExamSpeakingSubmission::class, 'session_id');
    }

    public function listeningPlayLogs(): HasMany
    {
        return $this->hasMany(ExamListeningPlayLog::class, 'session_id');
    }

    public function draft(): HasOne
    {
        return $this->hasOne(ExamSessionDraft::class, 'session_id');
    }
}
