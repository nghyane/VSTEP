<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Ai\Agents\ContentGenerator;
use App\Enums\BloomLevel;
use App\Enums\Level;
use App\Enums\Skill;
use App\Models\KnowledgePoint;
use App\Models\Question;
use Illuminate\Console\Command;
use RuntimeException;

class GenerateQuestions extends Command
{
    protected $signature = 'questions:generate
        {--skill= : writing or speaking}
        {--level= : A2, B1, B2, or C1}
        {--part= : Part number (1, 2, or 3)}
        {--count=5 : Number of questions to generate}
        {--dry-run : Print results without saving}';

    protected $description = 'Generate VSTEP questions using AI with coverage-based constraints';

    public function handle(): int
    {
        $skill = Skill::from($this->option('skill') ?? $this->choice('Skill', ['writing', 'speaking']));
        $level = Level::from($this->option('level') ?? $this->choice('Level', ['A2', 'B1', 'B2', 'C1']));
        $part = (int) ($this->option('part') ?? $this->choice('Part', $this->partsForSkill($skill)));
        $count = (int) $this->option('count');

        $this->info("Generating {$count} {$skill->value}/{$level->value}/Part{$part} questions...");

        // Step 1: Build coverage matrix
        $coverage = $this->buildCoverage($skill, $level, $part);
        $this->displayCoverage($coverage);

        // Step 2: Build prompt for agent
        $prompt = $this->buildPrompt($skill, $level, $part, $count, $coverage);

        // Step 3: Run agent
        $this->info('Running ContentGenerator agent...');
        $agent = new ContentGenerator($prompt);
        $agent->prompt("Generate {$count} {$skill->value} questions for VSTEP {$level->value}, Part {$part}.");

        $questions = $agent->getResult()
            ?? throw new RuntimeException('Agent did not call SubmitContent tool.');

        // Step 4: Validate
        $validated = $this->validate($questions, $skill, $level, $part, $coverage);

        if (empty($validated)) {
            $this->error('All generated questions failed validation.');

            return self::FAILURE;
        }

        $this->info(count($validated).' / '.count($questions).' questions passed validation.');

        // Step 5: Save
        if ($this->option('dry-run')) {
            $this->info('Dry run — not saving.');

            return self::SUCCESS;
        }

        $this->saveToDB($validated, $skill, $level, $part);

        return self::SUCCESS;
    }

    private function buildCoverage(Skill $skill, Level $level, int $part): array
    {
        $existing = Question::where('skill', $skill)
            ->where('level', $level)
            ->where('part', $part)
            ->get(['topic', 'bloom_level', 'content']);

        return [
            'total' => $existing->count(),
            'topics' => $existing->pluck('topic')->filter()->unique()->values()->toArray(),
            'bloom_distribution' => $existing->groupBy(fn ($q) => $q->bloom_level?->value ?? 'untagged')
                ->map->count()
                ->toArray(),
            'prompts' => $existing->map(fn ($q) => $q->content['prompt'] ?? $q->content['stem'] ?? '')->filter()->toArray(),
        ];
    }

    private function displayCoverage(array $coverage): void
    {
        $this->table(
            ['Metric', 'Value'],
            [
                ['Existing questions', $coverage['total']],
                ['Topics covered', implode(', ', $coverage['topics']) ?: '(none)'],
                ['Bloom distribution', collect($coverage['bloom_distribution'])->map(fn ($c, $k) => "{$k}: {$c}")->implode(', ') ?: '(none)'],
            ],
        );
    }

