<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const VIETNAMESE_DESCRIPTORS = [
        'writing' => [
            'task_fulfillment' => [
                '10' => 'Đáp ứng đầy đủ yêu cầu đề, mục đích/lập trường rõ ràng và luận điểm được phát triển thuyết phục.',
                '8' => 'Đáp ứng hầu hết yêu cầu chính; ý tưởng nhìn chung phù hợp và được phát triển tương đối đầy đủ.',
                '6' => 'Đáp ứng yêu cầu đề ở mức cơ bản nhưng một số phần còn thiếu phát triển hoặc dẫn chứng chưa đủ.',
                '4' => 'Chỉ đáp ứng một phần yêu cầu; nội dung phát triển hạn chế hoặc lặp lại.',
                '0' => 'Không có bài làm đủ điều kiện chấm hoặc bài làm lạc đề.',
            ],
            'organization' => [
                '10' => 'Ý tưởng được sắp xếp logic, chia đoạn hiệu quả và dùng phương tiện liên kết tự nhiên.',
                '8' => 'Bố cục rõ ràng; cách chia đoạn và liên kết nhìn chung hiệu quả.',
                '6' => 'Tổ chức bài có thể hiểu được nhưng liên kết hoặc chia đoạn còn máy móc.',
                '4' => 'Bố cục yếu; ý tưởng có thể chỉ được liệt kê hoặc khó theo dõi.',
                '0' => 'Không có tổ chức bài viết đủ điều kiện đánh giá.',
            ],
            'grammar' => [
                '10' => 'Sử dụng đa dạng cấu trúc ngữ pháp linh hoạt và chính xác.',
                '8' => 'Sử dụng tốt cả cấu trúc đơn giản và phức tạp, chỉ mắc lỗi không thường xuyên.',
                '6' => 'Có kết hợp cấu trúc đơn giản và một số cấu trúc phức tạp; lỗi khá rõ nhưng nghĩa vẫn hiểu được.',
                '4' => 'Chủ yếu dùng cấu trúc đơn giản và mắc lỗi thường xuyên.',
                '0' => 'Không có ngữ pháp đủ điều kiện đánh giá.',
            ],
            'vocabulary' => [
                '10' => 'Sử dụng vốn từ rộng, chính xác và tự nhiên theo chủ đề.',
                '8' => 'Sử dụng từ vựng theo chủ đề khá đa dạng, lựa chọn từ nhìn chung phù hợp.',
                '6' => 'Có đủ từ vựng để hoàn thành nhiệm vụ nhưng còn lặp từ hoặc thiếu chính xác.',
                '4' => 'Từ vựng cơ bản, lặp lại nhiều; lỗi chọn từ có thể ảnh hưởng độ rõ nghĩa.',
                '0' => 'Không có từ vựng đủ điều kiện đánh giá.',
            ],
        ],
        'speaking' => [
            'grammar' => [
                '10' => 'Sử dụng đa dạng dạng ngữ pháp linh hoạt và chính xác khi nói.',
                '8' => 'Sử dụng nhiều cấu trúc phù hợp, chỉ có lỗi nhỏ.',
                '6' => 'Dùng cấu trúc đơn giản và một số cấu trúc phức tạp; lỗi khá rõ nhưng giao tiếp vẫn tiếp tục được.',
                '4' => 'Cấu trúc hạn chế và mắc lỗi thường xuyên.',
                '0' => 'Không có phần nói đủ điều kiện chấm.',
            ],
            'vocabulary' => [
                '10' => 'Sử dụng vốn từ rộng, chính xác và tự nhiên cho nhiệm vụ nói.',
                '8' => 'Sử dụng từ vựng đa dạng, lựa chọn từ nhìn chung phù hợp.',
                '6' => 'Có đủ từ để giao tiếp nhưng còn lặp từ hoặc đôi lúc thiếu chính xác.',
                '4' => 'Từ vựng cơ bản và thường phải tìm từ khi nói.',
                '0' => 'Không có từ vựng đủ điều kiện đánh giá.',
            ],
            'fluency' => [
                '10' => 'Nói được đoạn dài với nhịp độ tự nhiên và rất ít ngập ngừng.',
                '8' => 'Duy trì được mạch nói, chỉ đôi lúc ngập ngừng.',
                '6' => 'Có thể tiếp tục nói nhưng các khoảng dừng và việc diễn đạt lại còn khá rõ.',
                '4' => 'Bài nói rời rạc, thường xuyên ngập ngừng.',
                '0' => 'Không có phần nói đủ điều kiện chấm.',
            ],
            'discourse_management' => [
                '10' => 'Phát triển ý phù hợp một cách mạch lạc, có tổ chức rõ và dẫn chứng/hỗ trợ tốt.',
                '8' => 'Phát triển ý phù hợp với liên kết và hỗ trợ nhìn chung rõ ràng.',
                '6' => 'Trả lời đúng hướng nhưng phát triển ý hoặc liên kết còn hạn chế.',
                '4' => 'Câu trả lời ngắn, liên kết yếu hoặc chỉ liên quan một phần.',
                '0' => 'Không có câu trả lời đủ điều kiện chấm.',
            ],
            'pronunciation' => [
                '10' => 'Phát âm rõ và tự nhiên, trọng âm và ngữ điệu hiệu quả.',
                '8' => 'Phát âm rõ; lỗi nhỏ hiếm khi ảnh hưởng đến khả năng hiểu.',
                '6' => 'Nhìn chung vẫn hiểu được dù lỗi phát âm khá rõ.',
                '4' => 'Lỗi phát âm thường khiến người nghe khó hiểu.',
                '0' => 'Không có phần nói đủ điều kiện chấm.',
            ],
        ],
    ];

    private const ENGLISH_DESCRIPTORS = [
        'writing' => [
            'task_fulfillment' => [
                '10' => 'Addresses the task fully with a clear purpose/position and well-developed relevant support.',
                '8' => 'Addresses all main requirements; ideas are generally developed and relevant.',
                '6' => 'Addresses the task but some parts are underdeveloped or only partly supported.',
                '4' => 'Addresses only part of the task; development is limited or repetitive.',
                '0' => 'No assessable response, or the response is off-topic.',
            ],
            'organization' => [
                '10' => 'Ideas are logically organized with effective paragraphing and cohesive devices.',
                '8' => 'Organization is clear; paragraphing and linking are generally effective.',
                '6' => 'Overall organization is understandable, though links or paragraphing may be mechanical.',
                '4' => 'Organization is weak; ideas may be listed or difficult to follow.',
                '0' => 'No assessable organization.',
            ],
            'grammar' => [
                '10' => 'Uses a wide range of grammatical structures flexibly and accurately.',
                '8' => 'Uses a good range of simple and complex structures with only occasional errors.',
                '6' => 'Uses a mix of simple and some complex structures; errors are noticeable but meaning is clear.',
                '4' => 'Uses mostly simple structures with frequent errors.',
                '0' => 'No assessable grammar.',
            ],
            'vocabulary' => [
                '10' => 'Uses a wide, precise lexical range naturally for the topic.',
                '8' => 'Uses varied topic vocabulary with generally appropriate word choice.',
                '6' => 'Uses sufficient vocabulary for the task, with some repetition or imprecision.',
                '4' => 'Uses basic, repetitive vocabulary; word-choice errors may affect clarity.',
                '0' => 'No assessable vocabulary.',
            ],
        ],
        'speaking' => [
            'grammar' => [
                '10' => 'Uses a wide range of grammatical forms flexibly and accurately.',
                '8' => 'Uses a good range of structures with minor errors.',
                '6' => 'Uses simple and some complex forms; errors are noticeable but communication continues.',
                '4' => 'Uses limited structures with frequent errors.',
                '0' => 'No assessable speech.',
            ],
            'vocabulary' => [
                '10' => 'Uses broad and precise vocabulary naturally for the speaking task.',
                '8' => 'Uses varied vocabulary with generally appropriate word choice.',
                '6' => 'Uses enough vocabulary to communicate, with repetition or occasional imprecision.',
                '4' => 'Uses basic vocabulary and often searches for words.',
                '0' => 'No assessable vocabulary.',
            ],
            'fluency' => [
                '10' => 'Produces extended speech with natural pacing and very little hesitation.',
                '8' => 'Maintains speech with only occasional hesitation.',
                '6' => 'Can keep speaking, though pauses and reformulation are noticeable.',
                '4' => 'Speech is fragmented with frequent hesitation.',
                '0' => 'No assessable speech.',
            ],
            'discourse_management' => [
                '10' => 'Develops relevant ideas coherently with clear organization and support.',
                '8' => 'Develops relevant ideas with generally clear linking and support.',
                '6' => 'Gives relevant answers but development or linking may be limited.',
                '4' => 'Answers are short, weakly connected, or only partly relevant.',
                '0' => 'No assessable response.',
            ],
            'pronunciation' => [
                '10' => 'Pronunciation is clear and natural, with effective stress and intonation.',
                '8' => 'Pronunciation is clear; minor issues rarely affect understanding.',
                '6' => 'Generally understandable, though pronunciation issues are noticeable.',
                '4' => 'Pronunciation issues often make understanding difficult.',
                '0' => 'No assessable speech.',
            ],
        ],
    ];

    public function up(): void
    {
        foreach (self::VIETNAMESE_DESCRIPTORS as $skill => $descriptors) {
            $this->updateRubrics($skill, $descriptors);
        }
    }

    public function down(): void
    {
        foreach (self::ENGLISH_DESCRIPTORS as $skill => $descriptors) {
            $this->updateRubrics($skill, $descriptors);
        }
    }

    /** @param array<string,array<string,string>> $descriptorsByCriterion */
    private function updateRubrics(string $skill, array $descriptorsByCriterion): void
    {
        DB::table('grading_rubrics')
            ->where('skill', $skill)
            ->orderBy('id')
            ->get()
            ->each(function (object $rubric) use ($descriptorsByCriterion): void {
                $criteria = json_decode((string) $rubric->criteria, true);
                if (! is_array($criteria)) {
                    return;
                }

                $changed = false;
                foreach ($criteria as &$criterion) {
                    if (! is_array($criterion)) {
                        continue;
                    }

                    $key = (string) ($criterion['key'] ?? '');
                    if (! isset($descriptorsByCriterion[$key])) {
                        continue;
                    }

                    $criterion['band_descriptors'] = $descriptorsByCriterion[$key];
                    $changed = true;
                }
                unset($criterion);

                if (! $changed) {
                    return;
                }

                DB::table('grading_rubrics')
                    ->where('id', $rubric->id)
                    ->update(['criteria' => json_encode($criteria, JSON_THROW_ON_ERROR)]);
            });
    }
};
