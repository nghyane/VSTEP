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
      expect(machine.canTransition("active", "failed")).toBe(true);
    });

    it("returns false for invalid transitions", () => {
      expect(machine.canTransition("pending", "completed")).toBe(false);
      expect(machine.canTransition("completed", "pending")).toBe(false);
      expect(machine.canTransition("failed", "active")).toBe(false);
    });

    it("returns false for self-transitions", () => {
      expect(machine.canTransition("pending", "pending")).toBe(false);
      expect(machine.canTransition("active", "active")).toBe(false);
      expect(machine.canTransition("completed", "completed")).toBe(false);
    });

    it("returns false for unknown states", () => {
      expect(machine.canTransition("unknown" as Status, "active")).toBe(false);
      expect(machine.canTransition("pending", "unknown" as Status)).toBe(false);
    });
  });

  describe("assertTransition", () => {
    it("does not throw for valid transitions", () => {
      expect(() => machine.assertTransition("pending", "active")).not.toThrow();
      expect(() =>
        machine.assertTransition("active", "completed"),
      ).not.toThrow();
    });

    it("throws BadRequestError for invalid transitions", () => {
      expect(() => machine.assertTransition("completed", "pending")).toThrow(
        'Cannot transition from "completed" to "pending"',
      );
    });

    it("throws for self-transitions", () => {
      expect(() => machine.assertTransition("pending", "pending")).toThrow(
        'Cannot transition from "pending" to "pending"',
      );
    });

    it("throws for transitions from terminal states", () => {
      expect(() => machine.assertTransition("failed", "pending")).toThrow(
        'Cannot transition from "failed" to "pending"',
      );
      expect(() => machine.assertTransition("completed", "active")).toThrow(
        'Cannot transition from "completed" to "active"',
      );
    });
  });

  describe("validNextStates", () => {
    it("returns valid next states", () => {
      expect(machine.validNextStates("pending")).toEqual(["active", "failed"]);
      expect(machine.validNextStates("active")).toEqual([
        "completed",
        "failed",
      ]);
    });

    it("returns empty array for terminal states", () => {
      expect(machine.validNextStates("completed")).toEqual([]);
      expect(machine.validNextStates("failed")).toEqual([]);
    });

    it("returns empty array for unknown states", () => {
      expect(machine.validNextStates("unknown" as Status)).toEqual([]);
    });
  });
});
