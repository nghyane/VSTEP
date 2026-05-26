<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Lightweight syntactic structure counter — no external NLP dependency.
 *
 * Counts complex structure types in English text via regex patterns.
 * Used to anchor VSTEP grammar rubric (v3) which specifies required
 * structure counts per band level (Thông tư 23/2017/TT-BGDĐT, operationalized).
 *
 * Runtime: <1ms per essay. Deterministic output.
 *
 * Limitations (documented):
 *   - Regex-based, not a full parser. May have ±1 type count error vs manual analysis.
 *   - Relative clause detection may include some non-restrictive "that" usages.
 *   - Passive detection may misclassify participial adjectives (e.g. "I am tired").
 *   - Suitable as an objective signal for LLM context, not as a standalone grader.
 */
final class SyntaxAnalyzer
{
    /** @var array<string, string> */
    private const STRUCTURES = [
        // Band 6+: conditional sentences
        'conditional' => '~
            \bif\b(?!.*\?)
            |\bunless\b
            |\bprovided\s+that\b
            |\b(?:what\s+if|suppose|supposing|imagine)\b
            |\bwish\b\s+(?:I|we|he|she|they)\s+\w+ed\b
        ~ix',

        'relative_clause' => '~
            \bwho\s+(?:is|are|was|were|has|have|had|will|would|can|could|\w+s\b)
            |\bwhich\s+(?:is|are|was|were|has|have|had|will|would|can|could|\w+s\b)
            |\bwhom\b
            |\bwhose\b
        ~ix',

        'passive_voice' => '~
            \b(?:am|is|are|was|were|been|being|got|get)\s+
            (?:not\s+)?(?:also\s+|often\s+|usually\s+|always\s+|never\s+)?
            (?!tired|excited|interested|bored|worried|surprised|confused|disappointed|satisfied|relaxed|scared|frightened|pleased|annoyed|embarrassed|frustrated|shocked|amazed|based|located|situated)(\w+(?:ed|en))\b
        ~ix',

        'complex_conjunction' => '~
            \b(?:although|though|even\s+though)\b
            |\b(?:despite|in\s+spite\s+of)\b
            |\bwhereas\b
            |\bwhile\b(?!.*\?)
            |\b(?:so\s+that|in\s+order\s+(?:that|to))\b
        ~ix',

        'participle_phrase' => '~
            ^\s*(?:Having|Being|Facing|Considering|Given|Looking|Taking|Based|Compared)\s+\w+(?:ed|en|ing)\b
        ~imx',

        'inversion' => '~
            \b(?:Not\s+only|Never|Rarely|Seldom|Hardly|No\s+sooner|Only\s+then|Only\s+in\s+this\s+way|Under\s+no\s+circumstances|At\s+no\s+time)\b
        ~ix',

        'cleft_sentence' => '~
            \bIt\s+(?:is|was)\s+(?!clear|important|obvious|necessary|essential|true|likely|possible|probable|difficult|easy|hard|good|bad|nice|interesting|surprising|well.known|worth|better|worse)\b.+\b(?:that|who|which|when|where)\b
            |\bWhat\b.+\b(?:is|was)\b.+\b(?:is|was|that)\b
            |\bAll\b.+\b(?:is|was)\b.+\b(?:is|was|that)\b
        ~ix',

        'subjunctive' => '~
            \b(?:suggest|recommend|insist|demand|propose|request|require|advise)\s+that\b
            |\b(?:if\s+I\s+were|if\s+he\s+were|if\s+she\s+were|if\s+it\s+were)\b
            |\bas\s+(?:if|though)\b
            |\bwould\s+(?:rather|sooner)\b
        ~ix',

        'comparative_correlative' => '~
            \bthe\s+(?:more|less|fewer|better|worse|bigger|greater)\b.*\bthe\s+(?:more|less|fewer|better|worse|bigger|greater)\b
        ~ix',

        'causative' => '~
            \b(?:have|get|had|got)\s+\w+\s+(?:\w+ed|done|fixed|repaired|cleaned|built|made)\b
            |\b(?:make|let|help)\s+\w+\s+\w+\b
        ~ix',
    ];

    /**
     * Analyze text and return structure type counts.
     *
     * @return array{types: list<string>, count: int, details: array<string,int>}
     */
    public function analyze(string $text): array
    {
        $details = [];
        $types = [];

        foreach (self::STRUCTURES as $name => $pattern) {
            $count = preg_match_all($pattern, $text);
            $details[$name] = max(0, $count);
            if ($count > 0) {
                $types[] = $name;
            }
        }

        return [
            'types' => $types,
            'count' => count($types),
            'details' => $details,
        ];
    }

    /**
     * Map structure type count to VSTEP grammar band (v3 rubric anchor).
     *
     * Band 5: 0 complex types (simple sentences only — and/but/so/because)
     * Band 6: 1-2 types (conditional, relative clause, or complex conjunction)
     * Band 7: 3-4 types (adds passive, participle, comparative correlative)
     * Band 8: 5 types     (adds cleft, subjunctive, inversion)
     * Band 9: 6+ types    (full range mastered)
     * Band 10: 7+ types   (nearly all types present)
     */
    public function structureBand(int $typeCount): int
    {
        return match (true) {
            $typeCount >= 7 => 10,
            $typeCount >= 6 => 9,
            $typeCount >= 5 => 8,
            $typeCount >= 3 => 7,
            $typeCount >= 1 => 6,
            default => 5,
        };
    }
}
