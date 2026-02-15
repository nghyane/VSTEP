import { describe, expect, it } from "bun:test";
import { BadRequestError } from "@common/errors";
import {
  assertAnswerKeyMatchesFormat,
  assertContentMatchesFormat,
} from "./validation";

const readingMCQContent = {
  passage:
    "The development of renewable energy sources has accelerated in recent years. Solar panels and wind turbines now account for a significant portion of global electricity production.",
  title: "Renewable Energy Growth",
  items: [
    {
      number: 1,
      prompt: "What has accelerated in recent years?",
      options: {
        A: "Fossil fuel production",
        B: "Renewable energy development",
        C: "Nuclear power expansion",
        D: "Coal mining operations",
      },
    },
    {
      number: 2,
      prompt:
        "Which sources are mentioned as contributing to electricity production?",
      options: {
        A: "Geothermal and hydroelectric",
        B: "Solar and wind",
        C: "Biomass and tidal",
        D: "Nuclear and natural gas",
      },
    },
  ],
};

const readingTNGContent = {
  passage:
    "Vietnam has a tropical monsoon climate with high humidity. The average temperature in Ho Chi Minh City is around 28°C year-round.",
  title: "Vietnamese Climate",
  items: [
    {
      number: 1,
      prompt: "Vietnam has a tropical monsoon climate.",
      options: { A: "True", B: "Not Given", C: "Not Mentioned" },
    },
    {
      number: 2,
      prompt: "The average temperature in Hanoi is 28°C.",
      options: { A: "True", B: "Not Given", C: "Not Mentioned" },
    },
  ],
};

const readingMatchingHeadingsContent = {
  paragraphs: [
    {
      label: "A",
      text: "The history of tea in Vietnam dates back centuries.",
    },
    {
      label: "B",
      text: "Modern tea production uses advanced processing techniques.",
    },
  ],
  headings: [
    "Ancient Origins",
    "Modern Techniques",
    "Export Markets",
    "Health Benefits",
  ],
  items: [
    { number: 1, targetParagraph: "A" },
    { number: 2, targetParagraph: "B" },
  ],
};

const readingGapFillContent = {
  textWithGaps:
    "The Vietnamese education system has undergone significant __1__ in recent decades. Students must pass a national __2__ to enter university.",
  items: [
    {
      number: 1,
      options: {
        A: "reforms",
        B: "challenges",
        C: "setbacks",
        D: "regulations",
      },
    },
    { number: 2 },
  ],
};

const listeningMCQContent = {
  audioUrl: "https://example.com/listening-test-1.mp3",
  items: [
    {
      number: 1,
      prompt: "What is the main topic of the conversation?",
      options: {
        A: "Travel plans",
        B: "University enrollment",
        C: "Job interview",
        D: "Restaurant reservation",
      },
    },
    {
      number: 2,
      prompt: "When does the event take place?",
      options: {
        A: "Monday morning",
        B: "Tuesday afternoon",
        C: "Wednesday evening",
        D: "Thursday night",
      },
    },
  ],
};

const listeningDictationContent = {
  audioUrl: "https://example.com/dictation-1.mp3",
  transcriptWithGaps:
    "The conference will be held on __1__ at the main __2__ of the university.",
  items: [
    { number: 1, correctText: "September fifteenth" },
    { number: 2, correctText: "auditorium" },
  ],
};

const writingTask1Content = {
  taskNumber: 1 as const,
  prompt:
    "You have received a letter from your English pen pal asking about your favorite Vietnamese holiday. Write a letter to your pen pal describing the holiday and its traditions.",
  minWords: 120,
};

const writingTask2Content = {
  taskNumber: 2 as const,
  prompt:
    "Some people believe that technology has made communication easier, while others argue it has made relationships more superficial. Discuss both views and give your own opinion.",
  minWords: 250,
};

const speakingPart1Content = {
  partNumber: 1 as const,
  prompt: "Tell me about your hometown. What do you like most about it?",
  speakingSeconds: 60,
};

const speakingPart2Content = {
  partNumber: 2 as const,
  prompt: "Choose one of the following topics and speak about it.",
  options: ["A memorable trip", "Your favorite book", "A person you admire"],
  preparationSeconds: 60,
  speakingSeconds: 120,
};

const speakingPart3Content = {
  partNumber: 3 as const,
  prompt:
    "Discuss the advantages and disadvantages of studying abroad versus studying in your home country.",
  mindMapNodes: ["Cost", "Culture", "Career", "Language"],
  followUpQuestions: [
    "What challenges might international students face?",
    "How can universities better support exchange students?",
  ],
  preparationSeconds: 60,
  speakingSeconds: 180,
};

