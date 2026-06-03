<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Content\ContentReferenceValidator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class SyncContentReferences extends Command
{
    protected $signature = 'content:sync
        {--no-validate : Skip reference fixture validation}
        {--status : Only print current reference content status}';

    protected $description = 'Validate, import and report curated VSTEP content reference data';

    public function handle(ContentReferenceValidator $validator): int
    {
        if ((bool) $this->option('status')) {
            $this->printStatus($validator);

            return self::SUCCESS;
        }

        if (! (bool) $this->option('no-validate')) {
            $errors = $validator->validateAll();
            if ($errors !== []) {
                foreach ($errors as $error) {
                    $this->error($error);
                }

                return self::FAILURE;
            }

            $this->info('Content reference fixtures valid.');
        }

        Artisan::call('db:seed', ['--class' => 'ReferencePracticeContentSeeder', '--force' => true]);
        $output = trim(Artisan::output());
        if ($output !== '') {
            $this->line($output);
        }

        $this->printStatus($validator);

        return self::SUCCESS;
    }

    private function printStatus(ContentReferenceValidator $validator): void
    {
        $counts = $validator->fixtureCounts();

        $this->info('Content reference status');
        $this->line("  fixture reading exercises: {$counts['reading_exercises']}");
        $this->line("  fixture reading questions: {$counts['reading_questions']}");
        $this->line("  fixture listening exercises: {$counts['listening_exercises']}");
        $this->line("  fixture listening questions: {$counts['listening_questions']}");
        $this->line("  fixture writing prompts: {$counts['writing_prompts']}");
        $this->line("  fixture speaking tasks: {$counts['speaking_tasks']}");
        $this->line('  runtime practice_reading_exercises: '.($this->tableCount('practice_reading_exercises') ?? 'not migrated'));
        $this->line('  runtime practice_reading_questions: '.($this->tableCount('practice_reading_questions') ?? 'not migrated'));
        $this->line('  runtime practice_listening_exercises: '.($this->tableCount('practice_listening_exercises') ?? 'not migrated'));
        $this->line('  runtime practice_listening_questions: '.($this->tableCount('practice_listening_questions') ?? 'not migrated'));
        $this->line('  runtime practice_writing_prompts: '.($this->tableCount('practice_writing_prompts') ?? 'not migrated'));
        $this->line('  runtime practice_speaking_tasks: '.($this->tableCount('practice_speaking_tasks') ?? 'not migrated'));
    }

    private function tableCount(string $table): ?int
    {
        if (! Schema::hasTable($table)) {
            return null;
        }

        return DB::table($table)->count();
    }
}
