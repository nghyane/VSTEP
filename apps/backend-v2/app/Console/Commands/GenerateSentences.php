<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Ai\Agents\ContentGenerator;
use App\Models\SentenceItem;
use App\Models\SentenceTopic;
use Illuminate\Console\Command;
use Illuminate\Process\Pool;
use Illuminate\Support\Facades\Process;

class GenerateSentences extends Command
{
    protected $signature = 'sentences:generate
        {--topic= : Generate for a specific topic only}
        {--dry-run : Print results without saving}
        {--sequential : Run topics one by one instead of parallel}';

    protected $description = 'Generate VSTEP sentence patterns using AI (12 topics, 240 sentences)';

    public const TOPICS = [
        ['name' => 'Câu diễn đạt quan điểm', 'description' => 'Các mẫu câu nêu ý kiến, quan điểm cá nhân trong bài viết.', 'icon_key' => 'opinion'],
        ['name' => 'Câu nguyên nhân – kết quả', 'description' => 'Các mẫu câu diễn đạt mối quan hệ nhân quả.', 'icon_key' => 'cause-effect'],
        ['name' => 'Câu so sánh – đối chiếu', 'description' => 'Các mẫu câu so sánh, đối chiếu hai đối tượng hoặc quan điểm.', 'icon_key' => 'comparison'],
        ['name' => 'Câu tổng kết – kết luận', 'description' => 'Các mẫu câu dùng để kết luận, tổng kết bài viết.', 'icon_key' => 'conclusion'],
        ['name' => 'Câu vấn đề – giải pháp', 'description' => 'Các mẫu câu nêu vấn đề và đề xuất giải pháp.', 'icon_key' => 'problem-solution'],
        ['name' => 'Câu dẫn chứng – ví dụ', 'description' => 'Các mẫu câu dẫn chứng, ví dụ minh họa cho luận điểm.', 'icon_key' => 'example-evidence'],
        ['name' => 'Câu chuyển ý (Transition)', 'description' => 'Các mẫu câu dùng để chuyển ý, nối các đoạn văn.', 'icon_key' => 'transition'],
        ['name' => 'Câu nhượng bộ (Concession)', 'description' => 'Các mẫu câu nhượng bộ, thừa nhận mặt đối lập trước khi đưa ra ý chính.', 'icon_key' => 'concession'],
        ['name' => 'Câu điều kiện (Conditional)', 'description' => 'Các mẫu câu điều kiện dùng trong lập luận.', 'icon_key' => 'conditional'],
        ['name' => 'Câu bị động & đảo ngữ', 'description' => 'Các mẫu câu bị động và đảo ngữ nâng cao.', 'icon_key' => 'passive-inversion'],
        ['name' => 'Câu mở bài (Introduction)', 'description' => 'Các mẫu câu dùng để mở bài trong bài viết VSTEP.', 'icon_key' => 'introduction'],
        ['name' => 'Câu liên kết đoạn (Cohesion)', 'description' => 'Các mẫu câu liên kết đoạn, tạo sự mạch lạc cho bài viết.', 'icon_key' => 'cohesion'],
    ];

    private const TARGET_PER_TOPIC = 20;

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
        $this->info('Generating sentences for '.count(self::TOPICS).' topics in parallel...');

