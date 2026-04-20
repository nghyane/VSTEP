<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\ExamVersion;
use App\Models\ExamVersionListeningItem;
use App\Models\ExamVersionListeningSection;
use App\Models\ExamVersionReadingItem;
use App\Models\ExamVersionReadingPassage;
use App\Models\ExamVersionSpeakingPart;
use App\Models\ExamVersionWritingTask;
use App\Models\GrammarCommonMistake;
use App\Models\GrammarExample;
use App\Models\GrammarExercise;
use App\Models\GrammarPoint;
use App\Models\GrammarPointLevel;
use App\Models\GrammarPointTask;
use App\Models\GrammarStructure;
use App\Models\GrammarVstepTip;
use App\Models\PracticeListeningExercise;
use App\Models\PracticeListeningQuestion;
use App\Models\PracticeReadingExercise;
use App\Models\PracticeReadingQuestion;
use App\Models\PracticeSpeakingDrill;
use App\Models\PracticeSpeakingDrillSentence;
use App\Models\PracticeSpeakingTask;
use App\Models\PracticeWritingPrompt;
use App\Models\VocabExercise;
use App\Models\VocabTopic;
use App\Models\VocabTopicTask;
use App\Models\VocabWord;
use Illuminate\Database\Seeder;

/**
 * Seed minimal demo content so FE can wire API immediately.
 * Not a full port of FE mock — just enough for each module to have data.
 */
