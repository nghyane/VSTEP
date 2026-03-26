<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Level;
use App\Enums\Skill;
use App\Models\KnowledgePoint;
use App\Models\Question;
use Illuminate\Database\Seeder;

class QuestionSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedListening();
        $this->seedReading();
        $this->seedWriting();
        $this->seedSpeaking();
    }

    // ── Listening ──────────────────────────────────────────────

    private function seedListening(): void
    {
        // Part 1: Short announcements
        $this->bulk(Skill::Listening, Level::A2, 1, [
            ['topic' => 'Announcement Location', 'stem' => 'Where is the announcement being made?', 'options' => ['At a train station', 'At an airport', 'At a bus stop', 'At a hospital'], 'answer' => 'B'],
            ['topic' => 'Store Closing Time', 'stem' => 'What time does the store close today?', 'options' => ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'], 'answer' => 'C'],
            ['topic' => 'Passenger Instructions', 'stem' => 'What should passengers do?', 'options' => ['Wait at gate 5', 'Go to the information desk', 'Check the screen', 'Call the airline'], 'answer' => 'A'],
            ['topic' => 'Message Audience', 'stem' => 'Who is the message for?', 'options' => ['All employees', 'New students', 'Hotel guests', 'Bus passengers'], 'answer' => 'C'],
            ['topic' => 'Announcement Content', 'stem' => 'What is being announced?', 'options' => ['A schedule change', 'A new product', 'A weather warning', 'A job opening'], 'answer' => 'A'],
            ['topic' => 'Delay Duration', 'stem' => 'How long will the delay be?', 'options' => ['10 minutes', '20 minutes', '30 minutes', '1 hour'], 'answer' => 'B'],
        ]);

        $this->bulk(Skill::Listening, Level::B1, 1, [
            ['topic' => 'Announcement Purpose', 'stem' => 'What is the purpose of the announcement?', 'options' => ['To advertise a product', 'To inform about a policy change', 'To welcome visitors', 'To give travel directions'], 'answer' => 'B'],
            ['topic' => 'Visitor Instructions', 'stem' => 'According to the speaker, what should visitors do first?', 'options' => ['Register at reception', 'Find their seats', 'Turn off phones', 'Read the brochure'], 'answer' => 'A'],
            ['topic' => 'Announcement Setting', 'stem' => 'Where would you most likely hear this announcement?', 'options' => ['In a library', 'At a conference', 'On a train', 'In a restaurant'], 'answer' => 'B'],
            ['topic' => 'Speaker Request', 'stem' => 'What does the speaker ask people to do?', 'options' => ['Leave the building', 'Fill out a form', 'Move to another room', 'Wait for instructions'], 'answer' => 'D'],
            ['topic' => 'Event Start Time', 'stem' => 'When will the event begin?', 'options' => ['In 5 minutes', 'In 15 minutes', 'In 30 minutes', 'In 1 hour'], 'answer' => 'B'],
            ['topic' => 'Schedule Change', 'stem' => 'What change is being announced?', 'options' => ['New opening hours', 'A price increase', 'A staff change', 'Building renovation'], 'answer' => 'A'],
        ]);

        $this->bulk(Skill::Listening, Level::B2, 1, [
            ['topic' => 'Safety Regulation', 'stem' => 'What is the main point of the announcement?', 'options' => ['A safety regulation update', 'An upcoming inspection', 'A training schedule', 'A holiday closure'], 'answer' => 'A'],
            ['topic' => 'New Policy Impact', 'stem' => 'The speaker implies that the new policy will...', 'options' => ['Reduce costs significantly', 'Require additional staff training', 'Take effect immediately', 'Be reviewed next quarter'], 'answer' => 'B'],
            ['topic' => 'Technical Problem', 'stem' => 'What problem does the speaker mention?', 'options' => ['Budget constraints', 'Staff shortages', 'Technical difficulties', 'Low attendance'], 'answer' => 'C'],
            ['topic' => 'Employee Action', 'stem' => 'According to the announcement, employees should...', 'options' => ['Submit reports by Friday', 'Attend the meeting tomorrow', 'Update their contact details', 'Review the handbook'], 'answer' => 'A'],
            ['topic' => 'Organization Inference', 'stem' => 'What can be inferred about the organization?', 'options' => ['It is expanding rapidly', 'It recently merged with another company', 'It is experiencing financial difficulties', 'It has changed leadership'], 'answer' => 'A'],
        ]);

        // Part 2: Conversations
        $this->bulk(Skill::Listening, Level::A2, 2, [
            ['topic' => 'Conversation Topic', 'stem' => 'What are the speakers talking about?', 'options' => ['A holiday plan', 'A school project', 'A birthday party', 'A shopping list'], 'answer' => 'A'],
            ['topic' => 'Commute Method', 'stem' => 'How will the woman get to work?', 'options' => ['By bus', 'By car', 'By bicycle', 'On foot'], 'answer' => 'B'],
            ['topic' => 'Dinner Suggestion', 'stem' => 'What does the man suggest?', 'options' => ['Going to a restaurant', 'Cooking at home', 'Ordering delivery', 'Skipping dinner'], 'answer' => 'A'],
            ['topic' => 'Reason for Upset', 'stem' => 'Why is the woman upset?', 'options' => ['She lost her phone', 'She missed the bus', 'She failed a test', 'She forgot her wallet'], 'answer' => 'B'],
            ['topic' => 'Next Action', 'stem' => 'What will the man do next?', 'options' => ['Call a taxi', 'Check the map', 'Ask for directions', 'Wait at the station'], 'answer' => 'C'],
            ['topic' => 'Speaker Location', 'stem' => 'Where are the speakers?', 'options' => ['At a shop', 'At school', 'At a park', 'At home'], 'answer' => 'A'],
            ['topic' => 'Shopping Item', 'stem' => 'What does the woman want to buy?', 'options' => ['A dress', 'A book', 'A phone', 'Shoes'], 'answer' => 'D'],
            ['topic' => 'Meeting Time', 'stem' => 'When will they meet?', 'options' => ['Monday morning', 'Tuesday afternoon', 'Wednesday evening', 'Thursday night'], 'answer' => 'B'],
        ]);

        $this->bulk(Skill::Listening, Level::B1, 2, [
            ['topic' => 'Job Interview', 'stem' => 'What is the main topic of the conversation?', 'options' => ['A vacation plan', 'A job interview', 'A health concern', 'A class assignment'], 'answer' => 'B'],
            ['topic' => 'Disagreement Reason', 'stem' => 'Why does the man disagree with the woman?', 'options' => ['He thinks it is too expensive', 'He prefers another option', 'He does not have time', 'He already made plans'], 'answer' => 'A'],
            ['topic' => 'Next Step', 'stem' => 'What will the speakers probably do next?', 'options' => ['Go shopping', 'Call a friend', 'Check the schedule', 'Leave the office'], 'answer' => 'C'],
            ['topic' => 'Woman Identity', 'stem' => 'What can be inferred about the woman?', 'options' => ['She is a new employee', 'She is the man\'s boss', 'She has visited before', 'She is running late'], 'answer' => 'A'],
            ['topic' => 'Project Status', 'stem' => 'The man mentions that the project...', 'options' => ['Is ahead of schedule', 'Needs more funding', 'Was just approved', 'Has been cancelled'], 'answer' => 'B'],
            ['topic' => 'Deadline Concern', 'stem' => 'What is the woman\'s concern?', 'options' => ['The deadline is too tight', 'The budget is insufficient', 'The team is too small', 'The client is unhappy'], 'answer' => 'A'],
            ['topic' => 'Proposal Reaction', 'stem' => 'How does the man feel about the proposal?', 'options' => ['Enthusiastic', 'Skeptical', 'Indifferent', 'Confused'], 'answer' => 'B'],
            ['topic' => 'Agreement Point', 'stem' => 'What do the speakers agree on?', 'options' => ['They need more data', 'The plan is ready', 'They should ask the manager', 'The meeting was productive'], 'answer' => 'A'],
        ]);

        $this->bulk(Skill::Listening, Level::B2, 2, [
            ['topic' => 'Environmental Policy', 'stem' => 'What is the primary concern discussed?', 'options' => ['Environmental impact of new policy', 'Cost of implementation', 'Timeline for completion', 'Staff resistance to change'], 'answer' => 'A'],
            ['topic' => 'Company Research', 'stem' => 'The woman suggests that the company should...', 'options' => ['Hire external consultants', 'Delay the project', 'Conduct more research', 'Increase the budget'], 'answer' => 'C'],
            ['topic' => 'Previous Approach', 'stem' => 'What does the man imply about the previous approach?', 'options' => ['It was too conservative', 'It lacked proper planning', 'It was ahead of its time', 'It yielded unexpected results'], 'answer' => 'B'],
            ['topic' => 'Main Challenge', 'stem' => 'According to the conversation, the main challenge is...', 'options' => ['Limited resources', 'Changing regulations', 'Market competition', 'Internal disagreements'], 'answer' => 'D'],
            ['topic' => 'Discussion Conclusion', 'stem' => 'What can be concluded from the discussion?', 'options' => ['Both speakers support the initiative', 'The woman is more optimistic than the man', 'They disagree on the fundamental approach', 'A decision has already been made'], 'answer' => 'B'],
            ['topic' => 'Stakeholder Feedback', 'stem' => 'The speakers agree that the next step should be...', 'options' => ['Presenting findings to the board', 'Gathering stakeholder feedback', 'Revising the timeline', 'Allocating additional resources'], 'answer' => 'B'],
        ]);

        // Part 3: Lectures
        $this->bulk(Skill::Listening, Level::B1, 3, [
            ['topic' => 'Modern Education', 'stem' => 'What is the lecture mainly about?', 'options' => ['The history of the internet', 'Climate change effects', 'Modern education methods', 'Economic development in Asia'], 'answer' => 'C'],
            ['topic' => 'Teacher Training', 'stem' => 'According to the speaker, what is the biggest challenge?', 'options' => ['Lack of funding', 'Lack of trained teachers', 'Student motivation', 'Outdated curriculum'], 'answer' => 'B'],
            ['topic' => 'Finland Education', 'stem' => 'The speaker mentions Finland as an example of...', 'options' => ['Economic growth', 'Educational reform', 'Political stability', 'Environmental policy'], 'answer' => 'B'],
            ['topic' => 'Education Investment', 'stem' => 'What does the speaker suggest should be done?', 'options' => ['Increase school hours', 'Invest in teacher training', 'Reduce class sizes', 'Use more technology'], 'answer' => 'B'],
            ['topic' => 'Speaker Tone', 'stem' => 'What is the speaker\'s tone?', 'options' => ['Critical', 'Optimistic', 'Neutral', 'Pessimistic'], 'answer' => 'B'],
            ['topic' => 'EdTech Role', 'stem' => 'According to the lecture, technology in education...', 'options' => ['Should replace teachers', 'Is a useful supplement', 'Creates more problems', 'Is too expensive'], 'answer' => 'B'],
        ]);

        $this->bulk(Skill::Listening, Level::B2, 3, [
            ['topic' => 'Urbanization Health', 'stem' => 'What is the primary focus of the lecture?', 'options' => ['The relationship between urbanization and public health', 'Modern architectural trends', 'Transportation infrastructure', 'Population growth statistics'], 'answer' => 'A'],
            ['topic' => 'Mental Health Impact', 'stem' => 'The speaker argues that urbanization has led to...', 'options' => ['Better healthcare access', 'Increased mental health issues', 'Lower crime rates', 'Improved air quality'], 'answer' => 'B'],
            ['topic' => 'Pollution Correlation', 'stem' => 'According to the data presented, which factor has the strongest correlation?', 'options' => ['Income level and life expectancy', 'Population density and pollution', 'Education level and employment', 'Housing cost and migration'], 'answer' => 'B'],
            ['topic' => 'Short-term Solutions', 'stem' => 'The speaker criticizes the current approach because...', 'options' => ['It focuses too much on short-term solutions', 'It ignores rural communities', 'It is based on outdated research', 'It requires too much government spending'], 'answer' => 'A'],
            ['topic' => 'Green Space', 'stem' => 'What recommendation does the speaker make?', 'options' => ['Implementing green space requirements', 'Limiting city population growth', 'Investing in suburban development', 'Reducing public transportation funding'], 'answer' => 'A'],
            ['topic' => 'Parks and Stress', 'stem' => 'The study mentioned in the lecture found that...', 'options' => ['Urban residents exercise more than rural residents', 'Access to parks reduces stress levels significantly', 'City noise has no effect on sleep quality', 'Pollution affects children more than adults'], 'answer' => 'B'],
        ]);

        $this->bulk(Skill::Listening, Level::C1, 3, [
            ['topic' => 'Cultural Identity', 'stem' => 'The lecturer\'s main thesis is that...', 'options' => ['Globalization has fundamentally altered cultural identity', 'Economic integration benefits all nations equally', 'Cultural homogenization is inevitable', 'Local traditions are resistant to global influence'], 'answer' => 'A'],
            ['topic' => 'Glocalization', 'stem' => 'The concept of "glocalization" refers to...', 'options' => ['Global companies adapting products to local markets', 'Local businesses expanding internationally', 'The rejection of foreign cultural influence', 'Government policies protecting domestic industries'], 'answer' => 'A'],
            ['topic' => 'Japanese Cuisine', 'stem' => 'The speaker uses the example of Japanese cuisine to illustrate...', 'options' => ['Cultural preservation efforts', 'The adaptation of foreign elements into local traditions', 'The decline of traditional cooking methods', 'The economic value of food tourism'], 'answer' => 'B'],
            ['topic' => 'Research Criticism', 'stem' => 'What criticism does the speaker raise about previous research?', 'options' => ['It relied too heavily on quantitative methods', 'It failed to account for power dynamics', 'It generalized findings from limited samples', 'It ignored economic factors entirely'], 'answer' => 'C'],
            ['topic' => 'Theoretical Frameworks', 'stem' => 'According to the lecturer, the most significant implication is...', 'options' => ['The need for new theoretical frameworks', 'The economic opportunity in cultural exchange', 'The political consequences of cultural shift', 'The educational reform required'], 'answer' => 'A'],
        ]);
    }

    // ── Reading ────────────────────────────────────────────────

    private function seedReading(): void
    {
        // Part 1: Everyday texts
        $this->bulk(Skill::Reading, Level::A2, 1, [
            ['topic' => 'Passage Main Idea', 'stem' => 'What is the passage mainly about?', 'options' => ['A family vacation', 'A cooking recipe', 'A school event', 'A job advertisement'], 'answer' => 'C'],
            ['topic' => 'Vocabulary Delighted', 'stem' => 'The word "delighted" in line 3 is closest in meaning to...', 'options' => ['Sad', 'Happy', 'Angry', 'Confused'], 'answer' => 'B'],
            ['topic' => 'Event Schedule', 'stem' => 'According to the text, when does the event start?', 'options' => ['Monday', 'Wednesday', 'Friday', 'Saturday'], 'answer' => 'D'],
            ['topic' => 'Notice Author', 'stem' => 'Who wrote this notice?', 'options' => ['A student', 'A teacher', 'A parent', 'The principal'], 'answer' => 'D'],
            ['topic' => 'Contact Method', 'stem' => 'What should interested people do?', 'options' => ['Call the office', 'Send an email', 'Visit the website', 'Come to the school'], 'answer' => 'B'],
            ['topic' => 'Activity Cost', 'stem' => 'How much does the activity cost?', 'options' => ['It is free', '$5', '$10', '$20'], 'answer' => 'A'],
        ]);

        $this->bulk(Skill::Reading, Level::B1, 1, [
            ['topic' => 'Author Purpose', 'stem' => 'What is the author\'s main purpose?', 'options' => ['To entertain readers', 'To give advice on healthy eating', 'To advertise a product', 'To describe a scientific experiment'], 'answer' => 'B'],
            ['topic' => 'Food Recommendation', 'stem' => 'According to the passage, which food is recommended?', 'options' => ['Fast food', 'Processed snacks', 'Fresh vegetables', 'Canned soup'], 'answer' => 'C'],
            ['topic' => 'Vocabulary Detrimental', 'stem' => 'The word "detrimental" in paragraph 2 means...', 'options' => ['Helpful', 'Harmful', 'Important', 'Unusual'], 'answer' => 'B'],
            ['topic' => 'Diet Advice', 'stem' => 'What does the author suggest readers do?', 'options' => ['Avoid all sugar', 'Eat more protein', 'Reduce processed food', 'Skip breakfast'], 'answer' => 'C'],
            ['topic' => 'Unsupported Claim', 'stem' => 'Which statement is NOT supported by the text?', 'options' => ['Vegetables are nutritious', 'Exercise is important', 'Sleep affects health', 'Organic food cures diseases'], 'answer' => 'D'],
            ['topic' => 'Text Source', 'stem' => 'The passage is most likely from...', 'options' => ['A novel', 'A health magazine', 'A textbook', 'A research paper'], 'answer' => 'B'],
        ]);

        // Part 2: Social issues
        $this->bulk(Skill::Reading, Level::B1, 2, [
            ['topic' => 'Traffic Congestion', 'stem' => 'What is the main idea of the passage?', 'options' => ['Traffic congestion affects quality of life', 'Public transport should be free', 'Cars should be banned from cities', 'Cycling is the best transport'], 'answer' => 'A'],
            ['topic' => 'Car Ownership', 'stem' => 'According to the author, what is the primary cause?', 'options' => ['Poor road design', 'Increasing car ownership', 'Lack of buses', 'Bad weather'], 'answer' => 'B'],
            ['topic' => 'Author Attitude', 'stem' => 'The author\'s attitude toward the current situation is...', 'options' => ['Supportive', 'Critical', 'Neutral', 'Humorous'], 'answer' => 'B'],
            ['topic' => 'Transport Solution', 'stem' => 'What solution does the text propose?', 'options' => ['Building more roads', 'Investing in public transport', 'Banning private cars', 'Reducing speed limits'], 'answer' => 'B'],
            ['topic' => 'Vocabulary Alleviate', 'stem' => 'The word "alleviate" is closest in meaning to...', 'options' => ['Worsen', 'Create', 'Reduce', 'Ignore'], 'answer' => 'C'],
            ['topic' => 'Implied Meaning', 'stem' => 'Which is implied but not directly stated?', 'options' => ['The problem will get worse without action', 'People prefer buses to trains', 'The government has enough money', 'All cities have the same problem'], 'answer' => 'A'],
        ]);

        $this->bulk(Skill::Reading, Level::B2, 2, [
            ['topic' => 'Remote Work Economy', 'stem' => 'The passage primarily discusses...', 'options' => ['The economic impact of remote work', 'The history of telecommuting', 'Management strategies for virtual teams', 'Technology infrastructure requirements'], 'answer' => 'A'],
            ['topic' => 'Worker Satisfaction', 'stem' => 'According to the research cited, remote workers...', 'options' => ['Are less productive than office workers', 'Report higher job satisfaction', 'Earn more than office counterparts', 'Have fewer career advancement opportunities'], 'answer' => 'B'],
            ['topic' => 'Double-Edged Sword', 'stem' => 'The author uses the phrase "double-edged sword" to suggest that...', 'options' => ['Remote work has both advantages and disadvantages', 'Technology is unreliable', 'Companies save money at employees\' expense', 'The trend will reverse'], 'answer' => 'A'],
            ['topic' => 'Future of Work', 'stem' => 'What can be inferred about the future of work?', 'options' => ['All jobs will be remote', 'Hybrid models will become standard', 'Offices will disappear entirely', 'Remote work is a temporary trend'], 'answer' => 'B'],
            ['topic' => 'Vocabulary Paramount', 'stem' => 'The word "paramount" in paragraph 4 is closest in meaning to...', 'options' => ['Optional', 'Interesting', 'Essential', 'Difficult'], 'answer' => 'C'],
            ['topic' => 'Remote Work Isolation', 'stem' => 'Which counterargument does the author acknowledge?', 'options' => ['Remote work increases isolation', 'Technology costs are prohibitive', 'Not all jobs can be done remotely', 'Productivity always decreases'], 'answer' => 'A'],
        ]);

        // Part 3: Advanced topics
        $this->bulk(Skill::Reading, Level::B2, 3, [
            ['topic' => 'Finland Example', 'stem' => 'The author uses the example of Finland to illustrate...', 'options' => ['Economic growth', 'Educational reform success', 'Political stability', 'Cultural diversity'], 'answer' => 'B'],
            ['topic' => 'Policy Balance', 'stem' => 'Which statement best summarizes the fourth paragraph?', 'options' => ['Technology solves all problems', 'Balance is needed in policy-making', 'Tradition is always better', 'Research is unreliable'], 'answer' => 'B'],
            ['topic' => 'Testing Limitations', 'stem' => 'The passage suggests that standardized testing...', 'options' => ['Accurately measures intelligence', 'Is the best assessment method', 'Has significant limitations', 'Should be abolished entirely'], 'answer' => 'C'],
            ['topic' => 'One-Size-Fits-All', 'stem' => 'What does the author mean by "one-size-fits-all approach"?', 'options' => ['A flexible method', 'A universal but inflexible solution', 'A custom-made strategy', 'An expensive program'], 'answer' => 'B'],
            ['topic' => 'Research Needed', 'stem' => 'The conclusion implies that...', 'options' => ['More research is needed', 'The current system works well', 'Change is impossible', 'Students don\'t care about education'], 'answer' => 'A'],
        ]);

        // Part 4: Academic/specialized
        $this->bulk(Skill::Reading, Level::C1, 4, [
            ['topic' => 'Cultural Decision-Making', 'stem' => 'The researcher\'s primary argument is that...', 'options' => ['Cognitive biases are universal and unavoidable', 'Cultural context shapes decision-making processes', 'Economic models accurately predict behavior', 'Individual differences are negligible'], 'answer' => 'B'],
            ['topic' => 'Methodology Criticism', 'stem' => 'The study\'s methodology has been criticized for...', 'options' => ['Using too small a sample size', 'Relying on self-reported data', 'Ignoring demographic variables', 'Not being replicable'], 'answer' => 'B'],
            ['topic' => 'Epistemic Humility', 'stem' => 'The term "epistemic humility" as used in the text refers to...', 'options' => ['Acknowledging the limits of one\'s knowledge', 'Being modest about achievements', 'Questioning established theories', 'Accepting criticism gracefully'], 'answer' => 'A'],
            ['topic' => 'Interdisciplinary Approach', 'stem' => 'What distinguishes the author\'s approach from earlier studies?', 'options' => ['It employs mixed methods', 'It focuses on developing countries', 'It uses a longitudinal design', 'It incorporates interdisciplinary perspectives'], 'answer' => 'D'],
            ['topic' => 'Cross-Cultural Research', 'stem' => 'The passage implies that future research should...', 'options' => ['Replicate existing studies', 'Explore cross-cultural dimensions more thoroughly', 'Focus exclusively on economic outcomes', 'Abandon qualitative approaches'], 'answer' => 'B'],
        ]);
    }

    // ── Writing ────────────────────────────────────────────────

    private function seedWriting(): void
    {
        $kps = KnowledgePoint::pluck('id', 'name');

        $kpMap = [
            'A2:1' => ['Simple Sentences', 'Basic Tenses', 'General Vocabulary', 'Coherence'],
            'B1:1' => ['Compound Sentences', 'Basic Tenses', 'Tense Consistency', 'General Vocabulary', 'Coherence', 'Paragraphing'],
            'B1:2' => ['Compound Sentences', 'Subject-Verb Agreement', 'General Vocabulary', 'Linking Words & Transitions', 'Paragraphing', 'Topic Sentences'],
            'B2:1' => ['Complex Sentences', 'Passive Voice', 'Topic-Specific Vocabulary', 'Register & Tone', 'Coherence'],
            'B2:2' => ['Complex Sentences', 'Relative Clauses', 'Topic-Specific Vocabulary', 'Linking Words & Transitions', 'Essay Structure', 'Argument Development'],
            'C1:2' => ['Complex Sentences', 'Participial Clauses', 'Academic Vocabulary', 'Essay Structure', 'Argument Development', 'Register & Tone'],
        ];

        $tasks = [
            ['level' => Level::A2, 'part' => 1, 'topic' => 'Birthday Party Invitation', 'prompt' => 'Write a short letter (80-100 words) to your friend inviting them to your birthday party. Include the date, time, place, and what you will do.'],
            ['level' => Level::B1, 'part' => 1, 'topic' => 'Absence Email', 'prompt' => 'Write an email (120-150 words) to your teacher explaining why you were absent from class last week and asking about the homework you missed.'],
            ['level' => Level::B1, 'part' => 1, 'topic' => 'New City', 'prompt' => 'You recently moved to a new city. Write a letter (120-150 words) to your friend describing your new neighborhood and your feelings about the move.'],
            ['level' => Level::B1, 'part' => 2, 'topic' => 'School Uniforms', 'prompt' => 'Some people think students should wear uniforms at school. Others disagree. Write an essay (150-180 words) giving your opinion with reasons.'],
            ['level' => Level::B2, 'part' => 1, 'topic' => 'Internship Application', 'prompt' => 'Write a formal letter (150-180 words) to a company applying for a summer internship. Describe your qualifications and why you are interested.'],
            ['level' => Level::B2, 'part' => 2, 'topic' => 'Social Media', 'prompt' => 'Write an essay (250 words) discussing the advantages and disadvantages of social media for young people. Give specific examples to support your points.'],
            ['level' => Level::B2, 'part' => 2, 'topic' => 'Technology Impact', 'prompt' => 'Some people believe that technology has made life easier, while others think it has created new problems. Discuss both views and give your opinion (250 words).'],
            ['level' => Level::C1, 'part' => 2, 'topic' => 'Globalization', 'prompt' => 'Critically evaluate the claim that globalization has done more harm than good for developing nations. Support your argument with specific examples (300 words).'],
            ['level' => Level::C1, 'part' => 2, 'topic' => 'AI Regulation', 'prompt' => 'To what extent should governments regulate artificial intelligence? Discuss the ethical, economic, and social implications in a well-structured essay (300 words).'],
        ];

        foreach ($tasks as $task) {
            $question = Question::firstOrCreate(
                ['skill' => Skill::Writing, 'level' => $task['level'], 'part' => $task['part'], 'topic' => $task['topic']],
                ['content' => ['prompt' => $task['prompt']], 'is_active' => true, 'verified_at' => now()],
            );

            $key = $task['level']->value.':'.$task['part'];
            $kpIds = collect($kpMap[$key] ?? [])
                ->map(fn (string $name) => $kps[$name] ?? null)
                ->filter()
                ->values()
                ->all();

            $question->knowledgePoints()->syncWithoutDetaching($kpIds);
        }
    }

    // ── Speaking ───────────────────────────────────────────────

    private function seedSpeaking(): void
    {
        $kps = KnowledgePoint::pluck('id', 'name');

        $kpMap = [
            'A2:1' => ['Simple Sentences', 'Basic Tenses', 'General Vocabulary', 'Individual Sounds', 'Word Stress'],
            'B1:1' => ['Compound Sentences', 'Basic Tenses', 'General Vocabulary', 'Word Stress', 'Sentence Stress', 'Self-Correction'],
            'B1:2' => ['Compound Sentences', 'Comparatives & Superlatives', 'Linking Words & Transitions', 'Sentence Stress', 'Intonation', 'Paraphrasing'],
            'B2:2' => ['Complex Sentences', 'Topic-Specific Vocabulary', 'Linking Words & Transitions', 'Intonation', 'Connected Speech', 'Elaboration'],
            'B2:3' => ['Complex Sentences', 'Conditional Clauses', 'Topic-Specific Vocabulary', 'Connected Speech', 'Rhythm & Pacing', 'Elaboration'],
            'C1:3' => ['Complex Sentences', 'Noun Clauses', 'Academic Vocabulary', 'Connected Speech', 'Rhythm & Pacing', 'Self-Correction'],
        ];

        $tasks = [
            ['level' => Level::A2, 'part' => 1, 'topic' => 'Family', 'prompt' => 'Tell me about your family. How many people are there? What do they do?'],
            ['level' => Level::A2, 'part' => 1, 'topic' => 'Daily Routine', 'prompt' => 'Describe your daily routine. What do you do from morning to evening?'],
            ['level' => Level::B1, 'part' => 1, 'topic' => 'Memorable Trip', 'prompt' => 'Describe a memorable trip you have taken. Where did you go? What did you do? Why was it memorable?'],
            ['level' => Level::B1, 'part' => 1, 'topic' => 'Favorite Hobby', 'prompt' => 'Talk about your favorite hobby or activity. How did you start it? Why do you enjoy it?'],
            ['level' => Level::B1, 'part' => 2, 'topic' => 'City vs Countryside', 'prompt' => 'Look at the two pictures. Compare and contrast life in a big city and life in the countryside. Which would you prefer to live in and why?'],
            ['level' => Level::B1, 'part' => 2, 'topic' => 'Study Methods', 'prompt' => 'Compare studying alone and studying in a group. What are the advantages and disadvantages of each?'],
            ['level' => Level::B2, 'part' => 2, 'topic' => 'Media Influence', 'prompt' => 'Compare the roles of traditional media and social media in modern society. How do they influence public opinion differently?'],
            ['level' => Level::B2, 'part' => 3, 'topic' => 'Youth Freedom', 'prompt' => 'Some people say that young people today have too much freedom. Do you agree or disagree? Give reasons and examples.'],
            ['level' => Level::B2, 'part' => 3, 'topic' => 'Free University Education', 'prompt' => 'Should university education be free for all students? Present arguments for both sides and give your opinion.'],
            ['level' => Level::C1, 'part' => 3, 'topic' => 'Genetic Engineering Ethics', 'prompt' => 'Discuss the ethical implications of genetic engineering in humans. Consider the scientific, social, and moral dimensions of this issue.'],
            ['level' => Level::C1, 'part' => 3, 'topic' => 'Global Inequality', 'prompt' => 'Evaluate the role of international organizations in addressing global inequality. How effective have they been, and what changes would you recommend?'],
        ];

        foreach ($tasks as $task) {
            $question = Question::firstOrCreate(
                ['skill' => Skill::Speaking, 'level' => $task['level'], 'part' => $task['part'], 'topic' => $task['topic']],
                ['content' => ['prompt' => $task['prompt']], 'is_active' => true, 'verified_at' => now()],
            );

            $key = $task['level']->value.':'.$task['part'];
            $kpIds = collect($kpMap[$key] ?? [])
                ->map(fn (string $name) => $kps[$name] ?? null)
                ->filter()
                ->values()
                ->all();

            $question->knowledgePoints()->syncWithoutDetaching($kpIds);
        }
    }

    // ── Helpers ────────────────────────────────────────────────

    private function bulk(Skill $skill, Level $level, int $part, array $items): void
    {
        foreach ($items as $item) {
            $options = [];
            foreach ($item['options'] as $i => $text) {
                $options[chr(65 + $i)] = $text;
            }

            Question::firstOrCreate(
                ['skill' => $skill, 'level' => $level, 'part' => $part, 'topic' => $item['topic']],
                [
                    'content' => ['stem' => $item['stem'], 'options' => $options],
                    'answer_key' => ['correctAnswers' => ['0' => $item['answer']]],
                    'is_active' => true,
                    'verified_at' => now(),
                ],
            );
        }
    }
}
