/**
 * Debug: Xác định cách Elysia xử lý error thrown từ macro resolve.
 * Thử các approach khác nhau để tìm cách đúng.
 */
import { describe, test, expect } from "bun:test";
import { Elysia, t } from "elysia";
import { bearer } from "@elysiajs/bearer";

// ── Approach 1: throw Error thường ──────────────
describe("Approach 1: throw plain Error", () => {
  const app = new Elysia()
    .use(bearer())
    .macro({
      auth(enabled: boolean) {
        if (!enabled) return;
        return {
          async resolve({ bearer: token }: { bearer: string | undefined }) {
            if (!token) throw new Error("UNAUTHORIZED");
            return { user: { sub: "test" } };
          },
        };
      },
    })
    .onError(({ error, set }) => {
      if (error.message === "UNAUTHORIZED") {
        set.status = 401;
        return { error: "UNAUTHORIZED" };
      }
    })
    .get("/test", ({ user }) => ({ user }), { auth: true });

  test("no token → check response", async () => {
    const res = await app.handle(new Request("http://localhost/test"));
    const body = await res.json();
    console.log("Approach 1:", res.status, JSON.stringify(body));
    // Just log, don't assert yet
  });
});

// ── Approach 2: Custom class extending Error ────
class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Unauthorized") {
    super(message);
  }
}

describe("Approach 2: custom error class + .error()", () => {
  const app = new Elysia()
    .use(bearer())
    .error({ UNAUTHORIZED: UnauthorizedError })
    .macro({
      auth(enabled: boolean) {
        if (!enabled) return;
        return {
          async resolve({ bearer: token }: { bearer: string | undefined }) {
            if (!token) throw new UnauthorizedError();
            return { user: { sub: "test" } };
          },
        };
      },
    })
    .onError(({ error, set, code }) => {
      console.log("onError code:", code, "error:", error.message);
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return { error: "UNAUTHORIZED" };
      }
    })
    .get("/test", ({ user }) => ({ user }), { auth: true });

  test("no token → check response", async () => {
    const res = await app.handle(new Request("http://localhost/test"));
    const body = await res.json();
    console.log("Approach 2:", res.status, JSON.stringify(body));
  });
});

// ── Approach 3: return early with error response ─
describe("Approach 3: return error response from resolve", () => {
  const app = new Elysia()
    .use(bearer())
    .macro({
      auth(enabled: boolean) {
        if (!enabled) return;
        return {
          async resolve({ bearer: token, set }: { bearer: string | undefined; set: any }) {
            if (!token) {
              set.status = 401;
              return { user: null, _error: true };
            }
            return { user: { sub: "test" } };
          },
        };
      },
    })
    .get("/test", ({ user }) => {
      return { user };
    }, { auth: true });

  test("no token → check response", async () => {
    const res = await app.handle(new Request("http://localhost/test"));
    const body = await res.json();
    console.log("Approach 3:", res.status, JSON.stringify(body));
  });
});

// ── Approach 4: use Elysia's error() function ────
describe("Approach 4: use error() from Elysia context", () => {
  const app = new Elysia()
    .use(bearer())
    .macro({
      auth(enabled: boolean) {
        if (!enabled) return;
        return {
          async resolve({ bearer: token, error }: { bearer: string | undefined; error: any }) {
            if (!token) return error(401, { error: "UNAUTHORIZED" });
            return { user: { sub: "test" } };
          },
        };
      },
    })
    .get("/test", ({ user }) => ({ user }), { auth: true });

  test("no token → check response", async () => {
    const res = await app.handle(new Request("http://localhost/test"));
    const body = await res.json();
    console.log("Approach 4:", res.status, JSON.stringify(body));
  });
});

// ── Approach 5: use status() from Elysia context ─
describe("Approach 5: use status() from Elysia context", () => {
  const app = new Elysia()
    .use(bearer())
    .macro({
      auth(enabled: boolean) {
        if (!enabled) return;
        return {
          async resolve({ bearer: token, status }: { bearer: token | undefined; status: any }) {
            if (!token) return status(401);
            return { user: { sub: "test" } };
          },
        };
      },
    })
    .get("/test", ({ user }) => ({ user }), { auth: true });

  test("no token → check response", async () => {
    const res = await app.handle(new Request("http://localhost/test"));
    const body = await res.text();
    console.log("Approach 5:", res.status, body);
  });
});

// ── Approach 6: beforeHandle + resolve combo ─────
describe("Approach 6: beforeHandle guard + resolve data", () => {
  const app = new Elysia()
    .use(bearer())
    .macro({
      auth(enabled: boolean) {
        if (!enabled) return;
        return {
          beforeHandle({ bearer: token, set }: { bearer: string | undefined; set: any }) {
            if (!token) {
              set.status = 401;
              return { error: "UNAUTHORIZED" };
            }
          },
          async resolve({ bearer: token }: { bearer: string | undefined }) {
            // Only runs if beforeHandle didn't return
            return { user: { sub: "test-user" } };
          },
        };
      },
    })
    .get("/test", ({ user }) => ({ user }), { auth: true });

  test("no token → 401", async () => {
    const res = await app.handle(new Request("http://localhost/test"));
    const body = await res.json();
    console.log("Approach 6 (no token):", res.status, JSON.stringify(body));
  });

  test("with token → 200", async () => {
    const res = await app.handle(
      new Request("http://localhost/test", {
        headers: { Authorization: "Bearer valid-token" },
      }),
    );
    const body = await res.json();
    console.log("Approach 6 (with token):", res.status, JSON.stringify(body));
  });
});
