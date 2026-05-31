<?php

declare(strict_types=1);

namespace App\Assessment\Validation;

use App\Assessment\Enums\AssessmentTaskType;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use Symfony\Component\Yaml\Yaml;

final class AssessmentGoldenSampleRepository
{
    private const ROOT = 'fixtures/writing_samples';

    private const CRITERIA = ['task_fulfillment', 'organization', 'grammar', 'vocabulary'];

    private const WEIGHTS = [
        'task_fulfillment' => 0.25,
        'organization' => 0.25,
        'grammar' => 0.25,
        'vocabulary' => 0.25,
    ];

    /** @return list<array<string,mixed>> */
    public function all(string $suite = 'benchmark'): array
    {
        if (! in_array($suite, ['benchmark', 'guardrail', 'all'], true)) {
            throw new RuntimeException("Unknown assessment validation suite: {$suite}");
        }

        $samples = [];
        foreach ($this->markdownFiles() as $path) {
            $data = $this->frontmatter($path);
            if ($data === null || ! $this->belongsToSuite($data, $suite)) {
                continue;
            }

            $samples[] = $this->sample($data, $path);
        }

        if ($samples === []) {
            throw new RuntimeException("No assessment validation samples found for suite {$suite}.");
        }

        usort($samples, fn (array $left, array $right): int => $left['label'] <=> $right['label']);

        return $samples;
    }

