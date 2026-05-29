== WRITING TASK ==
{{ $promptText }}

== TASK TYPE ==
@if(($part ?? 2) === 1)
VSTEP Task 1 — Letter/Email (target: ~120 words). Semi-formal/informal register acceptable.
@else
VSTEP Task 2 — Essay (target: ~250 words). Formal academic register expected.
@endif

== STUDENT RESPONSE ({{ $wordCount }} words) ==
{{ $text }}

== PRE-COMPUTED METRICS ==
- Word count: {{ $metrics['word_count'] ?? 'N/A' }}
- Sentence count: {{ $metrics['sentence_count'] ?? 'N/A' }}
- Paragraph count: {{ $metrics['paragraph_count'] ?? 'N/A' }}
- Linking words found: {{ $metrics['linking_word_count'] ?? 'N/A' }}
- Unique word ratio: {{ $metrics['unique_ratio'] ?? 'N/A' }}

@if(count($grammarErrors) > 0)
== DETECTED GRAMMAR ISSUES ==
@foreach($grammarErrors as $e)
- {{ $e['message'] }} ({{ $e['category'] }})
@if(!empty($e['replacements']))
  Suggested: {{ implode(', ', array_slice($e['replacements'], 0, 3)) }}
@endif
@endforeach
@endif

@if($bandContext !== null)
== STUDENT CONTEXT ==
Current band: {{ $bandContext['current'] }}, target: {{ $bandContext['target'] }} (VSTEP).
Calibrate feedback to bridge from {{ $bandContext['current'] }} to {{ $bandContext['target'] }}.

@if($bandContext['target'] === 'C1')
Push for sophistication: collocations, idioms, nuanced arguments, varied structures.
@elseif($bandContext['target'] === 'B2')
Focus on coherence, topic vocabulary, developed examples, complex sentences.
@elseif($bandContext['target'] === 'B1')
Focus on task completion, basic accuracy, simple but correct language.
@endif
@endif

== TASK ==
Generate feedback in Vietnamese for strengths and improvements.
For rewrites: show the improved English version of the student sentences. Keep the original English text intact — do NOT translate to Vietnamese.
Format each rewrite as: "Original: [student text] → Improved: [corrected English]"

- Strengths (3-5 items): what the student did well (Vietnamese)
- Improvements (3-5 items): what to fix (Vietnamese)
- Rewrites (0-3 items): corrected English versions of problem sentences
Keep each item concise.
