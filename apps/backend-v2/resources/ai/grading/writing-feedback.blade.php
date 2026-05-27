== WRITING TASK ==
{{ $promptText }}

== STUDENT RESPONSE ({{ $wordCount }} words) ==
{{ $text }}

== PRE-COMPUTED METRICS ==
- Word count: {{ $metrics['word_count'] }}
- Sentence count: {{ $metrics['sentence_count'] }}
- Paragraph count: {{ $metrics['paragraph_count'] }}
- Linking words found: {{ $metrics['linking_word_count'] }}
- Unique word ratio: {{ $metrics['unique_ratio'] }}

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
Generate 3-5 strengths, 3-5 improvements, and 0-3 rewrites in VIETNAMESE.
- Strengths: what the student did well (concrete, specific).
- Improvements: what to fix or do better (actionable, specific).
- Rewrites: corrected versions of problem sentences (original + improved).
Keep each item concise (1-2 sentences max).
