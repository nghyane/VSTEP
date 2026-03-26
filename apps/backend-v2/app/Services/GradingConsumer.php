<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\NotificationType;
use App\Enums\SubmissionStatus;
use App\Enums\VstepBand;
use App\Models\Submission;
use App\Support\VstepScoring;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class GradingConsumer
{
    private const STREAM = 'grading:results';

    private const GROUP = 'backend';

    private const CONSUMER = 'backend-1';

    public function __construct(
        private readonly ProgressService $progressService,
        private readonly NotificationService $notificationService,
    ) {}

    public function ensureGroup(): void
    {
        try {
            Redis::xgroup('CREATE', self::STREAM, self::GROUP, '0', true);
        } catch (\Throwable $e) {
            if (! str_contains($e->getMessage(), 'BUSYGROUP')) {
                throw $e;
            }
        }
    }

    public function poll(int $count = 10, int $blockMs = 5000): int
    {
        $response = Redis::xreadgroup(
            self::GROUP,
            self::CONSUMER,
            [self::STREAM => '>'],
            $count,
            $blockMs,
        );

        if (! $response) {
            return 0;
        }

        $processed = 0;

        foreach ($response[self::STREAM] ?? [] as $messageId => $fields) {
            $payload = $fields['payload'] ?? null;
            if (! $payload) {
                Redis::xack(self::STREAM, self::GROUP, $messageId);

                continue;
            }

            $data = json_decode($payload, true);
            $this->processResult($data);
            Redis::xack(self::STREAM, self::GROUP, $messageId);
            $processed++;
        }

        return $processed;
    }

    private function processResult(array $data): void
    {
        $submissionId = $data['submissionId'] ?? null;
        if (! $submissionId) {
            return;
        }

        $submission = Submission::find($submissionId);
        if (! $submission) {
            Log::warning('grading_result_orphan', ['submission_id' => $submissionId]);

            return;
        }

        if ($data['failed'] ?? false) {
            $submission->update(['status' => SubmissionStatus::Failed]);

            $this->notificationService->send(
                $submission->user_id,
                NotificationType::System,
                'Chấm điểm thất bại',
                "Bài {$submission->skill->value} không thể chấm tự động. Vui lòng thử lại.",
                ['submission_id' => $submission->id],
            );

            return;
        }

        $score = VstepScoring::round($data['overallScore']);
        $confidence = $data['confidence'] ?? 'medium';

        $status = $confidence === 'low'
            ? SubmissionStatus::ReviewPending
            : SubmissionStatus::Completed;

        $submission->update([
            'status' => $status,
            'score' => $score,
            'band' => VstepBand::fromScore($score),
            'result' => $data,
            'feedback' => $data['feedback'] ?? null,
            'completed_at' => now(),
        ]);

        if ($status === SubmissionStatus::Completed) {
            $this->progressService->applySubmission($submission);
        }

        $this->notificationService->send(
            $submission->user_id,
            NotificationType::GradingComplete,
            'Bài làm đã được chấm điểm',
            "Bạn đạt {$score}/10 cho bài {$submission->skill->value}."
                .($status === SubmissionStatus::ReviewPending ? ' Đang chờ giảng viên xem lại.' : ''),
            ['submission_id' => $submission->id, 'score' => $score, 'confidence' => $confidence],
        );
    }
}
