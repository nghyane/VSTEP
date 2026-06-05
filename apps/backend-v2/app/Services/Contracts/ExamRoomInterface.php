<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\ExamSession;
use App\Models\Profile;

interface ExamRoomInterface
{
    /**
     * @return array<string,mixed>
     */
    public function open(Profile $profile, ExamSession $session): array;

    /**
     * @return array{section_id:string,part:int,played:bool,already_played:bool,played_at:mixed}
     */
    public function markListeningPlayed(Profile $profile, ExamSession $session, string $sectionId, ?string $clientIp): array;
}
