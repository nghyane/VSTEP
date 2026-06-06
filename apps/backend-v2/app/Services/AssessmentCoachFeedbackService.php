<?php

declare(strict_types=1);

namespace App\Services;

use App\Ai\Contracts\SpeakingFeedbackGenerator;
use App\Ai\Contracts\WritingFeedbackGenerator;
use App\Assessment\Data\AssessmentInput;
use App\Assessment\Data\FeedbackBag;
use App\Assessment\Data\ScoreBag;
use App\Assessment\Data\SignalBag;
use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use Illuminate\Support\Facades\Log;
use Throwable;

final readonly class AssessmentCoachFeedbackService
{
    private const MIN_SPEAKING_FEEDBACK_WORDS = 20;

    private const MIN_SPEAKING_FEEDBACK_CONFIDENCE = 0.65;

    public function __construct(
        private WritingFeedbackGenerator $writingFeedback,
        private SpeakingFeedbackGenerator $speakingFeedback,
    ) {}

    public function forExam(AssessmentInput $input, SignalBag $signals, ScoreBag $scores, FeedbackBag $feedback): FeedbackBag
    {
        if ($input->sourceType !== AssessmentSourceType::Exam) {
            return $feedback;
        }

        try {
            return match ($input->skill) {
                AssessmentSkill::Writing => $this->withWritingFeedback($input, $signals, $feedback),
                AssessmentSkill::Speaking => $this->withSpeakingFeedback($input, $signals, $scores, $feedback),
            };
        } catch (Throwable $exception) {
            Log::warning('Exam coach feedback generation failed.', [
                'skill' => $input->skill->value,
                'source_id' => $input->sourceId,
                'error' => $exception->getMessage(),
            ]);

            return $feedback;
        }
    }

    private function withWritingFeedback(AssessmentInput $input, SignalBag $signals, FeedbackBag $feedback): FeedbackBag
    {
        $generated = $this->writingFeedback->generate(
            text: $input->text ?? '',
            promptText: $this->promptText($input->prompt),
            metrics: $signals->vocabulary,
            grammarErrors: $this->grammarErrors($signals),
            bandContext: null,
            part: (int) ($input->prompt['part'] ?? 2),
        );

        return $this->mergeFeedback($feedback, $generated);
    }

    private function withSpeakingFeedback(
        AssessmentInput $input,
        SignalBag $signals,
        ScoreBag $scores,
        FeedbackBag $feedback,
    ): FeedbackBag {
        if (! $this->hasAssessableSpeakingTranscript($signals)) {
            return $this->unassessableSpeakingFeedback($feedback, $signals);
        }

        $generated = $this->speakingFeedback->generate(
            transcript: (string) ($signals->speech['transcript'] ?? ''),
            promptText: $this->promptText($input->prompt),
            scores: $this->scoreMap($scores),
            metrics: [
                ...$signals->vocabulary,
                ...$signals->speech,
                ...$signals->coherence,
                'pronunciation' => $signals->pronunciation,
            ],
            bandContext: null,
        );

        return $this->mergeFeedback($feedback, $generated);
    }

    private function hasAssessableSpeakingTranscript(SignalBag $signals): bool
    {
        $wordCount = $this->speakingWordCount($signals);
        $confidence = $signals->speech['confidence'] ?? null;

        return $wordCount >= self::MIN_SPEAKING_FEEDBACK_WORDS
            && (! is_numeric($confidence) || (float) $confidence >= self::MIN_SPEAKING_FEEDBACK_CONFIDENCE);
    }

    private function unassessableSpeakingFeedback(FeedbackBag $feedback, SignalBag $signals): FeedbackBag
    {
        $wordCount = $this->speakingWordCount($signals);
        $confidence = $signals->speech['confidence'] ?? null;
        $improvements = $feedback->improvements;

        if ($wordCount < self::MIN_SPEAKING_FEEDBACK_WORDS) {
            $improvements[] = "Hệ thống chỉ nhận diện được {$wordCount} từ rõ ràng, chưa đủ dữ liệu để nhận xét nội dung bài nói.";
        }

        if (is_numeric($confidence) && (float) $confidence < self::MIN_SPEAKING_FEEDBACK_CONFIDENCE) {
            $improvements[] = 'Độ tin cậy transcript thấp ('.round((float) $confidence * 100).'%). Hãy thu âm lại ở nơi yên tĩnh và nói rõ từng câu.';
        }

        $improvements[] = 'Không tạo điểm mạnh tự động cho audio chưa đủ rõ để tránh phản hồi sai lệch.';

        return new FeedbackBag(
            strengths: [],
            improvements: array_values(array_unique($improvements)),
            warnings: array_values(array_unique([...$feedback->warnings, 'speaking_audio_unassessable'])),
            evidenceNotes: $feedback->evidenceNotes,
            rewrites: $feedback->rewrites,
        );
    }

    private function speakingWordCount(SignalBag $signals): int
    {
        return max(
            (int) ($signals->speech['word_count'] ?? 0),
            str_word_count((string) ($signals->speech['transcript'] ?? '')),
        );
    }

    /** @return list<array<string, mixed>> */
    private function grammarErrors(SignalBag $signals): array
    {
        $errors = $signals->grammar['errors'] ?? [];

        return is_array($errors) ? array_values($errors) : [];
    }

    /** @return array<string, float> */
    private function scoreMap(ScoreBag $scores): array
    {
        $map = [];
        foreach ($scores->criterionScores as $score) {
            $map[$score->key->value] = $score->score;
        }

        return $map;
    }

    /** @param array<string, mixed> $prompt */
    private function promptText(array $prompt): string
    {
        if (is_string($prompt['prompt'] ?? null)) {
            return $prompt['prompt'];
        }

        $content = $prompt['content'] ?? [];
        if (! is_array($content)) {
            return '';
        }

        return implode('. ', array_filter(array_map(
            fn (mixed $value): string => is_array($value)
                ? implode(' ', array_filter($value, 'is_string'))
                : (is_string($value) ? $value : ''),
            $content,
        )));
    }

    /** @param array<string, mixed> $generated */
    private function mergeFeedback(FeedbackBag $feedback, array $generated): FeedbackBag
    {
        return new FeedbackBag(
            strengths: $this->stringList($generated['strengths'] ?? []),
            improvements: $this->stringList($generated['improvements'] ?? []),
            warnings: $feedback->warnings,
            evidenceNotes: $feedback->evidenceNotes,
            rewrites: $this->stringList($generated['rewrites'] ?? []),
        );
    }

    /** @return list<string> */
    private function stringList(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        return array_values(array_filter(
            $items,
            fn (mixed $item): bool => is_string($item) && trim($item) !== '',
        ));
    }
}
