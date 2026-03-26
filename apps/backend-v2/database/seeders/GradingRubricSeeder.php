<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GradingRubric;
use Illuminate\Database\Seeder;

class GradingRubricSeeder extends Seeder
{
    public function run(): void
    {
        $levels = ['B1', 'B2', 'C1'];

        foreach ($levels as $level) {
            $this->seedWritingRubric($level);
            $this->seedSpeakingRubric($level);
        }
    }

    private function seedWritingRubric(string $level): void
    {
        $rubric = GradingRubric::firstOrCreate([
            'skill' => 'writing',
            'level' => $level,
        ]);

        $criteria = [
            [
                'key' => 'task_fulfillment',
                'name' => 'Hoàn thành yêu cầu',
                'description' => 'Đáp ứng đầy đủ yêu cầu đề bài. Nội dung đầy đủ, rõ ràng, phát triển ý thấu đáo. Độ dài phù hợp với yêu cầu (Task 1: ≥120 từ, Task 2: ≥250 từ). Văn phong phù hợp ngữ cảnh.',
                'band_descriptors' => $this->writingBands('task_fulfillment', $level),
            ],
            [
                'key' => 'organization',
                'name' => 'Tổ chức bài viết',
                'description' => 'Bố cục logic, phân đoạn rõ ràng. Sử dụng từ nối (cohesive devices) hiệu quả. Mạch lạc tổng thể, ý tưởng được sắp xếp có hệ thống.',
                'band_descriptors' => $this->writingBands('organization', $level),
            ],
            [
                'key' => 'vocabulary',
                'name' => 'Từ vựng',
                'description' => 'Vốn từ phong phú, đa dạng, phù hợp chủ đề. Sử dụng đúng ngữ cảnh, collocations phù hợp. Có sử dụng từ vựng học thuật và ít thông dụng khi cần.',
                'band_descriptors' => $this->writingBands('vocabulary', $level),
            ],
            [
                'key' => 'grammar',
                'name' => 'Ngữ pháp',
                'description' => 'Đa dạng cấu trúc ngữ pháp. Chính xác trong sử dụng thì, câu phức, mệnh đề. Kiểm soát tốt câu phức và cấu trúc nâng cao.',
                'band_descriptors' => $this->writingBands('grammar', $level),
            ],
        ];

        foreach ($criteria as $i => $data) {
            $rubric->criteria()->updateOrCreate(
                ['key' => $data['key']],
                [...$data, 'sort_order' => $i, 'weight' => 1.0],
            );
        }
    }

    private function seedSpeakingRubric(string $level): void
    {
        $rubric = GradingRubric::firstOrCreate([
            'skill' => 'speaking',
            'level' => $level,
        ]);

        $criteria = [
            [
                'key' => 'fluency_coherence',
                'name' => 'Độ trôi chảy & Liên kết',
                'description' => 'Nói tự nhiên, ít ngập ngừng, tự sửa lỗi tốt. Sắp xếp ý logic, sử dụng từ liên kết phù hợp. Phát triển chủ đề mạch lạc.',
                'band_descriptors' => $this->speakingBands('fluency_coherence', $level),
            ],
            [
                'key' => 'vocabulary',
                'name' => 'Từ vựng',
                'description' => 'Vốn từ phong phú, chính xác, phù hợp chủ đề. Sử dụng từ chuyên ngành và học thuật khi cần. Paraphrase linh hoạt.',
                'band_descriptors' => $this->speakingBands('vocabulary', $level),
            ],
            [
                'key' => 'grammar',
                'name' => 'Ngữ pháp',
                'description' => 'Đa dạng cấu trúc câu trong ngữ cảnh nói. Kết hợp câu đơn, ghép, phức. Chính xác trong sử dụng thì và cấu trúc.',
                'band_descriptors' => $this->speakingBands('grammar', $level),
            ],
            [
                'key' => 'pronunciation',
                'name' => 'Phát âm',
                'description' => 'Phát âm rõ ràng các âm đơn lẻ và âm cuối. Trọng âm từ/câu chính xác. Ngữ điệu tự nhiên, phù hợp ngữ cảnh.',
                'band_descriptors' => $this->speakingBands('pronunciation', $level),
            ],
            [
                'key' => 'task_fulfillment',
                'name' => 'Nội dung & Hoàn thành yêu cầu',
                'description' => 'Trả lời đúng câu hỏi, phát triển ý đầy đủ, logic. Nội dung phù hợp ngữ cảnh part (Part 1: ngắn gọn, Part 2: thảo luận giải pháp, Part 3: phát triển quan điểm).',
                'band_descriptors' => $this->speakingBands('task_fulfillment', $level),
            ],
        ];

        foreach ($criteria as $i => $data) {
            $rubric->criteria()->updateOrCreate(
                ['key' => $data['key']],
                [...$data, 'sort_order' => $i, 'weight' => 1.0],
            );
        }
    }