    private function buildPrompt(Skill $skill, Level $level, int $part, int $count, array $coverage): string
    {
        $bloomTargets = collect(BloomLevel::forLevel($level))->map(fn ($b) => $b->value)->toArray();

        $categories = match ($skill) {
            Skill::Writing => ['grammar', 'vocabulary', 'discourse', 'strategy'],
            Skill::Speaking => ['grammar', 'vocabulary', 'pronunciation', 'strategy'],
            default => [],
        };

        $knowledgePoints = KnowledgePoint::whereIn('category', $categories)->get();
        $exemplars = $this->fetchExemplars($skill, $level, $part);

        return view('generation.question-system', [
            'skill' => $skill->value,
            'level' => $level->value,
            'part' => $part,
            'count' => $count,
            'bloomTargets' => $bloomTargets,
            'existingTopics' => $coverage['topics'],
            'knowledgePoints' => $knowledgePoints,
            'exemplars' => $exemplars,
        ])->render();
    }

    private function fetchExemplars(Skill $skill, Level $level, int $part): array
    {
        return Question::with('knowledgePoints')
            ->where('skill', $skill)
            ->where('level', $level)
            ->where('part', $part)
            ->whereNotNull('verified_at')
            ->orderByDesc('verified_at')
            ->limit(3)
            ->get()
            ->map(fn (Question $q) => [
                'topic' => $q->topic,
                'bloom_level' => $q->bloom_level?->value,
                'content' => $q->content,
                'kp_names' => $q->knowledgePoints->pluck('name')->toArray(),
            ])
            ->toArray();
    }

    /**
     * @return list<array>
     */
    private function validate(array $questions, Skill $skill, Level $level, int $part, array $coverage): array
    {
        $validKpNames = KnowledgePoint::pluck('name')
            ->map(fn ($n) => mb_strtolower(trim($n)))
            ->toArray();

        $validBlooms = collect(BloomLevel::cases())->map(fn ($b) => $b->value)->toArray();
        $existingTopics = array_map('mb_strtolower', $coverage['topics']);
        $validated = [];

        foreach ($questions as $i => $q) {
            $errors = [];

            if (empty($q['prompt'] ?? '')) {
                $errors[] = 'empty prompt';
            }

            if (empty($q['topic'] ?? '')) {
                $errors[] = 'empty topic';
            }

            if (! in_array($q['bloom_level'] ?? '', $validBlooms)) {
                $errors[] = "invalid bloom_level: {$q['bloom_level']}";
            }

            if (in_array(mb_strtolower(trim($q['topic'] ?? '')), $existingTopics)) {
                $errors[] = "duplicate topic: {$q['topic']}";
            }

            $kpNames = $q['knowledge_points'] ?? [];
            $invalidKps = [];
            foreach ($kpNames as $name) {
                $normalized = mb_strtolower(trim(preg_replace('/\s*\([^)]*\)\s*$/', '', $name)));
                if (! in_array($normalized, $validKpNames)) {
                    $invalidKps[] = $name;
                }
            }
            if (! empty($invalidKps)) {
                $errors[] = 'invalid KPs: '.implode(', ', $invalidKps);
            }

            if (count($kpNames) < 2) {
                $errors[] = 'too few knowledge points (min 2)';
            }

            if (! empty($errors)) {
                $this->warn('  Q'.($i + 1).' REJECTED: '.implode('; ', $errors));
            } else {
                $q['knowledge_points'] = array_map(
                    fn ($name) => trim(preg_replace('/\s*\([^)]*\)\s*$/', '', $name)),
                    $kpNames,
                );
                $validated[] = $q;
                $this->line('  Q'.($i + 1)." OK: [{$q['bloom_level']}] {$q['topic']}");
            }
        }

        return $validated;
    }

    private function saveToDB(array $questions, Skill $skill, Level $level, int $part): void
    {
        $kpMap = KnowledgePoint::pluck('id', 'name');
        $saved = 0;

        foreach ($questions as $q) {
            $question = Question::create([
                'skill' => $skill,
                'level' => $level,
                'part' => $part,
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
        }

        $this->info("Saved {$saved} questions to DB.");
    }

    private function partsForSkill(Skill $skill): array
    {
        return match ($skill) {
            Skill::Writing => ['1', '2'],
            Skill::Speaking => ['1', '2', '3'],
            default => ['1'],
        };
    }
}
