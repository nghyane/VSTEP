== SPEAKING TASK ==
{{ $promptText }}

== STUDENT TRANSCRIPT ({{ $transcript !== '' ? str_word_count($transcript) : 0 }} words) ==
{{ $transcript }}

== PRE-COMPUTED METRICS ==
- Word count: {{ $metrics['word_count'] ?? 'N/A' }}
- Sentence count: {{ $metrics['sentence_count'] ?? 'N/A' }}
- Linking words found: {{ $metrics['linking_word_count'] ?? 'N/A' }}
- Sentence variety: {{ $metrics['sentence_variety'] ?? 'N/A' }}

== SCORES (1–10 scale) ==
@foreach($scores as $key => $score)
- {{ $key }}: {{ $score }}
@endforeach

@if($bandContext !== null)
== STUDENT CONTEXT ==
Current band: {{ $bandContext['current'] }}, target: {{ $bandContext['target'] }} (VSTEP).
Calibrate feedback to bridge from {{ $bandContext['current'] }} to {{ $bandContext['target'] }}.

@if($bandContext['target'] === 'C1')
Push for: sophisticated vocabulary, natural intonation, complex arguments, idiomatic expressions.
@elseif($bandContext['target'] === 'B2')
Focus on: coherent delivery, topic vocabulary, developed responses, smooth transitions.
@elseif($bandContext['target'] === 'B1')
Focus on: task completion, basic accuracy, simple but comprehensible speech.
@endif
@endif

== TASK ==
Generate feedback in Vietnamese.

- Strengths (3-5 items): what the student did well in their speaking response.
- Improvements (3-5 items): specific, actionable advice to improve.
Keep each item concise (1-2 sentences).
