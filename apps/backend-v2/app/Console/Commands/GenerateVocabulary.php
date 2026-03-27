<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Ai\Agents\ContentGenerator;
use App\Models\VocabularyTopic;
use App\Models\VocabularyWord;
use Illuminate\Console\Command;
use Illuminate\Process\Pool;
use Illuminate\Support\Facades\Process;

class GenerateVocabulary extends Command
{
    protected $signature = 'vocabulary:generate
        {--topic= : Generate for a specific topic only}
        {--dry-run : Print results without saving}
        {--sequential : Run topics one by one instead of parallel}';

    protected $description = 'Generate VSTEP vocabulary using AI (16 topics, ~420 words)';

    /**
     * Topic registry: 16 exam-relevant topics based on VSTEP research.
     * Tier 1 (30 words): high-frequency in exam papers.
     * Tier 2 (25 words): regularly appear in Writing/Speaking.
     * Tier 3 (20 words): supplementary but still exam-relevant.
     */
    public const TOPICS = [
        ['name' => 'Education', 'description' => 'Từ vựng về giáo dục, trường học, học tập', 'target' => 30],
        ['name' => 'Work & Career', 'description' => 'Từ vựng về công việc, sự nghiệp, doanh nghiệp', 'target' => 30],
        ['name' => 'Health & Medicine', 'description' => 'Từ vựng về sức khỏe, y tế, lối sống', 'target' => 30],
        ['name' => 'Technology', 'description' => 'Từ vựng về công nghệ, internet, thiết bị', 'target' => 30],
        ['name' => 'Environment', 'description' => 'Từ vựng về môi trường, khí hậu, thiên nhiên', 'target' => 30],
        ['name' => 'Travel & Tourism', 'description' => 'Từ vựng về du lịch, giao thông, lưu trú', 'target' => 30],
        ['name' => 'Family & Relationships', 'description' => 'Từ vựng về gia đình, mối quan hệ, xã hội', 'target' => 30],
        ['name' => 'Society & Culture', 'description' => 'Từ vựng về xã hội, văn hóa, truyền thống', 'target' => 30],
        ['name' => 'Media & Communication', 'description' => 'Từ vựng về truyền thông, báo chí, mạng xã hội', 'target' => 25],
        ['name' => 'Economics & Finance', 'description' => 'Từ vựng về kinh tế, tài chính, thương mại', 'target' => 25],
        ['name' => 'Housing & Urban Life', 'description' => 'Từ vựng về nhà ở, đô thị, quy hoạch', 'target' => 25],
        ['name' => 'Transportation', 'description' => 'Từ vựng về giao thông, phương tiện, hạ tầng', 'target' => 25],
        ['name' => 'Food & Nutrition', 'description' => 'Từ vựng về thực phẩm, dinh dưỡng, ẩm thực', 'target' => 20],
        ['name' => 'Sports & Recreation', 'description' => 'Từ vựng về thể thao, giải trí, hoạt động', 'target' => 20],
        ['name' => 'Science & Research', 'description' => 'Từ vựng về khoa học, nghiên cứu, phát minh', 'target' => 20],
        ['name' => 'Law & Government', 'description' => 'Từ vựng về pháp luật, chính phủ, chính sách', 'target' => 20],
    ];

    public function handle(): int
    {
        $topicFilter = $this->option('topic');

        if ($topicFilter) {
            return $this->generateSingle($topicFilter);
        }

        if ($this->option('sequential') || $this->option('dry-run')) {
            return $this->generateSequential(self::TOPICS);
        }

        return $this->generateParallel();
    }

    private function generateParallel(): int
    {
        $this->info('Generating vocabulary for '.count(self::TOPICS).' topics in parallel...');

        $topicsToRun = [];
        foreach (self::TOPICS as $t) {
            $topic = VocabularyTopic::where('name', $t['name'])->first();
            $existing = $topic ? $topic->words()->count() : 0;
            if ($existing >= $t['target']) {
                $this->line("  ✓ {$t['name']} — already has {$existing} words");

                continue;
            }
            $topicsToRun[] = $t;
        }

        if (empty($topicsToRun)) {
            $this->info('All topics already complete.');

            return self::SUCCESS;
        }

        $this->info(count($topicsToRun).' topics need generation.');

        $results = Process::pool(function (Pool $pool) use ($topicsToRun) {
            foreach ($topicsToRun as $t) {
                $pool->timeout(300)->command(sprintf(
                    'cd %s && php artisan vocabulary:generate --topic=%s',
                    base_path(),
                    escapeshellarg($t['name']),
                ));
            }
        })->start()->wait();

        foreach ($results as $i => $result) {
            $name = $topicsToRun[$i]['name'];
            if ($result->successful()) {
                $this->info("  ✓ {$name}");
                $this->line($result->output());
            } else {
                $this->error("  ✗ {$name}");
                $this->line($result->errorOutput());
            }
        }

        $total = VocabularyWord::count();
        $this->info("Done. Total words in DB: {$total}");

        return self::SUCCESS;
    }

