<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AssessmentResult;

final class AssessmentResultDisplayService
{
    private const MAX_SCORE = 10.0;

    private const MIN_B1 = 4.0;

    private const MIN_B2 = 6.0;

    private const MIN_C1 = 8.5;

    /** @return array<string,mixed> */
    public function forResult(AssessmentResult $result): array
    {
        $band = (float) $result->overall_band;
        $reason = $this->reason($result->caps_applied ?? [], $band);
        $status = $this->status($band, $reason['code']);

        return [
            'status' => $status,
            'status_label' => $this->statusLabel($status),
            'level' => $this->level($band, $status),
            'level_label' => $this->levelLabel($band, $status),
            'is_assessable' => $status !== 'not_assessable',
            'is_passing' => $band >= self::MIN_B1,
            'score' => [
                'value' => $band,
                'max' => self::MAX_SCORE,
                'label' => number_format($band, 1).' / '.number_format(self::MAX_SCORE, 0),
                'should_show' => true,
                'emphasis' => $status === 'not_assessable' ? 'secondary' : 'primary',
            ],
            'reason' => $reason,
            'message' => $this->message($status, $reason['code']),
            'thresholds' => [
                'min_b1' => self::MIN_B1,
                'min_b2' => self::MIN_B2,
                'min_c1' => self::MIN_C1,
                'max_score' => self::MAX_SCORE,
            ],
            'ui' => [
                'tone' => $this->tone($status),
                'badge' => $this->statusLabel($status),
                'show_score' => true,
                'show_criterion_breakdown' => $status !== 'not_assessable',
                'show_feedback' => $status !== 'not_assessable',
                'primary_action' => $status === 'not_assessable' ? 'rewrite' : null,
            ],
        ];
    }

    private function status(float $band, string $reasonCode): string
    {
        if (in_array($reasonCode, ['not_assessable', 'speaking_too_short', 'speaking_unreliable'], true)) {
            return 'not_assessable';
        }

        return $band >= self::MIN_B1 ? 'passed' : 'below_b1';
    }

    private function level(float $band, string $status): ?string
    {
        if ($status === 'not_assessable') {
            return null;
        }

        return match (true) {
            $band >= self::MIN_C1 => 'C1',
            $band >= self::MIN_B2 => 'B2',
            $band >= self::MIN_B1 => 'B1',
            default => 'below_b1',
        };
    }

    private function levelLabel(float $band, string $status): string
    {
        if ($status === 'not_assessable') {
            return 'Không đủ điều kiện chấm';
        }

        return match ($this->level($band, $status)) {
            'C1' => 'C1',
            'B2' => 'B2',
            'B1' => 'B1',
            default => 'Không đạt B1',
        };
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'not_assessable' => 'Không đủ điều kiện chấm',
            'below_b1' => 'Không đạt B1',
            default => 'Đạt',
        };
    }

    private function message(string $status, string $reasonCode): string
    {
        if ($status === 'not_assessable') {
            return match ($reasonCode) {
                'speaking_unreliable' => 'Audio chưa đủ rõ để chấm tin cậy. Hãy thu âm lại ở nơi yên tĩnh và nói rõ từng câu.',
                'speaking_too_short' => 'Audio chưa nhận diện được đủ nội dung để chấm tin cậy. Hãy thu âm lại ở nơi yên tĩnh và nói rõ hơn.',
                'too_short' => 'Bài quá ngắn hoặc chưa có đủ nội dung để đánh giá. Hãy viết lại bài đầy đủ hơn.',
                default => 'Bài chưa đủ điều kiện chấm. Hãy viết lại bài với nội dung tiếng Anh rõ ràng hơn.',
            };
        }

        if ($status === 'below_b1') {
            if ($reasonCode === 'low_asr_confidence') {
                return 'Audio chưa đủ rõ nên transcript không đáng tin cậy. Hãy thu âm lại trước khi dựa vào điểm AI.';
            }

            return 'Bài chưa đạt ngưỡng B1. Hãy xem góp ý chi tiết để cải thiện các tiêu chí còn yếu.';
        }

        return 'Bài đã đạt ngưỡng đánh giá. Hãy xem breakdown để biết điểm mạnh và điểm cần cải thiện.';
    }

    private function tone(string $status): string
    {
        return match ($status) {
            'not_assessable' => 'danger',
            'below_b1' => 'warning',
            default => 'success',
        };
    }

    /** @param array<string,mixed> $capsApplied */
    private function reason(array $capsApplied, float $band): array
    {
        $shortResponse = $capsApplied['short_response_word_count'] ?? null;
        if (is_array($shortResponse)) {
            $cap = (float) ($shortResponse['cap'] ?? $band);

            return [
                'code' => $cap <= 1.0 ? 'not_assessable' : 'too_short',
                'label' => $cap <= 1.0 ? 'Không đủ dữ liệu chấm' : 'Bài quá ngắn',
                'source' => 'short_response_word_count',
                'details' => $shortResponse,
            ];
        }

        if (($capsApplied['type'] ?? null) === 'assessment_requirements_not_met') {
            return [
                'code' => 'not_assessable',
                'label' => 'Bài chưa đáp ứng yêu cầu bắt buộc',
                'source' => 'assessment_requirements_not_met',
                'details' => $capsApplied,
            ];
        }

        if (($capsApplied['type'] ?? null) === 'speaking_response_too_short') {
            return [
                'code' => 'speaking_too_short',
                'label' => 'Audio chưa đủ dữ liệu chấm',
                'source' => 'speaking_response_too_short',
                'details' => $capsApplied,
            ];
        }

        if (($capsApplied['type'] ?? null) === 'speaking_audio_unassessable') {
            return [
                'code' => 'speaking_unreliable',
                'label' => 'Audio chưa đủ tin cậy',
                'source' => 'speaking_audio_unassessable',
                'details' => $capsApplied,
            ];
        }

        $lowAsrConfidence = $capsApplied['low_asr_confidence'] ?? null;
        if (is_array($lowAsrConfidence)) {
            return [
                'code' => 'low_asr_confidence',
                'label' => 'Transcript không đủ tin cậy',
                'source' => 'low_asr_confidence',
                'details' => $lowAsrConfidence,
            ];
        }

        if (($capsApplied['type'] ?? null) === 'content_cap') {
            return [
                'code' => 'content_cap',
                'label' => 'Nội dung chưa đáp ứng yêu cầu đề',
                'source' => 'content_cap',
                'details' => $capsApplied,
            ];
        }

        return [
            'code' => $band < self::MIN_B1 ? 'below_b1' : 'none',
            'label' => $band < self::MIN_B1 ? 'Chưa đạt ngưỡng B1' : null,
            'source' => null,
            'details' => [],
        ];
    }
}
