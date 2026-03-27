import type { DbTransaction } from "../../src/db/index";
import { table } from "../../src/db/schema/index";
import type { NewKnowledgePoint } from "../../src/db/schema/knowledge-points";
import { logResult, logSection } from "../utils";
import type { SeededQuestions } from "./02-questions";

// ---------------------------------------------------------------------------
// VSTEP Knowledge Points — realistic items mapped to exam skills
// ---------------------------------------------------------------------------

const KNOWLEDGE_POINTS: NewKnowledgePoint[] = [
  // Grammar (12)
  { category: "grammar", name: "Tenses (Simple, Continuous, Perfect)" },
  { category: "grammar", name: "Passive Voice" },
  { category: "grammar", name: "Conditional Sentences" },
  { category: "grammar", name: "Relative Clauses" },
  { category: "grammar", name: "Reported Speech" },
  { category: "grammar", name: "Subject-Verb Agreement" },
  { category: "grammar", name: "Articles and Determiners" },
  { category: "grammar", name: "Prepositions" },
  { category: "grammar", name: "Conjunctions and Linking Words" },
  { category: "grammar", name: "Comparative and Superlative" },
  { category: "grammar", name: "Modal Verbs" },
  { category: "grammar", name: "Gerunds and Infinitives" },

  // Vocabulary (10)
  { category: "vocabulary", name: "Academic Vocabulary" },
  { category: "vocabulary", name: "Collocations and Fixed Phrases" },
  { category: "vocabulary", name: "Synonyms and Antonyms" },
  { category: "vocabulary", name: "Word Formation (Prefixes/Suffixes)" },
  { category: "vocabulary", name: "Context Clue Vocabulary" },
  { category: "vocabulary", name: "Topic-specific Vocabulary (Health)" },
  { category: "vocabulary", name: "Topic-specific Vocabulary (Education)" },
  { category: "vocabulary", name: "Topic-specific Vocabulary (Environment)" },
  { category: "vocabulary", name: "Topic-specific Vocabulary (Technology)" },
  { category: "vocabulary", name: "Phrasal Verbs" },

  // Strategy (8)
  { category: "strategy", name: "Skimming for Main Idea" },
  { category: "strategy", name: "Scanning for Specific Information" },
  { category: "strategy", name: "Inference and Implication" },
  { category: "strategy", name: "Reference Words (Pronouns)" },
  { category: "strategy", name: "Listening for Gist" },
  { category: "strategy", name: "Note-taking while Listening" },
  { category: "strategy", name: "Essay Structure and Organization" },
  { category: "strategy", name: "Paraphrasing and Summarizing" },

  // Topics — Listening (6)
  { category: "topic", name: "Đời sống hàng ngày" },
  { category: "topic", name: "Du lịch & Khách sạn" },
  { category: "topic", name: "Giáo dục & Học tập" },
  { category: "topic", name: "Khoa học & Công nghệ" },
  { category: "topic", name: "Văn hóa & Xã hội" },
  { category: "topic", name: "Sức khỏe" },

  // Topics — Reading (7)
  { category: "topic", name: "Sức khỏe & Khoa học" },
  { category: "topic", name: "Công nghệ & Xã hội" },
  { category: "topic", name: "Giáo dục & Ngôn ngữ" },
  { category: "topic", name: "Thiên nhiên & Môi trường" },
  { category: "topic", name: "Lịch sử & Văn hóa" },
  { category: "topic", name: "Khoa học & Địa chất" },
  { category: "topic", name: "Du lịch & Tình nguyện" },

  // Topics — Writing (4)
  { category: "topic", name: "Thư cá nhân" },
  { category: "topic", name: "Bài luận xã hội" },
  { category: "topic", name: "Bài luận quan điểm" },
  { category: "topic", name: "Thư trang trọng" },

  // Topics — Speaking (4)
  { category: "topic", name: "Lối sống & Du lịch" },
  { category: "topic", name: "Giáo dục & Nghề nghiệp" },
  { category: "topic", name: "Văn hóa & Lễ hội" },
  { category: "topic", name: "Tài chính & Cuộc sống" },
];

export interface SeededKnowledgePoints {
  all: Array<{ id: string; category: string; name: string }>;
}

