<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Services\ExamImportService;
use App\Services\ExamVersionValidator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

final class ReferenceExamSeeder extends Seeder
{
    private const SOURCE_SCHOOL = 'VSTEP Simulation Bank';

    private const TOTAL_DURATION_MINUTES = 172;

    private const READING_TARGET_WORDS = [1 => 480, 2 => 500, 3 => 520, 4 => 540];

    private const LEGACY_FIXTURE_SLUGS = ['vstep-demo-1', 'vstep-practice-2', 'vstep-practice-3'];

    private const OLD_TEMPLATE_SLUGS = [
        'vstep-practice-4',
        'vstep-practice-5',
        'vstep-practice-6',
        'vstep-practice-7',
        'vstep-practice-8',
        'vstep-practice-9',
        'vstep-practice-10',
    ];

    public function run(ExamImportService $importer, ExamVersionValidator $validator): void
    {
        foreach ([
            'exams',
            'exam_versions',
            'exam_version_listening_sections',
            'exam_version_listening_items',
            'exam_version_reading_passages',
            'exam_version_reading_items',
            'exam_version_writing_tasks',
            'exam_version_speaking_parts',
        ] as $table) {
            if (! Schema::hasTable($table)) {
                return;
            }
        }

        $this->retireLegacyFixtureExams();

        $synced = 0;
        foreach ($this->examPlans() as $plan) {
            if (! $this->prepareForSync($plan['slug'])) {
                continue;
            }

            $versionData = $this->versionData($plan);
            $this->validateOfficialVersionData($validator, $versionData, $plan['slug']);

            $importer->importExam([
                'slug' => $plan['slug'],
                'title' => $plan['title'],
                'source_school' => self::SOURCE_SCHOOL,
                'tags' => $plan['tags'],
                'total_duration_minutes' => self::TOTAL_DURATION_MINUTES,
                'is_published' => true,
            ], $versionData);

            $synced++;
        }

        $this->command?->info("Curated reference full exams synced: {$synced} exams.");
    }

    private function retireLegacyFixtureExams(): void
    {
        Exam::query()
            ->whereIn('slug', self::LEGACY_FIXTURE_SLUGS)
            ->update(['is_published' => false]);

        foreach (self::OLD_TEMPLATE_SLUGS as $slug) {
            $exam = Exam::query()->where('slug', $slug)->first();
            if (! $exam) {
                continue;
            }

            if ($this->hasSessions($exam)) {
                $exam->update(['is_published' => false]);

                continue;
            }

            $exam->delete();
        }
    }

    private function prepareForSync(string $slug): bool
    {
        $exam = Exam::query()->where('slug', $slug)->first();
        if (! $exam) {
            return true;
        }

        if ($exam->source_school !== self::SOURCE_SCHOOL) {
            return false;
        }

        if ($this->hasSessions($exam)) {
            $exam->update(['is_published' => true]);

            return false;
        }

        $exam->delete();

        return true;
    }

    private function hasSessions(Exam $exam): bool
    {
        $versionIds = $exam->versions()->pluck('id');

        return ExamSession::query()->whereIn('exam_version_id', $versionIds)->exists();
    }

    /** @param array<string, mixed> $versionData */
    private function validateOfficialVersionData(ExamVersionValidator $validator, array $versionData, string $slug): void
    {
        $errors = $validator->validateOfficialFixtureData(
            collect($versionData['listening_sections']),
            collect($versionData['listening_items'])->groupBy('section_index'),
            collect($versionData['reading_passages']),
            collect($versionData['reading_items'])->groupBy('passage_index'),
            collect($versionData['writing_tasks']),
            collect($versionData['speaking_parts']),
        );

        if ($errors !== []) {
            throw new RuntimeException("Reference exam {$slug} failed validation: ".implode(' ', $errors));
        }
    }

    /** @param array<string, mixed> $plan @return array<string, mixed> */
    private function versionData(array $plan): array
    {
        [$listeningSections, $listeningItems] = $this->listeningData($plan);
        [$readingPassages, $readingItems] = $this->readingData($plan);

        return [
            'version_number' => 1,
            'published_at' => now()->toDateTimeString(),
            'listening_sections' => $listeningSections,
            'listening_items' => $listeningItems,
            'reading_passages' => $readingPassages,
            'reading_items' => $readingItems,
            'writing_tasks' => $this->writingTasks($plan),
            'speaking_parts' => $this->speakingParts($plan),
        ];
    }

    /** @param array<string, mixed> $plan @return array{list<array<string, mixed>>, list<array<string, mixed>>} */
    private function listeningData(array $plan): array
    {
        $sections = [];
        $items = [];

        foreach ($this->partOneListening($plan) as $notice) {
            $sectionIndex = count($sections);
            $sections[] = [
                'part' => 1,
                'part_title' => 'Part 1 · '.$notice['title'],
                'duration_minutes' => 1,
                'transcript' => $notice['transcript'],
                'display_order' => $sectionIndex + 1,
            ];
            $items[] = $this->listeningItem($sectionIndex, 1, $notice['stem'], $notice['options'], $notice['correct_index']);
        }

        foreach ($this->partTwoListening($plan) as $dialogue) {
            $sectionIndex = count($sections);
            $sections[] = [
                'part' => 2,
                'part_title' => 'Part 2 · '.$dialogue['title'],
                'duration_minutes' => 4,
                'transcript' => $dialogue['transcript'],
                'display_order' => $sectionIndex + 1,
            ];

            foreach ($dialogue['items'] as $itemIndex => $item) {
                $items[] = $this->listeningItem($sectionIndex, $itemIndex + 1, $item['stem'], $item['options'], $item['correct_index']);
            }
        }

        foreach ($this->partThreeListening($plan) as $talkIndex => $talk) {
            $sectionIndex = count($sections);
            $sections[] = [
                'part' => 3,
                'part_title' => 'Part 3 · '.$talk['title'],
                'duration_minutes' => $talkIndex === 2 ? 6 : 7,
                'transcript' => $talk['transcript'],
                'display_order' => $sectionIndex + 1,
            ];

            foreach ($talk['items'] as $itemIndex => $item) {
                $items[] = $this->listeningItem($sectionIndex, $itemIndex + 1, $item['stem'], $item['options'], $item['correct_index']);
            }
        }

        return [$sections, $items];
    }

