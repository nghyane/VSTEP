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

const currentLevel = LEVELS[(process.env.LOG_LEVEL as LogLevel) || "info"];

const format = (
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): string => {
  const time = new Date().toISOString();
  const log = { time, level, message, ...meta };
  return `${JSON.stringify(log)}\n`;
};

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (LEVELS.debug >= currentLevel) {
      Bun.stdout.write(format("debug", msg, meta));
    }
  },
  info: (msg: string, meta?: Record<string, unknown>) => {
    if (LEVELS.info >= currentLevel) {
      Bun.stdout.write(format("info", msg, meta));
    }
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    if (LEVELS.warn >= currentLevel) {
      Bun.stderr.write(format("warn", msg, meta));
    }
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    if (LEVELS.error >= currentLevel) {
      Bun.stderr.write(format("error", msg, meta));
    }
  },
};
