<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Services\Linguistics\JsonlFixtureReader;

final class ContentReferenceValidator
{
    private const READING_EXERCISES = 'reference/content/practice/reading-exercises.jsonl';

    private const READING_QUESTIONS = 'reference/content/practice/reading-questions.jsonl';

    private const LISTENING_EXERCISES = 'reference/content/practice/listening-exercises.jsonl';

    private const LISTENING_QUESTIONS = 'reference/content/practice/listening-questions.jsonl';

    private const WRITING_PROMPTS = 'reference/content/practice/writing-prompts.jsonl';

    private const SPEAKING_TASKS = 'reference/content/practice/speaking-tasks.jsonl';

    private const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

    private const MIN_READING_QUESTIONS_PER_EXERCISE = 8;

    private const WRITING_TASK_TYPES = [
        'request',
        'complaint',
        'apology',
        'application',
        'invitation',
        'advice',
        'information_request',
        'thanks',
        'arrangement',
        'feedback',
        'opinion',
        'problem_solution',
        'discussion',
        'advantage_disadvantage',
        'cause_effect',
    ];

    private const SPEAKING_TASK_TYPES = ['social', 'solution', 'topic'];

    public function __construct(
        private readonly JsonlFixtureReader $reader,
    ) {}

    /** @return list<string> */
    public function validateAll(): array
    {
        return [
            ...$this->validateManifest(),
            ...$this->validateReadingExercises(),
            ...$this->validateReadingQuestions(),
            ...$this->validateListeningExercises(),
            ...$this->validateListeningQuestions(),
            ...$this->validateWritingPrompts(),
            ...$this->validateSpeakingTasks(),
        ];
    }

    /** @return list<array<string, mixed>> */
    public function readingExercises(): array
    {
        return $this->reader->read(self::READING_EXERCISES);
    }

    /** @return list<array<string, mixed>> */
    public function readingQuestions(): array
    {
        return $this->reader->read(self::READING_QUESTIONS);
    }

    /** @return list<array<string, mixed>> */
    public function listeningExercises(): array
    {
        return $this->reader->read(self::LISTENING_EXERCISES);
    }

    /** @return list<array<string, mixed>> */
    public function listeningQuestions(): array
    {
        return $this->reader->read(self::LISTENING_QUESTIONS);
    }

    /** @return list<array<string, mixed>> */
    public function writingPrompts(): array
    {
        return $this->reader->read(self::WRITING_PROMPTS);
    }

    /** @return list<array<string, mixed>> */
    public function speakingTasks(): array
    {
        return $this->reader->read(self::SPEAKING_TASKS);
    }

    /** @return array{reading_exercises: int, reading_questions: int, listening_exercises: int, listening_questions: int, writing_prompts: int, speaking_tasks: int} */
    public function fixtureCounts(): array
    {
        return [
            'reading_exercises' => count($this->readingExercises()),
            'reading_questions' => count($this->readingQuestions()),
            'listening_exercises' => count($this->listeningExercises()),
            'listening_questions' => count($this->listeningQuestions()),
            'writing_prompts' => count($this->writingPrompts()),
            'speaking_tasks' => count($this->speakingTasks()),
        ];
    }

    /** @return list<string> */
    public function validateReadingExercises(): array
    {
        return $this->validatePracticeExercises(
            $this->readingExercises(),
            self::READING_EXERCISES,
            ['slug', 'title', 'part', 'level', 'topic', 'passage', 'keywords', 'estimated_minutes', 'source_key', 'selection_reason'],
            [1, 2, 3, 4],
            'passage',
        );
    }

    /** @return list<string> */
    public function validateListeningExercises(): array
    {
        return $this->validatePracticeExercises(
            $this->listeningExercises(),
            self::LISTENING_EXERCISES,
            ['slug', 'title', 'part', 'level', 'topic', 'transcript', 'keywords', 'estimated_minutes', 'source_key', 'selection_reason'],
            [1, 2, 3],
            'transcript',
        );
    }

    /** @return list<string> */
    public function validateReadingQuestions(): array
    {
        return [
            ...$this->validatePracticeQuestions(
                $this->readingQuestions(),
                $this->readingExercises(),
                self::READING_QUESTIONS,
            ),
            ...$this->validateMinimumQuestionsPerExercise(
                $this->readingQuestions(),
                $this->readingExercises(),
                self::READING_QUESTIONS,
                self::MIN_READING_QUESTIONS_PER_EXERCISE,
            ),
        ];
    }

    /** @return list<string> */
    public function validateListeningQuestions(): array
    {
        return $this->validatePracticeQuestions(
            $this->listeningQuestions(),
            $this->listeningExercises(),
            self::LISTENING_QUESTIONS,
        );
    }

