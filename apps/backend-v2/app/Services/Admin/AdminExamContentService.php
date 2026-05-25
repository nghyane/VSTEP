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
    /**
     * Guard: block edits on active version of published exam.
     */
    public function guardVersionEditable(ExamVersion $version): void
    {
        if ($version->is_active) {
            $isPublished = $version->exam()->value('is_published');
            if ($isPublished) {
                abort(422, 'Không thể sửa nội dung phiên bản đang hoạt động của đề thi đã xuất bản.');
            }
        }
    }

    // ─── Listening Sections ───

    public function createListeningSection(ExamVersion $version, array $data): ExamVersionListeningSection
    {
        $this->guardVersionEditable($version);

        return ExamVersionListeningSection::create([
            ...$data,
            'exam_version_id' => $version->id,
            'display_order' => $data['display_order'] ?? (int) $version->listeningSections()->max('display_order') + 1,
        ]);
    }

    public function updateListeningSection(ExamVersionListeningSection $section, array $data): ExamVersionListeningSection
    {
        $this->guardVersionEditable($section->version);
        $section->fill($data)->save();

        return $section;
    }

    public function deleteListeningSection(ExamVersionListeningSection $section): void
    {
        $this->guardVersionEditable($section->version);
        $section->delete();
    }

    // ─── Listening Items ───

    public function createListeningItem(ExamVersionListeningSection $section, array $data): ExamVersionListeningItem
    {
        $this->guardVersionEditable($section->version);

        return ExamVersionListeningItem::create([
            ...$data,
            'section_id' => $section->id,
            'display_order' => $data['display_order'] ?? (int) $section->items()->max('display_order') + 1,
        ]);
    }

    public function updateListeningItem(ExamVersionListeningItem $item, array $data): ExamVersionListeningItem
    {
        $this->guardVersionEditable($item->section->version);
        $item->fill($data)->save();

        return $item;
    }

    public function deleteListeningItem(ExamVersionListeningItem $item): void
    {
        $this->guardVersionEditable($item->section->version);
        $item->delete();
    }

    // ─── Reading Passages ───

    public function createReadingPassage(ExamVersion $version, array $data): ExamVersionReadingPassage
    {
        $this->guardVersionEditable($version);

        return ExamVersionReadingPassage::create([
            ...$data,
            'exam_version_id' => $version->id,
            'display_order' => $data['display_order'] ?? (int) $version->readingPassages()->max('display_order') + 1,
        ]);
    }

    public function updateReadingPassage(ExamVersionReadingPassage $passage, array $data): ExamVersionReadingPassage
    {
        $this->guardVersionEditable($passage->version);
        $passage->fill($data)->save();

        return $passage;
    }

    public function deleteReadingPassage(ExamVersionReadingPassage $passage): void
    {
        $this->guardVersionEditable($passage->version);
        $passage->delete();
    }

    // ─── Reading Items ───

    public function createReadingItem(ExamVersionReadingPassage $passage, array $data): ExamVersionReadingItem
    {
        $this->guardVersionEditable($passage->version);

        return ExamVersionReadingItem::create([
            ...$data,
            'passage_id' => $passage->id,
            'display_order' => $data['display_order'] ?? (int) $passage->items()->max('display_order') + 1,
        ]);
    }

    public function updateReadingItem(ExamVersionReadingItem $item, array $data): ExamVersionReadingItem
    {
        $this->guardVersionEditable($item->passage->version);
        $item->fill($data)->save();

        return $item;
    }

    public function deleteReadingItem(ExamVersionReadingItem $item): void
    {
        $this->guardVersionEditable($item->passage->version);
        $item->delete();
    }

    // ─── Writing Tasks ───

    public function createWritingTask(ExamVersion $version, array $data): ExamVersionWritingTask
    {
        $this->guardVersionEditable($version);

        return ExamVersionWritingTask::create([
            ...$data,
            'exam_version_id' => $version->id,
            'display_order' => $data['display_order'] ?? (int) $version->writingTasks()->max('display_order') + 1,
        ]);
    }

    public function updateWritingTask(ExamVersionWritingTask $task, array $data): ExamVersionWritingTask
    {
        $this->guardVersionEditable($task->version);
        $task->fill($data)->save();

        return $task;
    }

    public function deleteWritingTask(ExamVersionWritingTask $task): void
    {
        $this->guardVersionEditable($task->version);
        $task->delete();
    }

    // ─── Speaking Parts ───

    public function createSpeakingPart(ExamVersion $version, array $data): ExamVersionSpeakingPart
    {
        $this->guardVersionEditable($version);

        return ExamVersionSpeakingPart::create([
            ...$data,
            'exam_version_id' => $version->id,
            'display_order' => $data['display_order'] ?? (int) $version->speakingParts()->max('display_order') + 1,
        ]);
    }

    public function updateSpeakingPart(ExamVersionSpeakingPart $part, array $data): ExamVersionSpeakingPart
    {
        $this->guardVersionEditable($part->version);
        $part->fill($data)->save();

        return $part;
    }

    public function deleteSpeakingPart(ExamVersionSpeakingPart $part): void
    {
        $this->guardVersionEditable($part->version);
        $part->delete();
    }
}
