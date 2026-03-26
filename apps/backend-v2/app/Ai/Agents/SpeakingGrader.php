<?php

declare(strict_types=1);

namespace App\Ai\Agents;

use App\Ai\Tools\SubmitSpeakingGrade;
use App\Models\GradingRubric;
use App\Models\KnowledgePoint;
use App\Models\Submission;
use Illuminate\Database\Eloquent\Collection;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Promptable;
use Stringable;

#[Provider('local')]
#[Model('gpt-5.4')]
#[MaxSteps(3)]
#[MaxTokens(2048)]
#[Timeout(90)]
class SpeakingGrader implements Agent, HasTools
{
    use Promptable;

    private SubmitSpeakingGrade $submitTool;

    /**
     * @param  Collection<int, KnowledgePoint>  $knowledgeScope
     * @param  array{transcript: string, accuracy_score: float, fluency_score: float, prosody_score: float, word_errors: array}  $pronunciationData
     */
    public function __construct(
        public Submission $submission,
        public GradingRubric $rubric,
        public Collection $knowledgeScope,
        public array $pronunciationData,
    ) {
        $this->submitTool = new SubmitSpeakingGrade;
    }

    public function instructions(): Stringable|string
    {
        return view('grading.speaking-system', [
            'rubric' => $this->rubric,
            'question' => $this->submission->question,
            'knowledgeScope' => $this->knowledgeScope,
            'partNumber' => $this->submission->answer['part_number'] ?? 1,
            'pronunciation' => $this->pronunciationData,
        ])->render();
    }

    public function tools(): iterable
    {
        return [$this->submitTool];
    }

    public function getResult(): ?array
    {
        return $this->submitTool->getResult();
    }
}
