<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WritingTemplateController extends Controller
{
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'question_id' => ['required', 'string', 'exists:questions,id'],
        ]);

        $question = Question::find($validated['question_id']);

        // Cache template per question (24h) — same template for all users
        $cacheKey = "writing_template:{$question->id}";

        $template = Cache::remember($cacheKey, 86400, function () use ($question) {
            return $this->generateTemplate($question);
        });

        if ($template === null) {
            return response()->json(['data' => ['error' => 'Template generation failed.']], 503);
        }

        return response()->json(['data' => ['template' => $template]]);
    }

    private function generateTemplate(Question $question): ?array
    {
        $prompt = $question->content['prompt'] ?? '';
        $taskType = $question->content['taskType'] ?? 'essay';
        $level = $question->level->value;
        $requiredPoints = $question->content['requiredPoints'] ?? [];
        $minWords = $question->content['minWords'] ?? 120;

        $systemPrompt = $this->buildSystemPrompt($taskType, $level, $minWords);
        $userMessage = $this->buildUserMessage($prompt, $requiredPoints);

        $gatewayUrl = config('services.grading.url', 'http://localhost:8001');

        try {
            $response = Http::timeout(60)->post("{$gatewayUrl}/ai/generate-template", [
                'system' => $systemPrompt,
                'user' => $userMessage,
            ]);

            if ($response->successful()) {
                $data = $response->json();

                return $data['template'] ?? $data['data']['template'] ?? $data;
            }

            Log::warning('Template generation failed', [
                'question_id' => $question->id,
                'status' => $response->status(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Template generation error', [
                'question_id' => $question->id,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    private function buildSystemPrompt(string $taskType, string $level, int $minWords): string
    {
        return <<<PROMPT
You are a VSTEP writing template generator. Generate a fill-in-the-blank writing template for {$level} level students.

Task type: {$taskType}
Target word count: {$minWords} words

Generate a JSON array of template sections. Each section has:
- "title": Vietnamese section label (e.g., "Lời mở đầu", "Thân bài 1")
- "parts": array of parts, each is either:
  - {"type": "text", "content": "fixed text..."} — pre-written text
  - {"type": "blank", "id": "unique_id", "label": "Vietnamese hint", "variant": "content"|"transition", "hints": {"b1": ["option1", "option2"], "b2": ["option1", "option2"]}}

Rules:
- Create 4-6 sections covering the full structure
- Each section should have 2-4 blanks mixed with text
- "transition" variant blanks are for linking words (First, However, In conclusion...)
- "content" variant blanks are for topic-specific content
- B1 hints: simple, everyday vocabulary
- B2 hints: more sophisticated, academic vocabulary
- Blank IDs must be unique snake_case strings
- Text parts should guide the student through the structure
- Output ONLY valid JSON array, no markdown, no explanation
PROMPT;
    }

    private function buildUserMessage(string $prompt, array $requiredPoints): string
    {
        $message = "Writing prompt: {$prompt}";

        if (count($requiredPoints) > 0) {
            $points = implode(', ', $requiredPoints);
            $message .= "\nRequired points to address: {$points}";
        }

        return $message;
    }
}
