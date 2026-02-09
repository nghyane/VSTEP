import { t } from "elysia";

const MCQOptions = t.Object({
  A: t.String(),
  B: t.String(),
  C: t.String(),
  D: t.String(),
});

const MCQItem = t.Object({
  number: t.Integer(),
  prompt: t.String(),
  options: MCQOptions,
});

const WritingScaffolding = t.Optional(
  t.Object({
    template: t.Optional(t.String()),
    keywords: t.Optional(t.Array(t.String())),
    modelEssay: t.Optional(t.String()),
  }),
);

export const WritingTask1Content = t.Object({
  taskNumber: t.Literal(1),
  prompt: t.String(),
  instructions: t.Optional(t.String()),
  minWords: t.Optional(t.Integer({ default: 120 })),
  imageUrls: t.Optional(t.Array(t.String())),
  scaffolding: WritingScaffolding,
});

export const WritingTask2Content = t.Object({
  taskNumber: t.Literal(2),
  prompt: t.String(),
  instructions: t.Optional(t.String()),
  minWords: t.Optional(t.Integer({ default: 250 })),
  imageUrls: t.Optional(t.Array(t.String())),
  scaffolding: WritingScaffolding,
});

export const SpeakingPart1Content = t.Object({
  partNumber: t.Literal(1),
  prompt: t.String(),
  instructions: t.Optional(t.String()),
  speakingSeconds: t.Optional(t.Integer()),
  sampleAudioUrl: t.Optional(t.String()),
});

export const SpeakingPart2Content = t.Object({
  partNumber: t.Literal(2),
  prompt: t.String(),
  instructions: t.Optional(t.String()),
  options: t.Array(t.String(), { minItems: 2, maxItems: 5 }),
  preparationSeconds: t.Optional(t.Integer({ default: 60 })),
  speakingSeconds: t.Optional(t.Integer()),
  sampleAudioUrl: t.Optional(t.String()),
});

export const SpeakingPart3Content = t.Object({
  partNumber: t.Literal(3),
  prompt: t.String(),
  instructions: t.Optional(t.String()),
  mindMapNodes: t.Optional(t.Array(t.String())),
  followUpQuestions: t.Optional(t.Array(t.String())),
  preparationSeconds: t.Optional(t.Integer({ default: 60 })),
  speakingSeconds: t.Optional(t.Integer()),
  sampleAudioUrl: t.Optional(t.String()),
});

export const ReadingMCQContent = t.Object({
  passage: t.String(),
  title: t.Optional(t.String()),
  items: t.Array(MCQItem, { minItems: 1 }),
});

export const ReadingTNGContent = t.Object({
  passage: t.String(),
  title: t.Optional(t.String()),
  items: t.Array(
    t.Object({
      number: t.Integer(),
      prompt: t.String(),
      options: t.Object({
        A: t.String(),
        B: t.String(),
        C: t.String(),
      }),
    }),
    { minItems: 1 },
  ),
});

export const ReadingMatchingHeadingsContent = t.Object({
  passage: t.Optional(t.String()),
  title: t.Optional(t.String()),
  paragraphs: t.Array(t.Object({ label: t.String(), text: t.String() }), {
    minItems: 1,
  }),
  headings: t.Array(t.String(), { minItems: 1 }),
  items: t.Array(
    t.Object({ number: t.Integer(), targetParagraph: t.String() }),
    { minItems: 1 },
  ),
});

export const ReadingGapFillContent = t.Object({
  passage: t.Optional(t.String()),
  title: t.Optional(t.String()),
  textWithGaps: t.String(),
  items: t.Array(
    t.Object({
      number: t.Integer(),
      options: t.Optional(MCQOptions),
    }),
    { minItems: 1 },
  ),
});

const ListeningScaffolding = t.Optional(
  t.Object({
    keywords: t.Optional(t.Array(t.String())),
    slowAudioUrl: t.Optional(t.String()),
  }),
);

export const ListeningMCQContent = t.Object({
  audioUrl: t.String(),
  transcript: t.Optional(t.String()),
  scaffolding: ListeningScaffolding,
  items: t.Array(MCQItem, { minItems: 1 }),
});

export const ListeningDictationContent = t.Object({
  audioUrl: t.String(),
  transcript: t.Optional(t.String()),
  transcriptWithGaps: t.String(),
  scaffolding: ListeningScaffolding,
  items: t.Array(
    t.Object({
      number: t.Integer(),
      correctText: t.Optional(t.String()),
    }),
    { minItems: 1 },
  ),
});

export const QuestionContent = t.Union([
  WritingTask1Content,
  WritingTask2Content,
  SpeakingPart1Content,
  SpeakingPart2Content,
  SpeakingPart3Content,
  ReadingMCQContent,
  ReadingTNGContent,
  ReadingMatchingHeadingsContent,
  ReadingGapFillContent,
  ListeningMCQContent,
  ListeningDictationContent,
]);

export type QuestionContent = typeof QuestionContent.static;