        $topicsToRun = [];
        foreach (self::TOPICS as $t) {
            $topic = SentenceTopic::where('name', $t['name'])->first();
            $existing = $topic ? $topic->items()->count() : 0;
            if ($existing >= self::TARGET_PER_TOPIC) {
                $this->line("  ✓ {$t['name']} — already has {$existing} sentences");

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
                    'cd %s && php artisan sentences:generate --topic=%s',
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

        $total = SentenceItem::count();
        $this->info("Done. Total sentences in DB: {$total}");

        return self::SUCCESS;
    }

    private function generateSingle(string $topicFilter): int
    {
        $topics = collect(self::TOPICS)
            ->filter(fn ($t) => str_contains(mb_strtolower($t['name']), mb_strtolower($topicFilter)))
            ->values()->all();

        if (empty($topics)) {
            $this->error("Topic matching '{$topicFilter}' not found.");

            return self::FAILURE;
        }

        return $this->generateSequential($topics);
    }

    private function generateSequential(array $topics): int
    {
        $totalSaved = 0;

        foreach ($topics as $index => $topicConfig) {
            $this->info(($index + 1).'/'.count($topics).": {$topicConfig['name']}");

            $topic = SentenceTopic::where('name', $topicConfig['name'])->first();
            $existingSentences = $topic ? $topic->items()->pluck('sentence')->toArray() : [];
            $delta = self::TARGET_PER_TOPIC - count($existingSentences);

            if ($delta <= 0) {
                $this->line('  Already has '.count($existingSentences).' sentences, skipping.');

                continue;
            }

            $this->line('  Existing: '.count($existingSentences)." → generating {$delta} more");

            $exemplars = $topic
                ? $topic->items()->limit(3)->get(['sentence', 'translation', 'explanation', 'writing_usage', 'difficulty'])->toArray()
                : [];

            $prompt = view('generation.sentence-system', [
                'topic' => $topicConfig,
                'targetCount' => $delta,
                'existingSentences' => $existingSentences,
                'exemplars' => $exemplars,
            ])->render();

            $agent = new ContentGenerator($prompt);
            $agent->prompt("Generate {$delta} model sentences for the pattern '{$topicConfig['name']}'.");

            $sentences = $agent->getResult();
            if (! $sentences) {
                $this->warn('  Agent returned no results, skipping.');

                continue;
            }

            $validated = $this->validate($sentences, $existingSentences);
            $this->info('  Validated: '.count($validated).' / '.count($sentences));

            if (empty($validated)) {
                $this->warn('  All sentences failed validation, skipping.');

                continue;
            }

            if ($this->option('dry-run')) {
                foreach ($validated as $s) {
                    $this->line("    [{$s['difficulty']}] {$s['sentence']}");
                }

                continue;
            }

            $topicIndex = collect(self::TOPICS)->search(fn ($t) => $t['name'] === $topicConfig['name']);
            $saved = $this->saveToDB($topicConfig, $validated, (int) $topicIndex, count($existingSentences));
            $totalSaved += $saved;
            $this->info("  Saved {$saved} sentences.");
        }

        $this->info($this->option('dry-run')
            ? 'Dry run complete.'
            : "Done. Saved: {$totalSaved} sentences.");

        return self::SUCCESS;
    }

    /**
     * @return list<array>
     */
    private function validate(array $sentences, array $existingSentences): array
    {
        $existingLower = array_map('mb_strtolower', $existingSentences);
        $seenSentences = [];
        $validated = [];
        $validDifficulties = ['easy', 'medium', 'hard'];

        foreach ($sentences as $i => $s) {
            $errors = [];

            $sentence = trim($s['sentence'] ?? '');
            if ($sentence === '') {
                $errors[] = 'empty sentence';
            }

            if (in_array(mb_strtolower($sentence), $existingLower)) {
                $errors[] = 'duplicate (exists in DB)';
            }

            if (in_array(mb_strtolower($sentence), $seenSentences)) {
                $errors[] = 'duplicate (in batch)';
            }

            if (empty($s['translation'] ?? '')) {
                $errors[] = 'empty translation';
            }

            if (empty($s['explanation'] ?? '')) {
                $errors[] = 'empty explanation';
            }

            if (empty($s['writing_usage'] ?? '')) {
                $errors[] = 'empty writing_usage';
            }

            if (! in_array($s['difficulty'] ?? '', $validDifficulties)) {
                $errors[] = "invalid difficulty: {$s['difficulty']}";
            }

            if (! empty($errors)) {
                $this->warn('    S'.($i + 1).' REJECTED: '.implode('; ', $errors));
            } else {
                $seenSentences[] = mb_strtolower($sentence);
                $validated[] = $s;
            }
        }

        return $validated;
    }

    private function saveToDB(array $topicConfig, array $sentences, int $topicIndex, int $existingCount): int
    {
        $topic = SentenceTopic::firstOrCreate(
            ['name' => $topicConfig['name']],
            [
                'description' => $topicConfig['description'],
                'icon_key' => $topicConfig['icon_key'] ?? null,
                'sort_order' => $topicIndex + 1,
            ],
        );

        $saved = 0;

        foreach ($sentences as $i => $s) {
            SentenceItem::create([
                'topic_id' => $topic->id,
                'sentence' => trim($s['sentence']),
                'audio_url' => null,
                'translation' => $s['translation'],
                'explanation' => $s['explanation'] ?? '',
                'writing_usage' => $s['writing_usage'] ?? '',
                'difficulty' => $s['difficulty'],
                'sort_order' => $existingCount + $i + 1,
            ]);
            $saved++;
        }

        return $saved;
    }
}
