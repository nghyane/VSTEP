Task prompt: {{ $promptText }}

Student's writing:
{{ $text }}

Word count: {{ $wordCount }}

@if(!empty($grammarErrors))
Grammar errors detected by automated checker:
@foreach($grammarErrors as $error)
- "{{ $error['message'] }}" (offset {{ $error['offset'] }})
@endforeach
@endif

Text metrics:
- Words: {{ $metrics['word_count'] }}, Sentences: {{ $metrics['sentence_count'] }}, Paragraphs: {{ $metrics['paragraph_count'] }}
- Errors/sentence: {{ $metrics['errors_per_sentence'] }}, Unique word ratio: {{ $metrics['unique_ratio'] }}
- Linking words found: {{ $metrics['linking_word_count'] }}

@if(!empty($caps))
Score constraints (do NOT exceed these):
@foreach($caps as $criterion => $cap)
- {{ $criterion }} max: {{ $cap }}
@endforeach
@endif
