== SPEAKING TASK ==
{{ $prompt }}

== STUDENT TRANSCRIPT ==
{{ $transcript }}

@if(count($requirements) > 0)
== TASK REQUIREMENTS ==
@foreach($requirements as $i => $req)
{{ $i + 1 }}. {{ $req }}
@endforeach

For EACH requirement, assign:
- 1.0 = FULLY addressed
- 0.5 = PARTIALLY addressed
- 0.0 = NOT addressed

requirements_met = sum of scores (decimal allowed).
requirements_total = {{ count($requirements) }}
@else
requirements_met = 0
requirements_total = 1
@endif

Be precise. Do NOT inflate scores.
