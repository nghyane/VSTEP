<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\ExamVersion;
use App\Models\ExamVersionListeningItem;
use App\Models\ExamVersionListeningSection;
use App\Models\ExamVersionReadingItem;
use App\Models\ExamVersionReadingPassage;
use App\Models\ExamVersionSpeakingPart;
use App\Models\ExamVersionWritingTask;

final class AdminExamContentService
{
    // ─── Listening Sections ───

    public function createListeningSection(ExamVersion $version, array $data): ExamVersionListeningSection
    {
        $data['exam_version_id'] = $version->id;
        $data['display_order'] ??= (int) $version->listeningSections()->max('display_order') + 1;

        return ExamVersionListeningSection::create($data);
    }

    public function updateListeningSection(ExamVersionListeningSection $section, array $data): ExamVersionListeningSection
    {
        $section->fill($data)->save();

        return $section;
    }

    public function deleteListeningSection(ExamVersionListeningSection $section): void
    {
        $section->delete();
    }

    // ─── Listening Items ───

    public function createListeningItem(ExamVersionListeningSection $section, array $data): ExamVersionListeningItem
    {
        $data['section_id'] = $section->id;
        $data['display_order'] ??= (int) $section->items()->max('display_order') + 1;

        return ExamVersionListeningItem::create($data);
    }

    public function updateListeningItem(ExamVersionListeningItem $item, array $data): ExamVersionListeningItem
    {
        $item->fill($data)->save();

        return $item;
    }

    public function deleteListeningItem(ExamVersionListeningItem $item): void
    {
        $item->delete();
    }

    // ─── Reading Passages ───

    public function createReadingPassage(ExamVersion $version, array $data): ExamVersionReadingPassage
    {
        $data['exam_version_id'] = $version->id;
        $data['display_order'] ??= (int) $version->readingPassages()->max('display_order') + 1;

        return ExamVersionReadingPassage::create($data);
    }

    public function updateReadingPassage(ExamVersionReadingPassage $passage, array $data): ExamVersionReadingPassage
    {
        $passage->fill($data)->save();

        return $passage;
    }

    public function deleteReadingPassage(ExamVersionReadingPassage $passage): void
    {
        $passage->delete();
    }

    // ─── Reading Items ───

    public function createReadingItem(ExamVersionReadingPassage $passage, array $data): ExamVersionReadingItem
    {
        $data['passage_id'] = $passage->id;
        $data['display_order'] ??= (int) $passage->items()->max('display_order') + 1;

        return ExamVersionReadingItem::create($data);
    }

    public function updateReadingItem(ExamVersionReadingItem $item, array $data): ExamVersionReadingItem
    {
        $item->fill($data)->save();

        return $item;
    }

    public function deleteReadingItem(ExamVersionReadingItem $item): void
    {
        $item->delete();
    }

    // ─── Writing Tasks ───

    public function createWritingTask(ExamVersion $version, array $data): ExamVersionWritingTask
    {
        $data['exam_version_id'] = $version->id;
        $data['display_order'] ??= (int) $version->writingTasks()->max('display_order') + 1;

        return ExamVersionWritingTask::create($data);
    }

    public function updateWritingTask(ExamVersionWritingTask $task, array $data): ExamVersionWritingTask
    {
        $task->fill($data)->save();

        return $task;
    }

    public function deleteWritingTask(ExamVersionWritingTask $task): void
    {
        $task->delete();
    }

    // ─── Speaking Parts ───

    public function createSpeakingPart(ExamVersion $version, array $data): ExamVersionSpeakingPart
    {
        $data['exam_version_id'] = $version->id;
        $data['display_order'] ??= (int) $version->speakingParts()->max('display_order') + 1;

        return ExamVersionSpeakingPart::create($data);
    }

    public function updateSpeakingPart(ExamVersionSpeakingPart $part, array $data): ExamVersionSpeakingPart
    {
        $part->fill($data)->save();

        return $part;
    }

    public function deleteSpeakingPart(ExamVersionSpeakingPart $part): void
    {
        $part->delete();
    }
}