    /**
     * Band descriptors vary by level — higher levels expect more sophisticated performance.
     */
    private function writingBands(string $criterion, string $level): array
    {
        $bands = [
            'task_fulfillment' => [
                'B1' => [
                    '9-10' => 'Đáp ứng hoàn toàn yêu cầu đề bài, nội dung rõ ràng dù chủ đề quen thuộc. Phát triển ý đầy đủ với ví dụ đơn giản.',
                    '7-8' => 'Đáp ứng phần lớn yêu cầu, nội dung liên quan. Phát triển ý khá tốt nhưng đôi chỗ còn chung chung.',
                    '5-6' => 'Đáp ứng cơ bản yêu cầu đề bài. Nội dung đúng hướng nhưng thiếu phát triển, ví dụ hạn chế.',
                    '3-4' => 'Chỉ đáp ứng một phần yêu cầu. Nội dung sơ sài, lạc đề một phần.',
                    '1-2' => 'Hầu như không đáp ứng yêu cầu. Nội dung không liên quan hoặc quá ngắn.',
                ],
                'B2' => [
                    '9-10' => 'Đáp ứng hoàn toàn yêu cầu, nội dung sâu sắc với lập luận thuyết phục. Phát triển ý thấu đáo, ví dụ cụ thể và đa dạng.',
                    '7-8' => 'Đáp ứng tốt yêu cầu, lập luận rõ ràng. Phát triển ý tốt, có ví dụ phù hợp nhưng đôi chỗ chưa sâu.',
                    '5-6' => 'Đáp ứng yêu cầu cơ bản, lập luận có nhưng chưa thuyết phục. Phát triển ý trung bình.',
                    '3-4' => 'Đáp ứng một phần, thiếu lập luận rõ ràng. Nội dung hời hợt.',
                    '1-2' => 'Không đáp ứng yêu cầu. Nội dung lạc đề hoặc không thể đánh giá.',
                ],
                'C1' => [
                    '9-10' => 'Đáp ứng xuất sắc mọi yêu cầu. Lập luận chặt chẽ, sâu sắc, có tư duy phản biện. Ví dụ phong phú, thuyết phục.',
                    '7-8' => 'Đáp ứng tốt yêu cầu phức tạp, lập luận logic. Phát triển ý sâu, đôi chỗ có thể elaborate thêm.',
                    '5-6' => 'Đáp ứng yêu cầu nhưng lập luận chưa đủ sâu cho trình độ C1. Thiếu tư duy phản biện.',
                    '3-4' => 'Đáp ứng hạn chế, nội dung nông. Không phù hợp kỳ vọng C1.',
                    '1-2' => 'Không đáp ứng yêu cầu. Nội dung sơ sài.',
                ],
            ],
            'organization' => [
                'B1' => [
                    '9-10' => 'Bố cục rõ ràng: mở bài, thân bài, kết luận. Từ nối đơn giản nhưng hiệu quả. Ý tưởng được sắp xếp logic.',
                    '7-8' => 'Bố cục khá rõ ràng, phân đoạn hợp lý. Sử dụng được một số từ nối cơ bản.',
                    '5-6' => 'Có bố cục cơ bản nhưng đôi chỗ chưa rõ ràng. Từ nối hạn chế, lặp lại.',
                    '3-4' => 'Bố cục lộn xộn, thiếu phân đoạn. Ít hoặc không dùng từ nối.',
                    '1-2' => 'Không có bố cục rõ ràng. Các ý rời rạc, không liên kết.',
                ],
                'B2' => [
                    '9-10' => 'Bố cục chặt chẽ, logic. Phân đoạn rõ ràng với topic sentences. Từ nối đa dạng, tự nhiên. Mạch lạc cao.',
                    '7-8' => 'Bố cục tốt, phân đoạn hợp lý. Từ nối đa dạng, đôi chỗ chưa tự nhiên.',
                    '5-6' => 'Bố cục cơ bản, phân đoạn có nhưng chưa nhất quán. Từ nối hạn chế.',
                    '3-4' => 'Bố cục yếu, thiếu logic. Từ nối máy móc hoặc thiếu.',
                    '1-2' => 'Không có tổ chức. Ý lộn xộn.',
                ],
                'C1' => [
                    '9-10' => 'Bố cục xuất sắc, tổ chức tinh tế. Từ nối đa dạng, nâng cao, tự nhiên. Mạch lạc hoàn hảo giữa các đoạn.',
                    '7-8' => 'Bố cục chặt chẽ, từ nối phong phú. Mạch lạc tốt, đôi chỗ có thể tinh tế hơn.',
                    '5-6' => 'Bố cục ổn nhưng chưa đạt kỳ vọng C1. Từ nối chưa đủ đa dạng.',
                    '3-4' => 'Bố cục hạn chế, thiếu sự tinh tế. Từ nối cơ bản.',
                    '1-2' => 'Không có tổ chức phù hợp.',
                ],
            ],
            'vocabulary' => [
                'B1' => [
                    '9-10' => 'Từ vựng đủ cho chủ đề quen thuộc, dùng đúng. Có một số collocations tốt.',
                    '7-8' => 'Từ vựng phù hợp, đôi chỗ lặp lại. Collocations cơ bản đúng.',
                    '5-6' => 'Từ vựng hạn chế nhưng đủ truyền đạt ý. Lặp lại nhiều, đôi chỗ dùng sai.',
                    '3-4' => 'Từ vựng nghèo, thường xuyên dùng sai. Lặp lại rất nhiều.',
                    '1-2' => 'Từ vựng rất hạn chế, không đủ truyền đạt ý.',
                ],
                'B2' => [
                    '9-10' => 'Từ vựng phong phú, đa dạng, chính xác. Sử dụng được từ ít thông dụng, collocations tự nhiên.',
                    '7-8' => 'Từ vựng khá đa dạng, phần lớn chính xác. Đôi chỗ dùng từ chưa tự nhiên.',
                    '5-6' => 'Từ vựng đủ dùng nhưng thiếu đa dạng. Một số lỗi dùng từ.',
                    '3-4' => 'Từ vựng hạn chế, thường xuyên lặp lại và dùng sai.',
                    '1-2' => 'Từ vựng rất nghèo, gây khó hiểu.',
                ],
                'C1' => [
                    '9-10' => 'Từ vựng rất phong phú, linh hoạt, chính xác. Sử dụng thành ngữ, từ học thuật, collocations nâng cao tự nhiên.',
                    '7-8' => 'Từ vựng phong phú, có từ học thuật. Đôi chỗ chưa hoàn toàn tự nhiên.',
                    '5-6' => 'Từ vựng khá nhưng chưa đạt kỳ vọng C1. Thiếu từ nâng cao.',
                    '3-4' => 'Từ vựng hạn chế cho trình độ C1.',
                    '1-2' => 'Từ vựng không phù hợp trình độ.',
                ],
            ],
            'grammar' => [
                'B1' => [
                    '9-10' => 'Sử dụng đúng các cấu trúc cơ bản, có thể dùng một số câu phức đơn giản. Ít lỗi.',
                    '7-8' => 'Cấu trúc cơ bản chính xác. Thử dùng câu phức nhưng đôi chỗ sai.',
                    '5-6' => 'Cấu trúc đơn giản phần lớn đúng. Lỗi khi dùng câu phức nhưng nghĩa vẫn rõ.',
                    '3-4' => 'Lỗi thường xuyên cả câu đơn. Gây khó hiểu.',
                    '1-2' => 'Lỗi nghiêm trọng, gần như không kiểm soát ngữ pháp.',
                ],
                'B2' => [
                    '9-10' => 'Đa dạng cấu trúc phức tạp, chính xác cao. Kiểm soát tốt câu phức, mệnh đề quan hệ.',
                    '7-8' => 'Đa dạng cấu trúc, chính xác phần lớn. Lỗi nhỏ không ảnh hưởng giao tiếp.',
                    '5-6' => 'Sử dụng được câu đơn và câu phức nhưng còn lỗi. Nghĩa vẫn rõ ràng.',
                    '3-4' => 'Chủ yếu câu đơn, lỗi thường xuyên gây khó hiểu.',
                    '1-2' => 'Chỉ dùng được vài mẫu câu đơn giản, lỗi nghiêm trọng.',
                ],
                'C1' => [
                    '9-10' => 'Kiểm soát xuất sắc cấu trúc phức tạp. Đa dạng cao, hiếm khi lỗi. Sử dụng thành thạo đảo ngữ, mệnh đề phức.',
                    '7-8' => 'Đa dạng cấu trúc nâng cao, chính xác cao. Lỗi rất ít và nhỏ.',
                    '5-6' => 'Có dùng cấu trúc nâng cao nhưng chưa nhất quán. Một số lỗi.',
                    '3-4' => 'Cấu trúc hạn chế cho C1. Lỗi đáng kể.',
                    '1-2' => 'Không đạt kỳ vọng ngữ pháp C1.',
                ],
            ],
        ];

        return $bands[$criterion][$level];
    }

