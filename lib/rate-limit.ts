import { AppError } from "@/lib/errors";

const HOUR_MS = 60 * 60 * 1000;
const PRUNE_THRESHOLD = 1000;

/**
 * Fixed-window, in-memory limiter. On serverless each instance keeps its own
 * counts, so this is best-effort protection for the free model quota.
 */
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}) {
  const windows = new Map<string, { count: number; resetAt: number }>();

  function prune(time: number) {
    for (const [key, entry] of windows) {
      if (entry.resetAt <= time) windows.delete(key);
    }
  }

  return {
    check(key: string): void {
      const time = now();
      if (windows.size > PRUNE_THRESHOLD) prune(time);

      const entry = windows.get(key);
      if (!entry || entry.resetAt <= time) {
        windows.set(key, { count: 1, resetAt: time + windowMs });
        return;
      }
      if (entry.count >= limit) throw new AppError("RATE_LIMITED");
      entry.count += 1;
    },
  };
}

export const analyzeLimiter = createRateLimiter({ limit: 5, windowMs: HOUR_MS });
export const chatLimiter = createRateLimiter({ limit: 30, windowMs: HOUR_MS });

export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "anonymous";
}
