<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Level;
use App\Enums\Skill;
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
        // Part 1: Short announcements (8 Qs in real VSTEP)
        $this->bulk(Skill::Listening, Level::A2, 1, [
            ['Where is the announcement being made?', ['At a train station', 'At an airport', 'At a bus stop', 'At a hospital'], 'B'],
            ['What time does the store close today?', ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'], 'C'],
            ['What should passengers do?', ['Wait at gate 5', 'Go to the information desk', 'Check the screen', 'Call the airline'], 'A'],
            ['Who is the message for?', ['All employees', 'New students', 'Hotel guests', 'Bus passengers'], 'C'],
            ['What is being announced?', ['A schedule change', 'A new product', 'A weather warning', 'A job opening'], 'A'],
            ['How long will the delay be?', ['10 minutes', '20 minutes', '30 minutes', '1 hour'], 'B'],
        ]);

        $this->bulk(Skill::Listening, Level::B1, 1, [
            ['What is the purpose of the announcement?', ['To advertise a product', 'To inform about a policy change', 'To welcome visitors', 'To give travel directions'], 'B'],
            ['According to the speaker, what should visitors do first?', ['Register at reception', 'Find their seats', 'Turn off phones', 'Read the brochure'], 'A'],
            ['Where would you most likely hear this announcement?', ['In a library', 'At a conference', 'On a train', 'In a restaurant'], 'B'],
            ['What does the speaker ask people to do?', ['Leave the building', 'Fill out a form', 'Move to another room', 'Wait for instructions'], 'D'],
            ['When will the event begin?', ['In 5 minutes', 'In 15 minutes', 'In 30 minutes', 'In 1 hour'], 'B'],
            ['What change is being announced?', ['New opening hours', 'A price increase', 'A staff change', 'Building renovation'], 'A'],
        ]);

        $this->bulk(Skill::Listening, Level::B2, 1, [
            ['What is the main point of the announcement?', ['A safety regulation update', 'An upcoming inspection', 'A training schedule', 'A holiday closure'], 'A'],
            ['The speaker implies that the new policy will...', ['Reduce costs significantly', 'Require additional staff training', 'Take effect immediately', 'Be reviewed next quarter'], 'B'],
            ['What problem does the speaker mention?', ['Budget constraints', 'Staff shortages', 'Technical difficulties', 'Low attendance'], 'C'],
            ['According to the announcement, employees should...', ['Submit reports by Friday', 'Attend the meeting tomorrow', 'Update their contact details', 'Review the handbook'], 'A'],
            ['What can be inferred about the organization?', ['It is expanding rapidly', 'It recently merged with another company', 'It is experiencing financial difficulties', 'It has changed leadership'], 'A'],
        ]);

        // Part 2: Conversations (12 Qs in real VSTEP)
        $this->bulk(Skill::Listening, Level::A2, 2, [
            ['What are the speakers talking about?', ['A holiday plan', 'A school project', 'A birthday party', 'A shopping list'], 'A'],
            ['How will the woman get to work?', ['By bus', 'By car', 'By bicycle', 'On foot'], 'B'],
            ['What does the man suggest?', ['Going to a restaurant', 'Cooking at home', 'Ordering delivery', 'Skipping dinner'], 'A'],
            ['Why is the woman upset?', ['She lost her phone', 'She missed the bus', 'She failed a test', 'She forgot her wallet'], 'B'],
            ['What will the man do next?', ['Call a taxi', 'Check the map', 'Ask for directions', 'Wait at the station'], 'C'],
            ['Where are the speakers?', ['At a shop', 'At school', 'At a park', 'At home'], 'A'],
            ['What does the woman want to buy?', ['A dress', 'A book', 'A phone', 'Shoes'], 'D'],
            ['When will they meet?', ['Monday morning', 'Tuesday afternoon', 'Wednesday evening', 'Thursday night'], 'B'],
        ]);

        $this->bulk(Skill::Listening, Level::B1, 2, [
            ['What is the main topic of the conversation?', ['A vacation plan', 'A job interview', 'A health concern', 'A class assignment'], 'B'],
            ['Why does the man disagree with the woman?', ['He thinks it is too expensive', 'He prefers another option', 'He does not have time', 'He already made plans'], 'A'],
            ['What will the speakers probably do next?', ['Go shopping', 'Call a friend', 'Check the schedule', 'Leave the office'], 'C'],
            ['What can be inferred about the woman?', ['She is a new employee', 'She is the man\'s boss', 'She has visited before', 'She is running late'], 'A'],
            ['The man mentions that the project...', ['Is ahead of schedule', 'Needs more funding', 'Was just approved', 'Has been cancelled'], 'B'],
            ['What is the woman\'s concern?', ['The deadline is too tight', 'The budget is insufficient', 'The team is too small', 'The client is unhappy'], 'A'],
            ['How does the man feel about the proposal?', ['Enthusiastic', 'Skeptical', 'Indifferent', 'Confused'], 'B'],
            ['What do the speakers agree on?', ['They need more data', 'The plan is ready', 'They should ask the manager', 'The meeting was productive'], 'A'],
        ]);

        $this->bulk(Skill::Listening, Level::B2, 2, [
            ['What is the primary concern discussed?', ['Environmental impact of new policy', 'Cost of implementation', 'Timeline for completion', 'Staff resistance to change'], 'A'],
            ['The woman suggests that the company should...', ['Hire external consultants', 'Delay the project', 'Conduct more research', 'Increase the budget'], 'C'],
            ['What does the man imply about the previous approach?', ['It was too conservative', 'It lacked proper planning', 'It was ahead of its time', 'It yielded unexpected results'], 'B'],
            ['According to the conversation, the main challenge is...', ['Limited resources', 'Changing regulations', 'Market competition', 'Internal disagreements'], 'D'],
            ['What can be concluded from the discussion?', ['Both speakers support the initiative', 'The woman is more optimistic than the man', 'They disagree on the fundamental approach', 'A decision has already been made'], 'B'],
            ['The speakers agree that the next step should be...', ['Presenting findings to the board', 'Gathering stakeholder feedback', 'Revising the timeline', 'Allocating additional resources'], 'B'],
        ]);

        // Part 3: Lectures (15 Qs in real VSTEP)
        $this->bulk(Skill::Listening, Level::B1, 3, [
            ['What is the lecture mainly about?', ['The history of the internet', 'Climate change effects', 'Modern education methods', 'Economic development in Asia'], 'C'],
            ['According to the speaker, what is the biggest challenge?', ['Lack of funding', 'Lack of trained teachers', 'Student motivation', 'Outdated curriculum'], 'B'],
            ['The speaker mentions Finland as an example of...', ['Economic growth', 'Educational reform', 'Political stability', 'Environmental policy'], 'B'],
            ['What does the speaker suggest should be done?', ['Increase school hours', 'Invest in teacher training', 'Reduce class sizes', 'Use more technology'], 'B'],
            ['What is the speaker\'s tone?', ['Critical', 'Optimistic', 'Neutral', 'Pessimistic'], 'B'],
            ['According to the lecture, technology in education...', ['Should replace teachers', 'Is a useful supplement', 'Creates more problems', 'Is too expensive'], 'B'],
        ]);

        $this->bulk(Skill::Listening, Level::B2, 3, [
            ['What is the primary focus of the lecture?', ['The relationship between urbanization and public health', 'Modern architectural trends', 'Transportation infrastructure', 'Population growth statistics'], 'A'],
            ['The speaker argues that urbanization has led to...', ['Better healthcare access', 'Increased mental health issues', 'Lower crime rates', 'Improved air quality'], 'B'],
            ['According to the data presented, which factor has the strongest correlation?', ['Income level and life expectancy', 'Population density and pollution', 'Education level and employment', 'Housing cost and migration'], 'B'],
            ['The speaker criticizes the current approach because...', ['It focuses too much on short-term solutions', 'It ignores rural communities', 'It is based on outdated research', 'It requires too much government spending'], 'A'],
            ['What recommendation does the speaker make?', ['Implementing green space requirements', 'Limiting city population growth', 'Investing in suburban development', 'Reducing public transportation funding'], 'A'],
            ['The study mentioned in the lecture found that...', ['Urban residents exercise more than rural residents', 'Access to parks reduces stress levels significantly', 'City noise has no effect on sleep quality', 'Pollution affects children more than adults'], 'B'],
        ]);

        $this->bulk(Skill::Listening, Level::C1, 3, [
            ['The lecturer\'s main thesis is that...', ['Globalization has fundamentally altered cultural identity', 'Economic integration benefits all nations equally', 'Cultural homogenization is inevitable', 'Local traditions are resistant to global influence'], 'A'],
            ['The concept of "glocalization" refers to...', ['Global companies adapting products to local markets', 'Local businesses expanding internationally', 'The rejection of foreign cultural influence', 'Government policies protecting domestic industries'], 'A'],
            ['The speaker uses the example of Japanese cuisine to illustrate...', ['Cultural preservation efforts', 'The adaptation of foreign elements into local traditions', 'The decline of traditional cooking methods', 'The economic value of food tourism'], 'B'],
            ['What criticism does the speaker raise about previous research?', ['It relied too heavily on quantitative methods', 'It failed to account for power dynamics', 'It generalized findings from limited samples', 'It ignored economic factors entirely'], 'C'],
            ['According to the lecturer, the most significant implication is...', ['The need for new theoretical frameworks', 'The economic opportunity in cultural exchange', 'The political consequences of cultural shift', 'The educational reform required'], 'A'],
        ]);
    }

    // ── Reading ────────────────────────────────────────────────

    private function seedReading(): void
    {
        // Part 1: Everyday texts (10 Qs in real VSTEP)
        $this->bulk(Skill::Reading, Level::A2, 1, [
            ['What is the passage mainly about?', ['A family vacation', 'A cooking recipe', 'A school event', 'A job advertisement'], 'C'],
            ['The word "delighted" in line 3 is closest in meaning to...', ['Sad', 'Happy', 'Angry', 'Confused'], 'B'],
            ['According to the text, when does the event start?', ['Monday', 'Wednesday', 'Friday', 'Saturday'], 'D'],
            ['Who wrote this notice?', ['A student', 'A teacher', 'A parent', 'The principal'], 'D'],
            ['What should interested people do?', ['Call the office', 'Send an email', 'Visit the website', 'Come to the school'], 'B'],
            ['How much does the activity cost?', ['It is free', '$5', '$10', '$20'], 'A'],
        ]);

        $this->bulk(Skill::Reading, Level::B1, 1, [
            ['What is the author\'s main purpose?', ['To entertain readers', 'To give advice on healthy eating', 'To advertise a product', 'To describe a scientific experiment'], 'B'],
            ['According to the passage, which food is recommended?', ['Fast food', 'Processed snacks', 'Fresh vegetables', 'Canned soup'], 'C'],
            ['The word "detrimental" in paragraph 2 means...', ['Helpful', 'Harmful', 'Important', 'Unusual'], 'B'],
            ['What does the author suggest readers do?', ['Avoid all sugar', 'Eat more protein', 'Reduce processed food', 'Skip breakfast'], 'C'],
            ['Which statement is NOT supported by the text?', ['Vegetables are nutritious', 'Exercise is important', 'Sleep affects health', 'Organic food cures diseases'], 'D'],
            ['The passage is most likely from...', ['A novel', 'A health magazine', 'A textbook', 'A research paper'], 'B'],
        ]);

        // Part 2: Social issues (10 Qs in real VSTEP)
        $this->bulk(Skill::Reading, Level::B1, 2, [
            ['What is the main idea of the passage?', ['Traffic congestion affects quality of life', 'Public transport should be free', 'Cars should be banned from cities', 'Cycling is the best transport'], 'A'],
            ['According to the author, what is the primary cause?', ['Poor road design', 'Increasing car ownership', 'Lack of buses', 'Bad weather'], 'B'],
            ['The author\'s attitude toward the current situation is...', ['Supportive', 'Critical', 'Neutral', 'Humorous'], 'B'],
            ['What solution does the text propose?', ['Building more roads', 'Investing in public transport', 'Banning private cars', 'Reducing speed limits'], 'B'],
            ['The word "alleviate" is closest in meaning to...', ['Worsen', 'Create', 'Reduce', 'Ignore'], 'C'],
            ['Which is implied but not directly stated?', ['The problem will get worse without action', 'People prefer buses to trains', 'The government has enough money', 'All cities have the same problem'], 'A'],
        ]);

        $this->bulk(Skill::Reading, Level::B2, 2, [
            ['The passage primarily discusses...', ['The economic impact of remote work', 'The history of telecommuting', 'Management strategies for virtual teams', 'Technology infrastructure requirements'], 'A'],
            ['According to the research cited, remote workers...', ['Are less productive than office workers', 'Report higher job satisfaction', 'Earn more than office counterparts', 'Have fewer career advancement opportunities'], 'B'],
            ['The author uses the phrase "double-edged sword" to suggest that...', ['Remote work has both advantages and disadvantages', 'Technology is unreliable', 'Companies save money at employees\' expense', 'The trend will reverse'], 'A'],
            ['What can be inferred about the future of work?', ['All jobs will be remote', 'Hybrid models will become standard', 'Offices will disappear entirely', 'Remote work is a temporary trend'], 'B'],
            ['The word "paramount" in paragraph 4 is closest in meaning to...', ['Optional', 'Interesting', 'Essential', 'Difficult'], 'C'],
            ['Which counterargument does the author acknowledge?', ['Remote work increases isolation', 'Technology costs are prohibitive', 'Not all jobs can be done remotely', 'Productivity always decreases'], 'A'],
        ]);

        // Part 3: Advanced topics
        $this->bulk(Skill::Reading, Level::B2, 3, [
            ['The author uses the example of Finland to illustrate...', ['Economic growth', 'Educational reform success', 'Political stability', 'Cultural diversity'], 'B'],
            ['Which statement best summarizes the fourth paragraph?', ['Technology solves all problems', 'Balance is needed in policy-making', 'Tradition is always better', 'Research is unreliable'], 'B'],
            ['The passage suggests that standardized testing...', ['Accurately measures intelligence', 'Is the best assessment method', 'Has significant limitations', 'Should be abolished entirely'], 'C'],
            ['What does the author mean by "one-size-fits-all approach"?', ['A flexible method', 'A universal but inflexible solution', 'A custom-made strategy', 'An expensive program'], 'B'],
            ['The conclusion implies that...', ['More research is needed', 'The current system works well', 'Change is impossible', 'Students don\'t care about education'], 'A'],
        ]);

        // Part 4: Academic/specialized
        $this->bulk(Skill::Reading, Level::C1, 4, [
            ['The researcher\'s primary argument is that...', ['Cognitive biases are universal and unavoidable', 'Cultural context shapes decision-making processes', 'Economic models accurately predict behavior', 'Individual differences are negligible'], 'B'],
            ['The study\'s methodology has been criticized for...', ['Using too small a sample size', 'Relying on self-reported data', 'Ignoring demographic variables', 'Not being replicable'], 'B'],
            ['The term "epistemic humility" as used in the text refers to...', ['Acknowledging the limits of one\'s knowledge', 'Being modest about achievements', 'Questioning established theories', 'Accepting criticism gracefully'], 'A'],
            ['What distinguishes the author\'s approach from earlier studies?', ['It employs mixed methods', 'It focuses on developing countries', 'It uses a longitudinal design', 'It incorporates interdisciplinary perspectives'], 'D'],
            ['The passage implies that future research should...', ['Replicate existing studies', 'Explore cross-cultural dimensions more thoroughly', 'Focus exclusively on economic outcomes', 'Abandon qualitative approaches'], 'B'],
        ]);
    }

    // ── Writing ────────────────────────────────────────────────

    private function seedWriting(): void
    {
        $tasks = [
            [Level::A2, 1, 'Write a short letter (80-100 words) to your friend inviting them to your birthday party. Include the date, time, place, and what you will do.'],
            [Level::B1, 1, 'Write an email (120-150 words) to your teacher explaining why you were absent from class last week and asking about the homework you missed.'],
            [Level::B1, 1, 'You recently moved to a new city. Write a letter (120-150 words) to your friend describing your new neighborhood and your feelings about the move.'],
            [Level::B1, 2, 'Some people think students should wear uniforms at school. Others disagree. Write an essay (150-180 words) giving your opinion with reasons.'],
            [Level::B2, 1, 'Write a formal letter (150-180 words) to a company applying for a summer internship. Describe your qualifications and why you are interested.'],
            [Level::B2, 2, 'Write an essay (250 words) discussing the advantages and disadvantages of social media for young people. Give specific examples to support your points.'],
            [Level::B2, 2, 'Some people believe that technology has made life easier, while others think it has created new problems. Discuss both views and give your opinion (250 words).'],
            [Level::C1, 2, 'Critically evaluate the claim that globalization has done more harm than good for developing nations. Support your argument with specific examples (300 words).'],
            [Level::C1, 2, 'To what extent should governments regulate artificial intelligence? Discuss the ethical, economic, and social implications in a well-structured essay (300 words).'],
        ];

        foreach ($tasks as [$level, $part, $prompt]) {
            Question::create([
                'skill' => Skill::Writing,
                'level' => $level,
                'part' => $part,
                'content' => ['prompt' => $prompt],
                'answer_key' => null,
                'is_active' => true,
            ]);
        }
    }

    // ── Speaking ───────────────────────────────────────────────

    private function seedSpeaking(): void
    {
        $tasks = [
            [Level::A2, 1, 'Tell me about your family. How many people are there? What do they do?'],
            [Level::A2, 1, 'Describe your daily routine. What do you do from morning to evening?'],
            [Level::B1, 1, 'Describe a memorable trip you have taken. Where did you go? What did you do? Why was it memorable?'],
            [Level::B1, 1, 'Talk about your favorite hobby or activity. How did you start it? Why do you enjoy it?'],
            [Level::B1, 2, 'Look at the two pictures. Compare and contrast life in a big city and life in the countryside. Which would you prefer to live in and why?'],
            [Level::B1, 2, 'Compare studying alone and studying in a group. What are the advantages and disadvantages of each?'],
            [Level::B2, 2, 'Compare the roles of traditional media and social media in modern society. How do they influence public opinion differently?'],
            [Level::B2, 3, 'Some people say that young people today have too much freedom. Do you agree or disagree? Give reasons and examples.'],
            [Level::B2, 3, 'Should university education be free for all students? Present arguments for both sides and give your opinion.'],
            [Level::C1, 3, 'Discuss the ethical implications of genetic engineering in humans. Consider the scientific, social, and moral dimensions of this issue.'],
            [Level::C1, 3, 'Evaluate the role of international organizations in addressing global inequality. How effective have they been, and what changes would you recommend?'],
        ];

        foreach ($tasks as [$level, $part, $prompt]) {
            Question::create([
                'skill' => Skill::Speaking,
                'level' => $level,
                'part' => $part,
                'content' => ['prompt' => $prompt],
                'answer_key' => null,
                'is_active' => true,
            ]);
        }
    }

    // ── Helpers ────────────────────────────────────────────────

    private function bulk(Skill $skill, Level $level, int $part, array $items): void
    {
        foreach ($items as $item) {
            $options = [];
            foreach ($item[1] as $i => $text) {
                $options[chr(65 + $i)] = $text;
            }

            Question::create([
                'skill' => $skill,
                'level' => $level,
                'part' => $part,
                'content' => [
                    'stem' => $item[0],
                    'options' => $options,
                ],
                'answer_key' => [
                    'correctAnswers' => ['0' => $item[2]],
                ],
                'is_active' => true,
            ]);
        }
    }
}
