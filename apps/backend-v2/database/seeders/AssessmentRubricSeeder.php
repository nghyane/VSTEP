<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Assessment\Enums\AssessmentTaskType;
use App\Models\AssessmentRubric;
use Illuminate\Database\Seeder;

final class AssessmentRubricSeeder extends Seeder
{
    public function run(): void
    {
        foreach (AssessmentTaskType::cases() as $taskType) {
            AssessmentRubric::updateOrCreate(
                ['task_type' => $taskType->value, 'version' => 1],
                [
                    'skill' => $taskType->skill()->value,
                    'title' => $this->title($taskType),
                    'criteria' => $this->criteria($taskType),
                    'evidence_schema' => $this->evidenceSchema($taskType),
                    'scoring_policy' => ['scale' => 'vstep_0_10', 'rounding' => 'half_band'],
                    'is_active' => true,
                    'effective_from' => now(),
                ],
            );
        }
    }

    /** @return list<array{key: string, label: string, weight: float}> */
    private function criteria(AssessmentTaskType $taskType): array
    {
        if ($taskType->skill()->value === 'writing') {
            return [
                ['key' => 'task_fulfillment', 'label' => 'Task Fulfillment', 'weight' => 0.25],
                ['key' => 'organization', 'label' => 'Organization', 'weight' => 0.25],
                ['key' => 'grammar', 'label' => 'Grammar', 'weight' => 0.25],
                ['key' => 'vocabulary', 'label' => 'Vocabulary', 'weight' => 0.25],
            ];
        }

        return [
            ['key' => 'grammar', 'label' => 'Grammar', 'weight' => 0.20],
            ['key' => 'vocabulary', 'label' => 'Vocabulary', 'weight' => 0.20],
            ['key' => 'fluency', 'label' => 'Fluency', 'weight' => 0.20],
            ['key' => 'discourse_management', 'label' => 'Discourse Management', 'weight' => 0.20],
            ['key' => 'pronunciation', 'label' => 'Pronunciation', 'weight' => 0.20],
        ];
    }

    /** @return array<string,mixed> */
    private function evidenceSchema(AssessmentTaskType $taskType): array
    {
        return $taskType->skill()->value === 'writing'
            ? ['required' => ['points_covered', 'points_required', 'has_clear_position', 'has_irrelevant_content']]
            : ['required' => ['content_factor', 'transcript', 'pronunciation']];
    }

    private function title(AssessmentTaskType $taskType): string
    {
        return str($taskType->value)->replace('_', ' ')->title()->toString();
    }
}
