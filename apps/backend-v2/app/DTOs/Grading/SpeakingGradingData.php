<?php

declare(strict_types=1);

namespace App\DTOs\Grading;

final class SpeakingGradingData extends GradingResultData
{
    /**
     * @param  array<string,float>  $rubricScores
     * @param  array<int,string>  $strengths
     * @param  array<int,array{message:string,explanation:string}>  $improvements
     * @param  array<string,mixed>  $pronunciationReport
     */
    public function __construct(
        array $rubricScores,
        float $overallBand,
        array $strengths,
        array $improvements,
        public readonly string $transcript,
        public readonly array $pronunciationReport,
        ?string $rubricId = null,
    ) {
        parent::__construct($rubricScores, $overallBand, $strengths, $improvements, $rubricId);
    }

    public function toModelAttributes(): array
    {
        return [
            'rubric_scores' => $this->rubricScores,
            'overall_band' => $this->overallBand,
            'strengths' => $this->strengths,
            'improvements' => $this->improvements,
            'transcript' => $this->transcript,
            'pronunciation_report' => $this->pronunciationReport,
            'rubric_id' => $this->rubricId,
        ];
    }
}
