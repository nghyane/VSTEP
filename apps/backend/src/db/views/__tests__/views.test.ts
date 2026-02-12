import { describe, expect, it } from "bun:test";
import { examView, sessionView } from "../exams";
import {
  questionFullView,
  questionVersionView,
  questionView,
} from "../questions";
import { submissionView } from "../submissions";
import { userView } from "../users";

describe("userView", () => {
  it("omits passwordHash and deletedAt from columns", () => {
    expect(userView.columns).not.toHaveProperty("passwordHash");
    expect(userView.columns).not.toHaveProperty("deletedAt");
  });

  it("includes expected columns", () => {
    expect(userView.columns).toHaveProperty("id");
    expect(userView.columns).toHaveProperty("email");
    expect(userView.columns).toHaveProperty("role");
    expect(userView.columns).toHaveProperty("createdAt");
  });

  it("has matching queryColumns with all true values", () => {
    const colKeys = Object.keys(userView.columns).sort();
    const qcKeys = Object.keys(userView.queryColumns).sort();
    expect(qcKeys).toEqual(colKeys);
    for (const v of Object.values(userView.queryColumns)) {
      expect(v).toBe(true);
    }
  });

  it("has a TypeBox schema with properties", () => {
    expect(userView.schema).toHaveProperty("properties");
    expect(userView.schema.properties).not.toHaveProperty("passwordHash");
    expect(userView.schema.properties).not.toHaveProperty("deletedAt");
  });
});

describe("questionView", () => {
  it("omits answerKey and deletedAt from columns", () => {
    expect(questionView.columns).not.toHaveProperty("answerKey");
    expect(questionView.columns).not.toHaveProperty("deletedAt");
  });

  it("includes expected columns", () => {
    expect(questionView.columns).toHaveProperty("id");
    expect(questionView.columns).toHaveProperty("content");
    expect(questionView.columns).toHaveProperty("createdAt");
  });

  it("has matching queryColumns with all true values", () => {
    const colKeys = Object.keys(questionView.columns).sort();
    const qcKeys = Object.keys(questionView.queryColumns).sort();
    expect(qcKeys).toEqual(colKeys);
    for (const v of Object.values(questionView.queryColumns)) {
      expect(v).toBe(true);
    }
  });

  it("has a TypeBox schema with properties", () => {
    expect(questionView.schema).toHaveProperty("properties");
    expect(questionView.schema.properties).not.toHaveProperty("answerKey");
    expect(questionView.schema.properties).not.toHaveProperty("deletedAt");
  });
});

describe("questionFullView", () => {
  it("includes answerKey but omits deletedAt", () => {
    expect(questionFullView.columns).toHaveProperty("answerKey");
    expect(questionFullView.columns).not.toHaveProperty("deletedAt");
  });

  it("includes expected columns", () => {
    expect(questionFullView.columns).toHaveProperty("id");
    expect(questionFullView.columns).toHaveProperty("content");
    expect(questionFullView.columns).toHaveProperty("answerKey");
  });

  it("has matching queryColumns with all true values", () => {
    const colKeys = Object.keys(questionFullView.columns).sort();
    const qcKeys = Object.keys(questionFullView.queryColumns).sort();
    expect(qcKeys).toEqual(colKeys);
    for (const v of Object.values(questionFullView.queryColumns)) {
      expect(v).toBe(true);
    }
  });

  it("has a TypeBox schema with properties", () => {
    expect(questionFullView.schema).toHaveProperty("properties");
    expect(questionFullView.schema.properties).toHaveProperty("answerKey");
    expect(questionFullView.schema.properties).not.toHaveProperty("deletedAt");
  });
});

