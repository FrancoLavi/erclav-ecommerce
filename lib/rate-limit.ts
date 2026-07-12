import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };
type RateLimitOptions = { limit: number; windowMs: number; identifier?: string };

const globalRateLimit = globalThis as typeof globalThis & {
  erclavRateLimit?: Map<string, Bucket>;
};

const buckets = globalRateLimit.erclavRateLimit ?? new Map<string, Bucket>();
globalRateLimit.erclavRateLimit = buckets;

function cleanExpired(now: number) {
  if (buckets.size < 1_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export async function checkRateLimit(scope: string, options: RateLimitOptions) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip") || "local";
  const key = `${scope}:${options.identifier ?? ip}`;
  const now = Date.now();
  cleanExpired(now);

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1 };
  }

  if (current.count >= options.limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((current.resetAt - now) / 1_000) };
  }

  current.count += 1;
  return { allowed: true, remaining: options.limit - current.count };
}
