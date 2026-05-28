== WRITING TASK ==
{{ $promptText }}

== STUDENT RESPONSE ({{ $wordCount }} words) ==
{{ $text }}

== PRE-COMPUTED METRICS ==
- Sentences: {{ $metrics['sentence_count'] }}, Paragraphs: {{ $metrics['paragraph_count'] }}
- Linking words: {{ $metrics['linking_word_count'] }} ({{ implode(', ', $linkingWords) }})
- Unique word ratio: {{ $metrics['unique_ratio'] }}, Avg word length: {{ $metrics['avg_word_length'] }}

@if(isset($syntax) && $syntax['count'] > 0)
== SYNTAX STRUCTURES ==
{{ implode(', ', $syntax['types']) }} ({{ $syntax['count'] }} types)
@endif

@if(count($grammarErrors) > 0)
== GRAMMAR ISSUES (LanguageTool) ==
@foreach($grammarErrors as $e)
- {{ $e['message'] }}
@endforeach
@endif

== REQUIREMENTS ==
@if(count($requirements) > 0)
@foreach($requirements as $i => $req)
{{ $i + 1 }}. [req_{{ $i + 1 }}] {{ $req }}
@endforeach
@else
Infer 3-5 key requirements from the task.
@endif

TASK: Read the full essay above. For each requirement, answer ONLY YES or NO.
YES = the essay addresses this topic, even briefly. NO = the topic is completely absent.
