<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\AssessmentResult;
use App\Models\GradingRubric;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read GradingRubric $resource
 */
final class AdminGradingRubricResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'skill' => $this->resource->skill,
            'version' => $this->resource->version,
            'name' => $this->resource->name,
            'source_reference' => $this->resource->source_reference,
            'criteria' => $this->resource->criteria,
            'scoring_formula' => $this->resource->scoring_formula,
            'is_active' => (bool) $this->resource->is_active,
            'lifecycle' => $this->lifecycle(),
            'admin_actions' => $this->adminActions(),
            'policy_summary' => $this->policySummary(),
            'effective_from' => $this->resource->effective_from?->toDateString(),
            'created_at' => $this->resource->created_at,
            'policies' => AdminScoringPolicyResource::collection(
                $this->whenLoaded('policies'),
            ),
            'active_policy' => new AdminScoringPolicyResource(
                $this->whenLoaded('activePolicy'),
            ),
        ];
    }

    /** @return array<string,mixed> */
    private function lifecycle(): array
    {
        $status = $this->lifecycleStatus();

        return [
            'status' => $status,
            'is_editable' => $status === 'draft',
            'read_only_reason' => $this->readOnlyReason($status),
        ];
    }

    /** @return array<string,bool> */
    private function adminActions(): array
    {
        return [
            'can_edit' => $this->lifecycleStatus() === 'draft',
            'can_clone' => true,
            'can_activate' => $this->lifecycleStatus() === 'draft',
            'can_archive' => $this->resource->is_active,
            'can_delete' => false,
        ];
    }

    private function lifecycleStatus(): string
    {
        if ($this->resource->is_active) {
            return 'active';
        }

        return AssessmentResult::query()->where('rubric_id', $this->resource->id)->exists()
            ? 'archived'
            : 'draft';
    }

    private function readOnlyReason(string $status): ?string
    {
        return match ($status) {
            'active' => 'Rubric đang active nên bị khóa chỉnh sửa. Hãy clone version mới để thay đổi chính sách chấm.',
            'archived' => 'Rubric đã có kết quả lịch sử nên bị khóa để bảo toàn dữ liệu chấm cũ.',
            default => null,
        };
    }

    /** @return array<string,mixed> */
    private function policySummary(): array
    {
        if ($this->resource->skill !== 'writing') {
            return [
                'assessment_gates' => null,
                'word_rules' => null,
                'criteria_weights' => $this->criteriaWeights(),
            ];
        }

        $params = $this->resource->taskFulfillmentParams();
        $severity = 'standard';
        foreach ($this->resource->criteria as $criterion) {
            if (is_array($criterion) && ($criterion['key'] ?? null) === 'task_fulfillment') {
                $severity = (string) (is_array($criterion['params'] ?? null) ? ($criterion['params']['severity'] ?? 'standard') : 'standard');
                break;
            }
        }

        return [
            'severity' => $severity,
            'severity_label' => self::severityLabel($severity),
            'assessment_gates' => [
                'severe_minimum_words_task1' => $params->severeMinimumWordsTask1,
                'severe_minimum_words_task2' => $params->severeMinimumWordsTask2,
                'minimum_covered_points' => $params->minimumCoveredPoints,
            ],
            'system_gates' => [
                'non_english' => [
                    'enabled' => true,
                    'description' => 'Hệ thống từ chối bài viết không phải tiếng Anh.',
                ],
                'copied_prompt' => [
                    'enabled' => true,
                    'description' => 'Hệ thống phát hiện bài làm sao chép lại đề bài.',
                ],
                'empty_text' => [
                    'enabled' => true,
                    'description' => 'Hệ thống từ chối bài nộp rỗng.',
                ],
                'profanity' => [
                    'enabled' => true,
                    'description' => 'Cảnh báo nếu bài có từ ngữ không phù hợp (không chặn điểm).',
                ],
            ],
            'word_rules' => [
                'official_minimum_task1' => $params->wordMinimumTask1,
                'official_minimum_task2' => $params->wordMinimumTask2,
                'short_response_caps' => $params->shortResponseCaps,
                'task_fulfillment_word_caps' => $params->taskFulfillmentWordCaps,
            ],
            'criteria_weights' => $this->criteriaWeights(),
        ];
    }

    /** @return array<string,float> */
    private function criteriaWeights(): array
    {
        $weights = [];
        foreach ($this->resource->criteria as $criterion) {
            if (! is_array($criterion) || ! isset($criterion['key'])) {
                continue;
            }

            $weights[(string) $criterion['key']] = (float) ($criterion['weight'] ?? 0);
        }

        return $weights;
    }

    private static function severityLabel(string $severity): string
    {
        return match ($severity) {
            'strict' => 'Chặt',
            'lenient' => 'Thoáng',
            default => 'Tiêu chuẩn',
        };
    }
}
