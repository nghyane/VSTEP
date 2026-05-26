<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\GrammarPoint;
use App\Models\Profile;
use App\Models\ProfileGrammarMastery;
use App\Models\ProfileVocabSrsState;
use App\Models\VocabTopic;
use App\Services\Contracts\LearningPathInterface;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Read-only learning path snapshot — aggregates existing progress data
 * to tell the learner where they are and what to focus on next.
 *
 * No new models. No new tables. Pure query aggregation over:
 *   - ProgressService.chart() / predictLevel()
 *   - ProfileVocabSrsState + VocabTopic (vocabulary coverage per level)
 *   - ProfileGrammarMastery + GrammarPoint (grammar coverage per level)
 */
final class LearningPathService implements LearningPathInterface
{
    /**
     * Suggestion threshold — skills below this band trigger a suggestion.
     */
    private const WEAK_BAND_THRESHOLD = 5.0;

    public function __construct(
        private readonly ProgressService $progress,
    ) {}

    public function forProfile(Profile $profile): array
    {
        $chart = $this->progress->chart($profile);
        $currentLevel = $this->progress->predictLevel($chart, $profile->entry_level);
        $targetLevel = $profile->target_level;

        $deadline = $profile->target_deadline;
        $days = $deadline instanceof CarbonInterface
            ? max(0, (int) Carbon::now()->diffInDays($deadline, false))
            : null;

        return [
            'current_level' => $currentLevel ?? 'A1',
            'target_level' => $targetLevel,
            'days_remaining' => $days,
            'skills' => $this->buildSkills($profile, $chart, $currentLevel, $targetLevel),
        ];
    }

    /**
     * @param  array<string, float|int|null>|null  $chart
     * @return list<array<string, mixed>>
     */
    private function buildSkills(Profile $profile, ?array $chart, ?string $currentLevel, string $targetLevel): array
    {
        $level = $currentLevel ?? 'A1';

        return [
            $this->vocabSkill($profile, $level),
            $this->grammarSkill($profile, $level),
            $this->examSkill('writing', $chart, $level, $targetLevel),
            $this->examSkill('speaking', $chart, $level, $targetLevel),
            $this->examSkill('listening', $chart, $level, $targetLevel),
            $this->examSkill('reading', $chart, $level, $targetLevel),
        ];
    }

    // ──── Vocabulary ────

    /**
     * @return array{skill: string, level: string, band: null, coverage_pct: int, total_items: int, completed_items: int, suggestion: string|null}
     */
    private function vocabSkill(Profile $profile, string $level): array
    {
        $topicIds = VocabTopic::query()
            ->where('level', $level)
            ->where('is_published', true)
            ->pluck('id');

        $wordIds = DB::table('vocab_words')
            ->whereIn('topic_id', $topicIds)
            ->pluck('id');

        $totalItems = $wordIds->count();

        $completedItems = $totalItems > 0
            ? ProfileVocabSrsState::query()
                ->where('profile_id', $profile->id)
                ->whereIn('word_id', $wordIds)
                ->where('stability', '>', 0) // Learned = has FSRS stability
                ->count()
            : 0;

        $coveragePct = $totalItems > 0
            ? (int) round(($completedItems / $totalItems) * 100)
            : 0;

        $suggestion = $this->vocabSuggestion($level, $totalItems, $completedItems);

        return [
            'skill' => 'vocabulary',
            'level' => $level,
            'band' => null,
            'coverage_pct' => $coveragePct,
            'total_items' => $totalItems,
            'completed_items' => $completedItems,
            'suggestion' => $suggestion,
        ];
    }

    private function vocabSuggestion(string $level, int $total, int $completed): ?string
    {
        if ($total === 0) {
            return "Chưa có từ vựng cấp độ {$level} trong hệ thống.";
        }

        $remaining = $total - $completed;

        if ($completed === 0) {
            return "Bắt đầu học {$total} từ vựng {$level}. Hoàn thành ít nhất 50% trước khi chuyển cấp độ.";
        }

        if ($remaining > 0) {
            return "Còn {$remaining} từ vựng {$level} chưa học. Cần hoàn thành thêm để củng cố vốn từ.";
        }

        return "Đã hoàn thành tất cả từ vựng cấp độ {$level}. Sẵn sàng chuyển lên cấp độ cao hơn.";
    }

    // ──── Grammar ────

