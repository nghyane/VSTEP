import { ROLES } from "@common/auth-types";
import {
  AuthErrors,
  CrudErrors,
  CrudWithConflictErrors,
  ErrorResponse,
  IdParam,
  PaginationMeta,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import {
  KnownBody,
  TopicCreateBody,
  TopicListQuery,
  TopicProgress,
  TopicUpdateBody,
  VocabularyTopic,
  VocabularyTopicDetail,
  VocabularyTopicRow,
  VocabularyWord,
  WordCreateBody,
  WordUpdateBody,
} from "./schema";
import {
  createTopic,
  createWord,
  deleteTopic,
  deleteWord,
  findTopic,
  getProgress,
  listTopics,
  listWords,
  toggleKnown,
  updateTopic,
  updateWord,
} from "./service";

const WordIdParam = t.Object({
  wordId: t.String({ format: "uuid" }),
});

export const vocabulary = new Elysia({
  name: "module:vocabulary",
  prefix: "/vocabulary",
  detail: { tags: ["Vocabulary"] },
})
  .use(authPlugin)

  // -------------------------------------------------------------------------
  // Topics
  // -------------------------------------------------------------------------

  .get("/topics", ({ query }) => listTopics(query), {
    auth: true,
    query: TopicListQuery,
    response: {
      200: t.Object({
        data: t.Array(VocabularyTopic),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: {
      summary: "List vocabulary topics",
      description:
        "Return a paginated list of vocabulary topics with word counts.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/topics/:id", ({ params }) => findTopic(params.id), {
    auth: true,
    params: IdParam,
    response: {
      200: VocabularyTopicDetail,
      ...CrudErrors,
    },
    detail: {
      summary: "Get vocabulary topic by ID",
      description: "Return a topic with all its words.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/topics",
    ({ body, set }) => {
      set.status = 201;
      return createTopic(body);
    },
    {
      role: ROLES.ADMIN,
      body: TopicCreateBody,
      response: {
        201: VocabularyTopicRow,
        400: ErrorResponse,
        ...AuthErrors,
        ...CrudWithConflictErrors,
      },
      detail: {
        summary: "Create vocabulary topic",
        description: "Create a new vocabulary topic. Requires admin role.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .put("/topics/:id", ({ params, body }) => updateTopic(params.id, body), {
    role: ROLES.ADMIN,
    params: IdParam,
    body: TopicUpdateBody,
    response: {
      200: VocabularyTopicRow,
      400: ErrorResponse,
      ...CrudWithConflictErrors,
    },
    detail: {
      summary: "Update vocabulary topic",
      description: "Update a vocabulary topic. Requires admin role.",
      security: [{ bearerAuth: [] }],
    },
  })

  .delete("/topics/:id", ({ params }) => deleteTopic(params.id), {
    role: ROLES.ADMIN,
    params: IdParam,
    response: {
      200: t.Object({ id: t.String({ format: "uuid" }) }),
      ...CrudErrors,
    },
    detail: {
      summary: "Delete vocabulary topic",
      description:
        "Delete a vocabulary topic and all its words. Requires admin role.",
      security: [{ bearerAuth: [] }],
    },
  })

  // -------------------------------------------------------------------------
  // Words
  // -------------------------------------------------------------------------

  .get("/topics/:id/words", ({ params }) => listWords(params.id), {
    auth: true,
    params: IdParam,
    response: {
      200: t.Array(VocabularyWord),
      ...AuthErrors,
    },
    detail: {
      summary: "List words in a topic",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/topics/:id/words",
    ({ params, body, set }) => {
      set.status = 201;
      return createWord(params.id, body);
    },
    {
      role: ROLES.ADMIN,
      params: IdParam,
      body: WordCreateBody,
      response: {
        201: VocabularyWord,
        400: ErrorResponse,
        ...CrudWithConflictErrors,
      },
      detail: {
        summary: "Create word in topic",
        description:
          "Add a new word to a vocabulary topic. Requires admin role.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .put(
    "/words/:wordId",
    ({ params, body }) => updateWord(params.wordId, body),
    {
      role: ROLES.ADMIN,
      params: WordIdParam,
      body: WordUpdateBody,
      response: {
        200: VocabularyWord,
        400: ErrorResponse,
        ...CrudWithConflictErrors,
      },
      detail: {
        summary: "Update word",
        description: "Update a vocabulary word. Requires admin role.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete("/words/:wordId", ({ params }) => deleteWord(params.wordId), {
    role: ROLES.ADMIN,
    params: WordIdParam,
    response: {
      200: t.Object({ id: t.String({ format: "uuid" }) }),
      ...CrudErrors,
    },
    detail: {
      summary: "Delete word",
      description: "Delete a vocabulary word. Requires admin role.",
      security: [{ bearerAuth: [] }],
    },
  })

  // -------------------------------------------------------------------------
  // Progress
  // -------------------------------------------------------------------------

  .get(
    "/topics/:id/progress",
    ({ params, user }) => getProgress(params.id, user.sub),
    {
      auth: true,
      params: IdParam,
      response: {
        200: TopicProgress,
        ...AuthErrors,
      },
      detail: {
        summary: "Get topic progress",
        description: "Get the current user's progress for a vocabulary topic.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .put(
    "/words/:wordId/known",
    ({ params, body, user }) =>
      toggleKnown(params.wordId, user.sub, body.known),
    {
      auth: true,
      params: WordIdParam,
      body: KnownBody,
      response: {
        200: t.Object({
          userId: t.String({ format: "uuid" }),
          wordId: t.String({ format: "uuid" }),
          known: t.Boolean(),
          lastReviewedAt: t.Nullable(t.String()),
          createdAt: t.String(),
          updatedAt: t.String(),
        }),
        ...CrudErrors,
      },
      detail: {
        summary: "Toggle word known status",
        description: "Mark or unmark a word as known for the current user.",
        security: [{ bearerAuth: [] }],
      },
    },
  );
