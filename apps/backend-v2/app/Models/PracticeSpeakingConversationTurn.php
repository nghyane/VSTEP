<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PracticeSpeakingConversationTurn extends BaseModel
{
    public $timestamps = false;

    protected $fillable = [
        'session_id',
        'turn_index',
        'role',
        'text',
        'feedback',
        'suggested_words',
        'ipa',
    ];

    protected function casts(): array
    {
        return [
            'feedback' => 'array',
            'suggested_words' => 'array',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(PracticeSpeakingConversationSession::class, 'session_id');
    }
}
