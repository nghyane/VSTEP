<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GradingRubric;
use App\Models\ScoringPolicy;
use Illuminate\Database\Seeder;

/**
 * Seed VSTEP grading rubrics + scoring policies.
 *
 * Source: Thông tư 23/2017/TT-BGDĐT, Phụ lục III.
 * Band descriptors from official VSTEP examiner guidelines (B1-C1),
 * scale 0–10 per Bộ GD&ĐT specification.
 *
 * Immutable reference data. Re-running is safe (checks existing version).
 */
class GradingRubricSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedWritingRubric();
        $this->seedSpeakingRubric();
    }

    private function seedWritingRubric(): void
    {
        if (GradingRubric::where('skill', 'writing')->where('version', 2)->exists()) {
            return;
        }

        $rubric = GradingRubric::create([
            'skill' => 'writing',
            'version' => 2,
            'name' => 'VSTEP Writing Rubric v2',
            'source_reference' => 'Thông tư 23/2017/TT-BGDĐT, Phụ lục III. '
                .'Band descriptors theo khung VSTEP B1-C1 chính thức (scale 0-10).',
            'criteria' => $this->writingCriteria(),
            'scoring_formula' => 'mean_rounded_half',
            'is_active' => true,
            'effective_from' => '2017-09-01',
        ]);

        ScoringPolicy::create([
            'rubric_id' => $rubric->id,
            'version' => 2,
            'name' => 'VSTEP Writing Caps v2',
            'rules' => $this->writingPolicyRules(),
            'is_active' => true,
        ]);
    }

    private function seedSpeakingRubric(): void
    {
        if (GradingRubric::where('skill', 'speaking')->where('version', 2)->exists()) {
            return;
        }

        $rubric = GradingRubric::create([
            'skill' => 'speaking',
            'version' => 2,
            'name' => 'VSTEP Speaking Rubric v2',
            'source_reference' => 'Thông tư 23/2017/TT-BGDĐT, Phụ lục III. '
                .'Speaking assessment criteria VSTEP B1-C1 (scale 0-10).',
            'criteria' => $this->speakingCriteria(),
            'scoring_formula' => 'mean_rounded_half',
            'is_active' => true,
            'effective_from' => '2017-09-01',
        ]);

        ScoringPolicy::create([
            'rubric_id' => $rubric->id,
            'version' => 2,
            'name' => 'VSTEP Speaking Caps v2',
            'rules' => $this->speakingPolicyRules(),
            'is_active' => true,
        ]);
    }

    /** @return list<array<string,mixed>> */
    private function writingCriteria(): array
    {
        return [
            [
                'key' => 'task_fulfillment',
                'name' => 'Task Fulfillment',
                'name_vi' => 'Hoàn thành yêu cầu đề',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Thực hiện đầy đủ các yêu cầu của đề. Trình bày rõ ràng quan điểm của người viết về chủ đề bằng hệ thống ý tưởng liên quan, mở rộng và hỗ trợ làm rõ chủ đề.',
                    '9' => 'Thực hiện vừa đủ các yêu cầu của đề. Có hệ thống ý tưởng liên quan, mở rộng và hỗ trợ làm rõ chủ đề.',
                    '8' => 'Thể hiện tất cả các đặc điểm tích cực của Band 7, nhưng không phải tất cả các đặc điểm tích cực của Band 9.',
                    '7' => 'Đáp ứng tất cả các yêu cầu của đề bài. Thể hiện quan điểm rõ ràng trong suốt bài viết. Trình bày, mở rộng và hỗ trợ các ý chính, nhưng có xu hướng mắc lỗi khái quát hóa quá mức và/hoặc các ý tưởng hỗ trợ có thể thiếu tập trung.',
                    '6' => 'Đáp ứng tất cả các yêu cầu của đề bài mặc dù một số phần có thể được triển khai đầy đủ hơn những phần khác. Trình bày quan điểm liên quan đến chủ đề dù các kết luận có thể không rõ ràng hoặc lặp đi lặp lại. Trình bày các ý chính liên quan nhưng một số có thể không được triển khai đủ sâu/không rõ ràng.',
                    '5' => 'Chỉ đáp ứng một phần yêu cầu đề bài; định dạng bài viết có thể không phù hợp ở một vài chỗ. Thể hiện được quan điểm của người viết nhưng cách phát triển bài không phải lúc nào cũng rõ ràng và có thể không có rút ra được kết luận. Trình bày một số ý chính nhưng rất hạn chế và không phát triển đầy đủ; có thể chứa những chi tiết không liên quan.',
                    '4' => 'Chỉ đáp ứng yêu cầu của đề bài một cách tối thiểu hoặc bị lạc đề/xa đề; định dạng bài viết có thể không phù hợp. Có trình bày quan điểm nhưng không rõ ràng. Trình bày được một số ý chính nhưng không rõ ràng, khó xác định và có thể lặp đi lặp lại, không liên quan hoặc không được hỗ trợ tốt.',
                    '3' => 'Không thể hiện rõ ràng quan điểm của người viết. Trình bày rất ít ý tưởng, phần lớn trong số đó không được phát triển hoặc không liên quan đến chủ đề.',
                    '2' => 'Hầu như không đáp ứng được yêu cầu của đề bài. Không thể hiện được quan điểm của người viết. Có cố gắng trình bày một hoặc hai ý tưởng nhưng không biết cách phát triển những ý tưởng đó.',
                    '1' => 'Bài viết hoàn toàn không liên quan đến yêu cầu của đề bài.',
                    '0' => 'Không viết bài. Không cố gắng thực hiện yêu cầu của đề bài theo bất kỳ cách nào. Viết theo bài mẫu một cách hoàn toàn thuộc lòng.',
                ],
            ],
            [
                'key' => 'organization',
                'name' => 'Organization',
                'name_vi' => 'Bố cục bài viết',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Sử dụng các công cụ liên kết một cách mượt mà và không gây ra sự chú ý. Chia đoạn văn một cách khéo léo (mỗi đoạn tập trung giải quyết một yêu cầu/khía cạnh cụ thể, trình bày đoạn văn một cách dễ nhìn).',
                    '9' => 'Sắp xếp trình tự thông tin và ý tưởng một cách logic. Quản lý tốt tất cả các khía cạnh của sự gắn kết. Chia đoạn văn một cách hợp lý.',
                    '8' => 'Thể hiện tất cả các đặc điểm tích cực của Band 7, nhưng không phải tất cả các đặc điểm tích cực của Band 9.',
                    '7' => 'Tổ chức thông tin và ý tưởng một cách logic; có sự tiến triển rõ ràng xuyên suốt. Sử dụng nhiều loại thiết bị gắn kết một cách thích hợp mặc dù có thể có một số trường hợp sử dụng dưới mức/quá mức. Trình bày một chủ đề trung tâm rõ ràng trong mỗi đoạn văn.',
                    '6' => 'Tổ chức thông tin và ý tưởng một cách mạch lạc; bài văn nhìn chung thể hiện được luận điểm trung tâm của bài một cách xuyên suốt. Có sử dụng các công cụ liên kết một cách hiệu quả nhưng tính liên kết trong và/hoặc giữa các câu có thể sai hoặc là máy móc. Chưa có sự ổn định trong việc dùng phép dẫn chiếu một cách rõ ràng và hợp lý.',
                    '5' => 'Có sắp xếp thông tin và ý tưởng; tuy nhiên bài văn chưa thể hiện được luận điểm trung tâm của bài một cách xuyên suốt. Các công cụ liên kết bị sử dụng một cách không phù hợp, không chính xác hoặc lạm dụng. Có thể bị lặp từ do thiếu sử dụng phép dẫn chiếu và phép thay thế. Các thông tin và ý tưởng có thể không viết được dưới dạng đoạn văn hoàn chỉnh.',
                    '4' => 'Trình bày được thông tin và ý tưởng nhưng không sắp xếp chúng một cách mạch lạc và không thể hiện được luận điểm trung tâm của bài một cách xuyên suốt. Sử dụng các công cụ liên kết đơn giản nhưng có thể không chính xác hoặc bị lặp từ. Các thông tin và ý tưởng có thể không viết được dưới dạng đoạn văn hoàn chỉnh.',
                    '3' => 'Có thể sử dụng rất ít các công cụ liên kết đơn và nếu sử dụng được thì những công cụ đó không tạo được mối quan hệ logic giữa các ý tưởng.',
                    '2' => 'Hầu như không sắp xếp được ý tưởng cho bài viết.',
                    '1' => 'Không thể hiện được ý tưởng nào.',
                    '0' => 'Không viết bài. Không cố gắng thực hiện yêu cầu của đề bài theo bất kỳ cách nào. Viết theo bài mẫu một cách hoàn toàn thuộc lòng.',
                ],
            ],
            [
                'key' => 'grammar',
                'name' => 'Grammar',
                'name_vi' => 'Ngữ pháp',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Sử dụng lượng lớn cấu trúc một cách tự nhiên và chính xác. Hiếm mắc lỗi ngữ pháp, nếu mắc lỗi thì thường là vì sơ suất.',
                    '9' => 'Sử dụng lượng lớn cấu trúc. Hầu hết các câu văn đều không mắc lỗi. Rất ít khi mắc lỗi hoặc sử dụng cấu trúc không phù hợp.',
                    '8' => 'Thể hiện tất cả các đặc điểm tích cực của Band 7, nhưng không phải tất cả các đặc điểm tích cực của Band 9.',
                    '7' => 'Sử dụng đa dạng cấu trúc phức tạp. Hầu hết các câu văn đều không mắc lỗi hoặc mắc lỗi nhỏ. Sử dụng đúng ngữ pháp và dấu câu nhưng có thể mắc một vài lỗi.',
                    '6' => 'Kết hợp sử dụng cấu trúc đơn giản và phức tạp. Mắc một vài lỗi về ngữ pháp và dấu câu nhưng không ảnh hưởng tới truyền đạt thông tin.',
                    '5' => 'Chỉ sử dụng được một lượng hạn chế các cấu trúc. Có cố gắng sử dụng các câu phức tạp nhưng thường những câu này sẽ không chính xác bằng các cấu trúc câu đơn. Thường xuyên mắc lỗi ngữ pháp và dấu câu. Các lỗi này có thể gây ra khó khăn cho người đọc.',
                    '4' => 'Chỉ sử dụng được một lượng rất hạn chế các cấu trúc và hiếm khi sử dụng được mệnh đề phụ thuộc. Một số cấu trúc được sử dụng đúng tuy nhiên thường xuyên sai ngữ pháp và dấu câu.',
                    '3' => 'Có nỗ lực viết câu hoàn chỉnh nhưng lỗi sai ngữ pháp và dấu câu khiến thông điệp bị bóp méo.',
                    '2' => 'Không thể viết thành câu ngoại trừ những câu đã học thuộc lòng từ trước.',
                    '1' => 'Hoàn toàn không thể viết thành câu.',
                    '0' => 'Không viết bài. Không cố gắng thực hiện yêu cầu của đề bài theo bất kỳ cách nào. Viết theo bài mẫu một cách hoàn toàn thuộc lòng.',
                ],
            ],
            [
                'key' => 'vocabulary',
                'name' => 'Vocabulary',
                'name_vi' => 'Từ vựng',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Sử dụng lượng từ vựng lớn một cách tự nhiên và biết cách sử dụng các từ vựng phức tạp. Hiếm mắc lỗi dùng từ, nếu mắc lỗi thì thường là vì sơ suất.',
                    '9' => 'Sử dụng lượng từ vựng lớn. Truyền đạt ý nghĩa một cách súc tích, linh hoạt và trôi chảy. Sử dụng các từ vựng ít phổ biến một cách khéo léo nhưng đôi khi có thể mắc lỗi trong việc lựa chọn từ ngữ hoặc sử dụng collocation. Mắc một số lỗi về phát âm hoặc cấu tạo từ.',
                    '8' => 'Thể hiện tất cả các đặc điểm tích cực của Band 7, nhưng không phải tất cả các đặc điểm tích cực của Band 9.',
                    '7' => 'Sử dụng các từ vựng ít phổ biến hơn nhưng đôi khi có thể mắc lỗi trong việc lựa chọn từ ngữ, chính tả và / hoặc cấu tạo từ.',
                    '6' => 'Sử dụng lượng từ vựng vừa đủ để đáp ứng yêu cầu đề bài. Có cố gắng sử dụng những từ vựng ít phổ biến hơn nhưng không có độ chính xác. Vẫn mắc một số lỗi về chính tả và / hoặc về cấu tạo từ, nhưng chúng không gây cản trở.',
                    '5' => 'Sử dụng một lượng từ vựng hạn chế, nhưng đủ để đáp ứng yêu cầu đề bài. Có thể mắc các lỗi chính tả và / hoặc trong cách cấu tạo từ gây ra một số khó khăn cho người đọc.',
                    '4' => 'Sử dụng từ vựng cơ bản và những từ này có thể được sử dụng lặp đi lặp lại hoặc có thể không phù hợp với yêu cầu đề bài. Chưa kiểm soát được sự cấu tạo từ và/hoặc chính tả. Những lỗi sai sẽ gây khó hiểu cho người đọc.',
                    '3' => 'Chỉ sử dụng rất ít từ vựng và gần như không điều khiển được cách phát âm và không biết chọn cấu tạo từ. Những lỗi sai có thể bóp méo nghiêm trọng thông điệp muốn truyền tải.',
                    '2' => 'Chỉ sử dụng cực kỳ ít từ vựng không điều khiển được cách phát âm và không biết chọn cấu tạo từ.',
                    '1' => 'Chỉ sử dụng được 1 vài từ đơn lẻ.',
                    '0' => 'Không viết bài. Không cố gắng thực hiện yêu cầu của đề bài theo bất kỳ cách nào. Viết theo bài mẫu một cách hoàn toàn thuộc lòng.',
                ],
            ],
        ];
    }

    /** @return list<array<string,mixed>> */
    private function speakingCriteria(): array
    {
        return [
            [
                'key' => 'grammar',
                'name' => 'Grammar',
                'name_vi' => 'Ngữ pháp',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Uses flexibly and accurately a wide range of grammatical forms and hardly makes mistakes.',
                    '9' => 'Uses flexibly and accurately a wide range of grammatical structures; occasional non-systematic errors may occur.',
                    '8' => 'Uses flexibly and accurately simple structures and a range of complex structures; non-systematic errors may occur with instances of self-correction.',
                    '7' => 'Uses flexibly and accurately simple structures and shows a good control of complex structures; non-systematic errors sometimes occur but do not lead to misunderstanding.',
                    '6' => 'Uses relatively accurately simple structures and shows some control of some complex structures; non-systematic errors occur but do not lead to misunderstanding.',
                    '5' => 'Uses relatively accurately frequently used simple structures; some errors occur but he or she can make himself easily understood; shows some attempts to use complex sentences but makes many errors.',
                    '4' => 'Uses relatively accurately frequently used simple structures; some errors occur but he or she can make himself or herself easily understood.',
                    '3' => 'Uses some simple structures correctly but still systematically makes basic mistakes; however he or she can manage to make himself or herself understood.',
                    '2' => 'Shows only limited control of a few simple grammatical structures and sentence patterns in a learned repertoire.',
                    '1' => 'Performance does not satisfy band 2 descriptors.',
                    '0' => 'Không có thông tin.',
                ],
            ],
            [
                'key' => 'vocabulary',
                'name' => 'Vocabulary',
                'name_vi' => 'Từ vựng',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Has a good command of broad vocabulary, including less common words, idiomatic expressions and collocations; possibly searches for other expressions and/or avoidance strategies with few insignificant pauses; makes almost no minor slips but there are no significant lexical errors.',
                    '9' => 'Has a good command of broad vocabulary, including less common words, idiomatic expressions and collocations; possibly searches for other expressions and/or avoidance strategies despite some pauses; occasionally makes minor slips but there are no significant lexical errors.',
                    '8' => 'Uses a wide range of vocabulary of most topics and shows great efforts of avoiding lexical repetition for unfamiliar topics; attempts to use a few less common words and idiomatic expressions; has high lexical accuracy despite occasional confusion and incorrect word choices.',
                    '7' => 'Uses a wide range of vocabulary of most topics and shows some efforts of avoiding lexical repetition for unfamiliar topics; has generally high lexical accuracy despite some confusion and incorrect word choices.',
                    '6' => 'Uses a range of vocabulary of most topics but occasionally shows efforts to avoid lexical repetition for unfamiliar topics; has relatively high lexical accuracy (incorrect word choice and wrong word forms are found).',
                    '5' => 'Uses a range of vocabulary of familiar topics and occasionally uses them repetitively; has some difficulty with unfamiliar topics and makes some lexical errors.',
                    '4' => 'Uses sufficient vocabulary of familiar topics and at times uses them repeatedly; has some difficulty with unfamiliar topics and makes many lexical errors.',
                    '3' => 'Uses appropriate vocabulary and can control a narrow repertoire dealing with familiar situations.',
                    '2' => 'Only uses a basic vocabulary repertoire of isolated words and phrases related to particular concrete topics.',
                    '1' => 'Performance does not satisfy band 2 descriptors.',
                    '0' => 'Không có thông tin.',
                ],
            ],
            [
                'key' => 'pronunciation',
                'name' => 'Pronunciation',
                'name_vi' => 'Phát âm',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Is intelligible with individual sounds clearly articulated, sentence and word stress accurately placed; has appropriate intonation; places sentence stress flexibly and correctly to express different meanings.',
                    '9' => 'Is intelligible and has acquired a very clear and natural pronunciation; clearly articulates individual sounds; generally places word and sentence stress; shows efforts with intonation.',
                    '8' => 'Is intelligible and has acquired a quite clear and natural pronunciation; generally clearly articulates individual sounds; generally places stress and shows efforts with sentence stress despite rather low accuracy; shows some efforts with intonation.',
                    '7' => 'Is intelligible and has acquired a little clear and natural pronunciation; generally clearly articulates individual sounds; generally places word stress but does not show efforts to sentence stress; shows few efforts with intonation.',
                    '6' => 'Is mostly intelligible and has acquired a clear pronunciation; makes occasional errors with individual sounds; shows efforts in word stress despite some mispronunciation.',
                    '5' => 'Is mostly intelligible and has acquired a quite clear pronunciation; makes some errors with individual sounds; shows some efforts in word stress despite frequent mispronunciation.',
                    '4' => 'Is mostly intelligible; can articulate simple words and phrases but conversational partners will need to ask for repetition from time to time.',
                    '3' => 'Can articulate a very limited repertoire of learned words and phrases with limited accuracy.',
                    '2' => 'Is often unintelligible.',
                    '1' => 'Performance does not satisfy band 2 descriptors.',
                    '0' => 'Không có thông tin.',
                ],
            ],
            [
                'key' => 'fluency',
                'name' => 'Fluency',
                'name_vi' => 'Độ trôi chảy',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Frequently produces extended stretches of language with very little hesitation and maintains an easy, fluent and natural flow with little repetition or error correction; uses the pauses (if any) to search for appropriate ideas for difficult concepts.',
                    '9' => 'Frequently produces extended stretches of language with little hesitation and maintains an easy, fluent and natural flow with occasional repetition or error correction; uses the pauses (if any) to search for appropriate ideas for difficult topics.',
                    '8' => 'Deals with familiar and unfamiliar topics with ease, remarkable fluency and a fairly even tempo; hesitation may occur for grammatical and lexical planning but is rarely noticeable; produces extended stretches of language with rare repetition and self-correction.',
                    '7' => 'Deals with familiar and unfamiliar topics with ease, remarkable fluency and a fairly even tempo; hesitation may occur for grammatical and lexical planning but are occasionally noticeable; produces extended stretches of language with occasional repetition and self-correction.',
                    '6' => 'Deals with familiar and unfamiliar topics with relative ease; hesitation may occur for grammatical and lexical planning but not too noticeable; produces extended stretches of language but shows some evidence of error correction.',
                    '5' => 'Keeps speaking comprehensively on familiar and unfamiliar topics despite some hesitations for grammatical and lexical planning; produces extended responses that shows clear evidence of error corrections.',
                    '4' => 'Keeps speaking comprehensively on familiar topics and shows some attempts to express complex ideas despite evident hesitations for grammatical and lexical planning; produces extended responses using simple structures.',
                    '3' => 'Can construct words and phrases with noticeable hesitation, frequent false starts and repetition.',
                    '2' => 'Can only manage very short isolated words and phrases, mainly learned utterances, with much pausing.',
                    '1' => 'Performance does not satisfy band 2 descriptors.',
                    '0' => 'Không có thông tin.',
                ],
            ],
            [
                'key' => 'discourse_management',
                'name' => 'Discourse Management',
                'name_vi' => 'Kiểm soát diễn ngôn',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Coherently and easily develops ideas with elaborative details and some examples; can round off with an appropriate conclusion; produces clear and smoothly flowing, well-structured speech, showing efficiently and controlled use of organizational patterns, connectors and cohesive devices.',
                    '9' => 'Generally coherently develops ideas with elaborated details and examples and can round off with an appropriate conclusion; produces clear and smoothly flowing, well-structured speech, showing rather efficiently and controlled use of organizational patterns, connectors and cohesive devices.',
                    '8' => 'Relevantly develops ideas with ease, elaborating on ideas with appropriate details and examples; uses a variety of linking words and efficiently to mark clearly the relationships between ideas.',
                    '7' => 'Relevantly develops ideas with relative ease, elaborating on ideas with many appropriate details and examples; uses a variety of linking words to mark clearly the relationships between ideas.',
                    '6' => 'Relevantly develops ideas with relative ease, elaborating on ideas with some appropriate details and examples; uses more complex connectors to link his or her utterances but fails to mark clearly the relationships between ideas.',
                    '5' => 'Relevantly responds to questions and can develop ideas in a simple list of points; even though some attempts of idea elaboration (details and examples) are evident, they are either vaguely or repetitively expressed; flexibly links ideas with some simple connectors.',
                    '4' => 'Relevantly responds to questions and can develop ideas in a simple list of points; shows some attempts at idea elaboration; links ideas with some simple connectors but repetition is still common.',
                    '3' => 'Expresses ideas with limited language and cannot develop ideas without relying heavily on the repetition of the prompts; links groups of words with simple connectors like and, but, because.',
                    '2' => 'Hardly expresses or develops his or her ideas; only links words or groups of words with very basic connectors like and, or, then.',
                    '1' => 'Performance does not satisfy band 2 descriptors.',
                    '0' => 'Không có thông tin.',
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private function writingPolicyRules(): array
    {
        return [
            'caps' => [
                'grammar' => [
                    ['metric' => 'errors_per_sentence', 'op' => '>', 'value' => 1.0, 'max' => 3.5],
                    ['metric' => 'errors_per_sentence', 'op' => '>', 'value' => 0.5, 'max' => 6.0],
                    ['metric' => 'errors_per_sentence', 'op' => '>', 'value' => 0.2, 'max' => 7.5],
                    ['metric' => 'avg_sentence_length', 'op' => '<', 'value' => 6, 'max' => 5.0],
                ],
                'task_fulfillment' => [
                    ['metric' => 'word_count', 'op' => '<', 'value' => 80, 'max' => 5.0],
                    ['metric' => 'word_count', 'op' => '<', 'value' => 100, 'max' => 6.0],
                ],
                'vocabulary' => [
                    ['metric' => 'unique_ratio', 'op' => '<', 'value' => 0.4, 'max' => 5.0],
                    ['metric' => 'unique_ratio', 'op' => '<', 'value' => 0.5, 'max' => 6.0],
                ],
                'organization' => [
                    ['metric' => 'paragraph_count', 'op' => '<', 'value' => 2, 'max' => 5.0],
                    [
                        'all' => [
                            ['metric' => 'linking_word_count', 'op' => '==', 'value' => 0],
                            ['metric' => 'sentence_count', 'op' => '>', 'value' => 3],
                        ],
                        'max' => 6.0,
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private function speakingPolicyRules(): array
    {
        return [
            'caps' => [],
        ];
    }
}