class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedVocab();
        $this->seedGrammar();
        $this->seedListening();
        $this->seedReading();
        $this->seedWriting();
        $this->seedSpeaking();
        $this->seedExam();
    }

    private function seedVocab(): void
    {
        $topic = VocabTopic::firstOrCreate(['slug' => 'family-life'], [
            'name' => 'Gia đình & Cuộc sống',
            'description' => 'Từ vựng về gia đình, mối quan hệ, cuộc sống hằng ngày.',
            'level' => 'B1', 'icon_key' => 'family', 'display_order' => 1,
        ]);
        VocabTopicTask::firstOrCreate(['topic_id' => $topic->id, 'task' => 'SP1']);
        VocabTopicTask::firstOrCreate(['topic_id' => $topic->id, 'task' => 'WT1']);

        $words = [
            ['sibling', '/ˈsɪb.lɪŋ/', 'noun', 'Anh chị em ruột', 'I have two siblings.'],
            ['household', '/ˈhaʊs.hoʊld/', 'noun', 'Hộ gia đình', 'Our household has five members.'],
            ['nurture', '/ˈnɜːr.tʃər/', 'verb', 'Nuôi dưỡng', 'Parents nurture their children.'],
            ['bond', '/bɑːnd/', 'noun', 'Mối gắn kết', 'Family bonds are important.'],
            ['upbringing', '/ˈʌp.brɪŋ.ɪŋ/', 'noun', 'Sự nuôi dạy', 'Her upbringing was strict.'],
        ];
        foreach ($words as $i => [$word, $phonetic, $pos, $def, $ex]) {
            VocabWord::firstOrCreate(['topic_id' => $topic->id, 'word' => $word], [
                'phonetic' => $phonetic, 'part_of_speech' => $pos,
                'definition' => $def, 'example' => $ex,
                'synonyms' => [], 'collocations' => [], 'word_family' => [],
                'display_order' => $i,
            ]);
        }

        VocabExercise::firstOrCreate(['topic_id' => $topic->id, 'kind' => 'mcq', 'display_order' => 0], [
            'payload' => ['prompt' => 'A brother or sister is called a ___', 'options' => ['relative', 'sibling', 'cousin', 'partner'], 'correct_index' => 1],
            'explanation' => 'Sibling = anh chị em ruột.',
        ]);
        VocabExercise::firstOrCreate(['topic_id' => $topic->id, 'kind' => 'fill_blank', 'display_order' => 1], [
            'payload' => ['sentence' => 'Parents ___ their children with love.', 'accepted_answers' => ['nurture']],
            'explanation' => 'Nurture = nuôi dưỡng.',
        ]);
    }

    private function seedGrammar(): void
    {
        $point = GrammarPoint::firstOrCreate(['slug' => 'present-perfect'], [
            'name' => 'Present Perfect', 'vietnamese_name' => 'Thì hiện tại hoàn thành',
            'summary' => 'Diễn tả hành động đã xảy ra và có liên hệ với hiện tại.',
            'category' => 'foundation', 'display_order' => 1,
        ]);
        GrammarPointLevel::firstOrCreate(['grammar_point_id' => $point->id, 'level' => 'B1']);
        GrammarPointLevel::firstOrCreate(['grammar_point_id' => $point->id, 'level' => 'B2']);
        GrammarPointTask::firstOrCreate(['grammar_point_id' => $point->id, 'task' => 'WT2']);
        GrammarStructure::firstOrCreate(['grammar_point_id' => $point->id, 'display_order' => 0], [
            'template' => 'S + have/has + V3/ed', 'description' => 'Cấu trúc cơ bản.',
        ]);
        GrammarExample::firstOrCreate(['grammar_point_id' => $point->id, 'display_order' => 0], [
            'en' => 'I have lived here for five years.', 'vi' => 'Tôi đã sống ở đây 5 năm.',
        ]);
        GrammarCommonMistake::firstOrCreate(['grammar_point_id' => $point->id, 'display_order' => 0], [
            'wrong' => 'I have live here.', 'correct' => 'I have lived here.',
            'explanation' => 'Phải dùng V3/ed sau have/has.',
        ]);
        GrammarVstepTip::firstOrCreate(['grammar_point_id' => $point->id, 'display_order' => 0], [
            'task' => 'WT2', 'tip' => 'Dùng present perfect để nêu kinh nghiệm trong essay.',
            'example' => 'Many students have experienced online learning.',
        ]);
        GrammarExercise::firstOrCreate(['grammar_point_id' => $point->id, 'kind' => 'mcq', 'display_order' => 0], [
            'payload' => ['prompt' => 'She ___ (live) here since 2020.', 'options' => ['lived', 'has lived', 'is living', 'was living'], 'correct_index' => 1],
            'explanation' => 'Since + mốc thời gian → present perfect.',
        ]);
        GrammarExercise::firstOrCreate(['grammar_point_id' => $point->id, 'kind' => 'fill_blank', 'display_order' => 1], [
            'payload' => ['template' => 'They ___ (not finish) the project yet.', 'accepted_answers' => ["haven't finished", 'have not finished']],
            'explanation' => 'Yet dùng với present perfect phủ định.',
        ]);
    }

    private function seedListening(): void
    {
        $ex = PracticeListeningExercise::firstOrCreate(['slug' => 'directions-post-office'], [
            'title' => 'Hỏi đường đến bưu điện', 'description' => 'Một người lạ hỏi đường.',
            'part' => 1, 'transcript' => "Excuse me, could you tell me how to get to the post office?\nSure. Go straight ahead for two blocks, then turn left at the traffic lights.\nIs it far from here?\nNo, it's about a five-minute walk.",
            'vietnamese_transcript' => 'Xin lỗi, bạn có thể chỉ đường đến bưu điện không?',
            'keywords' => ['directions', 'post office', 'traffic lights'],
            'estimated_minutes' => 5,
        ]);
        PracticeListeningQuestion::firstOrCreate(['exercise_id' => $ex->id, 'display_order' => 0], [
            'question' => 'Where does the person want to go?',
            'options' => ['The bank', 'The post office', 'The hospital', 'The school'],
            'correct_index' => 1, 'explanation' => 'The person asks for the post office.',
        ]);
        PracticeListeningQuestion::firstOrCreate(['exercise_id' => $ex->id, 'display_order' => 1], [
            'question' => 'How far is it?',
            'options' => ['10 minutes', '5 minutes', '15 minutes', '20 minutes'],
            'correct_index' => 1, 'explanation' => 'About a five-minute walk.',
        ]);
    }

    private function seedReading(): void
    {
        $ex = PracticeReadingExercise::firstOrCreate(['slug' => 'restaurant-notice'], [
            'title' => 'Thông báo nhà hàng', 'description' => 'Thông báo về giờ mở cửa.',
            'part' => 1, 'passage' => "Welcome to The Green Leaf Restaurant!\n\nWe are pleased to announce that starting next Monday, we will open earlier at 7 a.m. to serve breakfast.",
            'vietnamese_translation' => 'Chào mừng đến nhà hàng Green Leaf!',
            'keywords' => ['restaurant', 'breakfast', 'opening hours'],
            'estimated_minutes' => 10,
        ]);
        PracticeReadingQuestion::firstOrCreate(['exercise_id' => $ex->id, 'display_order' => 0], [
            'question' => 'What is the new opening time?',
            'options' => ['6 a.m.', '7 a.m.', '8 a.m.', '9 a.m.'],
            'correct_index' => 1, 'explanation' => 'The restaurant will open at 7 a.m.',
        ]);
    }

    private function seedWriting(): void
    {
        PracticeWritingPrompt::firstOrCreate(['slug' => 'apology-letter'], [
            'title' => 'Thư xin lỗi bạn bè', 'description' => 'Viết thư xin lỗi vì đã quên sinh nhật.',
            'part' => 1, 'prompt' => "You forgot your close friend's birthday party last weekend. Write a letter to your friend to:\n- Apologize for missing the party\n- Explain why you couldn't attend\n- Suggest a plan to make it up",
            'min_words' => 100, 'max_words' => 150,
            'required_points' => ['apologize', 'explain reason', 'suggest plan'],
            'keywords' => ['apologize', 'birthday', 'make it up'],
            'sentence_starters' => ['I am writing to...', 'I sincerely apologize for...'],
            'sample_answer' => "Dear Minh,\n\nI am writing to sincerely apologize for missing your birthday party last Saturday. I feel terrible about it.\n\nThe reason I couldn't attend was that my grandmother was suddenly hospitalized, and I had to rush to the hospital with my family. Everything happened so quickly that I didn't even have time to call you.\n\nTo make it up to you, I would like to invite you to dinner at your favorite restaurant this weekend. It will be my treat, and I promise to bring a special gift for you.\n\nOnce again, I am truly sorry. I hope you had a wonderful birthday despite my absence.\n\nBest wishes,\nLan",
            'estimated_minutes' => 20,
        ]);
    }

    private function seedSpeaking(): void
    {
        $drill = PracticeSpeakingDrill::firstOrCreate(['slug' => 'daily-routine-a2'], [
            'title' => 'Daily routine', 'description' => 'Luyện các câu mô tả thói quen hằng ngày.',
            'level' => 'A2', 'estimated_minutes' => 4,
        ]);
        $sentences = [
            'I usually wake up at seven in the morning.',
            'After breakfast, I take the bus to work.',
            'I have lunch with my colleagues around noon.',
        ];
        foreach ($sentences as $i => $text) {
            PracticeSpeakingDrillSentence::firstOrCreate(['drill_id' => $drill->id, 'display_order' => $i], [
                'text' => $text, 'translation' => null,
            ]);
        }

        PracticeSpeakingTask::firstOrCreate(['slug' => 'social-interaction-p1'], [
            'title' => 'Social Interaction', 'part' => 1, 'task_type' => 'social',
            'content' => ['topics' => [['name' => 'Daily Life', 'questions' => ['Tell me about your daily routine.', 'What do you usually do on weekends?']]]],
            'estimated_minutes' => 4, 'speaking_seconds' => 120,
        ]);
    }

    private function seedExam(): void
    {
        $exam = Exam::firstOrCreate(['slug' => 'vstep-demo-1'], [
            'title' => 'Đề thi VSTEP Demo #1', 'source_school' => 'HNUE',
            'tags' => ['#FullTest', '#Demo'], 'total_duration_minutes' => 172, 'is_published' => true,
        ]);
        $version = ExamVersion::firstOrCreate(['exam_id' => $exam->id, 'version_number' => 1], [
            'is_active' => true, 'published_at' => now(),
        ]);

        $ls = ExamVersionListeningSection::firstOrCreate(['exam_version_id' => $version->id, 'part' => 1], [
            'part_title' => 'Phần 1 · Hội thoại ngắn', 'duration_minutes' => 7, 'display_order' => 0,
        ]);
        ExamVersionListeningItem::firstOrCreate(['section_id' => $ls->id, 'display_order' => 0], [
            'stem' => 'What does the woman suggest?', 'options' => ['Going to a movie', 'Having dinner', 'Taking a walk', 'Reading a book'], 'correct_index' => 1,
        ]);

        $rp = ExamVersionReadingPassage::firstOrCreate(['exam_version_id' => $version->id, 'part' => 1], [
            'title' => 'Bài đọc 1', 'duration_minutes' => 15, 'passage' => 'The rapid growth of technology has transformed education...', 'display_order' => 0,
        ]);
        ExamVersionReadingItem::firstOrCreate(['passage_id' => $rp->id, 'display_order' => 0], [
            'stem' => 'What is the main idea of the passage?', 'options' => ['Technology is harmful', 'Technology transforms education', 'Education is declining', 'Students dislike technology'], 'correct_index' => 1,
        ]);

        ExamVersionWritingTask::firstOrCreate(['exam_version_id' => $version->id, 'part' => 1], [
            'task_type' => 'letter', 'duration_minutes' => 20, 'prompt' => 'Write a letter to your teacher to apologize for missing class.', 'min_words' => 120, 'instructions' => ['Apologize', 'Explain reason', 'Promise to catch up'], 'display_order' => 0,
        ]);
        ExamVersionWritingTask::firstOrCreate(['exam_version_id' => $version->id, 'part' => 2], [
            'task_type' => 'essay', 'duration_minutes' => 40, 'prompt' => 'Some people think that social media has more negative effects than positive ones. Do you agree or disagree?', 'min_words' => 250, 'instructions' => ['State opinion', 'Give reasons', 'Provide examples'], 'display_order' => 1,
        ]);

        ExamVersionSpeakingPart::firstOrCreate(['exam_version_id' => $version->id, 'part' => 1], [
            'type' => 'social', 'duration_minutes' => 4, 'speaking_seconds' => 120,
            'content' => ['topics' => [['name' => 'Hobbies', 'questions' => ['What are your hobbies?', 'How often do you practice them?']]]], 'display_order' => 0,
        ]);
    }
}
