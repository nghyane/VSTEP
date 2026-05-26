== WRITING TASK ==
{{ $promptText }}

== STUDENT RESPONSE ({{ $wordCount }} words) ==
{{ $text }}

== PRE-COMPUTED METRICS ==
- Word count: {{ $metrics['word_count'] }}
- Sentence count: {{ $metrics['sentence_count'] }}
- Paragraph count: {{ $metrics['paragraph_count'] }}
- Unique word ratio: {{ $metrics['unique_ratio'] }}
- Average sentence length: {{ number_format($metrics['avg_sentence_length'], 1) }}
- Grammar errors detected: {{ $metrics['grammar_error_count'] }}
- Total errors detected: {{ $metrics['total_error_count'] }}
- Errors per sentence: {{ $metrics['errors_per_sentence'] }}
- Linking word count: {{ $metrics['linking_word_count'] }}

@if(count($grammarErrors) > 0)
== DETECTED GRAMMAR ISSUES (first 10) ==
@foreach($grammarErrors as $e)
- {{ $e['message'] }} ({{ $e['category'] }}) [offset: {{ $e['offset'] }}, length: {{ $e['length'] }}]
@if(!empty($e['replacements']))
  Suggested: {{ implode(', ', array_slice($e['replacements'], 0, 3)) }}
@endif
@endforeach
@endif

@php
$activeCaps = array_filter($caps, fn($v) => $v !== null);
@endphp
@if(!empty($activeCaps))
== SCORING CAPS APPLIED ==
The following maximum scores will be enforced after LLM scoring:
@foreach($activeCaps as $criterion => $max)
- {{ $criterion }}: max {{ $max }}
@endforeach
Score accordingly; the system will reconcile any excess.
@endif

== TASK ==
Evaluate the student's writing response against each rubric criterion (see system instruction for band descriptors).
Provide rubric scores (numeric), overall band (numeric), strengths (in Vietnamese), improvements (in Vietnamese), rewrites (corrected versions of problematic sentences — reason in Vietnamese), and annotations (specific issues found in the text — in Vietnamese).
