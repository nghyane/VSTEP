import { describe, expect, it } from "bun:test";
import { createStateMachine } from "./state-machine";

type Status = "pending" | "active" | "completed" | "failed";

const machine = createStateMachine<Status>({
  pending: ["active", "failed"],
  active: ["completed", "failed"],
  completed: [],
  failed: [],
});

describe("createStateMachine", () => {
  describe("canTransition", () => {
    it("returns true for valid transitions", () => {
      expect(machine.canTransition("pending", "active")).toBe(true);
      expect(machine.canTransition("pending", "failed")).toBe(true);
      expect(machine.canTransition("active", "completed")).toBe(true);
    });

    it("returns false for invalid transitions", () => {
      expect(machine.canTransition("pending", "completed")).toBe(false);
      expect(machine.canTransition("completed", "pending")).toBe(false);
      expect(machine.canTransition("failed", "active")).toBe(false);
    });
  });

  describe("assertTransition", () => {
    it("does not throw for valid transitions", () => {
      expect(() => machine.assertTransition("pending", "active")).not.toThrow();
    });

    it("throws ConflictError for invalid transitions", () => {
      expect(() => machine.assertTransition("completed", "pending")).toThrow(
        'Cannot transition from "completed" to "pending"',
      );
    });
  });

  describe("validNextStates", () => {
    it("returns valid next states", () => {
      expect(machine.validNextStates("pending")).toEqual(["active", "failed"]);
    });

    it("returns empty array for terminal states", () => {
      expect(machine.validNextStates("completed")).toEqual([]);
      expect(machine.validNextStates("failed")).toEqual([]);
    });
  });
});