    private function speakingBands(string $criterion, string $level): array
    {
        $bands = [
            'fluency_coherence' => [
                'B1' => [
                    '9-10' => 'Nói trôi chảy về chủ đề quen thuộc. Ngập ngừng ít, tự sửa lỗi được. Liên kết ý cơ bản tốt.',
                    '7-8' => 'Khá trôi chảy, đôi chỗ ngập ngừng khi tìm từ. Liên kết ý cơ bản.',
                    '5-6' => 'Nói được nhưng ngập ngừng rõ rệt. Liên kết ý hạn chế, dùng từ nối đơn giản.',
                    '3-4' => 'Ngập ngừng nhiều, dừng lâu. Ý rời rạc, khó theo dõi.',
                    '1-2' => 'Không thể duy trì bài nói. Dừng liên tục.',
                ],
                'B2' => [
                    '9-10' => 'Nói trôi chảy, tự nhiên. Ngập ngừng chỉ khi tìm nội dung, không phải tìm từ. Liên kết ý chặt chẽ, mạch lạc.',
                    '7-8' => 'Trôi chảy tốt, ngập ngừng ít. Liên kết ý khá tốt, từ nối đa dạng.',
                    '5-6' => 'Trôi chảy trung bình, ngập ngừng khi chủ đề khó. Liên kết ý cơ bản.',
                    '3-4' => 'Ngập ngừng thường xuyên. Liên kết yếu.',
                    '1-2' => 'Rất không trôi chảy. Không liên kết.',
                ],
                'C1' => [
                    '9-10' => 'Nói trôi chảy gần như người bản ngữ. Hiếm khi ngập ngừng. Phát triển ý mạch lạc, tinh tế.',
                    '7-8' => 'Rất trôi chảy, ngập ngừng hiếm. Liên kết xuất sắc.',
                    '5-6' => 'Trôi chảy nhưng chưa đạt kỳ vọng C1. Đôi chỗ ngập ngừng.',
                    '3-4' => 'Trôi chảy hạn chế cho C1.',
                    '1-2' => 'Không đạt kỳ vọng C1.',
                ],
            ],
            'vocabulary' => [
                'B1' => [
                    '9-10' => 'Từ vựng đủ cho chủ đề quen thuộc. Dùng đúng, ít lỗi.',
                    '7-8' => 'Từ vựng cơ bản phù hợp. Đôi chỗ thiếu từ, paraphrase được.',
                    '5-6' => 'Từ vựng hạn chế, lặp lại. Đủ truyền đạt ý cơ bản.',
                    '3-4' => 'Từ vựng rất hạn chế, thường xuyên thiếu từ.',
                    '1-2' => 'Từ vựng không đủ giao tiếp.',
                ],
                'B2' => [
                    '9-10' => 'Từ vựng phong phú, đa dạng. Sử dụng từ ít thông dụng, collocations tự nhiên.',
                    '7-8' => 'Từ vựng khá đa dạng. Paraphrase tốt, đôi chỗ chưa chính xác.',
                    '5-6' => 'Từ vựng đủ nhưng thiếu đa dạng. Một số lỗi dùng từ.',
                    '3-4' => 'Từ vựng hạn chế, lặp lại nhiều.',
                    '1-2' => 'Từ vựng rất nghèo.',
                ],
                'C1' => [
                    '9-10' => 'Từ vựng rất phong phú, linh hoạt. Thành ngữ, từ học thuật, diễn đạt cao cấp tự nhiên.',
                    '7-8' => 'Từ vựng phong phú, có từ nâng cao. Đôi chỗ chưa hoàn toàn tự nhiên.',
                    '5-6' => 'Từ vựng khá nhưng chưa đạt C1. Thiếu từ nâng cao.',
                    '3-4' => 'Từ vựng hạn chế cho C1.',
                    '1-2' => 'Không đạt kỳ vọng C1.',
                ],
            ],
            'grammar' => [
                'B1' => [
                    '9-10' => 'Cấu trúc cơ bản chính xác. Thử dùng câu phức đơn giản.',
                    '7-8' => 'Cấu trúc cơ bản phần lớn đúng. Lỗi nhỏ khi dùng câu phức.',
                    '5-6' => 'Câu đơn đúng, câu phức còn lỗi. Nghĩa vẫn hiểu được.',
                    '3-4' => 'Lỗi thường xuyên, gây khó hiểu.',
                    '1-2' => 'Lỗi nghiêm trọng, không kiểm soát ngữ pháp.',
                ],
                'B2' => [
                    '9-10' => 'Đa dạng cấu trúc, chính xác cao. Sử dụng câu phức, mệnh đề quan hệ tốt.',
                    '7-8' => 'Đa dạng cấu trúc, chính xác phần lớn. Lỗi nhỏ không ảnh hưởng.',
                    '5-6' => 'Câu đơn và phức, còn lỗi. Nghĩa rõ.',
                    '3-4' => 'Chủ yếu câu đơn, lỗi thường xuyên.',
                    '1-2' => 'Lỗi nghiêm trọng.',
                ],
                'C1' => [
                    '9-10' => 'Kiểm soát xuất sắc cấu trúc nâng cao. Đa dạng, hiếm lỗi.',
                    '7-8' => 'Đa dạng cấu trúc nâng cao. Lỗi rất ít.',
                    '5-6' => 'Có dùng cấu trúc nâng cao nhưng chưa nhất quán.',
                    '3-4' => 'Cấu trúc hạn chế cho C1.',
                    '1-2' => 'Không đạt kỳ vọng C1.',
                ],
            ],
            'pronunciation' => [
                'B1' => [
                    '9-10' => 'Phát âm rõ ràng, dễ hiểu. Trọng âm từ cơ bản đúng. Ngữ điệu tương đối tự nhiên.',
                    '7-8' => 'Phát âm khá rõ, đôi chỗ sai âm nhưng không ảnh hưởng giao tiếp. Trọng âm cơ bản đúng.',
                    '5-6' => 'Phát âm đủ hiểu nhưng ảnh hưởng bởi tiếng mẹ đẻ. Sai trọng âm đôi chỗ.',
                    '3-4' => 'Phát âm khó hiểu, lỗi âm thường xuyên. Trọng âm sai nhiều.',
                    '1-2' => 'Phát âm rất khó hiểu, gần như không thể giao tiếp.',
                ],
                'B2' => [
                    '9-10' => 'Phát âm rõ ràng, tự nhiên. Trọng âm từ/câu chính xác. Ngữ điệu phù hợp ngữ cảnh.',
                    '7-8' => 'Phát âm tốt, đôi chỗ sai nhỏ. Trọng âm và ngữ điệu khá tốt.',
                    '5-6' => 'Phát âm chấp nhận được. Sai trọng âm/ngữ điệu đôi chỗ nhưng vẫn hiểu.',
                    '3-4' => 'Phát âm yếu, ảnh hưởng giao tiếp. Ngữ điệu đơn điệu.',
                    '1-2' => 'Phát âm rất khó hiểu.',
                ],
                'C1' => [
                    '9-10' => 'Phát âm gần như bản ngữ. Ngữ điệu tự nhiên, linh hoạt. Trọng âm chính xác cả từ phức.',
                    '7-8' => 'Phát âm rất tốt. Ngữ điệu tự nhiên, đôi chỗ chưa hoàn hảo.',
                    '5-6' => 'Phát âm khá nhưng chưa đạt C1. Ngữ điệu chưa đủ linh hoạt.',
                    '3-4' => 'Phát âm hạn chế cho C1.',
                    '1-2' => 'Không đạt kỳ vọng C1.',
                ],
            ],
            'task_fulfillment' => [
                'B1' => [
                    '9-10' => 'Trả lời đúng, đầy đủ câu hỏi. Phát triển ý phù hợp ngữ cảnh. Nội dung liên quan.',
                    '7-8' => 'Trả lời đúng hướng, phát triển ý khá. Đôi chỗ chưa đầy đủ.',
                    '5-6' => 'Trả lời cơ bản đúng nhưng thiếu phát triển. Nội dung nông.',
                    '3-4' => 'Trả lời lạc đề một phần. Nội dung sơ sài.',
                    '1-2' => 'Không trả lời đúng câu hỏi hoặc quá ngắn.',
                ],
                'B2' => [
                    '9-10' => 'Trả lời sâu sắc, phát triển ý thuyết phục. Lập luận logic, ví dụ phù hợp.',
                    '7-8' => 'Trả lời tốt, phát triển ý rõ ràng. Có lập luận và ví dụ.',
                    '5-6' => 'Trả lời đúng nhưng thiếu chiều sâu. Lập luận chưa thuyết phục.',
                    '3-4' => 'Trả lời hời hợt, thiếu lập luận.',
                    '1-2' => 'Không trả lời đúng hoặc quá sơ sài.',
                ],
                'C1' => [
                    '9-10' => 'Trả lời xuất sắc, tư duy phản biện. Phát triển ý sâu sắc, đa chiều, thuyết phục.',
                    '7-8' => 'Trả lời sâu, có tư duy phản biện. Phát triển ý tốt.',
                    '5-6' => 'Trả lời khá nhưng chưa đạt chiều sâu C1.',
                    '3-4' => 'Nội dung hạn chế cho C1.',
                    '1-2' => 'Không đạt kỳ vọng C1.',
                ],
            ],
        ];

        return $bands[$criterion][$level];
    }
}
