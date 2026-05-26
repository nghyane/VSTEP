== SPEAKING TRANSCRIPT ==
{{ $transcript }}

@if(isset($pronunciationScore))
== PRONUNCIATION DATA ==
Speech-to-text confidence: {{ $pronunciationScore }}% (higher = clearer pronunciation)
@endif

== TASK ==
Evaluate the speaking performance based on the transcript above against each rubric criterion (see system instruction for band descriptors).

Note: You are evaluating from a transcript, not from audio. Therefore:
- For Pronunciation: use the STT confidence score above as a signal, combined with your analysis of vocabulary complexity and sentence structure as indirect indicators of the speaker's level.
- For Fluency: assess based on sentence length, complexity, and whether the speaker appears to produce extended stretches of language vs. fragments.
- For Grammar and Vocabulary: evaluate the actual language used in the transcript.
- For Discourse Management: evaluate coherence, topic development, and use of connectors visible in the transcript.

Provide rubric scores (numeric), overall band (numeric), strengths (in Vietnamese), and improvements (in Vietnamese).
Always produce a best-effort assessment based on available evidence.
