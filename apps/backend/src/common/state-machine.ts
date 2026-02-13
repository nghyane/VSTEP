import { BadRequestError } from "@common/errors";

type TransitionMap<S extends string> = Partial<Record<S, readonly S[]>>;

/**
 * Create a typed finite state machine from a transition map.
 * Reusable for any domain entity with status workflows (submissions, exam sessions, etc.).
 */
export function createStateMachine<S extends string>(
  transitions: TransitionMap<S>,
) {
  return {
    canTransition(from: S, to: S): boolean {
      return transitions[from]?.includes(to) ?? false;
    },
    assertTransition(from: S, to: S): void {
      if (!this.canTransition(from, to)) {
        throw new BadRequestError(
          `Cannot transition from "${from}" to "${to}"`,
        );
      }
    },
    validNextStates(from: S): readonly S[] {
      return transitions[from] ?? [];
    },
  };
}
