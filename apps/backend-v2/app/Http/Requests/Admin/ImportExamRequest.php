<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Services\ExamVersionValidator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ImportExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'exam.slug' => ['required', 'string', 'max:100', 'unique:exams,slug'],
            'exam.title' => ['required', 'string', 'max:200'],
            'exam.source_school' => ['nullable', 'string', 'max:100'],
            'exam.tags' => ['nullable', 'array'],
            'exam.tags.*' => ['string'],
            'exam.total_duration_minutes' => ['required', 'integer', 'min:1'],
            'exam.is_published' => ['nullable', 'boolean'],

            'version.version_number' => ['required', 'integer', 'min:1'],
            'version.published_at' => ['nullable', 'date'],

            'version.listening_sections' => ['required', 'array'],
            'version.listening_sections.*.part' => ['required', 'integer', 'in:1,2,3'],
            'version.listening_sections.*.part_title' => ['required', 'string', 'max:200'],
            'version.listening_sections.*.duration_minutes' => ['required', 'integer', 'min:0'],
            'version.listening_sections.*.audio_url' => ['nullable', 'string', 'max:500'],
            'version.listening_sections.*.transcript' => ['nullable', 'string'],
            'version.listening_sections.*.display_order' => ['nullable', 'integer'],

            'version.listening_items' => ['required', 'array'],
            'version.listening_items.*.section_index' => ['required', 'integer', 'min:0'],
            'version.listening_items.*.display_order' => ['required', 'integer'],
            'version.listening_items.*.stem' => ['required', 'string'],
            'version.listening_items.*.options' => ['required', 'array', 'min:4', 'max:4'],
            'version.listening_items.*.options.*' => ['required', 'string'],
            'version.listening_items.*.correct_index' => ['required', 'integer', 'min:0', 'max:3'],

            'version.reading_passages' => ['required', 'array'],
            'version.reading_passages.*.part' => ['nullable', 'integer', 'in:1,2,3,4'],
            'version.reading_passages.*.title' => ['required', 'string', 'max:200'],
            'version.reading_passages.*.duration_minutes' => ['required', 'integer', 'min:0'],
            'version.reading_passages.*.passage' => ['required', 'string'],
            'version.reading_passages.*.display_order' => ['nullable', 'integer'],

            'version.reading_items' => ['required', 'array'],
            'version.reading_items.*.passage_index' => ['required', 'integer', 'min:0'],
            'version.reading_items.*.display_order' => ['required', 'integer'],
            'version.reading_items.*.stem' => ['required', 'string'],
            'version.reading_items.*.options' => ['required', 'array', 'min:4', 'max:4'],
            'version.reading_items.*.options.*' => ['required', 'string'],
            'version.reading_items.*.correct_index' => ['required', 'integer', 'min:0', 'max:3'],

            'version.writing_tasks' => ['required', 'array'],
            'version.writing_tasks.*.part' => ['required', 'integer', 'min:1', 'max:2'],
            'version.writing_tasks.*.task_type' => ['required', 'string', 'in:letter,essay'],
            'version.writing_tasks.*.duration_minutes' => ['required', 'integer', 'min:0'],
            'version.writing_tasks.*.prompt' => ['required', 'string', 'min:1'],
            'version.writing_tasks.*.min_words' => ['required', 'integer', 'min:1'],
            'version.writing_tasks.*.instructions' => ['nullable', 'array'],
            'version.writing_tasks.*.display_order' => ['nullable', 'integer'],

            'version.speaking_parts' => ['required', 'array'],
            'version.speaking_parts.*.part' => ['required', 'integer', 'min:1', 'max:3'],
            'version.speaking_parts.*.type' => ['required', 'string', 'in:social,solution,topic'],
            'version.speaking_parts.*.duration_minutes' => ['required', 'integer', 'min:0'],
            'version.speaking_parts.*.speaking_seconds' => ['required', 'integer', 'min:1'],
            'version.speaking_parts.*.content' => ['required', 'array'],
            'version.speaking_parts.*.display_order' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'exam.slug.unique' => 'Exam slug already exists.',
            'version.listening_items.*.options.min' => 'Each question must have exactly 4 options.',
            'version.reading_items.*.options.min' => 'Each question must have exactly 4 options.',
        ];
    }

    /**
     * Run VSTEP structural validation after basic field validation passes.
     *
     * This is the API boundary — all structure checks happen here before data reaches Service.
     * DB constraints provide the final guard layer.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if ($v->errors()->isNotEmpty()) {
                return;
            }

            $versionData = $this->validated('version', []);
            if (empty($versionData)) {
                return;
            }

            $sections = collect($versionData['listening_sections'] ?? []);
            $passages = collect($versionData['reading_passages'] ?? []);

            // Build section_id → item mapping for validator
            $sectionIds = $sections->mapWithKeys(fn ($s, $i) => [$i => "sec_{$i}"])->all();
            $sectionItems = collect($versionData['listening_items'] ?? [])
                ->groupBy('section_index')
                ->mapWithKeys(fn ($items, $idx) => ["sec_{$idx}" => $items]);

            // Build passage_id → item mapping
            $passageIds = $passages->mapWithKeys(fn ($p, $i) => [$i => "pas_{$i}"])->all();
            $passageItems = collect($versionData['reading_items'] ?? [])
                ->groupBy('passage_index')
                ->mapWithKeys(fn ($items, $idx) => ["pas_{$idx}" => $items]);

            $validator = new ExamVersionValidator;
            $errors = $validator->validateFixtureData(
                $sections,
                $sectionItems,
                $passages,
                $passageItems,
                collect($versionData['writing_tasks'] ?? []),
                collect($versionData['speaking_parts'] ?? []),
            );

            foreach ($errors as $error) {
                $v->errors()->add('version', $error);
            }
        });
    }
}
