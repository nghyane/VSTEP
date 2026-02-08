import { env } from "@common/env";
import { sql } from "drizzle-orm";
import { db } from "@/db";

type Status = "ok" | "unavailable" | "error";

interface HealthResult {
  status: "ok" | "degraded";
  services: Record<string, Status>;
}

async function checkPostgres(): Promise<Status> {
  try {
    await db.execute(sql`SELECT 1`);
    return "ok";
  } catch {
    return "error";
  }
}

async function checkRedis(): Promise<Status> {
  if (!env.REDIS_URL) return "unavailable";
  try {
    const url = new URL(env.REDIS_URL);
    const socket = await Bun.connect({
      hostname: url.hostname,
      port: Number(url.port) || 6379,
      socket: {
        data() {},
        open(s) {
          s.end();
        },
        connectError() {},
      },
    });
    socket.end();
    return "ok";
  } catch {
    return "error";
  }
}

async function checkRabbitMQ(): Promise<Status> {
  if (!env.RABBITMQ_URL) return "unavailable";
  try {
    const mgmtUrl = env.RABBITMQ_URL.replace(/^amqp/, "http").replace(
      /:5672/,
      ":15672",
    );
    const res = await fetch(`${mgmtUrl}/api/health/checks/alarms`, {
      signal: AbortSignal.timeout(2000),
    }).catch(() => null);
    return res?.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

export async function checkHealth(): Promise<HealthResult> {
  const [dbStatus, redisStatus, rabbitmqStatus] = await Promise.all([
    checkPostgres(),
    checkRedis(),
    checkRabbitMQ(),
  ]);

  const services: Record<string, Status> = {
    db: dbStatus,
    redis: redisStatus,
    rabbitmq: rabbitmqStatus,
  };

  const allOk = Object.values(services).every(
    (s) => s === "ok" || s === "unavailable",
  );

  return { status: allOk ? "ok" : "degraded", services };
}
