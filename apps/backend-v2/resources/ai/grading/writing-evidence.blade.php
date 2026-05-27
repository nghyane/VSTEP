== WRITING TASK ==
{{ $promptText }}

== STUDENT RESPONSE ({{ $wordCount }} words) ==
{{ $text }}

== PRE-COMPUTED METRICS ==
- Word count: {{ $metrics['word_count'] }}
- Sentence count: {{ $metrics['sentence_count'] }}
- Paragraph count: {{ $metrics['paragraph_count'] }}
- Linking words found: {{ $metrics['linking_word_count'] }} ({{ implode(', ', $linkingWords) }})
- Unique word ratio: {{ $metrics['unique_ratio'] }}

@if(isset($syntax) && $syntax['count'] > 0)
== SYNTAX STRUCTURES DETECTED ==
Types found: {{ implode(', ', $syntax['types']) }} ({{ $syntax['count'] }} total)
@foreach($syntax['details'] as $type => $count)
  - {{ $type }}: {{ $count }}
@endforeach
@endif

@if(count($grammarErrors) > 0)
== DETECTED GRAMMAR ISSUES (LanguageTool) ==
@foreach($grammarErrors as $e)
- {{ $e['message'] }} ({{ $e['category'] }})
@if(!empty($e['replacements']))
  Suggested: {{ implode(', ', array_slice($e['replacements'], 0, 3)) }}
@endif
@endforeach
@endif

== TASK REQUIREMENTS ==
{{ $promptText }}

@if(count($requirements) > 0)
== SPECIFIC REQUIREMENTS TO CHECK ==
@foreach($requirements as $i => $req)
{{ $i + 1 }}. {{ $req }}
@endforeach

For EACH requirement above, assign a completion score:
- 1.0 = FULLY addressed with explanation, examples, or details
- 0.5 = PARTIALLY addressed (mentioned but not developed, or vague)
- 0.0 = NOT addressed at all

Sum the scores: requirements_met = total of all requirement scores (can be a decimal like 1.5, 2.0, 2.5, etc.)
requirements_total = {{ count($requirements) }} (one point available per requirement)

@else
== REQUIREMENT ANALYSIS ==
No specific requirements are listed. Infer 3-5 key expectations from the task description above.
Score each the same way (1.0/0.5/0.0).
requirements_total = number of key expectations you identified
requirements_met = your summed score (decimal allowed)

@endif

Also determine:
- has_clear_position: TRUE only if the student clearly states an opinion/stance AND supports it.
- has_irrelevant_content: TRUE only if there is genuinely off-topic or unrelated content.

Be precise. Do NOT inflate scores. A partially addressed requirement is 0.5, not 1.0.
