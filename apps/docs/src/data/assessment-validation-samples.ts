type AssessmentValidationSample = {
  slug: string;
  tab: string;
  label: string;
  sampleType: "benchmark" | "guardrail";
  expectedLabel: string;
  sourceGrade?: string;
  riskType?: string;
  prompt: string;
  requirements: string[];
  note: string;
  answer: string;
};

const assessmentValidationSamples: AssessmentValidationSample[] = [
  {
    slug: "cambridge-fce-environment-001-grade3",
    tab: "environment",
    label: "FCE 01: Environment — Grade 3 (B1)",
    sampleType: "benchmark",
    expectedLabel: "Kỳ vọng B1 · band 5.5",
    sourceGrade: "3",
    prompt: "Every country in the world has problems with pollution and damage to the environment. Do you think these problems can be solved?",
    requirements: ["Discuss transport and pollution", "Discuss rivers and seas", "Suggest solutions"],
    note: "Bài benchmark mức B1: nội dung liên quan nhưng chưa trả lời đầy đủ câu hỏi giải pháp.",
    answer: `I think that my country has problems with pollution to the environment like all other countries. This problem is normal for Russia. We have big problems with transport because there are too much cars in our country. And because of that we have problems with atmospeer, air in my city and in all Russia is really dirty and sometimes I can't make a sigh because it smells around me and of course around that cars on the road. I've heard about tradition of one country. They don't go anywhere by car one day a month or a year, they just use bycicle or their feet. I think it could be very good if we had a tradition like that.

So, what about the rivers and the seas? Yeah, there are some really good and clean rivers and seas where you can go, but there are not many of them. Once I saw the river OB in my city, it was about two years ago but I stil remember that in some places it was not blue, it was green or purple I didn't really understand because it had different colours.

I don't know what should we do. Maybe we should just open our eyes and look what we did. But Russian people don't care about the world around them many people care only about themselves an that's all.

So, the best idea is look around and try to do something good for our planet and for us and our children.`,
  },
  {
    slug: "cambridge-fce-environment-002-grade3-4",
    tab: "environment",
    label: "FCE 02: Environment — Grade 3-4 (B1+)",
    sampleType: "benchmark",
    expectedLabel: "Biên B1/B2 · band 6.0",
    sourceGrade: "3-4",
    prompt: "Every country in the world has problems with pollution and damage to the environment. Do you think these problems can be solved?",
    requirements: ["Discuss transport and pollution", "Discuss rivers and seas", "Suggest a third aspect"],
    note: "Bài benchmark biên B1/B2: có ý và đoạn rõ, nhưng giải pháp chưa phát triển sâu.",
    answer: `To begin with pollution and damage to the environment is the most serious and difficult problem for countries of all over the world. Scientists of different countries predict a global ecocatastrophe if people won't change their attitude to our planet.

First of all a huge damage to the environment brings a transport. People can't imagine their living without cars, buses, trains, ships and planes. But it's an open secret that one of disadvantage of these accustomed things is harmful exhaust. Needless to say that use of environment friendly engines helps us to save atmosphere from pollution.

In addition to this our rivers and seas are in not less danger situation. It's a fact of common knowledge that numerous factories and plants pour off their waste to ponds. Obviously that cleaning manufacturing water helps to avoid extinction of ocean residents.

Apart from this I'm inclined to believe that every person can and must contribute to solving this important problem. Doing a little steps for protection our environment every day we will be able to save our Earth. And it's a task of each of us.`,
  },
  {
    slug: "cambridge-fce-environment-003-grade5",
    tab: "environment",
    label: "FCE 03: Environment — Grade 5 (B2+)",
    sampleType: "benchmark",
    expectedLabel: "Kỳ vọng B2 · band 7.5",
    sourceGrade: "5",
    prompt: "Every country in the world has problems with pollution and damage to the environment. Do you think these problems can be solved?",
    requirements: ["Discuss transport solutions", "Discuss rivers and seas", "Suggest individual actions"],
    note: "Bài benchmark tốt: trả lời đủ ý, có lập luận và từ vựng rộng hơn.",
    answer: `DEVELOPMENT VS ENVIRONMENT

If we surf the web looking for pollution and environmental catastrophes, we will find out that every country in the world suffers them. This is a natural consequence of the struggle between development and environment.

If a country decided to live isolated from the rest of the world, living on what it can naturally grow and produce, it surely wouldn't be highly polluted. But we all want exotic food and technological items from all over the world, so we have to pay the price.

Investing on electrical transport would benefit the environment a lot. Even more if this electricity came from a natural source of energy like wind, rivers and solar boards. It's difficult to achieve this because petrol companies will fight against these actions.

We also have to take care of our rivers and seas. We all have heard about factories throwing highly toxic substances to rivers, without minimizing their poisoning effects. A really strict law should be applied to fine these factories and make them change their policy.

But what about ourselves? We also can do a lot! If, when possible, we bought larger packs of food, we would be producing less rubbish. And this is only an example!`,
  },
  {
    slug: "cambridge-fce-fashion-004-grade3",
    tab: "fashion",
    label: "FCE 04: Fashion — Grade 3 (B1)",
    sampleType: "benchmark",
    expectedLabel: "Kỳ vọng B1 · band 5.5",
    sourceGrade: "3",
    prompt: "Some people say the fashion industry has a bad effect on people's lives. Do you agree?",
    requirements: ["Discuss importance of appearance", "Discuss the price of clothes", "Give your own opinion"],
    note: "Bài benchmark B1: đủ nội dung chính nhưng tổ chức, từ vựng và ngữ pháp còn hạn chế.",
    answer: `In today's world, the fashion industry has a strong importance in people's lives. The fashion industry say to the society what to wear and creates new types of clothes all the time.

Some people claim that the fashion industry has a bad effect on people's lives, they say that the fashion industry creates clothes that the society has to wear. Furthermore, the clothes' price is extremely high and people, who can't afford it, should not be in the society.

In the other hand, the fashion industry guide the people to be in a good appearance, because, nowadays, the appearance of the person is more important than the person itself.

In my opinion, the fashion industry doesn't has a bad influence on people's lives. It's something which was created to help people what to wear.`,
  },
  {
    slug: "cambridge-fce-fashion-005-grade4",
    tab: "fashion",
    label: "FCE 05: Fashion — Grade 4 (B2)",
    sampleType: "benchmark",
    expectedLabel: "Kỳ vọng B2 · band 6.5",
    sourceGrade: "4",
    prompt: "Some people say the fashion industry has a bad effect on people's lives. Do you agree?",
    requirements: ["Discuss importance of appearance", "Discuss the price of clothes", "Give your own opinion"],
    note: "Bài benchmark B2: ý rõ và tổ chức tốt hơn, vẫn còn lỗi từ vựng/ngữ pháp.",
    answer: `Fashion industry is very a discussed subject nowadays: they create and design new clothes everyday in order to satisfy some people needs.

There are many people who claim that the fashion industry is important and good for society. According to them, this industry design beautiful clothes and thanks to that every person can wear shirts, trousers or any acessory which is on today's fashion.

On the other hand, the fashion industry in some people opinion, controls the market of clothes and because of that they can't wear what they want to. In addition, the industry can increase the price of clothes, forcing people who don't want to be "oldfashioned" to buy and pay a large amount of money to keep "beautiful".

In my opinion, we can't let the fashion industry decide what we must or musn't wear. We shouldn't judge people for its appearance,because that is not important. We must wear whatever we like, want and feel confortable with.`,
  },
  {
    slug: "cambridge-fce-fashion-006-grade5",
    tab: "fashion",
    label: "FCE 06: Fashion — Grade 5 (B2+)",
    sampleType: "benchmark",
    expectedLabel: "Kỳ vọng B2 · band 7.5",
    sourceGrade: "5",
    prompt: "Some people say the fashion industry has a bad effect on people's lives. Do you agree?",
    requirements: ["Discuss importance of appearance", "Discuss the price of clothes", "Give your own opinion"],
    note: "Bài benchmark tốt: lập luận cân bằng, liên kết tốt và có từ vựng ít phổ biến.",
    answer: `The society we live today is characterised by technology in constant development, fast speed processes, information travelling and getting to people at a blink of an eye and a complex web of social networking. In this context, the fashion industry is becoming increasingly important and having a more and more paramount role in our lives.

On one hand, the fashion industry is undeniably a source of profit and income. It hires millions of people all over the world and generates millions of dollars every year. Furthermore, such profitable business is also believed to be able to spread and make known the culture of a people, encouraging and enhancing a better understanding of each other.

Nevertheless, for those who are neither impressed nor motivated by numbers and figures, the fashion industry is seen as one which segregates people, isolating those who not fit their laws and commands. It is stated that people place too much importance on appearance and the material, world, sadly true, and the fashion industry just spurs on such situation. Moreover, not only are the costs of fashion item unrealistically high, it is thought to be a money better spent on more pressing issues, such as poverty and hunger.

I do believe that the fashion industry, as it is today, has a harmful effect, because it values a minority of people in detriment to the majority. However, it has such a wide reach that, it put into a good use, it can save lives.`,
  },
  {
    slug: "cambridge-fce-languages-007-grade5",
    tab: "languages",
    label: "FCE 07: Languages — Grade 5 (B2+)",
    sampleType: "benchmark",
    expectedLabel: "Kỳ vọng B2 · band 7.5",
    sourceGrade: "5",
    prompt: "There are more reasons to learn a foreign language than just to pass a test. Do you agree?",
    requirements: ["Discuss learning for pleasure", "Discuss personal challenge", "Give your own idea"],
    note: "Bài benchmark tốt: trả lời đầy đủ động cơ học ngoại ngữ, có ví dụ và kết luận rõ.",
    answer: `Everything around us revolves around language(s), it is the most important thing in our lives. Society would just not function without it. They are It is our future and I would personaly love to learn as many as I possibly can.

Not everything in life is done because it is necessary. Learning a new language can be a lot of fun. Many people only do it as a hoby, or their knowledge is something that brings them pride and pleasure.

Secondly, we have people who do it simply to challenge themselves. Truly I believe that having a great outcome that stems from your hard work and dedication to learn something new is a wonderful way to challenge prove your ability to yourself and others. Then there is travelling. It is very important to be able to understand and have a conversation with someone abroad, unless you would like to get lost or worse.

To conclude, I think that learning a new language is an amazing thing no matter why you do it. It is always better to do things out of enjoyment, but even if you do it for a test, that knowledge will always be useful.`,
  },
  {
    slug: "cambridge-fce-languages-008-grade3-4",
    tab: "languages",
    label: "FCE 08: Languages — Grade 3-4 (B1+)",
    sampleType: "benchmark",
    expectedLabel: "Biên B1/B2 · band 6.0",
    sourceGrade: "3-4",
    prompt: "There are more reasons to learn a foreign language than just to pass a test. Do you agree?",
    requirements: ["Discuss learning for pleasure", "Discuss personal challenge", "Give your own idea"],
    note: "Bài benchmark biên B1/B2: tổ chức ổn, nhưng hơi lệch sang trải nghiệm cá nhân.",
    answer: `Learning a a foreign languages is very important nowadays. English, in particular, is essential because it allows is spoken all over the world. That's the reason why we start studying it from the age of six years old. Going abroad and being able to speak to native people is very satisfying and that's why I want to improve my knowledge about foreign languages.

I decided to take this exam to know how high my level of English is, but also because I need this certification to go abroad next summer. I really want to come back to Cornwall, an amazing region in the South-West of England. I've been there twice with my family, but now I want to go alone. Only being there to England I can really improve my English comprehension and speaking skills.

Fortunately I can will have some English lessons which taught in English at university and I can't wait for it because it will be an interesting challenge for me.

Studying foreign languages is essential to live and to travel. It isn't simple and I surely have to challenge myself everyday, but the result is so satisfying that we I can't do without it.`,
  },
  {
    slug: "cambridge-fce-history-009-grade5",
    tab: "history",
    label: "FCE 09: History — Grade 5 (B2+)",
    sampleType: "benchmark",
    expectedLabel: "Kỳ vọng B2 · band 7.5",
    sourceGrade: "5",
    prompt: "Everyone should be taught the history of their own country. Do you agree?",
    requirements: ["Discuss what people can learn from the past", "Discuss whether future is more important", "Give your own idea"],
    note: "Bài benchmark tốt: phát triển ý tốt, liên kết hiệu quả, lỗi ít.",
    answer: `A very common topic that is being discussed nowadays is wether schools should teach subjects that some may consider useless later in life. A clear example is history, since it is quite difficult to learn and does not help us in day-to-day activities.

However, many people do not realize the importance of it or that it affects our lives today. For example, our political system would not be this way if it weren't for the Ancient Greeks, numerous politicians and wars who helped shape democracy and our constitution. Yet it is still thought that it's useless.

In addition, it is very important that we never forget about our past since we must know where we were standing years ago. Moreover, there are some things, such as World War II, that we have to remember to prevent them from happening again. We should also know where we we were standing a century ago: our origins, our identity. The more you learn about your ethnicity, the better.

All in all, I think that it is extremely important to learn about one's own country's history. Anyone who gets the chance to do this should not waste it, since they are very fortunate to have this opportunity.`,
  },
  {
    slug: "guardrail-writing-off-topic-001",
    tab: "guardrail",
    label: "Guardrail 01: Lạc đề",
    sampleType: "guardrail",
    expectedLabel: "Tối đa Không đạt · ≤ 3.5",
    riskType: "off_topic",
    prompt: "Do you think students should wear uniforms at school?",
    requirements: [],
    note: "Bài dùng tiếng Anh tương đối ổn nhưng trả lời sai đề, dùng để demo cap lạc đề.",
    answer: "Online learning is becoming popular because students can study at home. It saves travelling time and allows people to watch recorded lessons many times. In my opinion, technology will continue to change education in the future.",
  },
  {
    slug: "guardrail-writing-too-short-002",
    tab: "guardrail",
    label: "Guardrail 02: Quá ngắn",
    sampleType: "guardrail",
    expectedLabel: "Tối đa B1 · ≤ 4.0",
    riskType: "too_short",
    prompt: "Fixture không lưu đề gốc; dùng để kiểm tra bài quá ngắn.",
    requirements: [],
    note: "Bài quá ngắn, không đủ phát triển ý nên không được chấm cao dù câu đơn giản đúng.",
    answer: "I think tourism is good. It gives money and jobs. But it can make pollution. The government should help.",
  },
  {
    slug: "guardrail-writing-copied-prompt-003",
    tab: "guardrail",
    label: "Guardrail 03: Copy đề",
    sampleType: "guardrail",
    expectedLabel: "Tối đa Không đạt · ≤ 3.5",
    riskType: "copied_prompt",
    prompt: "Some people believe that a university degree is essential for getting a good job, while others think that experience and skills are more important. Discuss both views and give your opinion.",
    requirements: [],
    note: "Bài chủ yếu lặp lại đề, dùng để demo cap copied prompt.",
    answer: "Some people believe that a university degree is essential for getting a good job, while others think that experience and skills are more important. Discuss both views and give your opinion. A university degree is essential for getting a good job, while experience and skills are more important.",
  },
  {
    slug: "guardrail-writing-repeated-spam-004",
    tab: "guardrail",
    label: "Guardrail 04: Lặp câu/spam",
    sampleType: "guardrail",
    expectedLabel: "Tối đa B1 · ≤ 4.0",
    riskType: "repeated_spam",
    prompt: "Fixture không lưu đề gốc; dùng để kiểm tra bài lặp ý/spam.",
    requirements: [],
    note: "Bài có nhiều chữ nhưng lặp ý, tổ chức và từ vựng thấp nên không được tăng điểm giả.",
    answer: "Technology is important. Technology is important. Technology is important for people. It is good for life. It is good for students. It is good for work. Technology is important and technology is good. I think technology is important because technology is important.",
  },
  {
    slug: "guardrail-writing-non-english-005",
    tab: "guardrail",
    label: "Guardrail 05: Không phải tiếng Anh",
    sampleType: "guardrail",
    expectedLabel: "Tối đa Không đạt · ≤ 3.0",
    riskType: "non_english",
    prompt: "Fixture không lưu đề gốc; dùng để kiểm tra bài không viết bằng tiếng Anh.",
    requirements: [],
    note: "Bài không sử dụng tiếng Anh để trả lời yêu cầu nên phải bị chặn hoặc chấm rất thấp.",
    answer: "Em nghĩ vấn đề này rất quan trọng trong cuộc sống hiện nay. Mọi người cần học tập chăm chỉ và có trách nhiệm với xã hội. Nhà trường và gia đình nên phối hợp để giúp học sinh phát triển tốt hơn.",
  },
];

const tabLabels: Record<string, string> = {
  environment: "Môi trường",
  fashion: "Thời trang",
  languages: "Ngoại ngữ",
  history: "Lịch sử",
  guardrail: "Guardrail lỗi",
};

export const assessmentSampleTypeLabels = {
  benchmark: "Benchmark",
  guardrail: "Guardrail",
};

export const assessmentValidationTabs = Object.entries(tabLabels)
  .map(([key, label]) => ({
    key,
    label,
    samples: assessmentValidationSamples.filter((sample) => sample.tab === key),
  }))
  .filter((tab) => tab.samples.length > 0);