    /** @return array<string, mixed> */
    private function listeningItem(int $sectionIndex, int $displayOrder, string $stem, array $options, int $correctIndex): array
    {
        $targetCorrectIndex = ($sectionIndex + $displayOrder) % 4;
        $options = $this->moveCorrectOption($options, $correctIndex, $targetCorrectIndex);

        return [
            'section_index' => $sectionIndex,
            'display_order' => $displayOrder,
            'stem' => $stem,
            'options' => $options,
            'correct_index' => $targetCorrectIndex,
        ];
    }

    /** @param array<string, mixed> $plan @return list<array<string, mixed>> */
    private function partOneListening(array $plan): array
    {
        $theme = $plan['theme'];

        return [
            [
                'title' => 'Library Notice',
                'transcript' => "Attention students. The {$theme} resource room will close at 6 p.m. this Friday because staff members are preparing new study materials. It will open again at 9 a.m. on Saturday.",
                'stem' => 'When will the resource room close on Friday?',
                'options' => ['At 6 p.m.', 'At 8 p.m.', 'At 9 a.m.', 'At noon'],
                'correct_index' => 0,
            ],
            [
                'title' => 'Bus Change',
                'transcript' => 'Passengers on Route 12 should use the temporary stop outside the post office today. The usual stop near the main gate is closed while the pavement is repaired.',
                'stem' => 'Where should passengers wait today?',
                'options' => ['Outside the post office', 'Near the main gate', 'Inside the station', 'Beside the library'],
                'correct_index' => 0,
            ],
            [
                'title' => 'Workshop Reminder',
                'transcript' => "This is a reminder that tomorrow's {$theme} workshop starts at 2 p.m. in Room B204. Please bring your student card and arrive ten minutes early for registration.",
                'stem' => 'What should participants bring?',
                'options' => ['A student card', 'A laptop charger', 'A printed ticket', 'A dictionary'],
                'correct_index' => 0,
            ],
            [
                'title' => 'Clinic Message',
                'transcript' => 'The campus clinic will offer free health checks on Wednesday morning. Students do not need an appointment, but they should come before 11 a.m.',
                'stem' => 'What should students do?',
                'options' => ['Come before 11 a.m.', 'Book an appointment online', 'Pay a small fee', 'Call after lunch'],
                'correct_index' => 0,
            ],
            [
                'title' => 'Sports Centre',
                'transcript' => 'The sports centre swimming pool is unavailable this evening because of a school competition. The gym and badminton courts remain open as usual.',
                'stem' => 'Which facility is closed this evening?',
                'options' => ['The swimming pool', 'The gym', 'The badminton courts', 'The reception desk'],
                'correct_index' => 0,
            ],
            [
                'title' => 'Scholarship Deadline',
                'transcript' => 'Students applying for the community scholarship must upload their forms by midnight on Monday. Late applications cannot be accepted by the online system.',
                'stem' => 'When is the application deadline?',
                'options' => ['Midnight on Monday', 'Friday afternoon', 'Wednesday morning', 'Sunday at noon'],
                'correct_index' => 0,
            ],
            [
                'title' => 'Weather Warning',
                'transcript' => 'Because heavy rain is expected after 4 p.m., the outdoor exhibition will move to the student hall. Signs at the main entrance will show the new location.',
                'stem' => 'Why is the exhibition moving?',
                'options' => ['Heavy rain is expected', 'The hall is being cleaned', 'Tickets sold out', 'The entrance is closed'],
                'correct_index' => 0,
            ],
            [
                'title' => 'Museum Visit',
                'transcript' => 'For tomorrow\'s museum visit, please meet your group leader at the east gate at 8:30. The bus will leave at 8:45 and cannot wait for late arrivals.',
                'stem' => 'What time will the bus leave?',
                'options' => ['8:45', '8:15', '8:30', '9:00'],
                'correct_index' => 0,
            ],
        ];
    }

