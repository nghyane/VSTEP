import type { DbTransaction } from "../../src/db/index";
import { table } from "../../src/db/schema/index";
import type {
  NewVocabularyTopic,
  NewVocabularyWord,
} from "../../src/db/schema/vocabulary";
import { logResult, logSection } from "../utils";

// ---------------------------------------------------------------------------
// Seed data — 3 topics × 6 words each
// ---------------------------------------------------------------------------

const TOPICS: NewVocabularyTopic[] = [
  {
    name: "Travel & Tourism",
    description:
      "Từ vựng về du lịch, phương tiện, địa điểm và trải nghiệm khi đi du lịch",
    iconKey: "airplane",
    sortOrder: 0,
  },
  {
    name: "Education",
    description:
      "Từ vựng về giáo dục, học tập, trường học và phương pháp giảng dạy",
    iconKey: "graduation",
    sortOrder: 1,
  },
  {
    name: "Environment",
    description:
      "Từ vựng về môi trường, thiên nhiên, biến đổi khí hậu và bảo vệ môi trường",
    iconKey: "leaf",
    sortOrder: 2,
  },
];

type WordWithoutTopicId = Omit<NewVocabularyWord, "topicId">;

const WORDS_BY_TOPIC: Record<string, WordWithoutTopicId[]> = {
  "Travel & Tourism": [
    {
      word: "itinerary",
      phonetic: "/aɪˈtɪn.ə.rer.i/",
      partOfSpeech: "noun",
      definition:
        "A planned route or journey, including a list of places to visit and activities to do",
      explanation:
        "Lịch trình, kế hoạch chi tiết cho chuyến đi bao gồm các địa điểm và hoạt động",
      examples: [
        "We planned our itinerary for the two-week European tour",
        "The travel agent prepared a detailed itinerary",
      ],
      sortOrder: 0,
    },
    {
      word: "accommodation",
      phonetic: "/əˌkɒm.əˈdeɪ.ʃən/",
      partOfSpeech: "noun",
      definition:
        "A place to stay, such as a hotel, hostel, or rented apartment during travel",
      explanation: "Chỗ ở, nơi lưu trú khi đi du lịch",
      examples: [
        "We booked our accommodation three months in advance",
        "The accommodation was comfortable and affordable",
      ],
      sortOrder: 1,
    },
    {
      word: "excursion",
      phonetic: "/ɪkˈskɜː.ʒən/",
      partOfSpeech: "noun",
      definition:
        "A short trip or outing, usually for leisure or educational purposes",
      explanation:
        "Chuyến tham quan ngắn, thường với mục đích giải trí hoặc giáo dục",
      examples: [
        "We went on a boat excursion to explore the nearby islands",
        "The school organized an excursion to the museum",
      ],
      sortOrder: 2,
    },
    {
      word: "cuisine",
      phonetic: "/kwɪˈziːn/",
      partOfSpeech: "noun",
      definition:
        "A style or method of cooking, especially of a particular country or region",
      explanation:
        "Ẩm thực, phong cách nấu ăn đặc trưng của một vùng hoặc quốc gia",
      examples: [
        "Vietnamese cuisine is known for its fresh herbs and balanced flavors",
        "We enjoyed the local cuisine during our trip",
      ],
      sortOrder: 3,
    },
    {
      word: "souvenir",
      phonetic: "/ˌsuː.vəˈnɪər/",
      partOfSpeech: "noun",
      definition: "An object kept as a reminder of a place visited or an event",
      explanation: "Đồ lưu niệm, vật kỷ niệm từ chuyến đi",
      examples: [
        "She bought a souvenir magnet from every country she visited",
        "The shop sells handmade souvenirs",
      ],
      sortOrder: 4,
    },
    {
      word: "landmark",
      phonetic: "/ˈlænd.mɑːk/",
      partOfSpeech: "noun",
      definition: "A famous or important building, structure, or place",
      explanation: "Địa danh, công trình nổi tiếng hoặc quan trọng",
      examples: [
        "The Eiffel Tower is one of the most famous landmarks in the world",
        "We visited several historical landmarks during the tour",
      ],
      sortOrder: 5,
    },
  ],
  Education: [
    {
      word: "curriculum",
      phonetic: "/kəˈrɪk.jə.ləm/",
      partOfSpeech: "noun",
      definition:
        "The subjects and content taught in a school or educational program",
      explanation: "Chương trình giảng dạy, nội dung học tập trong trường",
      examples: [
        "The school updated its curriculum to include more technology courses",
        "The national curriculum sets standards for all schools",
      ],
      sortOrder: 0,
    },
    {
      word: "scholarship",
      phonetic: "/ˈskɒl.ə.ʃɪp/",
      partOfSpeech: "noun",
      definition:
        "Financial aid given to a student based on academic or other achievements",
      explanation:
        "Học bổng, hỗ trợ tài chính cho sinh viên dựa trên thành tích",
      examples: [
        "She won a full scholarship to study abroad",
        "Many scholarships are available for international students",
      ],
      sortOrder: 1,
    },
    {
      word: "dissertation",
      phonetic: "/ˌdɪs.əˈteɪ.ʃən/",
      partOfSpeech: "noun",
      definition:
        "A long piece of writing on a particular subject, especially for a university degree",
      explanation: "Luận văn, bài nghiên cứu dài để lấy bằng đại học",
      examples: [
        "He spent two years writing his doctoral dissertation",
        "The dissertation must be submitted by the end of the semester",
      ],
      sortOrder: 2,
    },
    {
      word: "pedagogy",
      phonetic: "/ˈped.ə.ɡɒdʒ.i/",
      partOfSpeech: "noun",
      definition:
        "The method and practice of teaching, especially as an academic subject",
      explanation: "Phương pháp giảng dạy, khoa học về giáo dục",
      examples: [
        "Modern pedagogy emphasizes student-centered learning",
        "She studied pedagogy before becoming a teacher",
      ],
      sortOrder: 3,
    },
    {
      word: "extracurricular",
      phonetic: "/ˌek.strə.kəˈrɪk.jə.lər/",
      partOfSpeech: "adjective",
      definition: "Activities done in addition to the normal school curriculum",
      explanation: "Ngoại khóa, hoạt động ngoài chương trình học chính",
      examples: [
        "Extracurricular activities help students develop social skills",
        "He participates in several extracurricular clubs",
      ],
      sortOrder: 4,
    },
    {
      word: "literacy",
      phonetic: "/ˈlɪt.ər.ə.si/",
      partOfSpeech: "noun",
      definition:
        "The ability to read and write, or knowledge in a particular subject",
      explanation: "Khả năng đọc viết, hoặc kiến thức về một lĩnh vực cụ thể",
      examples: [
        "The government launched a campaign to improve adult literacy",
        "Digital literacy is essential in today's world",
      ],
      sortOrder: 5,
    },
  ],
  Environment: [
    {
      word: "sustainability",
      phonetic: "/səˌsteɪ.nəˈbɪl.ə.ti/",
      partOfSpeech: "noun",
      definition:
        "The ability to maintain or support a process continuously over time without harming the environment",
      explanation:
        "Tính bền vững, khả năng duy trì mà không gây hại cho môi trường",
      examples: [
        "Sustainability is a key focus of modern urban planning",
        "The company is committed to environmental sustainability",
      ],
      sortOrder: 0,
    },
    {
      word: "biodiversity",
      phonetic: "/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/",
      partOfSpeech: "noun",
      definition:
        "The variety of plant and animal life in a particular habitat or in the world",
      explanation: "Đa dạng sinh học, sự phong phú về các loài động thực vật",
      examples: [
        "The rainforest has incredible biodiversity",
        "Protecting biodiversity is essential for ecosystem health",
      ],
      sortOrder: 1,
    },
    {
      word: "conservation",
      phonetic: "/ˌkɒn.səˈveɪ.ʃən/",
      partOfSpeech: "noun",
      definition:
        "The protection of natural resources and the environment from waste or harm",
      explanation: "Bảo tồn, việc bảo vệ tài nguyên thiên nhiên",
      examples: [
        "Conservation efforts have helped increase the tiger population",
        "Water conservation is important in dry regions",
      ],
      sortOrder: 2,
    },
    {
      word: "emissions",
      phonetic: "/ɪˈmɪʃ.ənz/",
      partOfSpeech: "noun",
      definition:
        "The release of gases, especially carbon dioxide, into the atmosphere",
      explanation: "Khí thải, lượng khí thải ra môi trường",
      examples: [
        "The factory reduced its carbon emissions by 30%",
        "Vehicle emissions are a major source of air pollution",
      ],
      sortOrder: 3,
    },
    {
      word: "renewable",
      phonetic: "/rɪˈnjuː.ə.bəl/",
      partOfSpeech: "adjective",
      definition:
        "Energy sources that are naturally replenished, such as solar or wind power",
      explanation: "Tái tạo được, nguồn năng lượng có thể bổ sung tự nhiên",
      examples: [
        "Renewable energy sources are becoming more affordable",
        "The country plans to switch to 100% renewable energy by 2050",
      ],
      sortOrder: 4,
    },
    {
      word: "ecosystem",
      phonetic: "/ˈiː.kəʊˌsɪs.təm/",
      partOfSpeech: "noun",
      definition:
        "A community of living organisms and their physical environment functioning as a unit",
      explanation: "Hệ sinh thái, cộng đồng sinh vật và môi trường sống",
      examples: [
        "Coral reefs are among the most diverse ecosystems on Earth",
        "Human activities can disrupt natural ecosystems",
      ],
      sortOrder: 5,
    },
  ],
};

export async function seedVocabulary(db: DbTransaction): Promise<void> {
  logSection("Vocabulary");

  const insertedTopics = await db
    .insert(table.vocabularyTopics)
    .values(TOPICS)
    .returning({
      id: table.vocabularyTopics.id,
      name: table.vocabularyTopics.name,
    });

  logResult("Vocabulary topics", insertedTopics.length);

  const allWords: NewVocabularyWord[] = [];
  for (const topic of insertedTopics) {
    const topicWords = WORDS_BY_TOPIC[topic.name];
    if (topicWords) {
      for (const w of topicWords) {
        allWords.push({ ...w, topicId: topic.id });
      }
    }
  }

  if (allWords.length > 0) {
    const insertedWords = await db
      .insert(table.vocabularyWords)
      .values(allWords)
      .returning({ id: table.vocabularyWords.id });
    logResult("Vocabulary words", insertedWords.length);
  }
}
