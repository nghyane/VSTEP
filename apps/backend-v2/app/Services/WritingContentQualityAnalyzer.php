<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Str;

final class WritingContentQualityAnalyzer
{
    /** @return array{requirements_met:list<bool>, requirements_met_count:int, requirements_total:int, prompt_overlap:float, is_irrelevant:bool} */
    public function analyze(string $text, string $prompt, array $requirements): array
    {
        $requirements = array_values(array_filter($requirements, fn (mixed $value): bool => is_string($value) && trim($value) !== ''));
        $requirementsMet = array_map(fn (string $requirement): bool => $this->requirementMet($text, $requirement), $requirements);
        $metCount = count(array_filter($requirementsMet));
        $promptTokens = $this->contentTokens($prompt.' '.implode(' ', $requirements));
        $textTokens = $this->contentTokens($text);
        $overlap = $this->overlapRatio($promptTokens, $textTokens);

        return [
            'requirements_met' => $requirementsMet,
            'requirements_met_count' => $metCount,
            'requirements_total' => max(1, count($requirements)),
            'prompt_overlap' => $overlap,
            'is_irrelevant' => $metCount === 0 && $overlap < 0.15,
        ];
    }

    private function requirementMet(string $text, string $requirement): bool
    {
        $lowerText = Str::lower($text);
        $lowerRequirement = Str::lower($requirement);

        if (Str::contains($lowerRequirement, ['opinion', 'agree', 'disagree', 'position'])) {
            return Str::contains($lowerText, ['in my opinion', 'i think', 'i believe', 'i agree', 'i disagree', 'my view', 'to my mind'])
                && $this->hasTopicalOverlap($text, $requirement);
        }

        if (Str::contains($lowerRequirement, ['reason', 'cause', 'why'])) {
            return Str::contains($lowerText, ['because', 'since', 'due to', 'as a result', 'therefore', 'reason'])
                && $this->hasTopicalOverlap($text, $requirement);
        }

        if (Str::contains($lowerRequirement, ['example', 'support', 'illustrate'])) {
            return Str::contains($lowerText, ['for example', 'for instance', 'such as', 'evidence', 'case'])
                || $this->hasTopicalOverlap($text, $requirement);
        }

        if (Str::contains($lowerRequirement, ['solution', 'suggest', 'recommend', 'plan'])) {
            return Str::contains($lowerText, ['solution', 'suggest', 'recommend', 'should', 'could', 'need to', 'plan']);
        }

        if (Str::contains($lowerRequirement, ['apologize', 'apology', 'sorry'])) {
            return Str::contains($lowerText, ['apologize', 'apology', 'sorry']);
        }

        if (Str::contains($lowerRequirement, ['request', 'ask'])) {
            return Str::contains($lowerText, ['could you', 'would you', 'i would like', 'please', 'request']);
        }

        if (Str::contains($lowerRequirement, ['complaint', 'complain'])) {
            return Str::contains($lowerText, ['complain', 'complaint', 'disappointed', 'problem', 'issue']);
        }

        if (Str::contains($lowerRequirement, ['apply', 'application'])) {
            return Str::contains($lowerText, ['apply', 'application', 'position', 'experience', 'qualification']);
        }

        $requirementTokens = $this->contentTokens($requirement);
        if ($requirementTokens === []) {
            return false;
        }

        $textTokens = $this->contentTokens($text);
        $matched = count(array_intersect($requirementTokens, $textTokens));

        return $matched >= max(1, (int) ceil(count($requirementTokens) * 0.3));
    }

    private function hasTopicalOverlap(string $text, string $requirement): bool
    {
        $generic = array_fill_keys(['state', 'opinion', 'agree', 'disagree', 'give', 'reason', 'reasons', 'support', 'ideas', 'about'], true);
        $requirementTokens = array_values(array_filter(
            $this->contentTokens($requirement),
            fn (string $word): bool => ! isset($generic[$word]),
        ));

        if ($requirementTokens === []) {
            return true;
        }

        return count(array_intersect($requirementTokens, $this->contentTokens($text))) > 0;
    }

    /** @return list<string> */
    private function contentTokens(string $text): array
    {
        preg_match_all('/\b[a-z]{3,}\b/u', Str::lower($text), $matches);
        $stopWords = $this->stopWords();

        return array_values(array_unique(array_filter(
            $matches[0] ?? [],
            fn (string $word): bool => ! isset($stopWords[$word]),
        )));
    }

    /** @param list<string> $promptTokens @param list<string> $textTokens */
    private function overlapRatio(array $promptTokens, array $textTokens): float
    {
        if ($promptTokens === [] || $textTokens === []) {
            return 0.0;
        }

        return round(count(array_intersect($promptTokens, $textTokens)) / count($promptTokens), 3);
    }

    /** @return array<string,true> */
    private function stopWords(): array
    {
        static $words = null;

        if ($words === null) {
            $words = array_fill_keys([
                'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'has', 'had', 'are', 'was', 'were',
                'you', 'your', 'they', 'their', 'our', 'can', 'could', 'should', 'would', 'will', 'may', 'might',
                'about', 'into', 'than', 'then', 'there', 'here', 'some', 'many', 'much', 'more', 'most', 'very',
                'give', 'make', 'made', 'take', 'took', 'use', 'used', 'using', 'write', 'answer', 'task', 'topic',
            ], true);
        }

        return $words;
    }
}
