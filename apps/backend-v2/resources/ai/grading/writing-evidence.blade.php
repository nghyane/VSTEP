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

== REQUIREMENTS TO CHECK ==
@foreach($requirements as $i => $req)
{{ $i + 1 }}. {{ $req }}
@endforeach

Count how many of the {{ count($requirements) }} requirements above the student ACTUALLY addressed.
Set requirements_total = {{ count($requirements) }}
Set requirements_met = number fulfilled.

Also determine:
- has_clear_position: does the student have a clear stance/opinion?
- has_irrelevant_content: is there off-topic content?

Be precise. Only count what is actually present in the text.