    /** @return list<string> */
    public function validateWritingPrompts(): array
    {
        $sources = $this->sources();
        $errors = [];
        $seen = [];

        foreach ($this->writingPrompts() as $index => $row) {
            $line = $index + 1;
            $errors = [...$errors, ...$this->required($row, [
                'slug', 'title', 'part', 'task_type', 'level', 'topic', 'prompt', 'min_words',
                'max_words', 'required_points', 'keywords', 'sentence_starters', 'estimated_minutes',
                'source_key', 'selection_reason',
            ], self::WRITING_PROMPTS, $line)];

            $this->validateSlug($row, $seen, self::WRITING_PROMPTS, $line, $errors);
            $this->validateSource($row, $sources, self::WRITING_PROMPTS, $line, $errors);
            $this->validateLevel($row, self::WRITING_PROMPTS, $line, $errors);
            $this->validateEnum($row, 'task_type', self::WRITING_TASK_TYPES, self::WRITING_PROMPTS, $line, $errors);
            $this->validatePositiveInt($row, 'estimated_minutes', self::WRITING_PROMPTS, $line, $errors);
            $this->validateStringList($row, 'required_points', 2, self::WRITING_PROMPTS, $line, $errors);
            $this->validateStringList($row, 'keywords', 2, self::WRITING_PROMPTS, $line, $errors);
            $this->validateStringList($row, 'sentence_starters', 2, self::WRITING_PROMPTS, $line, $errors);

            $part = $row['part'] ?? null;
            if (! in_array($part, [1, 2], true)) {
                $errors[] = self::WRITING_PROMPTS." line {$line}: part must be 1 or 2";
            }

            $minWords = $row['min_words'] ?? null;
            $maxWords = $row['max_words'] ?? null;
            if (! is_int($minWords) || ! is_int($maxWords) || $maxWords < $minWords) {
                $errors[] = self::WRITING_PROMPTS." line {$line}: invalid min_words/max_words";
            } elseif ($part === 1 && $minWords < 120) {
                $errors[] = self::WRITING_PROMPTS." line {$line}: Task 1 min_words must be at least 120";
            } elseif ($part === 2 && $minWords < 250) {
                $errors[] = self::WRITING_PROMPTS." line {$line}: Task 2 min_words must be at least 250";
            }
        }

        return $errors;
    }

    /** @return list<string> */
    public function validateSpeakingTasks(): array
    {
        $sources = $this->sources();
        $errors = [];
        $seen = [];

        foreach ($this->speakingTasks() as $index => $row) {
            $line = $index + 1;
            $errors = [...$errors, ...$this->required($row, [
                'slug', 'title', 'part', 'task_type', 'level', 'topic', 'content', 'estimated_minutes',
                'speaking_seconds', 'source_key', 'selection_reason',
            ], self::SPEAKING_TASKS, $line)];

            $this->validateSlug($row, $seen, self::SPEAKING_TASKS, $line, $errors);
            $this->validateSource($row, $sources, self::SPEAKING_TASKS, $line, $errors);
            $this->validateLevel($row, self::SPEAKING_TASKS, $line, $errors);
            $this->validateEnum($row, 'task_type', self::SPEAKING_TASK_TYPES, self::SPEAKING_TASKS, $line, $errors);
            $this->validatePositiveInt($row, 'estimated_minutes', self::SPEAKING_TASKS, $line, $errors);
            $this->validatePositiveInt($row, 'speaking_seconds', self::SPEAKING_TASKS, $line, $errors);
            $this->validateSpeakingShape($row, self::SPEAKING_TASKS, $line, $errors);
        }

        return $errors;
    }

    /** @return list<string> */
    private function validateManifest(): array
    {
        $errors = [];
        foreach (['manifest.json', 'sources.json'] as $file) {
            $path = database_path('reference/content/'.$file);
            if (! is_file($path)) {
                $errors[] = "reference/content/{$file}: missing file";
            } elseif (! is_array(json_decode((string) file_get_contents($path), true))) {
                $errors[] = "reference/content/{$file}: invalid JSON";
            }
        }

        return $errors;
    }

