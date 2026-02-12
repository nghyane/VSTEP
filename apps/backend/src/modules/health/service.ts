import { env } from "@common/env";
import { logger } from "@common/logger";
import { db } from "@db/index";
import { sql } from "drizzle-orm";

const TIMEOUT_MS = 2_000;

type Status = "ok" | "unavailable" | "error";

interface ServiceHealth {
  status: Status;
  latency?: number;
}

interface HealthResult {
  status: "ok" | "degraded";
  services: {
    db: ServiceHealth;
    redis: ServiceHealth;
  };
}

async function timed(
  name: string,
  check: () => Promise<void>,
): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await Promise.race([
      check(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timed out")), TIMEOUT_MS),
      ),
    ]);
    return { status: "ok", latency: Date.now() - start };
  } catch (err) {
    logger.warn(`${name} health check failed`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return { status: "error" };
  }
}

async function tcpProbe(url: string, defaultPort: number): Promise<void> {
  const parsed = new URL(url);
  const socket = await Bun.connect({
    hostname: parsed.hostname,
    port: Number(parsed.port) || defaultPort,
    socket: { data() {}, open() {}, connectError() {} },
  });
  socket.end();
}

const unavailable: ServiceHealth = { status: "unavailable" };

export async function checkHealth(): Promise<HealthResult> {
  const { REDIS_URL } = env;

  const [dbHealth, redisHealth] = await Promise.all([
    timed("Postgres", () => db.execute(sql`SELECT 1`).then(() => {})),
    REDIS_URL ? timed("Redis", () => tcpProbe(REDIS_URL, 6379)) : unavailable,
  ]);

  const services = {
    db: dbHealth,
    redis: redisHealth,
  };

  const allOk = Object.values(services).every(
    (s) => s.status === "ok" || s.status === "unavailable",
  );

  return { status: allOk ? "ok" : "degraded", services };
}
