<?php

declare(strict_types=1);

namespace App\DTOs\Grading;

final class WritingGradingData extends GradingResultData
{
    /**
     * @param  array<string,float>  $rubricScores
     * @param  array<int,string>  $strengths
     * @param  array<int,array{message:string,explanation:string}>  $improvements
     * @param  array<int,array{original:string,improved:string,reason:string}>  $rewrites
     * @param  array<int,array<string,mixed>>  $annotations
     */
    public function __construct(
        array $rubricScores,
        float $overallBand,
        array $strengths,
        array $improvements,
        public readonly array $rewrites,
        public readonly array $annotations,
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
            'rewrites' => $this->rewrites,
            'annotations' => $this->annotations,
            'paragraph_feedback' => [],
            'rubric_id' => $this->rubricId,
        ];
    }
}
