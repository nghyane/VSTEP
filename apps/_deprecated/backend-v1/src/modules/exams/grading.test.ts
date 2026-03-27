import { describe, expect, it } from "bun:test";
import { BadRequestError } from "@common/errors";
import type { ObjectiveAnswerKey, SubmissionAnswer } from "@db/types/answers";
import { type AnswerEntry, gradeAnswers, type QuestionInfo } from "./grading";

function makeMap(entries: [string, QuestionInfo][]): Map<string, QuestionInfo> {
  return new Map(entries);
}

function objAnswer(answers: Record<string, string>): SubmissionAnswer {
  return { answers } as SubmissionAnswer;
}

function objKey(correctAnswers: Record<string, string>): ObjectiveAnswerKey {
  return { correctAnswers } as ObjectiveAnswerKey;
}

describe("gradeAnswers", () => {
  it("returns zeros for empty answers", () => {
    const result = gradeAnswers([], new Map());
    expect(result.listening.correct).toBe(0);
    expect(result.listening.total).toBe(0);
    expect(result.reading.correct).toBe(0);
    expect(result.reading.total).toBe(0);
    expect(result.subjective).toHaveLength(0);
    expect(result.correctness.size).toBe(0);
  });

  it("grades listening answers correctly", () => {
    const answers: AnswerEntry[] = [
      { questionId: "q1", answer: objAnswer({ "1": "A", "2": "B" }) },
    ];
    const qMap = makeMap([
      ["q1", { skill: "listening", answerKey: objKey({ "1": "A", "2": "B" }) }],
    ]);

    const result = gradeAnswers(answers, qMap);
    expect(result.listening.correct).toBe(2);
    expect(result.listening.total).toBe(2);
    expect(result.reading.correct).toBe(0);
    expect(result.reading.total).toBe(0);
    expect(result.correctness.get("q1")).toBe(true);
  });

  it("grades reading answers correctly", () => {
    const answers: AnswerEntry[] = [
      { questionId: "q1", answer: objAnswer({ "1": "C", "2": "D" }) },
    ];
    const qMap = makeMap([
      ["q1", { skill: "reading", answerKey: objKey({ "1": "C", "2": "X" }) }],
    ]);

    const result = gradeAnswers(answers, qMap);
    expect(result.reading.correct).toBe(1);
    expect(result.reading.total).toBe(2);
    expect(result.correctness.get("q1")).toBe(false);
  });

  it("comparison is case-insensitive and trims whitespace", () => {
    const answers: AnswerEntry[] = [
      { questionId: "q1", answer: objAnswer({ "1": "  a ", "2": " B" }) },
    ];
    const qMap = makeMap([
      [
        "q1",
        { skill: "listening", answerKey: objKey({ "1": "A", "2": "b " }) },
      ],
    ]);

    const result = gradeAnswers(answers, qMap);
    expect(result.listening.correct).toBe(2);
    expect(result.listening.total).toBe(2);
    expect(result.correctness.get("q1")).toBe(true);
  });

  it("routes writing answers without grading", () => {
    const entry: AnswerEntry = {
      questionId: "q1",
      answer: { text: "My essay..." } as SubmissionAnswer,
    };
    const qMap = makeMap([["q1", { skill: "writing", answerKey: null }]]);

    const result = gradeAnswers([entry], qMap);
    expect(result.subjective).toHaveLength(1);
    expect(result.subjective[0]?.questionId).toBe("q1");
    expect(result.subjective[0]?.skill).toBe("writing");
    expect(result.listening.correct).toBe(0);
    expect(result.reading.correct).toBe(0);
    expect(result.correctness.size).toBe(0);
  });

  it("routes speaking answers without grading", () => {
    const entry: AnswerEntry = {
      questionId: "q1",
      answer: {
        audioUrl: "https://x.com/a.mp3",
        durationSeconds: 60,
      } as SubmissionAnswer,
    };
    const qMap = makeMap([["q1", { skill: "speaking", answerKey: null }]]);

    const result = gradeAnswers([entry], qMap);
    expect(result.subjective).toHaveLength(1);
    expect(result.subjective[0]?.questionId).toBe("q1");
    expect(result.subjective[0]?.skill).toBe("speaking");
    expect(result.correctness.size).toBe(0);
  });

  it("throws BadRequestError for unknown questionId", () => {
    const answers: AnswerEntry[] = [
      { questionId: "unknown", answer: objAnswer({ "1": "A" }) },
    ];

    expect(() => gradeAnswers(answers, new Map())).toThrow(BadRequestError);
  });

  it("marks question false when answerKey is null", () => {
    const answers: AnswerEntry[] = [
      { questionId: "q1", answer: objAnswer({ "1": "A" }) },
    ];
    const qMap = makeMap([["q1", { skill: "listening", answerKey: null }]]);

    const result = gradeAnswers(answers, qMap);
    // null answerKey → parseAnswerKey returns {} → items.length=0 → false
    expect(result.correctness.get("q1")).toBe(false);
    expect(result.listening.correct).toBe(0);
    expect(result.listening.total).toBe(0);
  });

  it("accumulates across multiple questions and skills", () => {
    const answers: AnswerEntry[] = [
      { questionId: "l1", answer: objAnswer({ "1": "A", "2": "B" }) },
      { questionId: "l2", answer: objAnswer({ "1": "X" }) },
      { questionId: "r1", answer: objAnswer({ "1": "C" }) },
      { questionId: "w1", answer: { text: "essay" } as SubmissionAnswer },
    ];
    const qMap = makeMap([
      ["l1", { skill: "listening", answerKey: objKey({ "1": "A", "2": "B" }) }],
      ["l2", { skill: "listening", answerKey: objKey({ "1": "Y" }) }],
      ["r1", { skill: "reading", answerKey: objKey({ "1": "C" }) }],
      ["w1", { skill: "writing", answerKey: null }],
    ]);

    const result = gradeAnswers(answers, qMap);
    expect(result.listening.correct).toBe(2); // l1: 2/2, l2: 0/1
    expect(result.listening.total).toBe(3);
    expect(result.reading.correct).toBe(1);
    expect(result.reading.total).toBe(1);
    expect(result.subjective).toHaveLength(1);
    expect(result.correctness.get("l1")).toBe(true);
    expect(result.correctness.get("l2")).toBe(false);
    expect(result.correctness.get("r1")).toBe(true);
    expect(result.correctness.has("w1")).toBe(false); // writing not in map
  });

  it("handles partial correct answers", () => {
    const answers: AnswerEntry[] = [
      {
        questionId: "q1",
        answer: objAnswer({ "1": "A", "2": "wrong", "3": "C" }),
      },
    ];
    const qMap = makeMap([
      [
        "q1",
        {
          skill: "reading",
          answerKey: objKey({ "1": "A", "2": "B", "3": "C" }),
        },
      ],
    ]);

    const result = gradeAnswers(answers, qMap);
    expect(result.reading.correct).toBe(2);
    expect(result.reading.total).toBe(3);
    expect(result.correctness.get("q1")).toBe(false);
  });

  it("handles missing user answer keys gracefully", () => {
    const answers: AnswerEntry[] = [
      { questionId: "q1", answer: objAnswer({ "1": "A" }) },
    ];
    const qMap = makeMap([
      ["q1", { skill: "listening", answerKey: objKey({ "1": "A", "2": "B" }) }],
    ]);

    const result = gradeAnswers(answers, qMap);
    // user only answered key "1", key "2" → ans["2"] is undefined → no match
    expect(result.listening.correct).toBe(1);
    expect(result.listening.total).toBe(2);
    expect(result.correctness.get("q1")).toBe(false);
  });

  describe("reading_tng (True/Not Given/Not Mentioned)", () => {
    it("grades all correct TNG answers", () => {
      const answers: AnswerEntry[] = [
        {
          questionId: "q1",
          answer: objAnswer({ "1": "A", "2": "B", "3": "C" }),
        },
      ];
      const qMap = makeMap([
        [
          "q1",
          {
            skill: "reading",
            answerKey: objKey({ "1": "A", "2": "B", "3": "C" }),
          },
        ],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.reading.correct).toBe(3);
      expect(result.reading.total).toBe(3);
      expect(result.correctness.get("q1")).toBe(true);
    });

    it("grades partial TNG answers", () => {
      const answers: AnswerEntry[] = [
        {
          questionId: "q1",
          answer: objAnswer({ "1": "A", "2": "C", "3": "C" }),
        },
      ];
      const qMap = makeMap([
        [
          "q1",
          {
            skill: "reading",
            answerKey: objKey({ "1": "A", "2": "B", "3": "C" }),
          },
        ],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.reading.correct).toBe(2);
      expect(result.reading.total).toBe(3);
      expect(result.correctness.get("q1")).toBe(false);
    });

    it("compares TNG answers case-insensitively", () => {
      const answers: AnswerEntry[] = [
        { questionId: "q1", answer: objAnswer({ "1": "a", "2": "b" }) },
      ];
      const qMap = makeMap([
        ["q1", { skill: "reading", answerKey: objKey({ "1": "A", "2": "B" }) }],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.reading.correct).toBe(2);
      expect(result.correctness.get("q1")).toBe(true);
    });
  });

  describe("reading_matching_headings", () => {
    it("matches correct heading text", () => {
      const answers: AnswerEntry[] = [
        {
          questionId: "q1",
          answer: objAnswer({ "1": "Economic Growth", "2": "Climate Change" }),
        },
      ];
      const qMap = makeMap([
        [
          "q1",
          {
            skill: "reading",
            answerKey: objKey({
              "1": "Economic Growth",
              "2": "Climate Change",
            }),
          },
        ],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.reading.correct).toBe(2);
      expect(result.correctness.get("q1")).toBe(true);
    });

    it("marks wrong heading as incorrect", () => {
      const answers: AnswerEntry[] = [
        {
          questionId: "q1",
          answer: objAnswer({ "1": "Wrong Heading", "2": "Climate Change" }),
        },
      ];
      const qMap = makeMap([
        [
          "q1",
          {
            skill: "reading",
            answerKey: objKey({
              "1": "Economic Growth",
              "2": "Climate Change",
            }),
          },
        ],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.reading.correct).toBe(1);
      expect(result.reading.total).toBe(2);
      expect(result.correctness.get("q1")).toBe(false);
    });

    it("compares heading text case-insensitively", () => {
      const answers: AnswerEntry[] = [
        {
          questionId: "q1",
          answer: objAnswer({ "1": "economic growth" }),
        },
      ];
      const qMap = makeMap([
        [
          "q1",
          { skill: "reading", answerKey: objKey({ "1": "Economic Growth" }) },
        ],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.reading.correct).toBe(1);
      expect(result.correctness.get("q1")).toBe(true);
    });
  });

  describe("reading_gap_fill (free text)", () => {
    it("matches exact words case-insensitively", () => {
      const answers: AnswerEntry[] = [
        {
          questionId: "q1",
          answer: objAnswer({ "1": "However", "2": "Therefore" }),
        },
      ];
      const qMap = makeMap([
        [
          "q1",
          {
            skill: "reading",
            answerKey: objKey({ "1": "however", "2": "therefore" }),
          },
        ],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.reading.correct).toBe(2);
      expect(result.correctness.get("q1")).toBe(true);
    });

    it("tolerates extra whitespace in user answer", () => {
      const answers: AnswerEntry[] = [
        {
          questionId: "q1",
          answer: objAnswer({ "1": "  however  ", "2": "  there fore " }),
        },
      ];
      const qMap = makeMap([
        [
          "q1",
          {
            skill: "reading",
            answerKey: objKey({ "1": "however", "2": "there fore" }),
          },
        ],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.reading.correct).toBe(2);
      expect(result.correctness.get("q1")).toBe(true);
    });

    it("marks wrong word as incorrect", () => {
      const answers: AnswerEntry[] = [
        { questionId: "q1", answer: objAnswer({ "1": "but" }) },
      ];
      const qMap = makeMap([
        ["q1", { skill: "reading", answerKey: objKey({ "1": "however" }) }],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.reading.correct).toBe(0);
      expect(result.correctness.get("q1")).toBe(false);
    });
  });

  describe("reading_gap_fill (MCQ-style)", () => {
    it("matches letter options like standard MCQ", () => {
      const answers: AnswerEntry[] = [
        { questionId: "q1", answer: objAnswer({ "1": "B", "2": "A" }) },
      ];
      const qMap = makeMap([
        ["q1", { skill: "reading", answerKey: objKey({ "1": "B", "2": "A" }) }],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.reading.correct).toBe(2);
      expect(result.correctness.get("q1")).toBe(true);
    });
  });

  describe("listening_dictation", () => {
    it("grades correct dictation words case-insensitively", () => {
      const answers: AnswerEntry[] = [
        {
          questionId: "q1",
          answer: objAnswer({ "1": "Environment", "2": "SUSTAINABLE" }),
        },
      ];
      const qMap = makeMap([
        [
          "q1",
          {
            skill: "listening",
            answerKey: objKey({ "1": "environment", "2": "sustainable" }),
          },
        ],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.listening.correct).toBe(2);
      expect(result.correctness.get("q1")).toBe(true);
    });

    it("tolerates extra whitespace in dictation answers", () => {
      const answers: AnswerEntry[] = [
        {
          questionId: "q1",
          answer: objAnswer({ "1": "  environment  ", "2": " sustainable " }),
        },
      ];
      const qMap = makeMap([
        [
          "q1",
          {
            skill: "listening",
            answerKey: objKey({ "1": "environment", "2": "sustainable" }),
          },
        ],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.listening.correct).toBe(2);
      expect(result.correctness.get("q1")).toBe(true);
    });

    it("marks wrong dictation word as incorrect", () => {
      const answers: AnswerEntry[] = [
        { questionId: "q1", answer: objAnswer({ "1": "enviroment" }) },
      ];
      const qMap = makeMap([
        [
          "q1",
          { skill: "listening", answerKey: objKey({ "1": "environment" }) },
        ],
      ]);

      const result = gradeAnswers(answers, qMap);
      expect(result.listening.correct).toBe(0);
      expect(result.correctness.get("q1")).toBe(false);
    });
  });

  describe("mixed format exam", () => {
    it("accumulates scores across MCQ, TNG, and dictation formats", () => {
      const answers: AnswerEntry[] = [
        { questionId: "r-mcq", answer: objAnswer({ "1": "A", "2": "C" }) },
        {
          questionId: "r-tng",
          answer: objAnswer({ "1": "A", "2": "B", "3": "A" }),
        },
        {
          questionId: "l-dict",
          answer: objAnswer({ "1": "environment", "2": "wrong" }),
        },
      ];
      const qMap = makeMap([
        [
          "r-mcq",
          { skill: "reading", answerKey: objKey({ "1": "A", "2": "B" }) },
        ],
        [
          "r-tng",
          {
            skill: "reading",
            answerKey: objKey({ "1": "A", "2": "B", "3": "C" }),
          },
        ],
        [
          "l-dict",
          {
            skill: "listening",
            answerKey: objKey({ "1": "environment", "2": "sustainable" }),
          },
        ],
      ]);

      const result = gradeAnswers(answers, qMap);
      // r-mcq: 1/2 correct, r-tng: 2/3 correct → reading: 3/5
      expect(result.reading.correct).toBe(3);
      expect(result.reading.total).toBe(5);
      // l-dict: 1/2 correct
      expect(result.listening.correct).toBe(1);
      expect(result.listening.total).toBe(2);

      expect(result.correctness.get("r-mcq")).toBe(false);
      expect(result.correctness.get("r-tng")).toBe(false);
      expect(result.correctness.get("l-dict")).toBe(false);
    });
  });
});
