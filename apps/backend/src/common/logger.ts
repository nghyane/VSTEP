/**
 * Simple logger using Bun.stdout/stderr
 * Zero dependency, fast, stable for academic projects
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const STREAMS: Record<LogLevel, typeof Bun.stdout> = {
  debug: Bun.stdout,
  info: Bun.stdout,
  warn: Bun.stderr,
  error: Bun.stderr,
};

const currentLevel = LEVELS[(process.env.LOG_LEVEL as LogLevel) || "info"];

function log(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (LEVELS[level] >= currentLevel) {
    const time = new Date().toISOString();
    STREAMS[level].write(
      `${JSON.stringify({ time, level, message, ...meta })}\n`,
    );
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) =>
    log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    log("error", msg, meta),
};
