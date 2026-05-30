<?php

declare(strict_types=1);

namespace App\Assessment\Contracts;

use App\Assessment\Data\EvidenceBag;
use App\Assessment\Data\FeedbackBag;
use App\Assessment\Data\ScoreBag;
use App\Assessment\Data\SignalBag;

interface FeedbackBuilder
{
    public function build(ScoreBag $scores, EvidenceBag $evidence, SignalBag $signals): FeedbackBag;
}
