<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Lightweight syntactic structure counter — no external NLP dependency.
 *
 * Counts complex structure types in English text via regex patterns.
 * Used to anchor VSTEP grammar rubric which specifies required
 * structure counts per band level (Thông tư 23/2017/TT-BGDĐT, operationalized).
 *
 * Runtime: <1ms per essay. Deterministic output.
 *
 * Limitations (documented):
 *   - Regex-based, not a full parser. May have ±1 type count error vs manual analysis.
 *   - Suitable as an objective signal, not as a standalone grader.
 */
final class SyntaxAnalyzer
{
    /** @var array<string, string> */
    private const STRUCTURES = [

        // ── Conditional ─────────────────────────────────────────────
        'conditional' => '~
            \bif\b(?!.*\?)
            |\bunless\b
            |\bprovided\s+that\b
            |\b(?:what\s+if|suppose|supposing|imagine)\b
            |\bwish\b\s+(?:I|we|he|she|they)\s+(?:\w+ed|had\s+\w+ed|could|would)\b
        ~ix',

        // ── Relative Clause ─────────────────────────────────────────
        // who/which + auxiliary verb → relative clause intro
        // Excludes: this, always, plus, its (common false positives)
        'relative_clause' => '~
            \bwho\s+(?:is|are|was|were|has|have|had|will|would|can|could|may|might|must|should|shall)\b
            |\bwhich\s+(?:is|are|was|were|has|have|had|will|would|can|could|may|might|must|should|shall)\b
            |\bwhom\b
            |\bwhose\b
        ~ix',

        // ── Passive Voice ───────────────────────────────────────────
        // be/get + (not) + (adverb) + past_participle
        // Matches: -ed, -en, and common irregular participles
        // Excludes participial adjectives (state, not action)
        'passive_voice' => '~
            \b(?:am|is|are|was|were|been|being|got|get)\s+
            (?:not\s+)?(?:also\s+|often\s+|usually\s+|always\s+|never\s+|frequently\s+|sometimes\s+)?
            (?!tired|excited|interested|bored|worried|surprised|confused|disappointed
               |satisfied|relaxed|scared|frightened|pleased|annoyed|embarrassed|frustrated
               |shocked|amazed|based|located|situated|concerned|depressed|exhausted
               |involved|married|prepared|supposed|used|determined|experienced|qualified
               |related|skilled|specialized|united|devoted|dedicated|complicated|balanced
               |convinced|educated|employed|organized|published|recognized|respected
               |stressed|supported|talented|designed|expected|required|honored|known
               |pleased|annoyed|embarrassed|frustrated)\b
            (?: \w+(?:ed|en)\b
               | \b(?:built|sent|spent|kept|left|lost|made|paid|sold|told
                     |bought|taught|caught|thought|found|heard|held|led|met
                     |felt|dealt|meant|won|read|cut|put|set|hit|brought)\b)
        ~ix',

        // ── Complex Conjunction ─────────────────────────────────────
        'complex_conjunction' => '~
            \b(?:although|though|even\s+though)\b
            |\b(?:despite|in\s+spite\s+of)\b
            |\bwhereas\b
            |\bwhile\b(?!.*\?)
            |\b(?:so\s+that|in\s+order\s+(?:that|to))\b
            |\b(?:as\s+long\s+as|as\s+soon\s+as|as\s+far\s+as)\b
        ~ix',

        // ── Participle Phrase (sentence opener) ─────────────────────
        'participle_phrase' => '~
            ^\s*(?:Having|Being|Facing|Considering|Given|Looking|Taking|Based|Compared
                  |Assuming|Regarding|Depending|Following|Including|Speaking|Using)\s+\w+
        ~imx',

        // ── Inversion ───────────────────────────────────────────────
        'inversion' => '~
            \b(?:Not\s+only|Never|Rarely|Seldom|Hardly|No\s+sooner
               |Only\s+then|Only\s+in\s+this\s+way|Only\s+after|Only\s+when
               |Under\s+no\s+circumstances|At\s+no\s+time|In\s+no\s+way
               |On\s+no\s+account|Not\s+until|Little\s+did|Nowhere)\b
        ~ix',

        // ── Cleft Sentence ──────────────────────────────────────────
        // It is/was + NOT adjective + ... + that/who/which/when/where
        'cleft_sentence' => '~
            \bIt\s+(?:is|was)\s+
            (?!clear|important|obvious|necessary|essential|true|likely|possible
               |probable|difficult|easy|hard|good|bad|nice|interesting|surprising
               |well\-known|worth|better|worse|vital|crucial|strange|unusual|common
               |rare|natural|normal|typical|unlikely|impossible|reasonable|evident
               |apparent|fortunate|unfortunate|fair|unfair|appropriate|relevant)\b
            .+\b(?:that|who|which|when|where)\b
            |\bWhat\b.+\b(?:is|was)\b
            |\bAll\b.+\b(?:is|was)\b
        ~ix',

        // ── Subjunctive ─────────────────────────────────────────────
        'subjunctive' => '~
            \b(?:suggest|recommend|insist|demand|propose|request|require|advise|order|command)\s+that\b
            |\b(?:if\s+I\s+were|if\s+he\s+were|if\s+she\s+were|if\s+it\s+were)\b
            |\b(?:it\s+is\s+(?:essential|vital|important|necessary|crucial)\s+that)\b
            |\bwould\s+(?:rather|sooner)\b
        ~ix',

        // ── Comparative Correlative ─────────────────────────────────
        // the + comparative ... the + comparative
        'comparative_correlative' => '~
            \bthe\s+(?:more|less|fewer|better|worse|bigger|greater|sooner|longer
                     |harder|easier|higher|lower|faster|slower|stronger|weaker
                     |closer|further|cheaper|later|earlier|smaller|larger)\b
            [^.!?]*?\bthe\s+(?:more|less|fewer|better|worse|bigger|greater|sooner|longer
                             |harder|easier|higher|lower|faster|slower|stronger|weaker
                             |closer|further|cheaper|later|earlier|smaller|larger)\b
        ~ix',

        // ── Causative ───────────────────────────────────────────────
        'causative' => '~
            \b(?:have|get|had|got)\s+\w+(?:\s+\w+)*?\s+
            (?:\w+ed|done|fixed|repaired|cleaned|built|made|painted|washed|cooked
               |prepared|delivered|installed|checked|designed|developed|written
               |taken|sent|bought|sold|created|changed|cut|set|baked)\b
            |\b(?:make|let|help)\s+(?:me|him|her|us|them|you|it)\s+(?:feel|understand|see|know|do|go|get|learn|relax|believe|realize|stay|become)\b
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
}
