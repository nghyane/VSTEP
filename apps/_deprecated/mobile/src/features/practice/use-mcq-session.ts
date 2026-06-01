import { useReducer } from "react";
import { useMutation } from "@tanstack/react-query";
import { submitMcqSession } from "./actions";
import type { McqQuestion, McqSubmitResult } from "./types";

interface State {
  answers: Record<string, number>;
  result: McqSubmitResult | null;
}

type Action =
  | { type: "select"; questionId: string; index: number }
  | { type: "submitted"; result: McqSubmitResult };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "select":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.index } };
    case "submitted":
      return { ...state, result: action.result };
  }
}

export function useMcqSession(
  skill: "listening" | "reading",
  sessionId: string | null,
  questions: McqQuestion[],
) {
  const [state, dispatch] = useReducer(reducer, { answers: {}, result: null });

  const mutation = useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error("No session");
      const formatted = Object.entries(state.answers).map(([question_id, selected_index]) => ({
        question_id,
        selected_index,
      }));
      return submitMcqSession(skill, sessionId, formatted);
    },
    onSuccess: (res) => dispatch({ type: "submitted", result: res }),
  });

  return {
    answers: state.answers,
    result: state.result,
    submitting: mutation.isPending,
    answeredCount: Object.keys(state.answers).length,
    select: (questionId: string, index: number) => dispatch({ type: "select", questionId, index }),
    submit: () => mutation.mutate(),
  };
}
