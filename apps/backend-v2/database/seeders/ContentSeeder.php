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

        // ── Listening: 3 parts, 14 sections, 35 items ──
        $this->seedListeningSections($version);

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

    /**
     * VSTEP Listening: Part 1 (8 announcements × 1Q), Part 2 (3 dialogues × 4Q), Part 3 (3 lectures × 5Q) = 35 items.
     */
    private function seedListeningSections(ExamVersion $version): void
    {
        $order = 0;

        // ── Part 1: 8 short announcements, 1 question each ──
        $p1 = [
            ['title' => 'Airport Announcement', 'transcript' => 'Attention all passengers. Due to a last-minute change, Flight VN 205 to Da Nang will now depart from Gate B7 instead of Gate A3. Please proceed to Gate B7 immediately. Boarding will begin in fifteen minutes. Thank you for your understanding.', 'items' => [
                ['What is the announcement about?', ['A gate change', 'A flight cancellation', 'A boarding call', 'A baggage claim'], 0],
            ]],
            ['title' => 'Library Notice', 'transcript' => 'Dear students, please be informed that the university library will have adjusted hours this week due to maintenance work. From Monday to Friday, the library will close at 8 PM instead of the usual 10 PM. Regular hours will resume next Monday. We apologize for any inconvenience.', 'items' => [
                ['When will the library close this week?', ['5 PM', '6 PM', '8 PM', '9 PM'], 2],
            ]],
            ['title' => 'Store Promotion', 'transcript' => 'Welcome to MegaMart! This weekend only, enjoy a special 20 percent discount on all electronics, including laptops, tablets, and smartphones. Visit our electronics department on the second floor. This offer is valid until Sunday at closing time. Don\'t miss out!', 'items' => [
                ['What discount is being offered?', ['10%', '20%', '30%', '50%'], 1],
            ]],
            ['title' => 'Weather Report', 'transcript' => 'Good morning. Here is your weather update for the Ho Chi Minh City area. Today will be mostly sunny with temperatures reaching 34 degrees. However, tomorrow we expect heavy rain throughout the day with possible thunderstorms in the afternoon. Residents are advised to carry umbrellas.', 'items' => [
                ['What weather is expected tomorrow?', ['Sunny', 'Rainy', 'Snowy', 'Cloudy'], 1],
            ]],
            ['title' => 'School Announcement', 'transcript' => 'Good morning, students. This is a reminder that the annual parent-teacher meeting will be held this Friday in the school auditorium from 2 PM to 5 PM. All students are required to inform their parents. Please collect the invitation letters from your homeroom teachers today.', 'items' => [
                ['What event is being announced?', ['A sports day', 'A field trip', 'A parent meeting', 'A book fair'], 2],
            ]],
            ['title' => 'Hospital Notice', 'transcript' => 'Attention all visitors. For the safety of our patients, all visitors must register at the reception desk on the ground floor before entering the patient wards. Please have your identification ready. Visiting hours are from 9 AM to 11 AM and 2 PM to 4 PM daily.', 'items' => [
                ['What should visitors do?', ['Register at reception', 'Wear a mask', 'Show ID', 'Call ahead'], 0],
            ]],
            ['title' => 'Train Station Update', 'transcript' => 'We regret to inform passengers that the 3:15 PM express train to Hanoi is currently delayed by approximately 45 minutes due to a technical issue with the signaling system. Engineers are working to resolve the problem. We will provide further updates shortly. Thank you for your patience.', 'items' => [
                ['What is the cause of the delay?', ['Bad weather', 'Technical issue', 'Staff shortage', 'Construction'], 1],
            ]],
            ['title' => 'Office Memo', 'transcript' => 'Dear colleagues, starting from next Monday, the company will implement a new remote work policy. Employees may work from home up to three days per week, subject to manager approval. Please review the detailed guidelines on the company intranet and discuss your schedule with your team leader.', 'items' => [
                ['What is the new policy about?', ['Dress code', 'Working hours', 'Parking', 'Remote work'], 3],
            ]],
        ];

        foreach ($p1 as $s) {
            $section = ExamVersionListeningSection::firstOrCreate(
                ['exam_version_id' => $version->id, 'part' => 1, 'display_order' => $order],
                ['part_title' => 'Part 1 · '.$s['title'], 'duration_minutes' => 1, 'transcript' => $s['transcript']],
            );
            foreach ($s['items'] as $i => $item) {
                ExamVersionListeningItem::firstOrCreate(
                    ['section_id' => $section->id, 'display_order' => $i],
                    ['stem' => $item[0], 'options' => $item[1], 'correct_index' => $item[2]],
                );
            }
            $order++;
        }

        // ── Part 2: 3 extended dialogues, 4 questions each ──
        $p2 = [
            ['title' => 'Student & Professor', 'transcript' => "Student: Excuse me, Professor Nguyen. Do you have a moment? I need to talk about my schedule.\nProfessor: Of course, come in. What seems to be the problem?\nStudent: Well, I just realized that my Biology lab and my English class are at the same time on Wednesdays. There's a schedule conflict.\nProfessor: I see. Have you checked if there are other sections available for either course?\nStudent: I looked, but the only other Biology section is already full.\nProfessor: In that case, I'd suggest you change to a different English section. There should be openings in the Tuesday-Thursday section.\nStudent: Oh, that would work! When is the deadline to make changes?\nProfessor: You have until next week to submit the change request through the online portal.\nStudent: Thank you so much, Professor. I'm really relieved. I was worried I'd have to drop one of the courses.\nProfessor: No problem. Just make sure you complete the change before the deadline.", 'items' => [
                ['What is the student\'s problem?', ['Missing assignment', 'Low grade', 'Schedule conflict', 'Tuition fee'], 2],
                ['What does the professor suggest?', ['Drop the course', 'Talk to the dean', 'Change sections', 'Submit late'], 2],
                ['When is the deadline?', ['Monday', 'Wednesday', 'Friday', 'Next week'], 3],
                ['How does the student feel?', ['Relieved', 'Frustrated', 'Confused', 'Grateful'], 0],
            ]],
            ['title' => 'Hotel Reservation', 'transcript' => "Receptionist: Good afternoon, Grand Palace Hotel. How may I help you?\nGuest: Hello, I'd like to book a room for three nights, from the 15th to the 18th of next month.\nReceptionist: Let me check availability. For those dates, we have a double room available on the 8th floor with a city view.\nGuest: That sounds nice. What's the rate?\nReceptionist: It's 1.2 million dong per night, and that includes breakfast for two.\nGuest: Does it include anything else, like airport transfer?\nReceptionist: I'm afraid the airport transfer is an additional charge. But breakfast is included in the room rate.\nGuest: Alright, I'll take it.\nReceptionist: Wonderful. Could I have your passport number to complete the reservation?\nGuest: Sure, let me get it.", 'items' => [
                ['How many nights does the guest want to stay?', ['2', '3', '4', '5'], 1],
                ['What type of room is available?', ['Single', 'Double', 'Suite', 'Deluxe'], 1],
                ['What is included in the price?', ['Breakfast', 'Airport transfer', 'Spa access', 'Parking'], 0],
                ['What does the receptionist ask for?', ['Passport', 'Credit card', 'Phone number', 'Email'], 0],
            ]],
            ['title' => 'Job Interview Discussion', 'transcript' => "Interviewer: Thank you for coming in today. I've reviewed your resume. You're applying for the marketing assistant position, correct?\nCandidate: Yes, that's right. I'm very interested in the role.\nInterviewer: I can see you have about two years of experience in digital marketing. Can you tell me about your previous role?\nCandidate: I worked at a small agency where I managed social media accounts and helped create content for various clients.\nInterviewer: That's good experience. For this position, we really emphasize communication skills, as you'll be working directly with clients and presenting campaign ideas.\nCandidate: I understand. In my previous role, I regularly presented reports to clients, so I'm comfortable with that.\nInterviewer: Excellent. We have a few more candidates to interview. We'll announce the results next week by email.\nCandidate: Thank you. I look forward to hearing from you.", 'items' => [
                ['What position is being discussed?', ['Manager', 'Intern', 'Accountant', 'Marketing assistant'], 3],
                ['What experience does the candidate have?', ['1 year', '2 years', '3 years', 'None'], 1],
                ['What skill does the interviewer emphasize?', ['Leadership', 'Teamwork', 'Communication', 'Technical'], 2],
                ['When will the result be announced?', ['Today', 'Tomorrow', 'Next week', 'In two weeks'], 2],
            ]],
        ];

        foreach ($p2 as $s) {
            $section = ExamVersionListeningSection::firstOrCreate(
                ['exam_version_id' => $version->id, 'part' => 2, 'display_order' => $order],
                ['part_title' => 'Part 2 · '.$s['title'], 'duration_minutes' => 4, 'transcript' => $s['transcript']],
            );
            foreach ($s['items'] as $i => $item) {
                ExamVersionListeningItem::firstOrCreate(
                    ['section_id' => $section->id, 'display_order' => $i],
                    ['stem' => $item[0], 'options' => $item[1], 'correct_index' => $item[2]],
                );
            }
            $order++;
        }

        // ── Part 3: 3 lectures/talks, 5 questions each ──
        $p3 = [
            ['title' => 'Climate Change Lecture', 'transcript' => "Good morning, everyone. Today I want to discuss the effects of global warming on our planet. As you may know, the global average temperature has increased by approximately 1.1 degrees Celsius since the pre-industrial era. This may seem like a small number, but its effects are enormous. One of the most visible consequences is the melting of polar ice caps. The Arctic ice sheet has been shrinking at an alarming rate, losing about 13 percent per decade. This contributes to rising sea levels, which threaten coastal communities worldwide. Scientists warn that if we don't take urgent action to reduce greenhouse gas emissions, we could see a temperature increase of 3 degrees or more by the end of this century. The situation is urgent, and we must act now. Reducing carbon emissions through renewable energy, better transportation, and changes in consumption patterns are all essential steps.", 'items' => [
                ['What is the main topic of the lecture?', ['Ocean pollution', 'Global warming effects', 'Renewable energy', 'Deforestation'], 1],
                ['According to the speaker, what has increased by 1.1°C?', ['Ocean temperature', 'Global average temperature', 'Arctic temperature', 'City temperature'], 1],
                ['What example does the speaker give?', ['Flooding in Europe', 'Drought in Africa', 'Melting ice caps', 'Forest fires'], 2],
                ['What solution does the speaker propose?', ['Nuclear energy', 'Carbon tax', 'Reducing emissions', 'Planting trees'], 2],
                ['What is the speaker\'s tone?', ['Optimistic', 'Neutral', 'Urgent', 'Pessimistic'], 2],
            ]],
            ['title' => 'History of the Internet', 'transcript' => "Let's take a journey through the history of the internet. It all began in 1969 when the United States Department of Defense created ARPANET, a network designed for military communication during the Cold War. The original purpose was to create a communication system that could survive a nuclear attack. For the first two decades, the internet was mainly used by researchers and academics. The real transformation came in 1991 when Tim Berners-Lee invented the World Wide Web, making the internet accessible to ordinary people. Since then, the growth has been extraordinary. Today, there are approximately 5 billion internet users worldwide. However, this rapid growth has also raised serious concerns, particularly about privacy. Our personal data is constantly being collected, stored, and sometimes misused by companies and governments.", 'items' => [
                ['When was ARPANET created?', ['1959', '1969', '1979', '1989'], 1],
                ['What was the original purpose?', ['Entertainment', 'Military communication', 'Education', 'Commerce'], 1],
                ['What invention made the internet popular?', ['Email', 'Social media', 'World Wide Web', 'Smartphones'], 2],
                ['How many users does the speaker mention?', ['1 billion', '3 billion', '5 billion', '7 billion'], 2],
                ['What concern does the speaker raise?', ['Cost', 'Speed', 'Privacy', 'Access'], 2],
            ]],
            ['title' => 'Nutrition and Health Talk', 'transcript' => "Thank you for joining today's health seminar. I'd like to talk about the importance of maintaining a balanced diet. Many people underestimate how much their food choices affect their overall health. Nutritionists recommend eating at least five servings of fruits and vegetables every day. These provide essential vitamins, minerals, and fiber that our bodies need. Speaking of fiber, this is the nutrient I want to focus on today. Fiber helps with digestion, reduces cholesterol, and can even help prevent certain types of cancer. Unfortunately, many people rely too heavily on processed food. While it may be convenient, processed food should be avoided as much as possible because it's often high in sugar, salt, and unhealthy fats. My recommendation is simple: start keeping a food diary. Write down everything you eat for two weeks. You'll be surprised at the patterns you discover, and it will help you make better choices.", 'items' => [
                ['What is the talk mainly about?', ['Exercise routines', 'Balanced diet', 'Mental health', 'Sleep habits'], 1],
                ['How many servings of vegetables are recommended?', ['2', '3', '5', '7'], 2],
                ['What does the speaker say about processed food?', ['It is convenient', 'It should be avoided', 'It is nutritious', 'It is cheap'], 1],
                ['What nutrient does the speaker focus on?', ['Protein', 'Fiber', 'Vitamins', 'Iron'], 1],
                ['What does the speaker recommend at the end?', ['See a doctor', 'Keep a food diary', 'Take supplements', 'Skip meals'], 1],
            ]],
        ];

        foreach ($p3 as $s) {
            $section = ExamVersionListeningSection::firstOrCreate(
                ['exam_version_id' => $version->id, 'part' => 3, 'display_order' => $order],
                ['part_title' => 'Part 3 · '.$s['title'], 'duration_minutes' => 6, 'transcript' => $s['transcript']],
            );
            foreach ($s['items'] as $i => $item) {
                ExamVersionListeningItem::firstOrCreate(
                    ['section_id' => $section->id, 'display_order' => $i],
                    ['stem' => $item[0], 'options' => $item[1], 'correct_index' => $item[2]],
                );
            }
            $order++;
        }
    }
}
