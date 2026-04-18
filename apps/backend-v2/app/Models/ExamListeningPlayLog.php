<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamListeningPlayLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'exam_listening_play_log';

    protected $fillable = ['session_id', 'section_id', 'played_at', 'client_ip'];

    protected function casts(): array
    {
        return ['played_at' => 'datetime'];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }
}
