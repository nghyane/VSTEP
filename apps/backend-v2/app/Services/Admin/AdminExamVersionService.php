<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\Exam;
use App\Models\ExamVersion;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

final class AdminExamVersionService
{
    /**
     * List all versions of an exam (ordered by version_number desc).
     */
    public function listVersions(Exam $exam): Collection
    {
        return $exam->versions()
            ->orderByDesc('version_number')
            ->get();
    }

    /**
     * Get a version with all nested content eager-loaded.
     */
    public function getVersionDetail(ExamVersion $version): ExamVersion
    {
        return $version->load([
            'listeningSections.items',
            'readingPassages.items',
            'writingTasks',
            'speakingParts',
        ]);
    }

    /**
     * Create a new empty version for an exam.
     */
    public function createVersion(Exam $exam): ExamVersion
    {
        $nextNumber = (int) $exam->versions()->max('version_number') + 1;

        return ExamVersion::create([
            'exam_id' => $exam->id,
            'version_number' => $nextNumber,
            'is_active' => false,
        ]);
    }

    /**
     * Set a version as active (deactivates all others atomically).
     */
    public function setActive(ExamVersion $version): ExamVersion
    {
        return DB::transaction(function () use ($version) {
            ExamVersion::where('exam_id', $version->exam_id)
                ->where('id', '!=', $version->id)
                ->update(['is_active' => false]);

            $version->is_active = true;
            $version->published_at = now();
            $version->save();

            return $version->fresh();
        });
    }

    /**
     * Delete a version (cannot delete active version of published exam).
     */
    public function deleteVersion(ExamVersion $version): void
    {
        if ($version->is_active) {
            $isPublished = Exam::where('id', $version->exam_id)->value('is_published');
            if ($isPublished) {
                abort(422, 'Không thể xóa phiên bản đang hoạt động của đề thi đã xuất bản.');
            }
        }

        $version->delete();
    }
}