    /** @param list<array<string, mixed>> $rows @param list<string> $required @param list<int> $parts @return list<string> */
    private function validatePracticeExercises(array $rows, string $file, array $required, array $parts, string $textKey): array
    {
        $sources = $this->sources();
        $errors = [];
        $seen = [];

        foreach ($rows as $index => $row) {
            $line = $index + 1;
            $errors = [...$errors, ...$this->required($row, $required, $file, $line)];
            $this->validateSlug($row, $seen, $file, $line, $errors);
            $this->validateSource($row, $sources, $file, $line, $errors);
            $this->validateLevel($row, $file, $line, $errors);
            $this->validatePositiveInt($row, 'estimated_minutes', $file, $line, $errors);
            $this->validateStringList($row, 'keywords', 2, $file, $line, $errors);

            if (! in_array($row['part'] ?? null, $parts, true)) {
                $errors[] = "{$file} line {$line}: invalid part";
            }
            if (! is_string($row[$textKey] ?? null) || str_word_count($row[$textKey]) < 25) {
                $errors[] = "{$file} line {$line}: {$textKey} is too short";
            }
        }

        return $errors;
    }

    /** @param list<array<string, mixed>> $questions @param list<array<string, mixed>> $exercises @return list<string> */
    private function validatePracticeQuestions(array $questions, array $exercises, string $file): array
    {
        $sources = $this->sources();
        $errors = [];
        $exerciseSlugs = array_fill_keys(array_map(
            fn (array $row): string => (string) ($row['slug'] ?? ''),
            $exercises,
        ), true);
        $seen = [];

        foreach ($questions as $index => $row) {
            $line = $index + 1;
            $errors = [...$errors, ...$this->required($row, [
                'exercise_slug', 'display_order', 'question', 'options', 'correct_index',
                'explanation', 'source_key', 'selection_reason',
            ], $file, $line)];
            $this->validateSource($row, $sources, $file, $line, $errors);
            $this->validatePositiveInt($row, 'display_order', $file, $line, $errors);

            $slug = (string) ($row['exercise_slug'] ?? '');
            if (! isset($exerciseSlugs[$slug])) {
                $errors[] = "{$file} line {$line}: unknown exercise_slug {$slug}";
            }
            $identity = $slug.'|'.((string) ($row['display_order'] ?? ''));
            if (isset($seen[$identity])) {
                $errors[] = "{$file} line {$line}: duplicate question display_order for exercise";
            }
            $seen[$identity] = true;

            if (! is_string($row['question'] ?? null) || trim($row['question']) === '') {
                $errors[] = "{$file} line {$line}: question must be a non-empty string";
            }
            if (! is_string($row['explanation'] ?? null) || trim($row['explanation']) === '') {
                $errors[] = "{$file} line {$line}: explanation must be a non-empty string";
            }

            $options = $row['options'] ?? null;
            if (! is_array($options) || count($options) !== 4) {
                $errors[] = "{$file} line {$line}: options must contain exactly 4 items";
            } else {
                foreach ($options as $option) {
                    if (! is_string($option) || trim($option) === '') {
                        $errors[] = "{$file} line {$line}: options contain an empty item";
                    }
                }
            }
            $correctIndex = $row['correct_index'] ?? null;
            if (! is_int($correctIndex) || $correctIndex < 0 || $correctIndex > 3) {
                $errors[] = "{$file} line {$line}: correct_index must be between 0 and 3";
            }
        }

        return $errors;
    }

    /** @param list<array<string, mixed>> $questions @param list<array<string, mixed>> $exercises @return list<string> */
    private function validateMinimumQuestionsPerExercise(array $questions, array $exercises, string $file, int $minimum): array
    {
        $counts = [];
        foreach ($questions as $question) {
            $slug = $question['exercise_slug'] ?? null;
            if (is_string($slug)) {
                $counts[$slug] = ($counts[$slug] ?? 0) + 1;
            }
        }

        $errors = [];
        foreach ($exercises as $exercise) {
            $slug = $exercise['slug'] ?? null;
            if (is_string($slug) && ($counts[$slug] ?? 0) < $minimum) {
                $errors[] = "{$file}: exercise {$slug} requires at least {$minimum} questions";
            }
        }

        return $errors;
    }

    /** @return array<string, mixed> */
    private function sources(): array
    {
        $decoded = json_decode((string) file_get_contents(database_path('reference/content/sources.json')), true);

        return is_array($decoded) ? $decoded : [];
    }

    /** @param list<string> $keys @return list<string> */
    private function required(array $row, array $keys, string $file, int $line): array
    {
        $errors = [];
        foreach ($keys as $key) {
            if (! array_key_exists($key, $row) || $row[$key] === '' || $row[$key] === []) {
                $errors[] = "{$file} line {$line}: missing {$key}";
            }
        }

        return $errors;
    }

    /** @param array<string, bool> $seen @param list<string> $errors */
    private function validateSlug(array $row, array &$seen, string $file, int $line, array &$errors): void
    {
        $slug = $row['slug'] ?? null;
        if (! is_string($slug) || preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) !== 1) {
            $errors[] = "{$file} line {$line}: invalid slug";

            return;
        }