    private function generateSingle(string $topicFilter): int
    {
        $topics = collect(self::TOPICS)
            ->filter(fn ($t) => mb_strtolower($t['name']) === mb_strtolower($topicFilter))
            ->values()->all();

        if (empty($topics)) {
            $this->error("Topic '{$topicFilter}' not found.");

            return self::FAILURE;
        }

        return $this->generateSequential($topics);
    }

    private function generateSequential(array $topics): int
    {
        $totalSaved = 0;

        foreach ($topics as $index => $topicConfig) {
            $this->info(($index + 1).'/'.count($topics).": {$topicConfig['name']} (target: {$topicConfig['target']})");

            $topic = VocabularyTopic::where('name', $topicConfig['name'])->first();
            $existingWords = $topic ? $topic->words()->pluck('word')->toArray() : [];
            $delta = $topicConfig['target'] - count($existingWords);

            if ($delta <= 0) {
                $this->line('  Already has '.count($existingWords).' words, skipping.');

                continue;
            }

            $this->line('  Existing: '.count($existingWords)." → generating {$delta} more");

            $exemplars = $topic
                ? $topic->words()->limit(3)->get(['word', 'phonetic', 'part_of_speech', 'definition', 'examples'])->toArray()
                : [];

            $prompt = view('generation.vocabulary-system', [
                'topic' => $topicConfig,
                'targetCount' => $delta,
                'existingWords' => $existingWords,
                'exemplars' => $exemplars,
            ])->render();

            $agent = new ContentGenerator($prompt);
            $agent->prompt("Generate {$delta} vocabulary words for the topic '{$topicConfig['name']}'.");

            $words = $agent->getResult();
            if (! $words) {
                $this->warn('  Agent returned no results, skipping.');

                continue;
            }

            $validated = $this->validate($words, $existingWords);
            $this->info('  Validated: '.count($validated).' / '.count($words));

            if (empty($validated)) {
                $this->warn('  All words failed validation, skipping.');

                continue;
            }

            if ($this->option('dry-run')) {
                foreach ($validated as $w) {
                    $this->line("    {$w['word']} ({$w['part_of_speech']}) — {$w['definition']}");
                }

                continue;
            }

            $saved = $this->saveToDB($topicConfig, $validated, count($existingWords));
            $totalSaved += $saved;
            $this->info("  Saved {$saved} words.");
        }

        $this->info($this->option('dry-run')
            ? 'Dry run complete.'
            : "Done. Saved: {$totalSaved} words.");

        return self::SUCCESS;
    }

    /**
     * @return list<array>
     */
    private function validate(array $words, array $existingWords): array
    {
        $existingLower = array_map('mb_strtolower', $existingWords);
        $seenWords = [];
        $validated = [];
        $validPos = ['noun', 'verb', 'adjective', 'adverb', 'phrase'];

        foreach ($words as $i => $w) {
            $errors = [];

            $word = trim($w['word'] ?? '');
            if ($word === '') {
                $errors[] = 'empty word';
            }

            if (in_array(mb_strtolower($word), $existingLower)) {
                $errors[] = 'duplicate (exists in DB)';
            }

            if (in_array(mb_strtolower($word), $seenWords)) {
                $errors[] = 'duplicate (in batch)';
            }

            if (! in_array($w['part_of_speech'] ?? '', $validPos)) {
                $errors[] = "invalid part_of_speech: {$w['part_of_speech']}";
            }

            if (empty($w['definition'] ?? '')) {
                $errors[] = 'empty definition';
            }

            $examples = $w['examples'] ?? [];
            if (! is_array($examples) || count($examples) < 2) {
                $errors[] = 'need at least 2 examples';
            }

            $phonetic = $w['phonetic'] ?? '';
            if ($phonetic !== '' && ! preg_match('#^/.*/$#', $phonetic)) {
                $errors[] = "invalid IPA format: {$phonetic}";
            }

            if (! empty($errors)) {
                $this->warn('    W'.($i + 1)." REJECTED ({$word}): ".implode('; ', $errors));
            } else {
                $seenWords[] = mb_strtolower($word);
                $validated[] = $w;
            }
        }

        return $validated;
    }

    private function saveToDB(array $topicConfig, array $words, int $existingCount): int
    {
        $topic = VocabularyTopic::firstOrCreate(
            ['name' => $topicConfig['name']],
            [
                'description' => $topicConfig['description'],
                'sort_order' => collect(self::TOPICS)->search(fn ($t) => $t['name'] === $topicConfig['name']) + 1,
            ],
        );

        $saved = 0;

        foreach ($words as $i => $w) {
            VocabularyWord::create([
                'topic_id' => $topic->id,
                'word' => trim($w['word']),
                'phonetic' => $w['phonetic'] ?? null,
                'audio_url' => null,
                'part_of_speech' => $w['part_of_speech'],
                'definition' => $w['definition'],
                'explanation' => $w['explanation'] ?? '',
                'examples' => array_slice($w['examples'], 0, 2),
                'sort_order' => $existingCount + $i + 1,
            ]);
            $saved++;
        }

        return $saved;
    }
}