    /** @param array<string, mixed> $plan @return list<array<string, mixed>> */
    private function partTwoListening(array $plan): array
    {
        $firstTopic = $plan['readings'][0]['subject'];
        $secondTopic = $plan['readings'][1]['subject'];

        return [
            [
                'title' => 'Study Project',
                'transcript' => "Mai: Have you chosen a topic for the presentation?\nAn: Yes, I think we should focus on {$firstTopic}. It connects with the case study from last week.\nMai: Good idea. We need current examples, not just definitions.\nAn: I found a report from the city office, but it is quite long.\nMai: I can summarize the data if you prepare the slides.\nAn: Deal. Let's meet in the library on Thursday afternoon and check the final version together.",
                'items' => [
                    ['stem' => 'What topic will they present?', 'options' => [ucfirst($firstTopic), ucfirst($secondTopic), 'Sports competitions', 'Hotel services'], 'correct_index' => 0],
                    ['stem' => 'What does Mai want to include?', 'options' => ['Current examples', 'Only definitions', 'Personal photos', 'A music video'], 'correct_index' => 0],
                    ['stem' => 'What will Mai do?', 'options' => ['Summarize the data', 'Prepare all slides', 'Book a hotel', 'Cancel the project'], 'correct_index' => 0],
                    ['stem' => 'When will they meet?', 'options' => ['Thursday afternoon', 'Monday morning', 'Friday evening', 'Sunday afternoon'], 'correct_index' => 0],
                ],
            ],
            [
                'title' => 'Service Desk',
                'transcript' => "Staff: Good morning. How can I help you?\nStudent: I registered for the {$plan['theme']} seminar, but I have not received the confirmation email.\nStaff: Let me check. Your name is on the list, but the system used your old email address.\nStudent: Can you update it?\nStaff: Of course. I will change it now and resend the confirmation. You should receive it within ten minutes.\nStudent: Great. Do I need to print it?\nStaff: No, showing it on your phone is enough.",
                'items' => [
                    ['stem' => 'What problem does the student have?', 'options' => ['No confirmation email', 'A missing phone', 'A late payment', 'A cancelled seminar'], 'correct_index' => 0],
                    ['stem' => 'Why did the problem happen?', 'options' => ['The system used an old email address', 'The seminar was full', 'The student forgot the date', 'The printer was broken'], 'correct_index' => 0],
                    ['stem' => 'What will the staff member do?', 'options' => ['Resend the confirmation', 'Move the seminar', 'Return a fee', 'Call the teacher'], 'correct_index' => 0],
                    ['stem' => 'How can the student show the confirmation?', 'options' => ['On a phone', 'Only as a printed copy', 'By passport', 'With a library card'], 'correct_index' => 0],
                ],
            ],
            [
                'title' => 'Community Visit',
                'transcript' => "Coordinator: We need to confirm the plan for Saturday's community visit.\nVolunteer: Are we still leaving at seven?\nCoordinator: We changed it to seven thirty because the host school asked us to arrive after assembly.\nVolunteer: What should volunteers bring?\nCoordinator: Comfortable shoes, a bottle of water and the activity booklet. Materials for children will be provided there.\nVolunteer: How many students are going?\nCoordinator: Twenty-four, plus three teachers. Please remind everyone to sign the attendance sheet before boarding.",
                'items' => [
                    ['stem' => 'What time will the group leave?', 'options' => ['7:30', '7:00', '8:30', '9:00'], 'correct_index' => 0],
                    ['stem' => 'Why was the time changed?', 'options' => ['The host school requested a later arrival', 'The bus broke down', 'The weather improved', 'The booklet was missing'], 'correct_index' => 0],
                    ['stem' => 'What should volunteers bring?', 'options' => ['Comfortable shoes', 'Children\'s materials', 'A projector', 'Lunch for teachers'], 'correct_index' => 0],
                    ['stem' => 'What must everyone do before boarding?', 'options' => ['Sign the attendance sheet', 'Buy a ticket', 'Choose a team name', 'Call their parents'], 'correct_index' => 0],
                ],
            ],
        ];
    }

    /** @param array<string, mixed> $plan @return list<array<string, mixed>> */
    private function partThreeListening(array $plan): array
    {
        return collect(array_slice($plan['readings'], 0, 3))
            ->map(function (array $topic, int $index): array {
                $subject = $topic['subject'];

                return [
                    'title' => $topic['title'],
                    'transcript' => "Today I want to discuss {$subject}, a development that has become more visible in many communities. The first point is that it can {$topic['benefit']}. This benefit is strongest when local people receive clear information and when small problems are reported early. The second point is that the idea also creates pressure. Managers must deal with {$topic['challenge']}, and they need evidence before expanding a project. A useful example is {$topic['example']}. This example shows that gradual planning is often more successful than a sudden campaign. In conclusion, {$subject} should be judged by long-term value, not by publicity alone.",
                    'items' => [
                        ['stem' => 'What is the talk mainly about?', 'options' => [ucfirst($subject), 'A sports event', 'A cooking class', 'A train schedule'], 'correct_index' => 0],
                        ['stem' => 'According to the speaker, when is the benefit strongest?', 'options' => ['When people receive clear information', 'When publicity is avoided completely', 'When costs are hidden', 'When projects are rushed'], 'correct_index' => 0],
                        ['stem' => 'What pressure does the speaker mention?', 'options' => [ucfirst($topic['challenge']), 'Choosing a holiday destination', 'Learning a musical instrument', 'Selling old equipment'], 'correct_index' => 0],
                        ['stem' => 'What does the example show?', 'options' => ['Gradual planning can work well', 'Campaigns should be sudden', 'Evidence is unnecessary', 'Local people should be excluded'], 'correct_index' => 0],
                        ['stem' => 'What is the speaker\'s final recommendation?', 'options' => ['Judge the idea by long-term value', 'Focus only on publicity', 'Stop all experiments', 'Ignore community feedback'], 'correct_index' => 0],
                    ],
                ];
            })
            ->all();
    }

    /** @param array<string, mixed> $plan @return array{list<array<string, mixed>>, list<array<string, mixed>>} */
    private function readingData(array $plan): array
    {
        $passages = [];
        $items = [];

        foreach ($plan['readings'] as $index => $topic) {
            $part = $index + 1;
            $passages[] = [
                'part' => $part,
                'title' => $topic['title'],
                'duration_minutes' => 15,
                'passage' => $this->readingPassage($topic, $part),
                'display_order' => $part,
            ];

            foreach ($this->readingItems($topic) as $itemIndex => $item) {
                $targetCorrectIndex = ((int) $plan['seed'] + $index + $itemIndex) % 4;
                $options = $this->moveCorrectOption($item['options'], $item['correct_index'], $targetCorrectIndex);
                $items[] = [
                    'passage_index' => $index,
                    'display_order' => $itemIndex + 1,
                    'stem' => $item['stem'],
                    'options' => $options,
                    'correct_index' => $targetCorrectIndex,
                ];
            }
        }

        return [$passages, $items];
    }

