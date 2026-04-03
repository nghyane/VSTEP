<?php

declare(strict_types=1);

namespace App\Services\WritingScaffoldGenerators;

use App\Ai\Agents\WritingTemplateGenerator;
use App\Enums\WritingScaffoldType;
use App\Models\Question;
use App\Services\WritingScaffoldPromptBuilder;
use App\Support\WritingHints;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class TemplateScaffoldGenerator implements WritingScaffoldGenerator
{
    public function __construct(
        private readonly WritingScaffoldPromptBuilder $promptBuilder,
    ) {}

    public function generate(Question $question, int $tier): array
    {
        $cacheKey = "writing_scaffold:v4:{$question->id}:tier{$tier}";
        $cached = Cache::get($cacheKey);

        if (is_array($cached)) {
            return $cached;
        }

        $scaffold = $this->generateFresh($question, $tier);

        Cache::put($cacheKey, $scaffold, now()->addDay());

        return $scaffold;
    }

    private function generateFresh(Question $question, int $tier): array
    {
        $prompt = $question->content['prompt'] ?? '';
        $taskType = $question->content['taskType'] ?? 'essay';
        $level = $question->level->value;
        $requiredPoints = $question->content['requiredPoints'] ?? [];
        $minWords = $question->content['minWords'] ?? 120;

        try {
            $response = WritingTemplateGenerator::make(
                instructions: $this->promptBuilder->buildSystemPrompt($taskType, $level, $minWords),
            )->prompt($this->promptBuilder->buildUserPrompt($prompt, $requiredPoints));

            $sections = $this->normalizeSections($response->structured['sections'] ?? null);

            if ($sections !== []) {
                return $this->wrap($question, $tier, $tier, WritingScaffoldType::Template, [
                    'sections' => $sections,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Writing template scaffold generation error', [
                'question_id' => $question->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $this->fallback($question, $tier);
    }

    private function fallback(Question $question, int $tier): array
    {
        return $this->wrap($question, $tier, 2, WritingScaffoldType::Guided, [
            'outline' => WritingHints::forQuestion($question->content, $question->level, $question->part)['outline'],
            'starters' => WritingHints::forQuestion($question->content, $question->level, $question->part)['starters'],
            'word_count' => WritingHints::forQuestion($question->content, $question->level, $question->part)['word_count'],
        ], 'template_unavailable');
    }

    private function normalizeSections(mixed $sections): array
    {
        if (! is_array($sections)) {
            return [];
        }

        $normalized = [];

        foreach ($sections as $section) {
            if (! is_array($section) || ! is_string($section['title'] ?? null) || ! is_array($section['parts'] ?? null)) {
                continue;
            }

            $parts = [];

            foreach ($section['parts'] as $part) {
                if (! is_array($part) || ! in_array($part['type'] ?? null, ['text', 'blank'], true)) {
                    continue;
                }

                if ($part['type'] === 'text') {
                    $content = is_string($part['content'] ?? null) ? trim((string) $part['content']) : '';

                    if ($content === '') {
                        continue;
                    }

                    $parts[] = [
                        'type' => 'text',
                        'content' => $content,
                    ];

                    continue;
                }

                $id = is_string($part['id'] ?? null) ? trim((string) $part['id']) : '';
                $label = is_string($part['label'] ?? null) ? trim((string) $part['label']) : '';
                $variant = $part['variant'] ?? null;

                if ($id === '' || $label === '' || ! in_array($variant, ['content', 'transition'], true)) {
                    continue;
                }

                $hints = is_array($part['hints'] ?? null) ? $part['hints'] : [];

                $parts[] = [
                    'type' => 'blank',
                    'id' => $id,
                    'label' => $label,
                    'variant' => $variant,
                    'hints' => [
                        'b1' => $this->normalizeHintList($hints['b1'] ?? null),
                        'b2' => $this->normalizeHintList($hints['b2'] ?? null),
                    ],
                ];
            }

            if ($parts === []) {
                continue;
            }

            $normalized[] = [
                'title' => trim($section['title']),
                'parts' => $parts,
            ];
        }

        return $normalized;
    }

    private function normalizeHintList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map(function (mixed $hint): ?string {
            if (! is_string($hint)) {
                return null;
            }

            $hint = trim($hint);

            return $hint === '' ? null : $hint;
        }, $value)));
    }

    private function wrap(
        Question $question,
        int $requestedTier,
        int $effectiveTier,
        WritingScaffoldType $type,
        mixed $payload,
        ?string $fallbackReason = null,
    ): array
    {
        return [
            'question_id' => $question->id,
            'tier' => $requestedTier,
            'requested_tier' => $requestedTier,
            'effective_tier' => $effectiveTier,
            'type' => $type->value,
            'payload' => $payload,
            'fallback_reason' => $fallbackReason,
        ];
    }
}