describe("questionVersionView", () => {
  it("includes all columns without omissions", () => {
    expect(questionVersionView.columns).toHaveProperty("id");
    expect(questionVersionView.columns).toHaveProperty("content");
  });

  it("has matching queryColumns with all true values", () => {
    const colKeys = Object.keys(questionVersionView.columns).sort();
    const qcKeys = Object.keys(questionVersionView.queryColumns).sort();
    expect(qcKeys).toEqual(colKeys);
    for (const v of Object.values(questionVersionView.queryColumns)) {
      expect(v).toBe(true);
    }
  });

  it("has a TypeBox schema with properties", () => {
    expect(questionVersionView.schema).toHaveProperty("properties");
  });
});

describe("submissionView", () => {
  it("omits internal submission columns", () => {
    const omittedKeys = [
      "confidence",
      "isLate",
      "attempt",
      "requestId",
      "reviewPriority",
      "reviewerId",
      "gradingMode",
      "auditFlag",
      "claimedBy",
      "claimedAt",
      "deadline",
      "deletedAt",
    ];
    for (const key of omittedKeys) {
      expect(submissionView.columns).not.toHaveProperty(key);
    }
  });

  it("includes expected columns", () => {
    expect(submissionView.columns).toHaveProperty("id");
    expect(submissionView.columns).toHaveProperty("userId");
    expect(submissionView.columns).toHaveProperty("status");
  });

  it("has matching queryColumns with all true values", () => {
    const colKeys = Object.keys(submissionView.columns).sort();
    const qcKeys = Object.keys(submissionView.queryColumns).sort();
    expect(qcKeys).toEqual(colKeys);
    for (const v of Object.values(submissionView.queryColumns)) {
      expect(v).toBe(true);
    }
  });

  it("has a TypeBox schema with properties", () => {
    expect(submissionView.schema).toHaveProperty("properties");
    const omittedKeys = [
      "confidence",
      "isLate",
      "attempt",
      "requestId",
      "reviewPriority",
      "reviewerId",
      "gradingMode",
      "auditFlag",
      "claimedBy",
      "claimedAt",
      "deadline",
      "deletedAt",
    ];
    for (const key of omittedKeys) {
      expect(submissionView.schema.properties).not.toHaveProperty(key);
    }
  });
});

describe("examView", () => {
  it("omits deletedAt from columns", () => {
    expect(examView.columns).not.toHaveProperty("deletedAt");
  });

  it("includes expected columns", () => {
    expect(examView.columns).toHaveProperty("id");
    expect(examView.columns).toHaveProperty("blueprint");
    expect(examView.columns).toHaveProperty("createdAt");
  });

  it("has matching queryColumns with all true values", () => {
    const colKeys = Object.keys(examView.columns).sort();
    const qcKeys = Object.keys(examView.queryColumns).sort();
    expect(qcKeys).toEqual(colKeys);
    for (const v of Object.values(examView.queryColumns)) {
      expect(v).toBe(true);
    }
  });

  it("has a TypeBox schema with properties", () => {
    expect(examView.schema).toHaveProperty("properties");
    expect(examView.schema.properties).not.toHaveProperty("deletedAt");
  });
});

describe("sessionView", () => {
  it("omits deletedAt from columns", () => {
    expect(sessionView.columns).not.toHaveProperty("deletedAt");
  });

  it("includes expected columns", () => {
    expect(sessionView.columns).toHaveProperty("id");
    expect(sessionView.columns).toHaveProperty("examId");
    expect(sessionView.columns).toHaveProperty("createdAt");
  });

  it("has matching queryColumns with all true values", () => {
    const colKeys = Object.keys(sessionView.columns).sort();
    const qcKeys = Object.keys(sessionView.queryColumns).sort();
    expect(qcKeys).toEqual(colKeys);
    for (const v of Object.values(sessionView.queryColumns)) {
      expect(v).toBe(true);
    }
  });

  it("has a TypeBox schema with properties", () => {
    expect(sessionView.schema).toHaveProperty("properties");
    expect(sessionView.schema.properties).not.toHaveProperty("deletedAt");
  });
});
