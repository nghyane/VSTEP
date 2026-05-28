<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * CEFR vocabulary master table — reference data from Oxford 3000/5000.
 * Used by CefrVocabularyClassifier to level-tag words in essays.
 * Linked to vocab_words via word text matching (not FK).
 */
class CefrVocabulary extends Model
{
    protected $table = 'cefr_vocabulary';

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'level' => 'string',
        ];
    }

    /** @return array<string, string> word → level map */
    public static function levelMap(): array
    {
        return static::query()->pluck('level', 'word')->toArray();
    }
}
