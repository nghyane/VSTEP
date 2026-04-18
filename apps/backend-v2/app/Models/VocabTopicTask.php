<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Junction row topic × VSTEP task. Composite primary key.
 */
#[Fillable(['topic_id', 'task'])]
class VocabTopicTask extends Model
{
    use HasFactory;

    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = null;

    public function topic(): BelongsTo
    {
        return $this->belongsTo(VocabTopic::class, 'topic_id');
    }
}