export async function seedKnowledgePoints(
  db: DbTransaction,
  questions: SeededQuestions["all"],
): Promise<SeededKnowledgePoints> {
  logSection("Knowledge Points");

  // 1. Insert knowledge points
  const inserted = await db
    .insert(table.knowledgePoints)
    .values(KNOWLEDGE_POINTS)
    .returning({
      id: table.knowledgePoints.id,
      category: table.knowledgePoints.category,
      name: table.knowledgePoints.name,
    });

  logResult("Knowledge points", inserted.length);

  // 2. Link questions to knowledge points
  // Assign 2-4 knowledge points + 1 topic per question based on skill
  const byCategory = (cat: string) =>
    inserted.filter((kp) => kp.category === cat);
  const grammar = byCategory("grammar");
  const vocabulary = byCategory("vocabulary");
  const strategy = byCategory("strategy");
  const allTopics = byCategory("topic");

  const topicsBySkill: Record<string, typeof allTopics> = {
    listening: allTopics.filter((kp) =>
      TOPIC_SKILL_MAP.listening.includes(kp.name),
    ),
    reading: allTopics.filter((kp) =>
      TOPIC_SKILL_MAP.reading.includes(kp.name),
    ),
    writing: allTopics.filter((kp) =>
      TOPIC_SKILL_MAP.writing.includes(kp.name),
    ),
    speaking: allTopics.filter((kp) =>
      TOPIC_SKILL_MAP.speaking.includes(kp.name),
    ),
  };

  const links: Array<{ questionId: string; knowledgePointId: string }> = [];

  for (const q of questions) {
    const topics = topicsBySkill[q.skill] ?? [];
    const assigned = pickForQuestion(
      q.skill,
      grammar,
      vocabulary,
      strategy,
      topics,
    );
    for (const kp of assigned) {
      links.push({ questionId: q.id, knowledgePointId: kp.id });
    }
  }

  if (links.length > 0) {
    await db.insert(table.questionKnowledgePoints).values(links);
  }

  logResult("Question-KP links", links.length);

  return { all: inserted };
}

const TOPIC_SKILL_MAP: Record<string, string[]> = {
  listening: [
    "Đời sống hàng ngày",
    "Du lịch & Khách sạn",
    "Giáo dục & Học tập",
    "Khoa học & Công nghệ",
    "Văn hóa & Xã hội",
    "Sức khỏe",
  ],
  reading: [
    "Sức khỏe & Khoa học",
    "Công nghệ & Xã hội",
    "Giáo dục & Ngôn ngữ",
    "Thiên nhiên & Môi trường",
    "Lịch sử & Văn hóa",
    "Khoa học & Địa chất",
    "Du lịch & Tình nguyện",
  ],
  writing: [
    "Thư cá nhân",
    "Bài luận xã hội",
    "Bài luận quan điểm",
    "Thư trang trọng",
  ],
  speaking: [
    "Lối sống & Du lịch",
    "Giáo dục & Nghề nghiệp",
    "Văn hóa & Lễ hội",
    "Tài chính & Cuộc sống",
  ],
};

/**
 * Pick relevant knowledge points for a question based on its skill.
 * Deterministic distribution using index-based selection.
 */
function pickForQuestion(
  skill: string,
  grammar: SeededKnowledgePoints["all"],
  vocabulary: SeededKnowledgePoints["all"],
  strategy: SeededKnowledgePoints["all"],
  topics: SeededKnowledgePoints["all"],
): SeededKnowledgePoints["all"] {
  // Use a simple counter per skill to rotate through knowledge points
  const idx = counters[skill] ?? 0;
  counters[skill] = idx + 1;

  const result: SeededKnowledgePoints["all"] = [];

  switch (skill) {
    case "reading":
      // Reading tests vocabulary, grammar, and reading strategies
      result.push(
        vocabulary[idx % vocabulary.length],
        grammar[idx % grammar.length],
        strategy[idx % strategy.length],
      );
      break;
    case "listening":
      // Listening focuses on vocabulary, listening strategies
      result.push(
        vocabulary[idx % vocabulary.length],
        strategy[(idx + 4) % strategy.length],
      );
      break;
    case "writing":
      // Writing tests grammar, vocabulary, and essay strategies
      result.push(
        grammar[idx % grammar.length],
        grammar[(idx + 3) % grammar.length],
        vocabulary[idx % vocabulary.length],
        strategy[(idx + 6) % strategy.length],
      );
      break;
    case "speaking":
      // Speaking tests vocabulary, grammar, and paraphrasing
      result.push(
        vocabulary[idx % vocabulary.length],
        grammar[(idx + 1) % grammar.length],
        strategy[(idx + 7) % strategy.length],
      );
      break;
    default:
      result.push(vocabulary[idx % vocabulary.length]);
  }

  // Assign 1 topic KP per question (round-robin within skill's topics)
  if (topics.length > 0) {
    result.push(topics[idx % topics.length]);
  }

  return result;
}

const counters: Record<string, number> = {};
