import { NextResponse } from "next/server";
import { z } from "zod";

type BucketState = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = Number.parseInt(
  process.env.API_RATE_LIMIT_MAX ?? "120",
  10
);
const VALIDATED_RATE_LIMIT_MAX_REQUESTS =
  Number.isFinite(RATE_LIMIT_MAX_REQUESTS) && RATE_LIMIT_MAX_REQUESTS > 0
    ? RATE_LIMIT_MAX_REQUESTS
    : 120;
const buckets = new Map<string, BucketState>();
let lastCleanupMs = 0;

function cleanupBuckets(nowMs: number): void {
  if (nowMs - lastCleanupMs < RATE_LIMIT_WINDOW_MS) return;

  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= nowMs) {
      buckets.delete(key);
    }
  });

  lastCleanupMs = nowMs;
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp) return firstIp.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

export function applyRateLimit(
  request: Request,
  routeKey: string
): NextResponse | null {
  const nowMs = Date.now();
  cleanupBuckets(nowMs);

  const ip = getClientIp(request);
  const bucketKey = `${routeKey}:${ip}`;
  const existingBucket = buckets.get(bucketKey);

  if (!existingBucket || existingBucket.resetAt <= nowMs) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: nowMs + RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (existingBucket.count >= VALIDATED_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existingBucket.resetAt - nowMs) / 1000)
    );

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(VALIDATED_RATE_LIMIT_MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  existingBucket.count += 1;
  return null;
}

type ParseQuerySuccess<TSchema extends z.ZodTypeAny> = {
  success: true;
  data: z.infer<TSchema>;
};

type ParseQueryFailure = {
  success: false;
  response: NextResponse;
};

type ParseParamsSuccess<TSchema extends z.ZodTypeAny> = {
  success: true;
  data: z.infer<TSchema>;
};

type ParseParamsFailure = {
  success: false;
  response: NextResponse;
};

type ParseJsonSuccess<TSchema extends z.ZodTypeAny> = {
  success: true;
  data: z.infer<TSchema>;
};

type ParseJsonFailure = {
  success: false;
  response: NextResponse;
};

export function parseQuery<
  TSchema extends z.ZodObject<Record<string, z.ZodTypeAny>>,
>(request: Request, schema: TSchema): ParseQuerySuccess<TSchema> | ParseQueryFailure {
  const rawParams = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = schema.safeParse(rawParams);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Invalid query parameters",
          issues,
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: parsed.data };
}

export function parseParams<TSchema extends z.ZodTypeAny>(
  params: unknown,
  schema: TSchema
): ParseParamsSuccess<TSchema> | ParseParamsFailure {
  const parsed = schema.safeParse(params);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Invalid route parameters",
          issues,
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: parsed.data };
}

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
): Promise<ParseJsonSuccess<TSchema> | ParseJsonFailure> {
  const raw = await request.json().catch(() => null);
  if (raw === null) {
    return {
      success: false,
      response: NextResponse.json({ error: "Invalid request body" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Invalid request body",
          issues,
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: parsed.data };
}

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/);
