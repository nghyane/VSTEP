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
  // Assign 2-4 knowledge points per question based on skill
  const byCategory = (cat: string) =>
    inserted.filter((kp) => kp.category === cat);
  const grammar = byCategory("grammar");
  const vocabulary = byCategory("vocabulary");
  const strategy = byCategory("strategy");

  const links: Array<{ questionId: string; knowledgePointId: string }> = [];

  for (const q of questions) {
    const assigned = pickForQuestion(q.skill, grammar, vocabulary, strategy);
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

/**
 * Pick relevant knowledge points for a question based on its skill.
 * Deterministic distribution using index-based selection.
 */
function pickForQuestion(
  skill: string,
  grammar: SeededKnowledgePoints["all"],
  vocabulary: SeededKnowledgePoints["all"],
  strategy: SeededKnowledgePoints["all"],
): SeededKnowledgePoints["all"] {
  // Use a simple counter per skill to rotate through knowledge points
  const idx = counters[skill] ?? 0;
  counters[skill] = idx + 1;

  switch (skill) {
    case "reading":
      // Reading tests vocabulary, grammar, and reading strategies
      return [
        vocabulary[idx % vocabulary.length],
        grammar[idx % grammar.length],
        strategy[idx % strategy.length],
      ];
    case "listening":
      // Listening focuses on vocabulary, listening strategies
      return [
        vocabulary[idx % vocabulary.length],
        strategy[(idx + 4) % strategy.length], // offset to pick listening strategies
      ];
    case "writing":
      // Writing tests grammar, vocabulary, and essay strategies
      return [
        grammar[idx % grammar.length],
        grammar[(idx + 3) % grammar.length],
        vocabulary[idx % vocabulary.length],
        strategy[(idx + 6) % strategy.length], // offset to pick writing strategies
      ];
    case "speaking":
      // Speaking tests vocabulary, grammar, and paraphrasing
      return [
        vocabulary[idx % vocabulary.length],
        grammar[(idx + 1) % grammar.length],
        strategy[(idx + 7) % strategy.length], // Paraphrasing
      ];
    default:
      return [vocabulary[idx % vocabulary.length]];
  }
}

const counters: Record<string, number> = {};