    /** @param array<string, string> $topic */
    private function readingPassage(array $topic, int $part): string
    {
        $subject = $topic['subject'];
        $passage = match ($part) {
            1 => implode("\n\n", [
                "The noticeboard outside the main office at {$topic['setting']} began carrying weekly updates about {$subject} after several users said they did not know where to get help. At first, only a few people paid attention, but the information became useful when it included exact times, names of staff members and simple examples of what the service could do. The aim was not to create a new department. It was to make an existing service easier to understand and easier to use.",
                "People involved in the project say it can {$topic['benefit']}. This is especially important for learners and residents who may feel uncomfortable asking direct questions. When the instructions are clear, they can decide whether the service is relevant before spending time in a queue or sending an email. The project also encouraged staff to review their own communication, because unclear signs often created repeated questions at busy times.",
                "The first trial was modest. {$topic['example']}. Staff recorded common questions during the first month and changed the wording of the notice twice. Some changes were very small, such as adding a map or replacing formal terms with everyday language. Nevertheless, these changes reduced confusion and helped new users complete simple tasks without extra support.",
                "There were still difficulties. The main one was {$topic['challenge']}. When information changed suddenly, users lost confidence and returned to asking friends instead of checking the official notice. The organizers learned that a useful service needs routine maintenance, not just a bright poster at the beginning of the year.",
                'The experience shows that practical communication can improve public services when it is specific, updated and tested with real users. A good notice does more than announce a rule; it helps people understand what to do next.',
            ]),
            2 => implode("\n\n", [
                "A recent local report examined {$subject} in {$topic['setting']} and found that the idea was most successful where {$topic['people']} were consulted before major decisions were made. The report did not claim that every project was successful. Instead, it compared several small trials and asked why some produced lasting benefits while others disappeared after a short period of publicity.",
                "The strongest result was linked to preparation. Projects that could {$topic['benefit']} usually began with interviews, observation and a realistic budget. For instance, {$topic['example']}. This example gave organizers evidence about what users actually needed, rather than what managers assumed they needed. It also helped them explain the purpose of the project to people who were uncertain about joining it.",
                "However, the report warned that enthusiasm can hide practical weaknesses. One recurring problem was {$topic['challenge']}. In several cases, the problem did not appear serious during the launch week, because staff were available and users were curious. After a few months, the weakness became more obvious. Without training, replacement equipment or clear responsibility, even a popular service became difficult to maintain.",
                'The report recommended a staged approach. A pilot project should have a fixed review date, a small set of success measures and a way for quiet users to give feedback. These measures do not guarantee success, but they make failure visible early enough to correct it. They also protect public money by preventing an untested idea from being expanded too quickly.',
                "Overall, the findings suggest that {$subject} can be valuable, but only when it is treated as a long-term service rather than a one-time campaign. The most effective projects combined evidence, communication and regular adjustment.",
            ]),
            3 => implode("\n\n", [
                "Debates about {$subject} often begin with a simple promise: the idea will make everyday life easier. In {$topic['setting']}, that promise is attractive because many people face limited time, limited budgets and complicated schedules. Advocates point out that the approach can {$topic['benefit']}, while critics worry that the same approach may create new forms of pressure if it is introduced too quickly.",
                "The disagreement is partly about evidence. Supporters often cite examples such as this: {$topic['example']}. The example is persuasive because it shows a concrete improvement rather than a vague ambition. Yet one example cannot answer every question. Decision makers still need to know whether the improvement can be repeated in other places, whether the cost is reasonable and whether people who dislike change can still access older forms of support.",
                "The most serious concern is {$topic['challenge']}. This issue matters because public trust is easy to lose and hard to rebuild. If users feel that a project benefits only confident or well-connected groups, they may reject it even when the original intention was positive. For this reason, inclusion should be measured from the beginning, not added later as a public relations message.",
                'A balanced policy would therefore combine ambition with caution. It would start with a limited trial, publish the results in plain language and invite criticism from people who use the service rarely. It would also explain what will happen if the trial fails. Such honesty can make a project look less dramatic, but it often makes it more durable.',
                "In the end, {$subject} should be judged by whether it solves a real problem without creating unfair barriers. The best question is not whether the idea sounds modern, but whether it improves daily life for a broad range of people.",
            ]),
            default => implode("\n\n", [
                "When analysts discuss {$subject}, they often focus on efficiency, but the deeper issue is how institutions decide what kind of progress is worth pursuing. In {$topic['setting']}, the subject has become a test case for balancing innovation with accountability. It can {$topic['benefit']}, yet it also forces planners to ask who controls information, who carries the cost and who is responsible when results are disappointing.",
                "The case of {$topic['example']} illustrates the complexity. At first, the project appeared straightforward: identify a problem, introduce a service and measure participation. In practice, participation was shaped by habits, trust and the quality of explanation. Some users adopted the change quickly, while others waited to see whether the service would remain stable after the initial attention ended.",
                "This hesitation was not simply resistance to change. It reflected a reasonable concern about {$topic['challenge']}. If this concern is ignored, the project may still produce attractive statistics while failing the people most in need of support. High participation among confident users can hide exclusion among people with less time, weaker digital access or previous negative experiences with public services.",
                'A more mature approach treats evaluation as part of design. Instead of asking only how many people used the service, planners should ask which groups used it, which groups stopped using it and what explanation they were given. They should also compare short-term convenience with long-term reliability. These questions are harder than a launch announcement, but they provide a better basis for policy.',
                "The broader lesson is that progress depends on institutional learning. {$topic['title']} can be a meaningful improvement when evidence is public, responsibilities are clear and users have realistic alternatives. Without those conditions, even a well-intentioned project may become another temporary initiative with little lasting value.",
            ]),
        };

        return $this->padPassage($passage, $topic, self::READING_TARGET_WORDS[$part]);
    }

    /** @param array<string, string> $topic */
    private function padPassage(string $passage, array $topic, int $targetWords): string
    {
        $additions = [
            "A further lesson is that measurement should be practical. Instead of collecting data only for annual reports, organizers can record waiting times, attendance, complaints and examples of successful use. These simple indicators help them see whether {$topic['subject']} is reaching the people it was designed to support.",
            'The experience also shows why communication must continue after a launch. When users understand what has changed, why it changed and how they can ask for help, they are more likely to give constructive feedback rather than abandon the service silently.',
        ];

        $index = 0;
        while (str_word_count($passage) < $targetWords) {
            $passage .= "\n\n".$additions[$index % count($additions)];
            $index++;
        }

        return $passage;
    }