        if (isset($seen[$slug])) {
            $errors[] = "{$file} line {$line}: duplicate slug {$slug}";
        }
        $seen[$slug] = true;
    }

    /** @param array<string, mixed> $sources @param list<string> $errors */
    private function validateSource(array $row, array $sources, string $file, int $line, array &$errors): void
    {
        $source = $row['source_key'] ?? null;
        if (! is_string($source) || ! array_key_exists($source, $sources)) {
            $errors[] = "{$file} line {$line}: unknown source_key";
        }
    }

    /** @param list<string> $errors */
    private function validateLevel(array $row, string $file, int $line, array &$errors): void
    {
        if (! in_array($row['level'] ?? null, self::LEVELS, true)) {
            $errors[] = "{$file} line {$line}: invalid CEFR level";
        }
    }

    /** @param list<string> $allowed @param list<string> $errors */
    private function validateEnum(array $row, string $key, array $allowed, string $file, int $line, array &$errors): void
    {
        if (! in_array($row[$key] ?? null, $allowed, true)) {
            $errors[] = "{$file} line {$line}: invalid {$key}";
        }
    }

    /** @param list<string> $errors */
    private function validatePositiveInt(array $row, string $key, string $file, int $line, array &$errors): void
    {
        if (! is_int($row[$key] ?? null) || $row[$key] < 1) {
            $errors[] = "{$file} line {$line}: {$key} must be a positive integer";
        }
    }

    /** @param list<string> $errors */
    private function validateStringList(array $row, string $key, int $min, string $file, int $line, array &$errors): void
    {
        $items = $row[$key] ?? null;
        if (! is_array($items) || count($items) < $min) {
            $errors[] = "{$file} line {$line}: {$key} must contain at least {$min} items";

            return;
        }

        foreach ($items as $item) {
            if (! is_string($item) || trim($item) === '') {
                $errors[] = "{$file} line {$line}: {$key} contains an empty item";
            }
        }
    }

    /** @param list<string> $errors */
    private function validateSpeakingShape(array $row, string $file, int $line, array &$errors): void
    {
        $content = $row['content'] ?? null;
        if (! is_array($content) || $content === []) {
            $errors[] = "{$file} line {$line}: content must be a JSON object";

            return;
        }

        $part = $row['part'] ?? null;
        $taskType = $row['task_type'] ?? null;
        if ($part === 1) {
            if ($taskType !== 'social') {
                $errors[] = "{$file} line {$line}: part 1 task_type must be social";
            }
            $topics = $content['topics'] ?? null;
            if (! is_array($topics) || count($topics) !== 2) {
                $errors[] = "{$file} line {$line}: part 1 requires exactly 2 topics";

                return;
            }
            $questionCount = 0;
            foreach ($topics as $topic) {
                $questions = is_array($topic) ? ($topic['questions'] ?? null) : null;
                if (! is_array($questions) || $questions === []) {
                    $errors[] = "{$file} line {$line}: part 1 topic questions are required";

                    continue;
                }
                $questionCount += count($questions);
            }
            if ($questionCount < 3 || $questionCount > 6) {
                $errors[] = "{$file} line {$line}: part 1 requires 3-6 total questions";
            }

            return;
        }

        if ($part === 2) {
            if ($taskType !== 'solution') {
                $errors[] = "{$file} line {$line}: part 2 task_type must be solution";
            }
            foreach (['situation', 'task'] as $key) {
                if (! is_string($content[$key] ?? null) || trim($content[$key]) === '') {
                    $errors[] = "{$file} line {$line}: part 2 content.{$key} is required";
                }
            }
            $solutions = $content['solutions'] ?? null;
            if (! is_array($solutions) || count($solutions) !== 3) {
                $errors[] = "{$file} line {$line}: part 2 requires exactly 3 solutions";
            }

            return;
        }

        if ($part === 3) {
            if ($taskType !== 'topic') {
                $errors[] = "{$file} line {$line}: part 3 task_type must be topic";
            }
            foreach (['topic', 'prompt'] as $key) {
                if (! is_string($content[$key] ?? null) || trim($content[$key]) === '') {
                    $errors[] = "{$file} line {$line}: part 3 content.{$key} is required";
                }
            }
            $questions = $content['follow_up_questions'] ?? null;
            if (! is_array($questions) || count($questions) < 3) {
                $errors[] = "{$file} line {$line}: part 3 requires at least 3 follow_up_questions";
            }

            return;
        }

        $errors[] = "{$file} line {$line}: speaking part must be 1, 2 or 3";
    }
}