describe("assertContentMatchesFormat", () => {
  it("accepts valid reading_mcq content", () => {
    expect(() =>
      assertContentMatchesFormat("reading_mcq", readingMCQContent),
    ).not.toThrow();
  });

  it("accepts valid reading_tng content", () => {
    expect(() =>
      assertContentMatchesFormat("reading_tng", readingTNGContent),
    ).not.toThrow();
  });

  it("accepts valid reading_matching_headings content", () => {
    expect(() =>
      assertContentMatchesFormat(
        "reading_matching_headings",
        readingMatchingHeadingsContent,
      ),
    ).not.toThrow();
  });

  it("accepts valid reading_gap_fill content", () => {
    expect(() =>
      assertContentMatchesFormat("reading_gap_fill", readingGapFillContent),
    ).not.toThrow();
  });

  it("accepts valid listening_mcq content", () => {
    expect(() =>
      assertContentMatchesFormat("listening_mcq", listeningMCQContent),
    ).not.toThrow();
  });

  it("accepts valid listening_dictation content", () => {
    expect(() =>
      assertContentMatchesFormat(
        "listening_dictation",
        listeningDictationContent,
      ),
    ).not.toThrow();
  });

  it("accepts valid writing_task_1 content", () => {
    expect(() =>
      assertContentMatchesFormat("writing_task_1", writingTask1Content),
    ).not.toThrow();
  });

  it("accepts valid writing_task_2 content", () => {
    expect(() =>
      assertContentMatchesFormat("writing_task_2", writingTask2Content),
    ).not.toThrow();
  });

  it("accepts valid speaking_part_1 content", () => {
    expect(() =>
      assertContentMatchesFormat("speaking_part_1", speakingPart1Content),
    ).not.toThrow();
  });

  it("accepts valid speaking_part_2 content", () => {
    expect(() =>
      assertContentMatchesFormat("speaking_part_2", speakingPart2Content),
    ).not.toThrow();
  });

  it("accepts valid speaking_part_3 content", () => {
    expect(() =>
      assertContentMatchesFormat("speaking_part_3", speakingPart3Content),
    ).not.toThrow();
  });

  it("throws when content type mismatches format", () => {
    expect(() =>
      assertContentMatchesFormat("reading_mcq", writingTask1Content),
    ).toThrow(BadRequestError);
    expect(() =>
      assertContentMatchesFormat("reading_mcq", writingTask1Content),
    ).toThrow("Content does not match format 'reading_mcq'");
  });

  it("throws when writing_task_1 content used for writing_task_2", () => {
    expect(() =>
      assertContentMatchesFormat("writing_task_2", writingTask1Content),
    ).toThrow(BadRequestError);
  });

  it("throws when required fields are missing", () => {
    expect(() =>
      assertContentMatchesFormat("reading_mcq", { title: "No passage" }),
    ).toThrow(BadRequestError);
  });

  it("throws for unknown format", () => {
    expect(() => assertContentMatchesFormat("unknown_format", {})).toThrow(
      BadRequestError,
    );
  });
});