    /**
     * @return array{skill: string, level: string, band: null, coverage_pct: int, total_items: int, completed_items: int, suggestion: string|null}
     */
    private function grammarSkill(Profile $profile, string $level): array
    {
        $pointIds = GrammarPoint::query()
            ->where('is_published', true)
            ->whereHas('levels', fn ($q) => $q->where('level', $level))
            ->pluck('id');

        $totalItems = $pointIds->count();

        $completedItems = $totalItems > 0
            ? ProfileGrammarMastery::query()
                ->where('profile_id', $profile->id)
                ->whereIn('grammar_point_id', $pointIds)
                ->where('computed_level', 'mastered')
                ->count()
            : 0;

        $coveragePct = $totalItems > 0
            ? (int) round(($completedItems / $totalItems) * 100)
            : 0;

        $suggestion = $this->grammarSuggestion($level, $totalItems, $completedItems);

        return [
            'skill' => 'grammar',
            'level' => $level,
            'band' => null,
            'coverage_pct' => $coveragePct,
            'total_items' => $totalItems,
            'completed_items' => $completedItems,
            'suggestion' => $suggestion,
        ];
    }

    private function grammarSuggestion(string $level, int $total, int $completed): ?string
    {
        if ($total === 0) {
            return "Chưa có chủ điểm ngữ pháp cấp độ {$level} trong hệ thống.";
        }

        $remaining = $total - $completed;

        if ($completed === 0) {
            return "Bắt đầu học {$total} chủ điểm ngữ pháp {$level}. Tập trung vào các điểm có trong VSTEP Writing.";
        }

        if ($remaining > 0) {
            return "Còn {$remaining} chủ điểm ngữ pháp {$level} chưa mastered. Ưu tiên các điểm sai nhiều.";
        }

        return "Đã master tất cả chủ điểm ngữ pháp {$level}. Có thể chuyển lên cấp độ cao hơn.";
    }

    // ──── Exam skills (writing/speaking/listening/reading) ────

    /**
     * @param  array<string, float|int|null>|null  $chart
     * @return array{skill: string, level: string, band: float|null, coverage_pct: null, total_items: null, completed_items: null, suggestion: string|null}
     */
    private function examSkill(string $skill, ?array $chart, string $level, string $targetLevel): array
    {
        $bandRaw = $chart[$skill] ?? null;
        $band = $bandRaw !== null ? (float) $bandRaw : null;

        $suggestion = $this->examSuggestion($skill, $level, $targetLevel, $band, $chart);

        return [
            'skill' => $skill,
            'level' => $level,
            'band' => $band,
            'coverage_pct' => null,
            'total_items' => null,
            'completed_items' => null,
            'suggestion' => $suggestion,
        ];
    }

    /**
     * @param  array<string, float|int|null>|null  $chart
     */
    private function examSuggestion(string $skill, string $level, string $targetLevel, ?float $band, ?array $chart): ?string
    {
        $sampleSize = $chart['sample_size'] ?? 0;

        if ($band === null || $sampleSize < 1) {
            $skillLabel = $this->skillLabel($skill);

            return "Chưa có bài thi {$skillLabel} nào. Làm ít nhất 1 bài thi thử để hệ thống đánh giá trình độ.";
        }

        if ($band < self::WEAK_BAND_THRESHOLD) {
            $skillLabel = $this->skillLabel($skill);
            $targetBand = match ($targetLevel) {
                'C1' => 8.5,
                'B2' => 6.0,
                default => 4.0,
            };

            return "Band {$skillLabel} {$level} đang yếu ({$band} < {$targetBand} mục tiêu {$targetLevel}). Cần luyện tập thêm kỹ năng này.";
        }

        if ($band < $this->nextLevelThreshold($level)) {
            return $this->skillLabel($skill)." {$level}: band {$band} đang ở mức khá. Tiếp tục luyện tập để đạt chuẩn {$targetLevel}.";
        }

        return $this->skillLabel($skill)." {$level}: band {$band} đã vững. Có thể tập trung vào các kỹ năng yếu hơn.";
    }

    // ──── Helpers ────

    private function nextLevelThreshold(string $level): float
    {
        return match ($level) {
            'A1' => 3.5,
            'A2' => 4.0,
            'B1' => 6.0,
            'B2' => 8.5,
            default => 9.0,
        };
    }

    private function skillLabel(string $skill): string
    {
        return match ($skill) {
            'writing' => 'Viết',
            'speaking' => 'Nói',
            'listening' => 'Nghe',
            'reading' => 'Đọc',
            default => $skill,
        };
    }
}