    /** @param array<string, string> $topic @return list<array<string, mixed>> */
    private function readingItems(array $topic): array
    {
        $subject = $topic['subject'];

        return [
            [
                'stem' => 'What is the main purpose of the passage?',
                'options' => ["To discuss benefits and limits of {$subject}", 'To advertise a private product', 'To describe a sports competition', 'To tell a personal travel story'],
                'correct_index' => 0,
            ],
            [
                'stem' => 'According to the passage, supporters believe the approach can...',
                'options' => [ucfirst($topic['benefit']), 'remove the need for planning', 'solve every problem immediately', 'work without public information'],
                'correct_index' => 0,
            ],
            [
                'stem' => 'What difficulty is mentioned in the passage?',
                'options' => [ucfirst($topic['challenge']), 'Too many holidays', 'A lack of interest in food', 'The disappearance of all technology'],
                'correct_index' => 0,
            ],
            [
                'stem' => 'Why does the writer mention the example in the second paragraph?',
                'options' => ['To show how evidence can guide improvement', 'To prove that no project can succeed', 'To introduce a famous person', 'To compare two unrelated countries'],
                'correct_index' => 0,
            ],
            [
                'stem' => 'The word predictable in paragraph 1 is closest in meaning to...',
                'options' => ['Easy to know or plan for', 'Completely surprising', 'Very expensive', 'Impossible to describe'],
                'correct_index' => 0,
            ],
            [
                'stem' => 'What does gradual implementation allow organizers to do?',
                'options' => ['Collect feedback and train staff', 'Avoid all evaluation', 'Hide costs from users', 'End the project immediately'],
                'correct_index' => 0,
            ],
            [
                'stem' => 'Which group should be considered according to the passage?',
                'options' => ['Users who need extra support', 'Only confident users', 'Only managers', 'People outside the community'],
                'correct_index' => 0,
            ],
            [
                'stem' => 'What can happen if messages are unclear?',
                'options' => ['Users may return to older habits', 'All services become free', 'Training becomes unnecessary', 'Reports disappear'],
                'correct_index' => 0,
            ],
            [
                'stem' => 'Which statement would the writer most likely agree with?',
                'options' => ["{$subject} should be judged with evidence", 'Publicity is more important than value', 'Quiet users should not be consulted', 'Every pilot project should be cancelled'],
                'correct_index' => 0,
            ],
            [
                'stem' => 'What is the best title for the passage?',
                'options' => [$topic['title'], 'The End of Community Services', 'A Guide to Weekend Sports', 'Why Reports Are Always Wrong'],
                'correct_index' => 0,
            ],
        ];
    }

    /** @param array<string, mixed> $plan @return list<array<string, mixed>> */
    private function writingTasks(array $plan): array
    {
        $firstTopic = $plan['readings'][0]['subject'];
        $essayTopic = $plan['readings'][2]['subject'];

        return [
            [
                'part' => 1,
                'task_type' => 'letter',
                'duration_minutes' => 20,
                'prompt' => "You recently joined a short course about {$firstTopic}. Your friend is interested in taking the same course next month. Write an email to your friend. In your email, describe what you learned, explain one difficulty you had, and suggest how your friend should prepare.",
                'min_words' => 120,
                'instructions' => ['Describe what you learned', 'Explain one difficulty', 'Suggest preparation advice'],
                'requirements' => ['course description', 'difficulty', 'advice'],
                'display_order' => 1,
            ],
            [
                'part' => 2,
                'task_type' => 'essay',
                'duration_minutes' => 40,
                'prompt' => "Some people think that investment in {$essayTopic} should be a priority for modern communities. Others believe money should be spent on more traditional services. Discuss both views and give your own opinion.",
                'min_words' => 250,
                'instructions' => ['Discuss both views', 'Give your own opinion', 'Support your ideas with reasons and examples'],
                'requirements' => ['balanced discussion', 'clear opinion', 'supporting examples'],
                'display_order' => 2,
            ],
        ];
    }

    /** @param array<string, mixed> $plan @return list<array<string, mixed>> */
    private function speakingParts(array $plan): array
    {
        $firstTopic = $plan['readings'][0]['subject'];
        $secondTopic = $plan['readings'][1]['subject'];
        $thirdTopic = $plan['readings'][2]['subject'];

        return [
            [
                'part' => 1,
                'type' => 'social',
                'duration_minutes' => 3,
                'speaking_seconds' => 180,
                'content' => [
                    'topics' => [
                        ['name' => 'Study and work', 'questions' => ['What do you usually do to study effectively?', 'Do you prefer working alone or with other people?', 'How do you organize a busy week?']],
                        ['name' => 'Community life', 'questions' => ["How often do you use services related to {$firstTopic}?", 'What public place is useful in your area?', 'What could make your local community better?']],
                    ],
                ],
                'requirements' => ['answer naturally', 'give reasons', 'extend answers with examples'],
                'display_order' => 1,
            ],
            [
                'part' => 2,
                'type' => 'solution',
                'duration_minutes' => 4,
                'speaking_seconds' => 240,
                'content' => [
                    'situation' => "Your class wants to improve awareness of {$secondTopic} among students, but the budget is limited.",
                    'solutions' => ['organize a short workshop', 'create an online information page', 'run a student volunteer campaign'],
                    'task' => 'Choose the best solution, explain your reasons and say why the other options are less suitable.',
                ],
                'requirements' => ['choose one solution', 'compare alternatives', 'justify the decision'],
                'display_order' => 2,
            ],
            [
                'part' => 3,
                'type' => 'topic',
                'duration_minutes' => 5,
                'speaking_seconds' => 300,
                'content' => [
                    'topic' => ucfirst($thirdTopic),
                    'prompt' => "Develop a short talk about why {$thirdTopic} matters for modern communities. Include benefits, possible problems and your own recommendation.",
                    'follow_up_questions' => ['Who should pay for this kind of improvement?', 'How can young people take part?', 'What risks should leaders consider?', 'Do you think technology makes the issue easier or harder?'],
                ],
                'requirements' => ['develop the topic', 'cover benefits and problems', 'respond to follow-up questions'],
                'display_order' => 3,
            ],
        ];
    }