describe("assertAnswerKeyMatchesFormat", () => {
  it("accepts valid ABCD answer key for reading_mcq", () => {
    const answerKey = { correctAnswers: { "1": "B", "2": "B" } };
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_mcq", readingMCQContent, answerKey),
    ).not.toThrow();
  });

  it("accepts valid ABCD answer key for listening_mcq", () => {
    const answerKey = { correctAnswers: { "1": "B", "2": "A" } };
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "listening_mcq",
        listeningMCQContent,
        answerKey,
      ),
    ).not.toThrow();
  });

  it("accepts lowercase answer values (normalized to uppercase check)", () => {
    const answerKey = { correctAnswers: { "1": "b", "2": "c" } };
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_mcq", readingMCQContent, answerKey),
    ).not.toThrow();
  });

  it("rejects invalid MCQ value (E)", () => {
    const answerKey = { correctAnswers: { "1": "E", "2": "B" } };
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_mcq", readingMCQContent, answerKey),
    ).toThrow(BadRequestError);
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_mcq", readingMCQContent, answerKey),
    ).toThrow("invalid for format 'reading_mcq'");
  });

  it("rejects MCQ answer key with missing item", () => {
    const answerKey = { correctAnswers: { "1": "A" } };
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_mcq", readingMCQContent, answerKey),
    ).toThrow(BadRequestError);
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_mcq", readingMCQContent, answerKey),
    ).toThrow("1 entries but content has 2 items");
  });

  it("rejects MCQ answer key with extra unknown item", () => {
    const answerKey = { correctAnswers: { "1": "A", "2": "B", "99": "C" } };
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_mcq", readingMCQContent, answerKey),
    ).toThrow(BadRequestError);
  });

  it("accepts valid ABC answer key for reading_tng", () => {
    const answerKey = { correctAnswers: { "1": "A", "2": "C" } };
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_tng", readingTNGContent, answerKey),
    ).not.toThrow();
  });

  it("rejects D for reading_tng (only ABC allowed)", () => {
    const answerKey = { correctAnswers: { "1": "D", "2": "A" } };
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_tng", readingTNGContent, answerKey),
    ).toThrow(BadRequestError);
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_tng", readingTNGContent, answerKey),
    ).toThrow("must be one of A, B, C");
  });

  it("accepts ABCD for gap fill items with MCQ options", () => {
    const answerKey = { correctAnswers: { "1": "A", "2": "examination" } };
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "reading_gap_fill",
        readingGapFillContent,
        answerKey,
      ),
    ).not.toThrow();
  });

  it("accepts free text for gap fill items without options", () => {
    const answerKey = { correctAnswers: { "1": "B", "2": "exam" } };
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "reading_gap_fill",
        readingGapFillContent,
        answerKey,
      ),
    ).not.toThrow();
  });

  it("rejects invalid MCQ value for gap fill item with options", () => {
    const answerKey = { correctAnswers: { "1": "E", "2": "exam" } };
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "reading_gap_fill",
        readingGapFillContent,
        answerKey,
      ),
    ).toThrow(BadRequestError);
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "reading_gap_fill",
        readingGapFillContent,
        answerKey,
      ),
    ).toThrow("MCQ gap item 1");
  });

  it("rejects empty string for free-text gap fill item", () => {
    const answerKey = { correctAnswers: { "1": "A", "2": "  " } };
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "reading_gap_fill",
        readingGapFillContent,
        answerKey,
      ),
    ).toThrow(BadRequestError);
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "reading_gap_fill",
        readingGapFillContent,
        answerKey,
      ),
    ).toThrow("free-text gap item 2");
  });

  it("accepts valid answer key for matching headings", () => {
    const answerKey = {
      correctAnswers: { "1": "Ancient Origins", "2": "Modern Techniques" },
    };
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "reading_matching_headings",
        readingMatchingHeadingsContent,
        answerKey,
      ),
    ).not.toThrow();
  });

  it("rejects empty value for matching headings", () => {
    const answerKey = { correctAnswers: { "1": "Ancient Origins", "2": "" } };
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "reading_matching_headings",
        readingMatchingHeadingsContent,
        answerKey,
      ),
    ).toThrow(BadRequestError);
  });

  it("accepts valid non-empty strings for listening_dictation", () => {
    const answerKey = {
      correctAnswers: {
        "1": "September fifteenth",
        "2": "auditorium",
      },
    };
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "listening_dictation",
        listeningDictationContent,
        answerKey,
      ),
    ).not.toThrow();
  });

  it("rejects empty string for listening_dictation", () => {
    const answerKey = {
      correctAnswers: { "1": "September fifteenth", "2": "" },
    };
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "listening_dictation",
        listeningDictationContent,
        answerKey,
      ),
    ).toThrow(BadRequestError);
  });

  it("rejects answer key for writing_task_1", () => {
    const answerKey = { correctAnswers: { "1": "A" } };
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "writing_task_1",
        writingTask1Content,
        answerKey,
      ),
    ).toThrow(BadRequestError);
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "writing_task_1",
        writingTask1Content,
        answerKey,
      ),
    ).toThrow("must not be provided for subjective format");
  });

  it("rejects answer key for writing_task_2", () => {
    expect(() =>
      assertAnswerKeyMatchesFormat("writing_task_2", writingTask2Content, {
        correctAnswers: {},
      }),
    ).toThrow(BadRequestError);
  });

  it("rejects answer key for speaking_part_1", () => {
    expect(() =>
      assertAnswerKeyMatchesFormat("speaking_part_1", speakingPart1Content, {
        correctAnswers: { "1": "hello" },
      }),
    ).toThrow(BadRequestError);
  });

  it("rejects answer key for speaking_part_2", () => {
    expect(() =>
      assertAnswerKeyMatchesFormat("speaking_part_2", speakingPart2Content, {
        correctAnswers: {},
      }),
    ).toThrow(BadRequestError);
  });

  it("rejects answer key for speaking_part_3", () => {
    expect(() =>
      assertAnswerKeyMatchesFormat("speaking_part_3", speakingPart3Content, {
        correctAnswers: {},
      }),
    ).toThrow(BadRequestError);
  });

  it("accepts null answer key for writing formats", () => {
    expect(() =>
      assertAnswerKeyMatchesFormat("writing_task_1", writingTask1Content, null),
    ).not.toThrow();
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "writing_task_2",
        writingTask2Content,
        undefined,
      ),
    ).not.toThrow();
  });

  it("accepts null answer key for speaking formats", () => {
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "speaking_part_1",
        speakingPart1Content,
        null,
      ),
    ).not.toThrow();
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "speaking_part_2",
        speakingPart2Content,
        null,
      ),
    ).not.toThrow();
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "speaking_part_3",
        speakingPart3Content,
        null,
      ),
    ).not.toThrow();
  });

  it("rejects null answer key for reading_mcq", () => {
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_mcq", readingMCQContent, null),
    ).toThrow(BadRequestError);
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_mcq", readingMCQContent, null),
    ).toThrow("Answer key is required");
  });

  it("rejects null answer key for listening_mcq", () => {
    expect(() =>
      assertAnswerKeyMatchesFormat("listening_mcq", listeningMCQContent, null),
    ).toThrow(BadRequestError);
  });

  it("rejects null answer key for reading_tng", () => {
    expect(() =>
      assertAnswerKeyMatchesFormat("reading_tng", readingTNGContent, null),
    ).toThrow(BadRequestError);
  });

  it("rejects null answer key for listening_dictation", () => {
    expect(() =>
      assertAnswerKeyMatchesFormat(
        "listening_dictation",
        listeningDictationContent,
        null,
      ),
    ).toThrow(BadRequestError);
  });
});
