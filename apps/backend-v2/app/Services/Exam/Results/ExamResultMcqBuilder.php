<?php

declare(strict_types=1);

namespace App\Services\Exam\Results;

use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Services\Contracts\ExamResultDisplayFormatterInterface;
use App\Services\Contracts\ExamResultMcqBuilderInterface;

final readonly class ExamResultMcqBuilder implements ExamResultMcqBuilderInterface
{
    public function __construct(
        private ExamResultDisplayFormatterInterface $formatter,
    ) {}

    public function detail(ExamSession $session): array
    {
        $answers = $session->mcqAnswers->keyBy(
            fn (ExamMcqAnswer $answer): string => "{$answer->item_ref_type}:{$answer->item_ref_id}",
        );
        $skills = $session->selected_skills ?? [];
        $rows = [];

        if (in_array('listening', $skills, true)) {
            foreach ($session->examVersion->listeningSections as $section) {
                foreach ($section->items as $item) {
                    $rows[] = $this->row(
                        'exam_listening_item',
                        $item->id,
                        $item->correct_index,
                        $answers->get("exam_listening_item:{$item->id}"),
                    );
                }
            }
        }

        if (in_array('reading', $skills, true)) {
            foreach ($session->examVersion->readingPassages as $passage) {
                foreach ($passage->items as $item) {
                    $rows[] = $this->row(
                        'exam_reading_item',
                        $item->id,
                        $item->correct_index,
                        $answers->get("exam_reading_item:{$item->id}"),
                    );
                }
            }
        }

        return $rows;
    }

    public function summary(array $mcqDetail): array
    {
        $score = 0;
        $answered = 0;
        foreach ($mcqDetail as $row) {
            if ($row['selected_index'] !== null) {
                $answered++;
            }
            if ($row['is_correct']) {
                $score++;
            }
        }
        $total = count($mcqDetail);
        $unanswered = $total - $answered;

        return [
            'score' => $score,
            'total' => $total,
            'answered' => $answered,
            'wrong' => $answered - $score,
            'unanswered' => $unanswered,
            'score_on_10' => $total > 0 ? round($score / $total * 10, 1) : 0.0,
        ];
    }

    /** @return array<string, mixed> */
    private function row(string $itemRefType, string $itemRefId, int $correctIndex, ?ExamMcqAnswer $answer): array
    {
        $selectedIndex = $answer?->selected_index;
        $answered = $selectedIndex !== null;
        $isCorrect = $answered && $selectedIndex === $correctIndex;
        $answerStatus = $this->formatter->mcqAnswerStatus($answered, $isCorrect);
        $selectedLabel = $selectedIndex === null ? null : $this->formatter->mcqOptionLabel((int) $selectedIndex);
        $correctLabel = $this->formatter->mcqOptionLabel($correctIndex);

        return [
            'item_ref_type' => $itemRefType,
            'item_ref_id' => $itemRefId,
            'selected_index' => $selectedIndex,
            'correct_index' => $correctIndex,
            'answered' => $answered,
            'is_correct' => $isCorrect,
            'answer_status' => $answerStatus,
            'answer_status_label' => $this->formatter->mcqAnswerStatusLabel($answerStatus),
            'answer_tone' => $this->formatter->mcqAnswerTone($answerStatus),
            'selected_label' => $selectedLabel,
            'correct_label' => $correctLabel,
            'selected_summary_label' => $selectedLabel === null ? 'Bạn chưa trả lời' : "Bạn chọn {$selectedLabel}",
            'correct_summary_label' => "Đáp án đúng {$correctLabel}",
            'correct_badge_label' => 'Đúng',
            'selected_badge_label' => 'Bạn chọn',
            'answered_at' => $answer?->answered_at,
        ];
    }
}