    /** @return list<array<string, mixed>> */
    private function examPlans(): array
    {
        return [
            $this->plan(
                'vstep-mock-test-01-campus-orientation',
                'VSTEP Mock Test 01: Campus Orientation & Student Services',
                1,
                'campus orientation',
                ['Full Mock', 'B1-C1', 'Campus Life', 'Student Services'],
                [
                    ['title' => 'First-Year Advisory Desks', 'subject' => 'first-year advisory desks', 'setting' => 'large university campuses', 'people' => 'new students, advisers and faculty assistants', 'benefit' => 'help new students choose courses, solve timetable problems and find welfare support', 'challenge' => 'keeping advice consistent when several offices answer similar questions', 'example' => 'a university placed trained peer advisers beside the enrolment hall during the first two weeks'],
                    ['title' => 'Student ID Services', 'subject' => 'student ID services', 'setting' => 'student administration offices', 'people' => 'students, security staff and service clerks', 'benefit' => 'make borrowing, attendance checks and building access quicker', 'challenge' => 'replacing lost cards without creating long queues', 'example' => 'an office introduced an appointment window for students who needed replacement cards'],
                    ['title' => 'Academic Skills Clinics', 'subject' => 'academic skills clinics', 'setting' => 'campus learning centres', 'people' => 'tutors and students preparing assignments', 'benefit' => 'give learners practical guidance on note-taking, citation and revision habits', 'challenge' => 'encouraging students to ask for help before deadlines become urgent', 'example' => 'a skills centre offered ten-minute drop-in consultations before mid-term exams'],
                    ['title' => 'Quiet Study Zones', 'subject' => 'quiet study zones', 'setting' => 'university libraries', 'people' => 'independent learners, librarians and student groups', 'benefit' => 'protect focused study time in buildings that also host group work', 'challenge' => 'enforcing noise rules without making the library feel unfriendly', 'example' => 'library staff used coloured cards to remind users which floors were silent'],
                ],
            ),
            $this->plan(
                'vstep-mock-test-02-work-internships',
                'VSTEP Mock Test 02: Internships & Workplace Communication',
                2,
                'workplace preparation',
                ['Full Mock', 'B1-C1', 'Workplace', 'Career Skills'],
                [
                    ['title' => 'Remote Internship Supervision', 'subject' => 'remote internship supervision', 'setting' => 'companies with hybrid teams', 'people' => 'interns, mentors and department managers', 'benefit' => 'give young workers professional experience without requiring daily travel', 'challenge' => 'helping interns ask quick questions when supervisors are busy online', 'example' => 'a marketing firm scheduled two short check-ins each day for remote interns'],
                    ['title' => 'Workplace Email Etiquette', 'subject' => 'workplace email etiquette', 'setting' => 'training departments', 'people' => 'new employees and team leaders', 'benefit' => 'reduce misunderstandings and make requests easier to answer', 'challenge' => 'teaching polite tone without making messages too long', 'example' => 'a company asked trainees to rewrite unclear emails from realistic office situations'],
                    ['title' => 'Job Interview Practice', 'subject' => 'job interview practice', 'setting' => 'career centres', 'people' => 'graduates, recruiters and career advisers', 'benefit' => 'build confidence before applicants meet employers', 'challenge' => 'giving honest feedback without discouraging nervous candidates', 'example' => 'a career centre recorded mock interviews and reviewed the answers privately'],
                    ['title' => 'Professional Networking Events', 'subject' => 'professional networking events', 'setting' => 'business schools', 'people' => 'students, alumni and employers', 'benefit' => 'connect learners with people who can explain real career paths', 'challenge' => 'making the event useful for shy participants as well as confident speakers', 'example' => 'organizers gave students question cards before they met alumni guests'],
                ],
            ),
            $this->plan(
                'vstep-mock-test-03-city-life-housing',
                'VSTEP Mock Test 03: Transport, Housing & City Life',
                3,
                'urban living',
                ['Full Mock', 'B1-C1', 'Urban Life', 'Public Services'],
                [
                    ['title' => 'Student Housing Advice', 'subject' => 'student housing advice', 'setting' => 'rental districts near universities', 'people' => 'students, landlords and housing officers', 'benefit' => 'help renters understand contracts, deposits and repair responsibilities', 'challenge' => 'checking unreliable advertisements before students pay fees', 'example' => 'a housing office created a checklist for viewing rooms safely'],
                    ['title' => 'Evening Bus Services', 'subject' => 'evening bus services', 'setting' => 'suburban transport routes', 'people' => 'shift workers, students and bus operators', 'benefit' => 'make late travel safer and cheaper for people without private vehicles', 'challenge' => 'running enough buses when passenger numbers change by season', 'example' => 'a transport company tested later buses during the university exam period'],
                    ['title' => 'Neighbourhood Noise Rules', 'subject' => 'neighbourhood noise rules', 'setting' => 'mixed residential areas', 'people' => 'families, students and local officials', 'benefit' => 'help residents share buildings and streets more peacefully', 'challenge' => 'responding fairly when complaints involve different lifestyles', 'example' => 'a ward office held a meeting after repeated complaints about weekend parties'],
                    ['title' => 'Public Market Upgrades', 'subject' => 'public market upgrades', 'setting' => 'traditional market streets', 'people' => 'vendors, shoppers and municipal planners', 'benefit' => 'improve hygiene and access while keeping small businesses visible', 'challenge' => 'renovating stalls without interrupting sellers income for too long', 'example' => 'market managers renovated one row of stalls at a time during quiet weeks'],
                ],
            ),
            $this->plan(
                'vstep-mock-test-04-campus-learning',
                'VSTEP Mock Test 04: Campus Learning & Academic Support',
                4,
                'campus learning',
                ['Full Mock', 'B1-C1', 'Education', 'Academic Skills'],
                [
                    ['title' => 'Shared Study Rooms', 'subject' => 'shared study rooms', 'setting' => 'university towns', 'people' => 'students and tutors', 'benefit' => 'give learners access to quiet spaces, shared devices and peer support', 'challenge' => 'keeping rooms open at predictable times', 'example' => 'a college library tested evening study rooms during the exam period'],
                    ['title' => 'Digital Library Access', 'subject' => 'digital library access', 'setting' => 'large campuses', 'people' => 'students, librarians and lecturers', 'benefit' => 'reduce travel time and help users find academic sources more quickly', 'challenge' => 'training new users to search databases effectively', 'example' => 'an online guide helped first-year students compare reliable articles'],
                    ['title' => 'Peer Mentoring Programmes', 'subject' => 'peer mentoring programmes', 'setting' => 'vocational colleges', 'people' => 'new learners and senior students', 'benefit' => 'make academic advice less formal and easier to request', 'challenge' => 'matching mentors with learners who have different schedules', 'example' => 'a weekend mentoring pilot linked language learners with final-year volunteers'],
                    ['title' => 'Flexible Assessment', 'subject' => 'flexible assessment', 'setting' => 'modern classrooms', 'people' => 'teachers, students and course designers', 'benefit' => 'give learners more chances to show progress over time', 'challenge' => 'making standards consistent across different tasks', 'example' => 'one course combined short quizzes, presentations and reflective journals'],
                ],
            ),
            $this->plan(
                'vstep-mock-test-05-sustainable-cities',
                'VSTEP Mock Test 05: Sustainable Cities & Public Services',
                5,
                'sustainable cities',
                ['Full Mock', 'B1-C1', 'Environment', 'Public Services'],
                [
                    ['title' => 'Urban Tree Projects', 'subject' => 'urban tree projects', 'setting' => 'crowded city districts', 'people' => 'residents and local planners', 'benefit' => 'cool streets, absorb rainwater and make public spaces more pleasant', 'challenge' => 'choosing species that do not damage pavements', 'example' => 'a neighbourhood mapped hot streets before planting shade trees'],
                    ['title' => 'Public Bicycle Schemes', 'subject' => 'public bicycle schemes', 'setting' => 'busy transport corridors', 'people' => 'commuters and city visitors', 'benefit' => 'offer a low-cost option for short journeys', 'challenge' => 'balancing bicycle supply between popular stations', 'example' => 'a city used morning travel data to move bicycles before rush hour'],
                    ['title' => 'Waste Sorting Habits', 'subject' => 'waste sorting habits', 'setting' => 'apartment neighbourhoods', 'people' => 'households and building managers', 'benefit' => 'increase recycling and reduce pressure on landfill sites', 'challenge' => 'helping residents follow rules when labels are confusing', 'example' => 'colour-coded bins were introduced beside the lifts in several buildings'],
                    ['title' => 'Community Energy Advice', 'subject' => 'community energy advice', 'setting' => 'suburban communities', 'people' => 'families and energy advisers', 'benefit' => 'help households reduce bills without losing comfort', 'challenge' => 'explaining technical information in simple language', 'example' => 'local volunteers visited homes and checked basic electricity use'],
                ],
            ),
            $this->plan(
                'vstep-mock-test-06-digital-workplace',
                'VSTEP Mock Test 06: Digital Workplaces & Consumer Services',
                6,
                'digital workplace',
                ['Full Mock', 'B1-C1', 'Technology', 'Workplace'],
                [
                    ['title' => 'Remote Team Meetings', 'subject' => 'remote team meetings', 'setting' => 'international companies', 'people' => 'employees and project managers', 'benefit' => 'connect teams across locations without frequent travel', 'challenge' => 'preventing online meetings from becoming too long', 'example' => 'a design team used shorter agendas and shared notes after each call'],
                    ['title' => 'Online Training Portals', 'subject' => 'online training portals', 'setting' => 'growing businesses', 'people' => 'new employees and trainers', 'benefit' => 'let staff review essential skills at their own pace', 'challenge' => 'keeping learning materials current after procedures change', 'example' => 'a company updated safety videos after workers reported unclear steps'],
                    ['title' => 'Digital Payment Records', 'subject' => 'digital payment records', 'setting' => 'small shops and service firms', 'people' => 'customers, owners and accountants', 'benefit' => 'make transactions faster and easier to record', 'challenge' => 'protecting customers who have limited internet access', 'example' => 'a market association offered short payment lessons for older sellers'],
                    ['title' => 'Flexible Office Design', 'subject' => 'flexible office design', 'setting' => 'hybrid workplaces', 'people' => 'staff members and office planners', 'benefit' => 'support both focused work and team discussion', 'challenge' => 'ensuring that shared desks are booked fairly', 'example' => 'one office tested quiet zones before changing the whole floor plan'],
                ],
            ),
            $this->plan(
                'vstep-mock-test-07-public-health',
                'VSTEP Mock Test 07: Public Health & Community Wellbeing',
                7,
                'public health',
                ['Full Mock', 'B1-C1', 'Health', 'Community'],
                [
                    ['title' => 'School Breakfast Clubs', 'subject' => 'school breakfast clubs', 'setting' => 'urban primary schools', 'people' => 'children, parents and teachers', 'benefit' => 'help pupils start lessons with more energy and attention', 'challenge' => 'finding volunteers who can arrive early every morning', 'example' => 'a local bakery donated bread while parents served fruit twice a week'],
                    ['title' => 'Walking Groups', 'subject' => 'walking groups', 'setting' => 'residential areas', 'people' => 'older adults and community nurses', 'benefit' => 'improve fitness while reducing social isolation', 'challenge' => 'choosing routes that are safe in different weather conditions', 'example' => 'a clinic organized short walks that ended at a public garden'],
                    ['title' => 'Mental Health Workshops', 'subject' => 'mental health workshops', 'setting' => 'secondary schools', 'people' => 'students, counsellors and parents', 'benefit' => 'make it easier to discuss stress before problems become serious', 'challenge' => 'protecting privacy during group activities', 'example' => 'a school invited counsellors to teach practical breathing techniques'],
                    ['title' => 'Community Health Messages', 'subject' => 'community health messages', 'setting' => 'local clinics', 'people' => 'patients and health workers', 'benefit' => 'share reliable advice during seasonal illness', 'challenge' => 'correcting rumours that spread quickly online', 'example' => 'nurses used posters and short videos to explain when to seek care'],
                ],
            ),
            $this->plan(
                'vstep-mock-test-08-tourism-heritage',
                'VSTEP Mock Test 08: Tourism, Heritage & Local Culture',
                8,
                'tourism and heritage',
                ['Full Mock', 'B1-C1', 'Tourism', 'Culture'],
                [
                    ['title' => 'Local Heritage Trails', 'subject' => 'local heritage trails', 'setting' => 'historic towns', 'people' => 'visitors, guides and residents', 'benefit' => 'bring attention to small museums and traditional streets', 'challenge' => 'protecting quiet neighbourhoods from overcrowding', 'example' => 'a walking map encouraged tourists to visit less crowded workshops'],
                    ['title' => 'Homestay Standards', 'subject' => 'homestay standards', 'setting' => 'rural tourism areas', 'people' => 'hosts, guests and tourism officers', 'benefit' => 'raise service quality while keeping local character', 'challenge' => 'checking safety standards without creating too much paperwork', 'example' => 'families attended a short course on hygiene and guest communication'],
                    ['title' => 'Festival Management', 'subject' => 'festival management', 'setting' => 'coastal provinces', 'people' => 'organizers, vendors and visitors', 'benefit' => 'support local businesses and preserve cultural traditions', 'challenge' => 'managing noise, waste and traffic during peak days', 'example' => 'one festival added shuttle buses and reusable cups for visitors'],
                    ['title' => 'Digital Museum Guides', 'subject' => 'digital museum guides', 'setting' => 'regional museums', 'people' => 'curators, teachers and tourists', 'benefit' => 'help visitors understand exhibits without waiting for a guide', 'challenge' => 'making digital content accessible for older visitors', 'example' => 'a museum tested audio guides with large buttons and simple menus'],
                ],
            ),
            $this->plan(
                'vstep-mock-test-09-education-technology',
                'VSTEP Mock Test 09: Education Technology & Learning Support',
                9,
                'technology and education',
                ['Full Mock', 'B1-C1', 'Education', 'Technology'],
                [
                    ['title' => 'Learning Apps for Vocabulary', 'subject' => 'learning apps for vocabulary', 'setting' => 'language classrooms', 'people' => 'learners and teachers', 'benefit' => 'support regular review through short daily practice', 'challenge' => 'encouraging learners to use the app beyond the first week', 'example' => 'a teacher linked app practice with short classroom speaking tasks'],
                    ['title' => 'AI Feedback Tools', 'subject' => 'AI feedback tools', 'setting' => 'writing courses', 'people' => 'students and writing instructors', 'benefit' => 'give quick comments on grammar, organization and word choice', 'challenge' => 'helping learners understand that automated advice is not always complete', 'example' => 'one class compared machine feedback with teacher comments before revising essays'],
                    ['title' => 'Virtual Science Labs', 'subject' => 'virtual science labs', 'setting' => 'schools with limited equipment', 'people' => 'science teachers and pupils', 'benefit' => 'allow students to practise experiments safely before using real tools', 'challenge' => 'making sure simulations do not replace hands-on investigation', 'example' => 'students used a virtual circuit before building one in pairs'],
                    ['title' => 'Online Parent Meetings', 'subject' => 'online parent meetings', 'setting' => 'busy urban schools', 'people' => 'parents, teachers and school leaders', 'benefit' => 'make communication easier for families with difficult work schedules', 'challenge' => 'ensuring that parents without stable internet are still included', 'example' => 'a school offered both video meetings and phone appointments'],
                ],
            ),
            $this->plan(
                'vstep-mock-test-10-environmental-action',
                'VSTEP Mock Test 10: Environmental Action & Responsible Consumption',
                10,
                'environmental choices',
                ['Full Mock', 'B1-C1', 'Environment', 'Consumption'],
                [
                    ['title' => 'Reusable Packaging', 'subject' => 'reusable packaging', 'setting' => 'cafes and food shops', 'people' => 'customers, shop owners and suppliers', 'benefit' => 'reduce single-use waste from everyday purchases', 'challenge' => 'cleaning and returning containers reliably', 'example' => 'a group of cafes tested a deposit system for takeaway cups'],
                    ['title' => 'Water Saving Campaigns', 'subject' => 'water saving campaigns', 'setting' => 'dry farming districts', 'people' => 'families, farmers and local officials', 'benefit' => 'reduce waste during months when rainfall is low', 'challenge' => 'changing habits before a serious shortage occurs', 'example' => 'local radio messages explained simple ways to reuse household water'],
                    ['title' => 'Repair Cafes', 'subject' => 'repair cafes', 'setting' => 'community centres', 'people' => 'volunteers and residents', 'benefit' => 'extend the life of household items and teach practical skills', 'challenge' => 'finding volunteers with enough technical knowledge', 'example' => 'retired mechanics helped residents repair lamps, fans and bicycles'],
                    ['title' => 'Green School Gardens', 'subject' => 'green school gardens', 'setting' => 'public schools', 'people' => 'children, teachers and parents', 'benefit' => 'connect lessons about science with real outdoor responsibility', 'challenge' => 'maintaining the garden during school holidays', 'example' => 'families took turns watering vegetables during the summer break'],
                ],
            ),
        ];
    }

    /** @param list<string> $tags @param list<array<string, string>> $readings @return array<string, mixed> */
    private function plan(string $slug, string $title, int $seed, string $theme, array $tags, array $readings): array
    {
        return [
            'slug' => $slug,
            'title' => $title,
            'seed' => $seed,
            'theme' => $theme,
            'tags' => $tags,
            'readings' => $readings,
        ];
    }

    /** @param list<string> $options @return list<string> */
    private function moveCorrectOption(array $options, int $correctIndex, int $targetCorrectIndex): array
    {
        $correct = $options[$correctIndex];
        unset($options[$correctIndex]);

        $distractors = array_values($options);
        array_splice($distractors, $targetCorrectIndex, 0, [$correct]);

        return $distractors;
    }
}
