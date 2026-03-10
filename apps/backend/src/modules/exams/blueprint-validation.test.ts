import { describe, expect, it } from "bun:test";
import { BadRequestError } from "@common/errors";
import type { ExamBlueprint } from "@db/types/exam-blueprint";
import type { QuestionContent } from "@db/types/question-content";
import { validateVstepExamBlueprint } from "./blueprint-validation";

type BlueprintQuestion = {
  id: string;
  skill: "listening" | "reading" | "writing" | "speaking";
  part: number;
  content: QuestionContent;
};

function makeListeningQuestion(
  id: string,
  part: 1 | 2 | 3,
  itemCount: number,
): BlueprintQuestion {
  return {
    id,
    skill: "listening",
    part,
    content: {
      audioUrl: "https://example.com/audio.mp3",
      items: Array.from({ length: itemCount }, () => ({
        stem: "Question",
        options: ["A", "B", "C", "D"],
      })),
    },
  };
}

function makeReadingQuestion(
  id: string,
  part: 1 | 2 | 3 | 4,
  itemCount: number,
): BlueprintQuestion {
  return {
    id,
    skill: "reading",
    part,
    content: {
      passage: "Passage",
      items: Array.from({ length: itemCount }, () => ({
        stem: "Question",
        options: ["A", "B", "C", "D"],
      })),
    },
  };
}

function makeWritingQuestion(
  id: string,
  part: 1 | 2,
  minWords: number,
): BlueprintQuestion {
  return {
    id,
    skill: "writing",
    part,
    content: {
      prompt: "Write",
      taskType: part === 1 ? "letter" : "essay",
      minWords,
    },
  };
}

function makeSpeakingQuestion(id: string, part: 1 | 2 | 3): BlueprintQuestion {
  if (part === 1) {
    return {
      id,
      skill: "speaking",
      part,
      content: {
        topics: [
          { name: "Topic 1", questions: ["Q1", "Q2", "Q3"] },
          { name: "Topic 2", questions: ["Q1", "Q2", "Q3"] },
        ],
      },
    };
  }

  if (part === 2) {
    return {
      id,
      skill: "speaking",
      part,
      content: {
        situation: "Situation",
        options: ["Opt 1", "Opt 2", "Opt 3"],
        preparationSeconds: 60,
        speakingSeconds: 120,
      },
    };
  }

  return {
    id,
    skill: "speaking",
    part,
    content: {
      centralIdea: "Idea",
      suggestions: ["A", "B", "C"],
      followUpQuestion: "Follow up",
      preparationSeconds: 60,
      speakingSeconds: 300,
    },
  };
}

function makeValidDataset() {
  const questions: BlueprintQuestion[] = [
    makeListeningQuestion("l1", 1, 8),
    makeListeningQuestion("l2", 2, 12),
    makeListeningQuestion("l3", 3, 15),
    makeReadingQuestion("r1", 1, 10),
    makeReadingQuestion("r2", 2, 10),
    makeReadingQuestion("r3", 3, 10),
    makeReadingQuestion("r4", 4, 10),
    makeWritingQuestion("w1", 1, 120),
    makeWritingQuestion("w2", 2, 250),
    makeSpeakingQuestion("s1", 1),
    makeSpeakingQuestion("s2", 2),
    makeSpeakingQuestion("s3", 3),
  ];

  const blueprint: ExamBlueprint = {
    listening: { questionIds: ["l1", "l2", "l3"] },
    reading: { questionIds: ["r1", "r2", "r3", "r4"] },
    writing: { questionIds: ["w1", "w2"] },
    speaking: { questionIds: ["s1", "s2", "s3"] },
  };

  return { blueprint, questions };
}

describe("validateVstepExamBlueprint", () => {
  it("accepts full valid VSTEP structure", () => {
    const { blueprint, questions } = makeValidDataset();
    expect(() =>
      validateVstepExamBlueprint(blueprint, questions),
    ).not.toThrow();
  });

  it("rejects listening total different from 35", () => {
    const { blueprint, questions } = makeValidDataset();
    const listeningPart3 = questions.find((question) => question.id === "l3");
    if (!listeningPart3) throw new Error("missing fixture question l3");

    listeningPart3.content = {
      audioUrl: "https://example.com/audio.mp3",
      items: Array.from({ length: 14 }, () => ({
        stem: "Question",
        options: ["A", "B", "C", "D"],
      })),
    };

    expect(() => validateVstepExamBlueprint(blueprint, questions)).toThrow(
      BadRequestError,
    );
  });

  it("rejects reading structure that is not 4x10", () => {
    const { blueprint, questions } = makeValidDataset();
    const readingPart4 = questions.find((question) => question.id === "r4");
    if (!readingPart4) throw new Error("missing fixture question r4");

    readingPart4.content = {
      passage: "Passage",
      items: Array.from({ length: 9 }, () => ({
        stem: "Question",
        options: ["A", "B", "C", "D"],
      })),
    };

    expect(() => validateVstepExamBlueprint(blueprint, questions)).toThrow(
      BadRequestError,
    );
  });

  it("rejects writing when task minimum words are lower than standard", () => {
    const { blueprint, questions } = makeValidDataset();
    const writingTask2 = questions.find((question) => question.id === "w2");
    if (!writingTask2) throw new Error("missing fixture question w2");

    writingTask2.content = {
      prompt: "Write",
      taskType: "essay",
      minWords: 200,
    };

    expect(() => validateVstepExamBlueprint(blueprint, questions)).toThrow(
      BadRequestError,
    );
  });

  it("rejects speaking when missing one required part", () => {
    const { blueprint, questions } = makeValidDataset();
    blueprint.speaking = { questionIds: ["s1", "s2"] };

    const selectedQuestions = questions.filter(
      (question) => question.id !== "s3",
    );

    expect(() =>
      validateVstepExamBlueprint(blueprint, selectedQuestions),
    ).toThrow(BadRequestError);
  });

  it("rejects when question is assigned to wrong skill bucket", () => {
    const { blueprint, questions } = makeValidDataset();
    blueprint.listening = { questionIds: ["l1", "l2", "r1"] };

    expect(() => validateVstepExamBlueprint(blueprint, questions)).toThrow(
      BadRequestError,
    );
  });
});
