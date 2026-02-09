import { env } from "@common/env";
import { sql } from "drizzle-orm";
import { db } from "@/db";

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
    rabbitmq: ServiceHealth;
  };
}

async function checkPostgres(): Promise<ServiceHealth> {
  const startedAt = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { status: "ok", latency: Date.now() - startedAt };
  } catch {
    return { status: "error" };
  }
}

async function checkRedis(): Promise<ServiceHealth> {
  if (!env.REDIS_URL) return { status: "unavailable" };

  const startedAt = Date.now();
  let socket: Bun.Socket<unknown> | null = null;

  try {
    const url = new URL(env.REDIS_URL);

    socket = await Promise.race([
      Bun.connect({
        hostname: url.hostname,
        port: Number(url.port) || 6379,
        socket: {
          data() {},
          open() {},
          connectError() {},
        },
      }),
      new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Redis health check timed out"));
        }, 2000);
        timeoutId.unref?.();
      }),
    ]);

    return { status: "ok", latency: Date.now() - startedAt };
  } catch {
    return { status: "error" };
  } finally {
    socket?.end();
  }
}

async function checkRabbitMQ(): Promise<ServiceHealth> {
  if (!env.RABBITMQ_URL) return { status: "unavailable" };

  const startedAt = Date.now();

  try {
    const parsed = new URL(env.RABBITMQ_URL);
    parsed.protocol = parsed.protocol === "amqps:" ? "https:" : "http:";
    parsed.port = "15672";

    const res = await fetch(`${parsed.origin}/api/health/checks/alarms`, {
      signal: AbortSignal.timeout(2000),
    }).catch(() => null);

    if (!res?.ok) {
      return { status: "error" };
    }

    return { status: "ok", latency: Date.now() - startedAt };
  } catch {
    return { status: "error" };
  }
}

export async function checkHealth(): Promise<HealthResult> {
  const [dbStatus, redisStatus, rabbitmqStatus] = await Promise.all([
    checkPostgres(),
    checkRedis(),
    checkRabbitMQ(),
  ]);

  const services = {
    db: dbStatus,
    redis: redisStatus,
    rabbitmq: rabbitmqStatus,
  };

  const allOk = Object.values(services).every(
    (service) => service.status === "ok" || service.status === "unavailable",
  );

  return { status: allOk ? "ok" : "degraded", services };
}
