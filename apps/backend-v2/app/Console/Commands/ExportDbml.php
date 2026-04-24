<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ExportDbml extends Command
{
    protected $signature = 'db:dbml
        {--split : Generate separate files per domain}
        {--dictionary : Generate markdown data dictionary}
        {--output=docs/erd : Output directory}';

    protected $description = 'Export database schema to DBML format for dbdiagram.io';

    /** Domain groupings — edit to match your project */
    private array $domains = [
        'auth_profile' => ['users', 'refresh_tokens', 'profiles', 'profile_onboarding_responses',
            'profile_daily_activity', 'profile_streak_state', 'profile_reset_events', 'notifications'],
        'exam_content' => ['exams', 'exam_versions', 'exam_version_listening_sections', 'exam_version_listening_items',
            'exam_version_reading_passages', 'exam_version_reading_items',
            'exam_version_writing_tasks', 'exam_version_speaking_parts'],
        'exam_session' => ['exam_sessions', 'exam_mcq_answers', 'exam_listening_play_log',
            'exam_writing_submissions', 'exam_speaking_submissions',
            'grading_jobs', 'writing_grading_results', 'speaking_grading_results'],
        'practice' => ['practice_sessions', 'practice_mcq_answers',
            'practice_listening_exercises', 'practice_listening_questions',
            'practice_reading_exercises', 'practice_reading_questions',
            'practice_writing_prompts', 'practice_writing_submissions',
            'practice_writing_outline_sections', 'practice_writing_template_sections', 'practice_writing_sample_markers',
            'practice_speaking_tasks', 'practice_speaking_submissions',
            'practice_speaking_drills', 'practice_speaking_drill_sentences', 'practice_speaking_drill_attempts'],
        'grammar_vocab' => ['grammar_points', 'grammar_structures', 'grammar_examples', 'grammar_common_mistakes',
            'grammar_exercises', 'grammar_vstep_tips',
            'grammar_point_functions', 'grammar_point_levels', 'grammar_point_tasks',
            'profile_grammar_mastery', 'practice_grammar_attempts',
            'vocab_topics', 'vocab_topic_tasks', 'vocab_words', 'vocab_exercises',
            'practice_vocab_exercise_attempts', 'practice_vocab_reviews', 'profile_vocab_srs_states'],
        'course_teacher' => ['courses', 'course_schedule_items', 'course_enrollments',
            'teacher_slots', 'teacher_bookings', 'teacher_reviews'],
        'wallet_promo' => ['coin_transactions', 'wallet_topup_packages', 'wallet_topup_orders',
            'promo_codes', 'promo_code_redemptions', 'system_configs'],
    ];

    public function handle(): int
    {
        $outDir = base_path($this->option('output'));
        if (! is_dir($outDir)) {
            mkdir($outDir, 0755, true);
        }

        $schema = $this->introspect();

        if ($this->option('split')) {
            $this->exportOverview($schema, $outDir);
            $this->exportDomains($schema, $outDir);
        } else {
            $this->exportFull($schema, $outDir);
        }

        if ($this->option('dictionary')) {
            $this->exportDictionary($schema, $outDir);
        }

        return self::SUCCESS;
    }

    /** Read full schema from DB */
    private function introspect(): array
    {
        $tables = [];
        $tableNames = array_map(
            fn (string $name) => str_contains($name, '.') ? Str::afterLast($name, '.') : $name,
            Schema::getTableListing(),
        );

        foreach ($tableNames as $tableName) {
            if ($tableName === 'migrations') {
                continue;
            }

            $columns = Schema::getColumns($tableName);
            $indexes = Schema::getIndexes($tableName);
            $foreignKeys = Schema::getForeignKeys($tableName);

            $pkCols = [];
            foreach ($indexes as $idx) {
                if ($idx['primary'] ?? false) {
                    $pkCols = $idx['columns'];
                }
            }

            $tables[$tableName] = [
                'columns' => $columns,
                'pk' => $pkCols,
                'fks' => $foreignKeys,
            ];
        }

        return $tables;
    }

    private function shortType(string $type): string
    {
        return str_replace(
            ['character varying', 'timestamp(0) without time zone', 'time(0) without time zone'],
            ['varchar', 'timestamp', 'time'],
            $type,
        );
    }

    private function tableToDbml(string $name, array $table, bool $pkOnly = false): string
    {
        $lines = ["Table {$name} {"];

        foreach ($table['columns'] as $col) {
            if ($pkOnly && ! in_array($col['name'], $table['pk'])) {
                continue;
            }

            $type = $this->shortType($col['type']);
            $settings = [];

            if (in_array($col['name'], $table['pk'])) {
                $settings[] = 'pk';
            }
            if (! ($col['nullable'] ?? true)) {
                $settings[] = 'not null';
            }
            if ($col['auto_increment'] ?? false) {
                $settings[] = 'increment';
            }
            if (($col['default'] ?? null) === 'CURRENT_TIMESTAMP') {
                $settings[] = 'default: `now()`';
            }

            $s = $settings ? ' ['.implode(', ', $settings).']' : '';
            $lines[] = "  {$col['name']} {$type}{$s}";
        }

        $lines[] = '}';

        return implode("\n", $lines);
    }

    private function refsToDbml(string $tableName, array $fks): string
    {
        $lines = [];
        foreach ($fks as $fk) {
            $srcCol = $fk['columns'][0];
            $dstTable = $fk['foreign_table'];
            $dstCol = $fk['foreign_columns'][0];
            $lines[] = "Ref: {$tableName}.{$srcCol} > {$dstTable}.{$dstCol}";
        }

        return implode("\n", $lines);
    }

    private function exportFull(array $schema, string $outDir): void
    {
        $lines = ['// VSTEP Database ERD', '// Generated: '.now()->toDateString(), ''];

        // Topological order: parent tables first, children after
        $sorted = $this->topologicalSort($schema);

        // Emit tables grouped by domain, each group in topo order
        $tableToDomain = [];
        foreach ($this->domains as $domain => $tables) {
            foreach ($tables as $t) {
                $tableToDomain[$t] = $domain;
            }
        }

        foreach ($this->domains as $group => $tables) {
            $lines[] = "// --- {$group} ---";
            $lines[] = '';
            // Tables in this domain, sorted by topo order
            $domainTables = array_filter($sorted, fn ($t) => ($tableToDomain[$t] ?? '') === $group);
            foreach ($domainTables as $name) {
                if (isset($schema[$name])) {
                    $lines[] = $this->tableToDbml($name, $schema[$name]);
                    $lines[] = '';
                }
            }
        }

        $lines[] = '// Relationships';
        foreach ($sorted as $name) {
            if (! isset($schema[$name])) {
                continue;
            }
            $refs = $this->refsToDbml($name, $schema[$name]['fks']);
            if ($refs) {
                $lines[] = $refs;
            }
        }

        $lines[] = '';
        foreach ($this->domains as $group => $tables) {
            $lines[] = "TableGroup {$group} {";
            foreach ($tables as $t) {
                if (isset($schema[$t])) {
                    $lines[] = "  {$t}";
                }
            }
            $lines[] = '}';
            $lines[] = '';
        }

        $path = "{$outDir}/vstep-erd.dbml";
        file_put_contents($path, implode("\n", $lines)."\n");
        $this->info("Full ERD: {$path}");
    }

    /** Topological sort: tables with no FKs first, then their dependents */
    private function topologicalSort(array $schema): array
    {
        // Count incoming FK references for each table
        $inDegree = [];
        $deps = []; // table -> [tables it depends on]
        foreach ($schema as $name => $table) {
            $inDegree[$name] = $inDegree[$name] ?? 0;
            $deps[$name] = [];
            foreach ($table['fks'] as $fk) {
                $parent = $fk['foreign_table'];
                if ($parent !== $name && isset($schema[$parent])) {
                    $deps[$name][] = $parent;
                    $inDegree[$parent] = $inDegree[$parent] ?? 0;
                }
            }
        }

        // Kahn's algorithm
        $queue = [];
        foreach ($inDegree as $t => $d) {
            if ($d === 0) {
                $queue[] = $t;
            }
        }

        // Tables with most references first (hubs like users, profiles)
        $refCount = array_map(fn () => 0, $schema);
        foreach ($schema as $name => $table) {
            foreach ($table['fks'] as $fk) {
                $parent = $fk['foreign_table'];
                if (isset($refCount[$parent])) {
                    $refCount[$parent]++;
                }
            }
        }

        // Sort by ref count descending (most-referenced first)
        $sorted = array_keys($schema);
        usort($sorted, fn ($a, $b) => ($refCount[$b] ?? 0) <=> ($refCount[$a] ?? 0));

        return $sorted;
    }

    private function exportOverview(array $schema, string $outDir): void
    {
        $lines = ['// VSTEP Database - Overview (PK only)', '// Generated: '.now()->toDateString(), ''];

        foreach ($schema as $name => $table) {
            $lines[] = $this->tableToDbml($name, $table, pkOnly: true);
            $lines[] = '';
        }

        $lines[] = '// Relationships';
        foreach ($schema as $name => $table) {
            $refs = $this->refsToDbml($name, $table['fks']);
            if ($refs) {
                $lines[] = $refs;
            }
        }

        $lines[] = '';
        foreach ($this->domains as $group => $tables) {
            $lines[] = "TableGroup {$group} {";
            foreach ($tables as $t) {
                if (isset($schema[$t])) {
                    $lines[] = "  {$t}";
                }
            }
            $lines[] = '}';
            $lines[] = '';
        }

        $path = "{$outDir}/00-overview.dbml";
        file_put_contents($path, implode("\n", $lines)."\n");
        $this->info("Overview: {$path}");
    }

    private function exportDomains(array $schema, string $outDir): void
    {
        $tableToDomain = [];
        foreach ($this->domains as $domain => $tables) {
            foreach ($tables as $t) {
                $tableToDomain[$t] = $domain;
            }
        }

        $i = 1;
        foreach ($this->domains as $domain => $tables) {
            $tableSet = array_flip($tables);
            $lines = ['// '.Str::headline($domain), '// Generated: '.now()->toDateString(), ''];

            // Domain tables (full columns)
            foreach ($tables as $t) {
                if (! isset($schema[$t])) {
                    continue;
                }
                $lines[] = $this->tableToDbml($t, $schema[$t]);
                $lines[] = '';
            }

            // Stub tables for cross-domain FKs
            $stubs = [];
            foreach ($tables as $t) {
                if (! isset($schema[$t])) {
                    continue;
                }
                foreach ($schema[$t]['fks'] as $fk) {
                    $dst = $fk['foreign_table'];
                    if (! isset($tableSet[$dst]) && isset($schema[$dst]) && ! isset($stubs[$dst])) {
                        $stubs[$dst] = true;
                    }
                }
            }

            if ($stubs) {
                $lines[] = '// --- Referenced from other domains ---';
                $lines[] = '';
                foreach (array_keys($stubs) as $stub) {
                    $lines[] = $this->tableToDbml($stub, $schema[$stub], pkOnly: true);
                    $lines[] = '';
                }
            }

            // Refs
            $lines[] = '// Relationships';
            foreach ($tables as $t) {
                if (! isset($schema[$t])) {
                    continue;
                }
                $refs = $this->refsToDbml($t, $schema[$t]['fks']);
                if ($refs) {
                    $lines[] = $refs;
                }
            }

            $num = str_pad((string) $i, 2, '0', STR_PAD_LEFT);
            $path = "{$outDir}/{$num}-{$domain}.dbml";
            file_put_contents($path, implode("\n", $lines)."\n");
            $this->info("{$domain}: {$path}");
            $i++;
        }
    }
}
