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
@endif

@if(count($grammarErrors) > 0)
== DETECTED GRAMMAR ISSUES (LanguageTool) ==
@foreach($grammarErrors as $e)
- {{ $e['message'] }} ({{ $e['category'] }})
@endforeach
@endif

== TASK ==
For EACH requirement below, find evidence in the student's response that addresses it.
Quote the exact sentences from the essay (copy-paste, do NOT paraphrase).

@if(count($requirements) > 0)
@foreach($requirements as $i => $req)
{{ $i + 1 }}. [key: req_{{ $i + 1 }}] "{{ $req }}"
@endforeach
@else
No specific requirements given. Infer 3-5 key expectations from the task description.
Use keys: req_1, req_2, req_3...
@endif

IMPORTANT: A requirement is MET if the student addresses it with any level of detail.
Even a brief mention counts as MET. Only mark as NOT met if the topic is completely absent.

Also determine:
- has_clear_position: 
@if($part === 1)
  TRUE if the letter clearly expresses its core purpose with supporting details.
@else
  TRUE if the essay states an opinion AND supports it with at least one reason.
@endif
- has_irrelevant_content: TRUE only if there is content completely unrelated to the task.
