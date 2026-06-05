<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ExamSessionStatus;
use App\Exceptions\NotOwnerException;
use App\Models\ExamListeningPlayLog;
use App\Models\ExamSession;
use App\Models\ExamSessionDraft;
use App\Models\ExamVersionListeningSection;
use App\Models\Profile;
use App\Services\Contracts\ExamRoomInterface;
use Illuminate\Validation\ValidationException;

final class ExamRoomService implements ExamRoomInterface
{
    public function open(Profile $profile, ExamSession $session): array
    {
        if ($session->profile_id !== $profile->id) {
            throw new NotOwnerException;
        }

        $session->loadMissing([
            'examVersion.exam',
            'examVersion.listeningSections.items',
            'examVersion.readingPassages.items',
            'examVersion.writingTasks',
            'examVersion.speakingParts',
        ]);

        /** @var ExamSessionDraft|null $draft */
        $draft = ExamSessionDraft::query()->where('session_id', $session->id)->first();
        $version = $session->examVersion;
        $version->listeningSections->each(
            fn (ExamVersionListeningSection $section) => $section->items->each->makeHidden('correct_index')
        );
        $version->readingPassages->each(
            fn ($passage) => $passage->items->each->makeHidden('correct_index')
        );

        return [
            'session' => [
                ...$session->toArray(),
                'remaining_seconds' => max(0, (int) now()->diffInSeconds($session->server_deadline_at, false)),
            ],
            'exam' => $version->exam,
            'version' => $version,
            'draft' => $draft === null ? null : [
                'session_id' => $draft->session_id,
                'skill_idx' => $draft->skill_idx,
                'mcq_answers' => $draft->mcq_answers,
                'writing_answers' => $draft->writing_answers,
                'speaking_marks' => $draft->speaking_marks,
                'saved_at' => $draft->saved_at,
            ],
            'listening_play_summary' => $this->buildListeningPlaySummary($session),
            'actions' => [
                'can_answer' => $session->status === ExamSessionStatus::Active && $session->server_deadline_at->isFuture(),
                'can_submit' => $session->status === ExamSessionStatus::Active,
                'can_view_result' => $session->status->isTerminal(),
            ],
        ];
    }

    public function markListeningPlayed(Profile $profile, ExamSession $session, string $sectionId, ?string $clientIp): array
    {
        $this->assertOwner($profile, $session);

        if ($session->status !== ExamSessionStatus::Active || $session->server_deadline_at->isPast()) {
            throw ValidationException::withMessages(['session' => ['Session not active.']]);
        }

        if (! in_array('listening', $session->selected_skills ?? [], true)) {
            throw ValidationException::withMessages(['section_id' => ['Listening is not selected for this session.']]);
        }

        $section = $this->findListeningSection($session, $sectionId);

        $log = ExamListeningPlayLog::createOrFirst(
            ['session_id' => $session->id, 'section_id' => $section->id],
            ['played_at' => now(), 'client_ip' => $clientIp],
        );

        return [
            'section_id' => $section->id,
            'part' => $section->part,
            'played' => true,
            'already_played' => ! $log->wasRecentlyCreated,
            'played_at' => $log->played_at,
        ];
    }

    private function assertOwner(Profile $profile, ExamSession $session): void
    {
        if ($session->profile_id !== $profile->id) {
            throw new NotOwnerException;
        }
    }

    private function findListeningSection(ExamSession $session, string $sectionId): ExamVersionListeningSection
    {
        $session->loadMissing('examVersion.listeningSections');

        /** @var ExamVersionListeningSection|null $section */
        $section = $session->examVersion->listeningSections->firstWhere('id', $sectionId);
        if ($section === null) {
            throw ValidationException::withMessages(['section_id' => ['Section does not belong to this exam session.']]);
        }

        return $section;
    }

    /**
     * @return list<array{section_id:string,part:int,played:bool,played_at:mixed}>
     */
    private function buildListeningPlaySummary(ExamSession $session): array
    {
        $session->loadMissing(['examVersion.listeningSections', 'listeningPlayLogs']);
        $logs = $session->listeningPlayLogs->keyBy('section_id');

        return $session->examVersion->listeningSections
            ->map(function (ExamVersionListeningSection $section) use ($logs): array {
                /** @var ExamListeningPlayLog|null $log */
                $log = $logs->get($section->id);

                return [
                    'section_id' => $section->id,
                    'part' => $section->part,
                    'played' => $log !== null,
                    'played_at' => $log?->played_at,
                ];
            })
            ->values()
            ->all();
    }
}
