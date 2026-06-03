<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Services\Content\ContentReferenceImporter;
use App\Services\Content\ContentReferenceValidator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

final class ReferencePracticeContentSeeder extends Seeder
{
    public function run(ContentReferenceValidator $validator, ContentReferenceImporter $importer): void
    {
        foreach ([
            'practice_reading_exercises',
            'practice_reading_questions',
            'practice_listening_exercises',
            'practice_listening_questions',
            'practice_writing_prompts',
            'practice_speaking_tasks',
        ] as $table) {
            if (! Schema::hasTable($table)) {
                return;
            }
        }
        $errors = $validator->validateAll();
        if ($errors !== []) {
            throw new RuntimeException('Content reference validation failed: '.implode(' ', $errors));
        }

        $created = $importer->import($validator);

        $this->command?->info("Reference practice content seeded: {$created['reading_exercises']} new reading exercises, {$created['listening_exercises']} new listening exercises, {$created['writing_prompts']} new writing prompts, {$created['speaking_tasks']} new speaking tasks.");
    }
}
