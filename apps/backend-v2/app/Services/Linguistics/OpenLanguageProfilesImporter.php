<?php

declare(strict_types=1);

namespace App\Services\Linguistics;

use Illuminate\Console\OutputStyle;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

final class OpenLanguageProfilesImporter
{
    private const VENDOR_PATH = 'reference/linguistics/vendor/open-language-profiles';

    /** @return array{vocabulary: int, grammar_patterns: int} */
    public function import(OutputStyle $output): array
    {
        $vocabularyPath = $this->vendorPath('cefr-j-vocabulary-profile-1.5.csv');
        $octanovePath = $this->vendorPath('octanove-vocabulary-profile-c1c2-1.0.csv');
        $grammarPath = $this->vendorPath('cefr-j-grammar-profile-20180315.csv');

        $vocabularyCount = $this->importVocabulary($vocabularyPath, 'cefr_j_wordlist_1_5', $output)
            + $this->importVocabulary($octanovePath, 'octanove_c1c2_1_0', $output);

        $grammarCount = 0;
        if (Schema::hasTable('grammar_patterns')) {
            $grammarCount = $this->importGrammar($grammarPath, $output);
        } else {
            $output->warning('Skipping grammar profile import: grammar_patterns table does not exist. Run migrations first.');
        }

        return ['vocabulary' => $vocabularyCount, 'grammar_patterns' => $grammarCount];
    }

    private function vendorPath(string $filename): string
    {
        $path = database_path(self::VENDOR_PATH.'/'.$filename);
        if (! is_file($path)) {
            throw new \RuntimeException("Missing OLP vendor fixture: {$path}");
        }

        return $path;
    }

    private function importVocabulary(string $path, string $source, OutputStyle $output): int
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return 0;
        }

        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);

            return 0;
        }

        $processed = 0;
        $now = now();
        while (($row = fgetcsv($handle)) !== false) {
            $data = $this->combineCsv($header, $row);
            $word = $this->normalizeHeadword((string) ($data['headword'] ?? ''));
            $level = $this->normalizeLevel((string) ($data['CEFR'] ?? ''));
            if ($word === '' || $level === null) {
                continue;
            }

            DB::table('cefr_vocabulary')->updateOrInsert(
                ['word' => $word],
                [
                    'lemmatized' => $word,
                    'level' => $level,
                    'pos' => $this->normalizePos((string) ($data['pos'] ?? '')),
                    'topic' => $this->topic($data),
                    'source' => $source,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
            $processed++;
        }

        fclose($handle);
        $output->writeln("  {$source}: {$processed} rows processed");

        return $processed;
    }

    private function importGrammar(string $path, OutputStyle $output): int
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return 0;
        }

        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);

            return 0;
        }

        $processed = 0;
        $now = now();
        while (($row = fgetcsv($handle)) !== false) {
            $data = $this->combineCsv($header, $row);
            $key = Str::slug((string) ($data['Shorthand Code'] ?? $data['ID'] ?? ''));
            $label = trim((string) ($data['Grammatical Item'] ?? ''));
            $level = $this->normalizeLevel((string) ($data['FREQ*DISP'] ?? $data['CEFR-J Level'] ?? $data['Core Inventory'] ?? ''));
            if ($key === '' || $label === '' || $level === null) {
                continue;
            }

            DB::table('grammar_patterns')->updateOrInsert(
                ['key' => 'olp_'.$key],
                [
                    'label' => $label,
                    'level' => $level,
                    'category' => $this->grammarCategory((string) ($data['Shorthand Code'] ?? '')),
                    'pattern_type' => 'profile_item',
                    'pattern' => $label,
                    'skill' => 'writing',
                    'weight' => 1,
                    'source' => 'cefr_j_grammar_profile_20180315',
                    'is_active' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
            $processed++;
        }

        fclose($handle);
        $output->writeln("  cefr_j_grammar_profile_20180315: {$processed} rows processed");

        return $processed;
    }

    /** @param list<string> $header @param list<string|null> $row @return array<string, string|null> */
    private function combineCsv(array $header, array $row): array
    {
        $data = [];
        foreach ($header as $index => $key) {
            $data[(string) $key] = $row[$index] ?? null;
        }

        return $data;
    }

    private function normalizeHeadword(string $headword): string
    {
        $headword = Str::of($headword)->lower()->trim()->replaceMatches('/\s+/', ' ')->toString();
        if ($headword === '' || str_contains($headword, '?')) {
            return '';
        }

        return str_replace(['/', '／'], '/', $headword);
    }

    private function normalizeLevel(string $level): ?string
    {
        if (preg_match('/\b(A1|A2|B1|B2|C1|C2)\b/i', $level, $matches) !== 1) {
            return null;
        }

        return strtoupper($matches[1]);
    }

    private function normalizePos(string $pos): string
    {
        return Str::of($pos)->lower()->trim()->replace('be-verb', 'verb')->replace('modal auxiliary', 'modal')->toString();
    }

    /** @param array<string, string|null> $data */
    private function topic(array $data): string
    {
        foreach (['CoreInventory 1', 'CoreInventory 2', 'Threshold'] as $key) {
            $value = trim((string) ($data[$key] ?? ''));
            if ($value !== '') {
                return Str::limit($value, 50, '');
            }
        }

        return 'general';
    }

    private function grammarCategory(string $code): string
    {
        $prefix = Str::of($code)->before('.')->lower()->toString();

        return match ($prefix) {
            'pass' => 'voice',
            'ta' => 'tense_aspect',
            'md' => 'modal_auxiliary',
            'prel', 'prelo', 'rbrel' => 'relative_clause',
            'cl' => 'subordination',
            'comp' => 'comparison',
            'phv' => 'phrasal_verb',
            default => $prefix !== '' ? $prefix : 'grammar_profile',
        };
    }
}
