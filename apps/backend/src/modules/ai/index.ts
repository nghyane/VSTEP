import { env } from "@common/env";
import { AppError } from "@common/errors";
import { AuthErrors } from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";

const AiSkill = t.Union([
  t.Literal("listening"),
  t.Literal("reading"),
  t.Literal("writing"),
  t.Literal("speaking"),
]);

const ParaphraseBody = t.Object({
  text: t.String({ minLength: 1 }),
  skill: AiSkill,
  context: t.Optional(t.String()),
});

const ParaphraseResponseSchema = t.Object({
  highlights: t.Array(
    t.Object({
      phrase: t.String(),
      note: t.String(),
    }),
  ),
});

type ParaphraseResponse = typeof ParaphraseResponseSchema.static;

const ExplainBody = t.Object({
  text: t.String({ minLength: 1 }),
  skill: AiSkill,
  questionNumbers: t.Optional(t.Array(t.Number())),
  answers: t.Optional(t.Record(t.String(), t.String())),
  correctAnswers: t.Optional(t.Record(t.String(), t.String())),
});

const ExplainResponseSchema = t.Object({
  highlights: t.Array(
    t.Object({
      phrase: t.String(),
      note: t.String(),
      category: t.Union([
        t.Literal("grammar"),
        t.Literal("vocabulary"),
        t.Literal("strategy"),
        t.Literal("discourse"),
      ]),
    }),
  ),
  questionExplanations: t.Optional(
    t.Array(
      t.Object({
        questionNumber: t.Number(),
        correctAnswer: t.String(),
        explanation: t.String(),
        wrongAnswerNote: t.Optional(t.String()),
      }),
    ),
  ),
});

type ExplainResponse = typeof ExplainResponseSchema.static;

async function callGradingService<TResponse>(
  path: string,
  payload: unknown,
): Promise<TResponse> {
  const res = await fetch(`${env.GRADING_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new AppError(
      502,
      `Grading service error: ${res.status}`,
      "GRADING_SERVICE_ERROR",
      { path, status: res.status },
    );
  }

  return (await res.json()) as TResponse;
}

export const ai = new Elysia({
  name: "module:ai",
  prefix: "/ai",
  detail: { tags: ["AI"] },
})
  .use(authPlugin)

  .post(
    "/paraphrase",
    ({ body }) =>
      callGradingService<ParaphraseResponse>("/ai/paraphrase", body),
    {
      auth: true,
      body: ParaphraseBody,
      response: {
        200: ParaphraseResponseSchema,
        ...AuthErrors,
      },
      detail: {
        summary: "AI Paraphrase",
        description:
          "Analyze text and return paraphrase suggestions for key phrases.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/explain",
    ({ body }) =>
      callGradingService<ExplainResponse>("/ai/explain", {
        text: body.text,
        skill: body.skill,
        answers: body.answers,
        // biome-ignore lint/style/useNamingConvention: Grading service request schema is snake_case.
        question_numbers: body.questionNumbers,
        // biome-ignore lint/style/useNamingConvention: Grading service request schema is snake_case.
        correct_answers: body.correctAnswers,
      }),
    {
      auth: true,
      body: ExplainBody,
      response: {
        200: ExplainResponseSchema,
        ...AuthErrors,
      },
      detail: {
        summary: "AI Explain",
        description:
          "Analyze text for grammar, vocabulary, and strategy with Vietnamese explanations.",
        security: [{ bearerAuth: [] }],
      },
    },
  );
