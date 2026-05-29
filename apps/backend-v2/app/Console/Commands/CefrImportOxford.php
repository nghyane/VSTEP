<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Import full Oxford 3000/5000 word lists from GitHub CSV.
 *
 * Source: winterdl/oxford-5000-vocabulary-audio-definition
 * Format: index,word,type,cefr,phon_br,phon_am,definition,example,uk_mp3,us_mp3
 *
 * Idempotent: skips already-imported words.
 */
class CefrImportOxford extends Command
{
    protected $signature = 'cefr:import-oxford
        {--csv= : Local CSV file path (downloads from GitHub if not provided)}';

    protected $description = 'Import full Oxford 3000/5000 CEFR vocabulary from CSV';

    private const CSV_URL = 'https://raw.githubusercontent.com/winterdl/oxford-5000-vocabulary-audio-definition/main/data/oxford_3000.csv';

    private const CSV_URL_5000 = 'https://raw.githubusercontent.com/winterdl/oxford-5000-vocabulary-audio-definition/main/data/oxford_5000.csv';

    public function handle(): int
    {
        $this->info('Importing Oxford 3000/5000 CEFR vocabulary...');

        $total = 0;
        $total += $this->importCsv(self::CSV_URL, 'oxford_3000');
        $total += $this->importCsv(self::CSV_URL_5000, 'oxford_5000');

        $count = DB::table('cefr_vocabulary')->count();
        $this->info("Imported {$total} new words. Total cefr_vocabulary: {$count}");

        $byLevel = DB::table('cefr_vocabulary')
            ->select('level', DB::raw('count(*) as cnt'))
            ->groupBy('level')->orderBy('level')->get();

        foreach ($byLevel as $row) {
            $this->line("  {$row->level}: {$row->cnt} words");
        }

        return self::SUCCESS;
    }

    private function importCsv(string $url, string $source): int
    {
        $csvPath = $this->option('csv') ?? $this->downloadCsv($url);
        if ($csvPath === null || ! file_exists($csvPath)) {
            $this->error("CSV not found: {$url}");

            return 0;
        }

        $handle = fopen($csvPath, 'r');
        if ($handle === false) {
            return 0;
        }

        // Skip header row
        fgetcsv($handle);

        $existing = DB::table('cefr_vocabulary')->pluck('word')->map(fn ($w) => strtolower($w))->unique()->toArray();

        $rows = [];
        $now = now();
        $imported = 0;
        $skipped = 0;

        while (($data = fgetcsv($handle)) !== false) {
            $word = strtolower(trim((string) ($data[1] ?? '')));
            $type = strtolower(trim((string) ($data[2] ?? '')));
            $cefr = strtoupper(trim((string) ($data[3] ?? '')));

            // Skip empty, multi-word phrases, function words
            if ($word === '' || str_contains($word, ' ')) {
                continue;
            }

            // Normalize CEFR level
            $cefr = match ($cefr) {
                'A1', 'A2', 'B1', 'B2', 'C1' => $cefr,
                default => null,
            };
            if ($cefr === null) {
                continue;
            }

            if (in_array($word, $existing, true)) {
                $skipped++;

                continue;
            }

            // Deduplicate by word (same word may appear as different POS)
            $rows[$word] = [
                'word' => $word,
                'level' => $cefr,
                'pos' => $type,
                'topic' => 'general',
                'source' => $source,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $imported++;
        }

        fclose($handle);

        if ($rows !== []) {
            foreach (array_chunk(array_values($rows), 500) as $chunk) {
                DB::table('cefr_vocabulary')->insert($chunk);
            }
        }

        $this->info("  {$source}: {$imported} new, {$skipped} duplicates skipped");

        return $imported;
    }

    private function downloadCsv(string $url): ?string
    {
        $this->info("  Downloading {$url}...");

        $content = @file_get_contents($url);
        if ($content === false) {
            $this->warn('  Download failed');

            return null;
        }

        $path = storage_path('app/cefr_import_'.basename($url));
        file_put_contents($path, $content);

        return $path;
    }
}
