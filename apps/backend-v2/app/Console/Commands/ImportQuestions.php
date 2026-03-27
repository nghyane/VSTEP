<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\BloomLevel;
use App\Enums\Level;
use App\Enums\Skill;
use App\Models\KnowledgePoint;
use App\Models\Question;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ImportQuestions extends Command
{
    protected $signature = 'questions:import {path : Path to JSON file}';

    protected $description = 'Import generated questions from JSON file into DB';

    public function handle(): int
    {
        $path = $this->argument('path');

        if (! File::exists($path)) {
            $this->error("File not found: {$path}");

            return self::FAILURE;
        }

        $data = json_decode(File::get($path), true);
        $meta = $data['metadata'];
        $questions = $data['questions'];

        $this->info("Importing {$meta['count']} {$meta['skill']}/{$meta['level']}/Part{$meta['part']} questions...");

        $kpMap = KnowledgePoint::pluck('id', 'name');
        $saved = 0;

        foreach ($questions as $q) {
            $question = Question::create([
                'skill' => Skill::from($meta['skill']),
                'level' => Level::from($meta['level']),
                'part' => $meta['part'],
                'topic' => $q['topic'],
                'bloom_level' => BloomLevel::from($q['bloom_level']),
                'content' => ['prompt' => $q['prompt']],
                'answer_key' => null,
                'is_active' => true,
            ]);

            $kpIds = collect($q['knowledge_points'])
                ->map(fn ($name) => $kpMap->get($name))
                ->filter()
                ->toArray();

            $question->knowledgePoints()->attach($kpIds);
            $saved++;
            $this->line("  [{$q['bloom_level']}] {$q['topic']}");
        }

        $this->info("Imported {$saved} questions.");

        return self::SUCCESS;
    }
}
