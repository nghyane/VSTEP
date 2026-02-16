import { env } from "@common/env";
import { logger } from "@common/logger";
import { db } from "@db/index";
import { sql } from "drizzle-orm";

const TIMEOUT_MS = 2_000;

async function timed(name: string, check: () => Promise<void>) {
  const start = Date.now();
  return Promise.race([
    check(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timed out")), TIMEOUT_MS),
    ),
  ])
    .then(() => ({ status: "ok" as const, latency: Date.now() - start }))
    .catch((err) => {
      logger.warn(`${name} health check failed`, {
        error: err instanceof Error ? err.message : String(err),
      });
      return { status: "error" as const };
    });
}

async function tcpProbe(url: string, defaultPort: number) {
  const parsed = new URL(url);
  const socket = await Bun.connect({
    hostname: parsed.hostname,
    port: Number(parsed.port) || defaultPort,
    socket: { data() {}, open() {}, connectError() {} },
  });
  socket.end();
}

const unavailable = { status: "unavailable" as const };

export async function check() {
  const [dbHealth, redisHealth] = await Promise.all([
    timed("Postgres", () => db.execute(sql`SELECT 1`).then(() => {})),
    env.REDIS_URL
      ? timed("Redis", () => tcpProbe(env.REDIS_URL as string, 6379))
      : unavailable,
  ]);

  const services = { db: dbHealth, redis: redisHealth };
  const allHealthy = Object.values(services).every(
    (s) => s.status === "ok" || s.status === "unavailable",
  );

  return {
    status: allHealthy ? ("ok" as const) : ("degraded" as const),
    services,
  };
}
