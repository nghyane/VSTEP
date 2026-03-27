import { describe, expect, it } from "bun:test";
import { Value } from "@sinclair/typebox/value";
import {
  CONTENT_MAP,
  ListeningPart1Content,
  ListeningPart2Content,
  ListeningPart3Content,
} from "./question-content";

function mcqItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    stem: `Question ${i + 1}`,
    options: ["A", "B", "C", "D"],
  }));
}

function listeningContent(itemCount: number) {
  return {
    audioUrl: "https://example.com/audio.mp3",
    items: mcqItems(itemCount),
  };
}

describe("ListeningPart1Content (max 8 items)", () => {
  it("accepts 1-8 items", () => {
    expect(Value.Check(ListeningPart1Content, listeningContent(1))).toBe(true);
    expect(Value.Check(ListeningPart1Content, listeningContent(8))).toBe(true);
  });

  it("rejects 9+ items", () => {
    expect(Value.Check(ListeningPart1Content, listeningContent(9))).toBe(false);
  });

  it("rejects 0 items", () => {
    expect(Value.Check(ListeningPart1Content, listeningContent(0))).toBe(false);
  });
});

describe("ListeningPart2Content (max 12 items)", () => {
  it("accepts 1-12 items", () => {
    expect(Value.Check(ListeningPart2Content, listeningContent(1))).toBe(true);
    expect(Value.Check(ListeningPart2Content, listeningContent(12))).toBe(true);
  });

  it("rejects 13+ items", () => {
    expect(Value.Check(ListeningPart2Content, listeningContent(13))).toBe(
      false,
    );
  });
});

describe("ListeningPart3Content (max 15 items)", () => {
  it("accepts 1-15 items", () => {
    expect(Value.Check(ListeningPart3Content, listeningContent(1))).toBe(true);
    expect(Value.Check(ListeningPart3Content, listeningContent(15))).toBe(true);
  });

  it("rejects 16+ items", () => {
    expect(Value.Check(ListeningPart3Content, listeningContent(16))).toBe(
      false,
    );
  });
});

function getSchema(key: string) {
  const schema = CONTENT_MAP[key];
  if (!schema) throw new Error(`Missing schema for ${key}`);
  return schema;
}

describe("CONTENT_MAP per-part validation", () => {
  it("listening:1 uses Part1 schema (max 8)", () => {
    const schema = getSchema("listening:1");
    expect(Value.Check(schema, listeningContent(8))).toBe(true);
    expect(Value.Check(schema, listeningContent(9))).toBe(false);
  });

  it("listening:2 uses Part2 schema (max 12)", () => {
    const schema = getSchema("listening:2");
    expect(Value.Check(schema, listeningContent(12))).toBe(true);
    expect(Value.Check(schema, listeningContent(13))).toBe(false);
  });

  it("listening:3 uses Part3 schema (max 15)", () => {
    const schema = getSchema("listening:3");
    expect(Value.Check(schema, listeningContent(15))).toBe(true);
    expect(Value.Check(schema, listeningContent(16))).toBe(false);
  });
});
