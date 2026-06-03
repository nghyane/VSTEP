<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Models\PracticeListeningExercise;
use App\Models\PracticeListeningQuestion;
use App\Models\PracticeReadingExercise;
use App\Models\PracticeReadingQuestion;
use App\Models\PracticeSpeakingTask;
use App\Models\PracticeWritingPrompt;
use App\Services\Admin\AdminMcqPracticeService;
use App\Services\Admin\AdminSpeakingTaskService;
use App\Services\Admin\AdminWritingService;
use Illuminate\Support\Facades\DB;

final class ContentReferenceImporter
{
    public function __construct(
        private readonly AdminMcqPracticeService $mcqService,
        private readonly AdminWritingService $writingService,
        private readonly AdminSpeakingTaskService $speakingTaskService,
    ) {}

    /** @return array{reading_exercises: int, listening_exercises: int, writing_prompts: int, speaking_tasks: int} */
    public function import(ContentReferenceValidator $validator): array
    {
        return DB::transaction(function () use ($validator): array {
            return [
                'reading_exercises' => $this->importReading($validator),
                'listening_exercises' => $this->importListening($validator),
                'writing_prompts' => $this->importWriting($validator),
                'speaking_tasks' => $this->importSpeaking($validator),
            ];
        });
    }

    private function importReading(ContentReferenceValidator $validator): int
    {
        $questionsBySlug = collect($validator->readingQuestions())->groupBy('exercise_slug');
        $created = 0;

        foreach ($validator->readingExercises() as $row) {
            if (PracticeReadingExercise::query()->where('slug', $row['slug'])->exists()) {
                continue;
            }

            $exercise = $this->mcqService->createExercise(PracticeReadingExercise::class, [
                'slug' => $row['slug'],
                'title' => $row['title'],
                'description' => $row['description'] ?? null,
                'part' => $row['part'],
                'passage' => $row['passage'],
                'vietnamese_translation' => $row['vietnamese_translation'] ?? null,
                'keywords' => $row['keywords'],
                'estimated_minutes' => $row['estimated_minutes'],
                'is_published' => $row['is_published'] ?? true,
            ]);

            foreach ($questionsBySlug->get($row['slug'], collect()) as $question) {
                $this->mcqService->createQuestion(PracticeReadingQuestion::class, $exercise, [
                    'display_order' => $question['display_order'],
                    'question' => $question['question'],
                    'options' => $question['options'],
                    'correct_index' => $question['correct_index'],
                    'explanation' => $question['explanation'],
                ]);
            }

            $created++;
        }

        return $created;
    }

    private function importListening(ContentReferenceValidator $validator): int
    {
        $questionsBySlug = collect($validator->listeningQuestions())->groupBy('exercise_slug');
        $created = 0;

        foreach ($validator->listeningExercises() as $row) {
            if (PracticeListeningExercise::query()->where('slug', $row['slug'])->exists()) {
                continue;
            }

            $exercise = $this->mcqService->createExercise(PracticeListeningExercise::class, [
                'slug' => $row['slug'],
                'title' => $row['title'],
                'description' => $row['description'] ?? null,
                'part' => $row['part'],
                'audio_url' => $row['audio_url'] ?? null,
                'transcript' => $row['transcript'],
                'vietnamese_transcript' => $row['vietnamese_transcript'] ?? null,
                'word_timestamps' => $row['word_timestamps'] ?? null,
                'keywords' => $row['keywords'],
                'estimated_minutes' => $row['estimated_minutes'],
                'is_published' => $row['is_published'] ?? true,
            ]);

            foreach ($questionsBySlug->get($row['slug'], collect()) as $question) {
                $this->mcqService->createQuestion(PracticeListeningQuestion::class, $exercise, [
                    'display_order' => $question['display_order'],
                    'question' => $question['question'],
                    'options' => $question['options'],
                    'correct_index' => $question['correct_index'],
                    'explanation' => $question['explanation'],
                ]);
            }

            $created++;
        }

        return $created;
    }

    private function importWriting(ContentReferenceValidator $validator): int
    {
        $created = 0;

        foreach ($validator->writingPrompts() as $row) {
            if (PracticeWritingPrompt::query()->where('slug', $row['slug'])->exists()) {
                continue;
            }

            $this->writingService->createPrompt([
                'slug' => $row['slug'],
                'title' => $row['title'],
                'description' => $row['description'] ?? null,
                'part' => $row['part'],
                'prompt' => $row['prompt'],
                'min_words' => $row['min_words'],
                'max_words' => $row['max_words'],
                'required_points' => $row['required_points'],
                'keywords' => $row['keywords'],
                'sentence_starters' => $row['sentence_starters'],
                'sample_answer' => $row['sample_answer'] ?? null,
                'estimated_minutes' => $row['estimated_minutes'],
                'is_published' => $row['is_published'] ?? true,
            ]);

            $created++;
        }

        return $created;
    }

    private function importSpeaking(ContentReferenceValidator $validator): int
    {
        $created = 0;

        foreach ($validator->speakingTasks() as $row) {
            if (PracticeSpeakingTask::query()->where('slug', $row['slug'])->exists()) {
                continue;
            }

            $this->speakingTaskService->createTask([
                'slug' => $row['slug'],
                'title' => $row['title'],
                'part' => $row['part'],
                'task_type' => $row['task_type'],
                'content' => $row['content'],
                'estimated_minutes' => $row['estimated_minutes'],
                'speaking_seconds' => $row['speaking_seconds'],
                'is_published' => $row['is_published'] ?? true,
            ]);

            $created++;
        }

        return $created;
    }
}
