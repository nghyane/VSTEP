<?php

declare(strict_types=1);

/**
 * Structured CEFR/VSTEP vocabulary curriculum.
 *
 * Topic labels are Vietnamese; target vocabulary and sample usage are English.
 * Each topic is repeated across A1-C1 so learners can see lexical progression
 * within the same real-world domain.
 *
 * @return array<string, array<string, list<array{string, string, string, string}>>>
 */
return [
    'Gia đình' => [
        'A1' => [
            ['mother', 'noun', 'mẹ', 'My mother cooks dinner every evening.'],
            ['father', 'noun', 'bố', 'My father reads a book after work.'],
            ['sister', 'noun', 'chị hoặc em gái', 'My sister is twelve years old.'],
            ['brother', 'noun', 'anh hoặc em trai', 'My brother plays football with me.'],
            ['parents', 'noun', 'bố mẹ', 'My parents live in a small house.'],
        ],
        'A2' => [
            ['relative', 'noun', 'họ hàng', 'We visit a relative during the holiday.'],
            ['grandparent', 'noun', 'ông hoặc bà', 'My grandparent tells funny stories.'],
            ['get along', 'verb', 'hòa thuận', 'I get along well with my cousins.'],
            ['look after', 'verb', 'chăm sóc', 'Parents look after their young children.'],
            ['family gathering', 'noun', 'buổi họp mặt gia đình', 'Our family gathering happens every Sunday.'],
        ],
        'B1' => [
            ['household', 'noun', 'hộ gia đình', 'Every member of the household shares the chores.'],
            ['generation', 'noun', 'thế hệ', 'Each generation has different habits.'],
            ['supportive', 'adjective', 'hay hỗ trợ, động viên', 'Her family is supportive of her decision to study abroad.'],
            ['upbringing', 'noun', 'sự nuôi dạy', 'His upbringing taught him to respect older people.'],
            ['responsibility', 'noun', 'trách nhiệm', 'Looking after a child is a serious responsibility.'],
        ],
        'B2' => [
            ['sibling rivalry', 'noun', 'sự cạnh tranh giữa anh chị em', 'Sibling rivalry can decrease when parents treat children fairly.'],
            ['work-life balance', 'noun', 'sự cân bằng công việc và cuộc sống', 'Good work-life balance gives parents more time with their children.'],
            ['extended family', 'noun', 'gia đình mở rộng', 'The extended family provides childcare when both parents work.'],
            ['intergenerational', 'adjective', 'giữa các thế hệ', 'Intergenerational conversations help preserve family traditions.'],
            ['financial burden', 'noun', 'gánh nặng tài chính', 'Rising rent creates a financial burden for young families.'],
        ],
        'C1' => [
            ['familial obligation', 'noun', 'nghĩa vụ gia đình', 'Familial obligation may influence whether graduates return to their hometowns.'],
            ['intergenerational mobility', 'noun', 'khả năng thăng tiến giữa các thế hệ', 'Education is often viewed as a route to intergenerational mobility.'],
            ['caregiving responsibility', 'noun', 'trách nhiệm chăm sóc người thân', 'Caregiving responsibility can limit an employee\'s career progression.'],
            ['domestic arrangement', 'noun', 'cách tổ chức đời sống gia đình', 'Remote work has changed the domestic arrangement of many households.'],
            ['kinship network', 'noun', 'mạng lưới quan hệ họ hàng', 'A strong kinship network can provide support during economic hardship.'],
        ],
    ],
    'Giáo dục' => [
        'A1' => [
            ['school', 'noun', 'trường học', 'My school is near my home.'],
            ['teacher', 'noun', 'giáo viên', 'The teacher writes on the board.'],
            ['student', 'noun', 'học sinh, sinh viên', 'Every student has a notebook.'],
            ['lesson', 'noun', 'bài học', 'Our English lesson starts at eight.'],
            ['homework', 'noun', 'bài tập về nhà', 'I finish my homework before dinner.'],
        ],
        'A2' => [
            ['subject', 'noun', 'môn học', 'Science is my favourite subject.'],
            ['exam', 'noun', 'kỳ thi', 'She studies hard for the exam.'],
            ['revise', 'verb', 'ôn tập', 'I revise vocabulary on the bus.'],
            ['classmate', 'noun', 'bạn cùng lớp', 'My classmate helped me with the project.'],
            ['graduate', 'verb', 'tốt nghiệp', 'He will graduate from high school next year.'],
        ],
        'B1' => [
            ['curriculum', 'noun', 'chương trình học', 'The curriculum includes practical communication skills.'],
            ['assignment', 'noun', 'bài tập được giao', 'We submitted our assignment before the deadline.'],
            ['scholarship', 'noun', 'học bổng', 'She received a scholarship to attend university.'],
            ['academic', 'adjective', 'thuộc học thuật', 'Academic success requires regular effort.'],
            ['concentrate', 'verb', 'tập trung', 'Students concentrate better in a quiet classroom.'],
        ],
        'B2' => [
            ['critical thinking', 'noun', 'tư duy phản biện', 'Debates develop critical thinking rather than simple memorisation.'],
            ['vocational training', 'noun', 'đào tạo nghề', 'Vocational training equips learners with job-ready skills.'],
            ['assessment criteria', 'noun', 'tiêu chí đánh giá', 'Clear assessment criteria help students improve their essays.'],
            ['educational inequality', 'noun', 'bất bình đẳng giáo dục', 'Digital access can reduce educational inequality in rural areas.'],
            ['lifelong learning', 'noun', 'học tập suốt đời', 'Lifelong learning is essential in a changing labour market.'],
        ],
        'C1' => [
            ['pedagogical approach', 'noun', 'phương pháp sư phạm', 'A learner-centred pedagogical approach encourages independent inquiry.'],
            ['academic integrity', 'noun', 'liêm chính học thuật', 'Universities must reinforce academic integrity in the age of generative AI.'],
            ['standardised assessment', 'noun', 'đánh giá chuẩn hóa', 'Standardised assessment may overlook creativity and local context.'],
            ['educational attainment', 'noun', 'trình độ học vấn đạt được', 'Parental income remains associated with educational attainment.'],
            ['interdisciplinary inquiry', 'noun', 'nghiên cứu liên ngành', 'Climate policy benefits from interdisciplinary inquiry across science and economics.'],
        ],
    ],
    'Sức khỏe' => [
        'A1' => [
            ['doctor', 'noun', 'bác sĩ', 'The doctor checks my throat.'],
            ['hospital', 'noun', 'bệnh viện', 'The hospital is open every day.'],
            ['medicine', 'noun', 'thuốc', 'I take my medicine after lunch.'],
            ['healthy', 'adjective', 'khỏe mạnh', 'Fruit helps me stay healthy.'],
            ['exercise', 'noun', 'việc tập thể dục', 'Exercise is good for my body.'],
        ],
        'A2' => [
            ['appointment', 'noun', 'cuộc hẹn khám', 'I have a dental appointment on Friday.'],
            ['headache', 'noun', 'đau đầu', 'She stayed home because of a headache.'],
            ['recover', 'verb', 'hồi phục', 'He recovered quickly after the flu.'],
            ['balanced diet', 'noun', 'chế độ ăn cân bằng', 'A balanced diet includes vegetables and protein.'],
            ['avoid', 'verb', 'tránh', 'You should avoid sugary drinks.'],
        ],
        'B1' => [
            ['symptom', 'noun', 'triệu chứng', 'A high temperature is a common symptom of infection.'],
            ['treatment', 'noun', 'phương pháp điều trị', 'The patient responded well to the treatment.'],
            ['mental health', 'noun', 'sức khỏe tinh thần', 'Regular breaks can improve mental health.'],
            ['prevent', 'verb', 'phòng ngừa', 'Vaccination can prevent serious illness.'],
            ['nutrition', 'noun', 'dinh dưỡng', 'Good nutrition supports children\'s development.'],
        ],
        'B2' => [
            ['healthcare access', 'noun', 'khả năng tiếp cận y tế', 'Remote clinics improve healthcare access for mountain communities.'],
            ['sedentary lifestyle', 'noun', 'lối sống ít vận động', 'A sedentary lifestyle increases the risk of heart disease.'],
            ['preventive measure', 'noun', 'biện pháp phòng ngừa', 'Screening is an effective preventive measure for some diseases.'],
            ['chronic condition', 'noun', 'bệnh mãn tính', 'People with a chronic condition need continuous care.'],
            ['well-being', 'noun', 'sự khỏe mạnh toàn diện', 'Flexible hours may enhance employees\' well-being.'],
        ],
        'C1' => [
            ['public health intervention', 'noun', 'can thiệp y tế công cộng', 'A public health intervention must be evaluated for equity as well as efficiency.'],
            ['health disparity', 'noun', 'chênh lệch về sức khỏe', 'Income and location contribute to persistent health disparity.'],
            ['evidence-based treatment', 'noun', 'điều trị dựa trên bằng chứng', 'Patients deserve access to evidence-based treatment rather than misinformation.'],
            ['psychological resilience', 'noun', 'khả năng phục hồi tâm lý', 'Community support can strengthen psychological resilience after a disaster.'],
            ['healthcare provision', 'noun', 'việc cung cấp dịch vụ y tế', 'An ageing population places pressure on long-term healthcare provision.'],
        ],
    ],
    'Môi trường' => [
        'A1' => [
            ['tree', 'noun', 'cây', 'There is a tall tree in our garden.'],
            ['river', 'noun', 'sông', 'The river is clean and blue.'],
            ['rain', 'noun', 'mưa', 'The rain helps the flowers grow.'],
            ['recycle', 'verb', 'tái chế', 'We recycle paper at school.'],
            ['rubbish', 'noun', 'rác', 'Please put rubbish in the bin.'],
        ],
        'A2' => [
            ['pollution', 'noun', 'ô nhiễm', 'Traffic causes pollution in the city.'],
            ['protect', 'verb', 'bảo vệ', 'We should protect wild animals.'],
            ['waste', 'noun', 'chất thải', 'The factory produces too much waste.'],
            ['save energy', 'verb', 'tiết kiệm năng lượng', 'Turn off the lights to save energy.'],
            ['environment', 'noun', 'môi trường', 'Cycling is better for the environment.'],
        ],
        'B1' => [
            ['climate change', 'noun', 'biến đổi khí hậu', 'Climate change is affecting farmers in many regions.'],
            ['renewable energy', 'noun', 'năng lượng tái tạo', 'Solar power is a form of renewable energy.'],
            ['habitat', 'noun', 'môi trường sống', 'Plastic waste damages the habitat of sea animals.'],
            ['conservation', 'noun', 'sự bảo tồn', 'Forest conservation protects rare species.'],
            ['carbon emissions', 'noun', 'khí thải carbon', 'Public transport can reduce carbon emissions.'],
        ],
        'B2' => [
            ['biodiversity loss', 'noun', 'suy giảm đa dạng sinh học', 'Deforestation accelerates biodiversity loss in tropical regions.'],
            ['sustainable development', 'noun', 'phát triển bền vững', 'Sustainable development balances economic growth with environmental protection.'],
            ['environmental regulation', 'noun', 'quy định môi trường', 'Strict environmental regulation can discourage illegal dumping.'],
            ['ecological footprint', 'noun', 'dấu chân sinh thái', 'Eating locally produced food may reduce your ecological footprint.'],
            ['fossil fuel dependence', 'noun', 'sự phụ thuộc nhiên liệu hóa thạch', 'Investment in wind power reduces fossil fuel dependence.'],
        ],
        'C1' => [
            ['climate resilience', 'noun', 'khả năng chống chịu khí hậu', 'Urban planning should prioritise climate resilience in flood-prone districts.'],
            ['environmental degradation', 'noun', 'suy thoái môi trường', 'Unchecked mining has caused severe environmental degradation.'],
            ['decarbonisation strategy', 'noun', 'chiến lược khử carbon', 'A credible decarbonisation strategy requires measurable targets.'],
            ['ecosystem restoration', 'noun', 'phục hồi hệ sinh thái', 'Ecosystem restoration can support livelihoods while protecting wildlife.'],
            ['environmental stewardship', 'noun', 'trách nhiệm gìn giữ môi trường', 'Schools can cultivate environmental stewardship through community projects.'],
        ],
    ],
    'Công việc' => [
        'A1' => [
            ['job', 'noun', 'công việc', 'My sister has a job in a shop.'],
            ['office', 'noun', 'văn phòng', 'He works in an office.'],
            ['manager', 'noun', 'quản lý', 'The manager talks to the staff.'],
            ['salary', 'noun', 'lương', 'She gets her salary every month.'],
            ['work', 'verb', 'làm việc', 'I work from Monday to Friday.'],
        ],
        'A2' => [
            ['apply', 'verb', 'nộp đơn', 'I want to apply for a summer job.'],
            ['interview', 'noun', 'buổi phỏng vấn', 'Her interview lasted thirty minutes.'],
            ['colleague', 'noun', 'đồng nghiệp', 'My colleague showed me how to use the machine.'],
            ['experience', 'noun', 'kinh nghiệm', 'He has experience working with customers.'],
            ['part-time', 'adjective', 'bán thời gian', 'Many students have a part-time job.'],
        ],
        'B1' => [
            ['qualification', 'noun', 'bằng cấp, năng lực', 'This position requires a teaching qualification.'],
            ['promotion', 'noun', 'sự thăng chức', 'She earned a promotion after two successful projects.'],
            ['deadline', 'noun', 'hạn chót', 'Our team completed the report before the deadline.'],
            ['employment', 'noun', 'việc làm', 'Tourism provides employment for local residents.'],
            ['productive', 'adjective', 'có năng suất', 'A clear schedule helps employees remain productive.'],
        ],
        'B2' => [
            ['career progression', 'noun', 'sự thăng tiến nghề nghiệp', 'Professional training supports career progression.'],
            ['job satisfaction', 'noun', 'mức độ hài lòng công việc', 'Fair pay is only one factor in job satisfaction.'],
            ['transferable skill', 'noun', 'kỹ năng chuyển đổi được', 'Communication is a transferable skill valued by employers.'],
            ['workforce shortage', 'noun', 'thiếu hụt nhân lực', 'The healthcare sector faces a serious workforce shortage.'],
            ['performance appraisal', 'noun', 'đánh giá hiệu suất', 'A fair performance appraisal should include constructive feedback.'],
        ],
        'C1' => [
            ['occupational mobility', 'noun', 'khả năng dịch chuyển nghề nghiệp', 'Digital skills enhance occupational mobility in volatile economies.'],
            ['labour market participation', 'noun', 'sự tham gia thị trường lao động', 'Affordable childcare can increase labour market participation among women.'],
            ['professional autonomy', 'noun', 'quyền tự chủ nghề nghiệp', 'Professional autonomy often improves motivation and accountability.'],
            ['workplace inclusivity', 'noun', 'tính hòa nhập nơi làm việc', 'Workplace inclusivity requires policies that address unconscious bias.'],
            ['employment precarity', 'noun', 'sự bấp bênh việc làm', 'Gig workers frequently experience employment precarity without social protection.'],
        ],
    ],
    'Công nghệ' => [
        'A1' => [
            ['phone', 'noun', 'điện thoại', 'I use my phone to call my friend.'],
            ['computer', 'noun', 'máy tính', 'Our computer is on the desk.'],
            ['internet', 'noun', 'mạng internet', 'The internet helps me find information.'],
            ['email', 'noun', 'thư điện tử', 'I sent an email to my teacher.'],
            ['screen', 'noun', 'màn hình', 'The screen is very bright.'],
        ],
        'A2' => [
            ['download', 'verb', 'tải xuống', 'You can download the document from this website.'],
            ['password', 'noun', 'mật khẩu', 'Do not share your password with anyone.'],
            ['online', 'adjective', 'trực tuyến', 'We joined an online English class.'],
            ['application', 'noun', 'ứng dụng', 'This application helps me learn new words.'],
            ['device', 'noun', 'thiết bị', 'Turn off your device before the flight.'],
        ],
        'B1' => [
            ['digital skill', 'noun', 'kỹ năng số', 'A basic digital skill is necessary for most office jobs.'],
            ['privacy', 'noun', 'quyền riêng tư', 'Users should check their privacy settings carefully.'],
            ['social media', 'noun', 'mạng xã hội', 'Social media can spread news very quickly.'],
            ['innovation', 'noun', 'sự đổi mới', 'Innovation has changed the way people communicate.'],
            ['reliable source', 'noun', 'nguồn đáng tin cậy', 'Students must find a reliable source for research.'],
        ],
        'B2' => [
            ['data security', 'noun', 'bảo mật dữ liệu', 'Companies must invest in data security to protect customers.'],
            ['digital divide', 'noun', 'khoảng cách số', 'Affordable broadband can narrow the digital divide.'],
            ['automation', 'noun', 'tự động hóa', 'Automation may remove routine tasks while creating new roles.'],
            ['artificial intelligence', 'noun', 'trí tuệ nhân tạo', 'Artificial intelligence can support doctors in analysing images.'],
            ['misinformation', 'noun', 'thông tin sai lệch', 'Users need media literacy to recognise misinformation online.'],
        ],
        'C1' => [
            ['algorithmic bias', 'noun', 'thiên lệch thuật toán', 'Audits are necessary to detect algorithmic bias in hiring systems.'],
            ['digital governance', 'noun', 'quản trị số', 'Effective digital governance must balance innovation with public accountability.'],
            ['technological disruption', 'noun', 'sự gián đoạn do công nghệ', 'Technological disruption requires workers to continually update their skills.'],
            ['data sovereignty', 'noun', 'chủ quyền dữ liệu', 'Data sovereignty has become central to national technology policy.'],
            ['ethical implication', 'noun', 'hệ quả đạo đức', 'Developers should examine every ethical implication of automated decision-making.'],
        ],
    ],
];