    /** @return list<string> */
    private function markdownFiles(): array
    {
        $root = database_path(self::ROOT);
        if (! is_dir($root)) {
            throw new RuntimeException("Writing samples directory not found: {$root}");
        }

        $files = [];
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS));
        foreach ($iterator as $file) {
            if ($file->getExtension() === 'md') {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }

    /** @return array<string,mixed>|null */
    private function frontmatter(string $path): ?array
    {
        $content = (string) file_get_contents($path);
        if (! str_starts_with($content, "---\n")) {
            return null;
        }

        $end = strpos($content, "\n---", 4);
        if ($end === false) {
            return null;
        }

        $parsed = Yaml::parse(substr($content, 4, $end - 4));

        return is_array($parsed) ? $parsed : null;
    }

    /** @param array<string,mixed> $data */
    private function belongsToSuite(array $data, string $suite): bool
    {
        return $suite === 'all' || ($data['sample_type'] ?? null) === $suite;
    }

    /**
     * @param  array<string,mixed>  $data
     * @return array<string,mixed>
     */
    private function sample(array $data, string $path): array
    {
        return match ($data['sample_type'] ?? null) {
            'benchmark' => $this->benchmark($data, $path),
            'guardrail' => $this->guardrail($data, $path),
            default => throw new RuntimeException("Assessment sample {$path} is missing valid sample_type."),
        };
    }

    /** @param array<string,mixed> $data */
    private function benchmark(array $data, string $path): array
    {
        $this->require($data, [
            'sample_id', 'label', 'source_id', 'expected_level', 'expected_level_policy',
            'source_grade', 'prompt', 'requirements', 'expert_analysis', 'criterion_grades',
        ], $path, 'Benchmark sample');

        $source = $this->source((string) $data['source_id']);

        return [
            'sample_type' => 'benchmark',
            'sample_id' => (string) $data['sample_id'],
            'label' => (string) $data['label'],
            'source_grade' => $data['source_grade'],
            'task_type' => $this->taskType((string) $source['task_type']),
            'expected_level' => (string) $data['expected_level'],
            'expected_band' => $this->sourceGradeToBand((string) $data['source_grade'], $source, $path),
            'expected_level_policy' => (string) $data['expected_level_policy'],
            'criterion_scores' => $this->criterionScores((array) $data['criterion_grades'], $source, $path),
            'weights' => self::WEIGHTS,
        ];
    }

    /** @param array<string,mixed> $data */
    private function guardrail(array $data, string $path): array
    {
        $this->require($data, [
            'sample_id', 'label', 'risk_type', 'reference_id', 'task_type',
            'expected_behavior', 'reason', 'criterion_scores',
        ], $path, 'Guardrail sample');

        $expected = (array) $data['expected_behavior'];
        $this->require($expected, ['max_level', 'max_band'], $path, 'Guardrail expected_behavior');
        $this->reference((string) $data['reference_id']);

        return [
            'sample_type' => 'guardrail',
            'sample_id' => (string) $data['sample_id'],
            'label' => (string) $data['label'],
            'risk_type' => (string) $data['risk_type'],
            'reference_id' => (string) $data['reference_id'],
            'task_type' => AssessmentTaskType::from((string) $data['task_type']),
            'expected_level' => (string) $expected['max_level'],
            'expected_level_policy' => 'max_level',
            'criterion_scores' => $this->plainScores((array) $data['criterion_scores'], $path),
            'weights' => self::WEIGHTS,
            'expected_behavior' => $expected,
            'policy' => (array) ($data['scoring_policy'] ?? []),
        ];
    }

    /**
     * @param  array<string,mixed>  $data
     * @param  list<string>  $keys
     */
    private function require(array $data, array $keys, string $path, string $label): void
    {
        foreach ($keys as $key) {
            if (! array_key_exists($key, $data) || $data[$key] === '' || $data[$key] === []) {
                throw new RuntimeException("{$label} {$path} is missing required metadata: {$key}");
            }
        }
    }

    private function taskType(string $type): AssessmentTaskType
    {
        return str_contains($type, 'Task 1')
            ? AssessmentTaskType::WritingTask1Letter
            : AssessmentTaskType::WritingTask2Essay;
    }

    /**
     * @param  array<string,int|float>  $grades
     * @param  array<string,mixed>  $source
     * @return array<string,float>
     */
    private function criterionScores(array $grades, array $source, string $path): array
    {
        $scores = [];
        foreach ($this->validatedCriteria($grades, $path, 'grade') as $criterion => $grade) {
            $scores[$criterion] = $this->sourceGradeToBand((string) $grade, $source, $path);
        }

        return $scores;
    }

    /**
     * @param  array<string,int|float>  $scores
     * @return array<string,float>
     */
    private function plainScores(array $scores, string $path): array
    {
        return array_map('floatval', $this->validatedCriteria($scores, $path, 'score'));
    }

    /**
     * @param  array<string,int|float>  $values
     * @return array<string,int|float>
     */
    private function validatedCriteria(array $values, string $path, string $label): array
    {
        foreach (self::CRITERIA as $criterion) {
            if (! array_key_exists($criterion, $values) || ! is_numeric($values[$criterion])) {
                throw new RuntimeException("Assessment sample {$path} is missing numeric criterion {$label}: {$criterion}");
            }
        }

        return array_intersect_key($values, array_flip(self::CRITERIA));
    }

    /** @param array<string,mixed> $source */
    private function sourceGradeToBand(string $grade, array $source, string $path): float
    {
        if (str_contains($grade, '-')) {
            $grades = array_map('trim', explode('-', $grade));

            return array_sum(array_map(
                fn (string $singleGrade): float => $this->sourceGradeToBand($singleGrade, $source, $path),
                $grades,
            )) / count($grades);
        }

        $map = $source['internal_validation_band_by_source_grade'] ?? [];
        if (! is_array($map) || ! isset($map[$grade]) || ! is_numeric($map[$grade])) {
            throw new RuntimeException("Assessment sample {$path} references grade {$grade} missing from source {$source['source_id']}");
        }

        return (float) $map[$grade];
    }

    /** @return array<string,mixed> */
    private function source(string $sourceId): array
    {
        $source = $this->yaml("sources/{$sourceId}.yaml", 'source', $sourceId);
        $this->require($source, [
            'name', 'sample_source_url', 'scale_name', 'scale_url', 'skill', 'task_type',
            'presentation_note', 'technical_note', 'internal_validation_band_by_source_grade',
        ], $sourceId, 'Golden sample source');

        if ($source['skill'] !== 'writing') {
            throw new RuntimeException("Golden sample source {$sourceId} has unsupported skill: {$source['skill']}");
        }

        return $source;
    }

    /** @return array<string,mixed> */
    private function reference(string $referenceId): array
    {
        $reference = $this->yaml("references/{$referenceId}.yaml", 'reference', $referenceId);
        $this->require($reference, ['name', 'skill', 'score_scale', 'criteria', 'tasks', 'validation_role'], $referenceId, 'Assessment validation reference');

        if ($reference['skill'] !== 'writing') {
            throw new RuntimeException("Assessment validation reference {$referenceId} has unsupported skill: {$reference['skill']}");
        }

        return $reference;
    }

    /** @return array<string,mixed> */
    private function yaml(string $relativePath, string $idKey, string $expectedId): array
    {
        $path = database_path(self::ROOT.'/'.$relativePath);
        if (! is_file($path)) {
            throw new RuntimeException("Assessment validation metadata not found: {$path}");
        }

        $data = Yaml::parse((string) file_get_contents($path));
        if (! is_array($data) || ($data[$idKey.'_id'] ?? null) !== $expectedId) {
            throw new RuntimeException("Invalid assessment validation metadata file: {$path}");
        }

        return $data;
    }
}
