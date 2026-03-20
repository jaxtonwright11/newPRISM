import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  __getRateLimitBucketCountForTests,
  __resetRateLimitStateForTests,
  applyRateLimit,
  parseQuery,
  slugSchema,
} from "./api";

const configuredLimit = Number.parseInt(process.env.API_RATE_LIMIT_MAX ?? "120", 10);
const rateLimitMaxRequests =
  Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 120;

function createRequest(path: string, headers: HeadersInit = {}): Request {
  return new Request(`https://example.com${path}`, { headers });
}

function createForwardedRequest(ip: string, path = "/api/topics"): Request {
  return createRequest(path, {
    "x-forwarded-for": `${ip}, 10.0.0.1`,
  });
}

describe("applyRateLimit", () => {
  beforeEach(() => {
    __resetRateLimitStateForTests();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    __resetRateLimitStateForTests();
  });

  it("allows requests up to limit and blocks with rate limit headers after", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);

    const request = createForwardedRequest("203.0.113.10");
    for (let index = 0; index < rateLimitMaxRequests; index += 1) {
      expect(applyRateLimit(request, "topics")).toBeNull();
    }

    const blockedResponse = applyRateLimit(request, "topics");
    expect(blockedResponse).not.toBeNull();
    expect(blockedResponse?.status).toBe(429);
    expect(blockedResponse?.headers.get("X-RateLimit-Limit")).toBe(
      String(rateLimitMaxRequests)
    );
    expect(blockedResponse?.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(blockedResponse?.headers.get("Retry-After")).toBe("60");
    await expect(blockedResponse?.json()).resolves.toEqual({
      error: "Rate limit exceeded",
    });
  });

  it("isolates buckets by route key and client ip", () => {
    vi.spyOn(Date, "now").mockReturnValue(2_000);

    const routeAndIpOne = createForwardedRequest("198.51.100.10");
    for (let index = 0; index < rateLimitMaxRequests; index += 1) {
      expect(applyRateLimit(routeAndIpOne, "topics")).toBeNull();
    }
    expect(applyRateLimit(routeAndIpOne, "topics")?.status).toBe(429);

    const differentIp = createForwardedRequest("198.51.100.11");
    expect(applyRateLimit(differentIp, "topics")).toBeNull();

    const differentRoute = createForwardedRequest("198.51.100.10");
    expect(applyRateLimit(differentRoute, "alignment")).toBeNull();
  });

  it("cleans up expired buckets when cleanup window elapses", () => {
    const nowSpy = vi.spyOn(Date, "now");

    const oldBucketRequest = createForwardedRequest("192.0.2.1");
    const activeBucketRequest = createForwardedRequest("192.0.2.2");
    const cleanupTriggerRequest = createForwardedRequest("192.0.2.3");

    nowSpy.mockReturnValue(0);
    expect(applyRateLimit(oldBucketRequest, "topics-old")).toBeNull();

    nowSpy.mockReturnValue(30_000);
    expect(applyRateLimit(activeBucketRequest, "topics-active")).toBeNull();
    expect(__getRateLimitBucketCountForTests()).toBe(2);

    nowSpy.mockReturnValue(61_000);
    expect(applyRateLimit(cleanupTriggerRequest, "topics-trigger")).toBeNull();
    expect(__getRateLimitBucketCountForTests()).toBe(2);

    expect(applyRateLimit(oldBucketRequest, "topics-old")).toBeNull();
    expect(__getRateLimitBucketCountForTests()).toBe(3);
  });
});

describe("parseQuery", () => {
  const schema = z.object({
    page: z.coerce.number().int().min(1),
    tag: z.string().min(1),
  });

  it("returns parsed query values for valid input", () => {
    const request = createRequest("/api/topics?page=2&tag=climate");
    const parsed = parseQuery(request, schema);

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      throw new Error("Expected parseQuery success");
    }

    expect(parsed.data).toEqual({
      page: 2,
      tag: "climate",
    });
  });

  it("returns a structured 400 response for invalid query values", async () => {
    const request = createRequest("/api/topics?page=0&tag=");
    const parsed = parseQuery(request, schema);

    expect(parsed.success).toBe(false);
    if (parsed.success) {
      throw new Error("Expected parseQuery failure");
    }

    expect(parsed.response.status).toBe(400);
    await expect(parsed.response.json()).resolves.toMatchObject({
      error: "Invalid query parameters",
      issues: expect.arrayContaining([
        expect.objectContaining({
          path: "page",
        }),
      ]),
    });
  });
});

describe("slugSchema", () => {
  it("accepts lower-case slugs and trims whitespace", () => {
    const parsed = slugSchema.safeParse("  local-topic-42  ");

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      throw new Error("Expected slugSchema success");
    }

    expect(parsed.data).toBe("local-topic-42");
  });

  it("rejects invalid slug formats", () => {
    const invalidSlugs = ["UPPER", "has_underscore", "", "space slug"];

    invalidSlugs.forEach((slug) => {
      expect(slugSchema.safeParse(slug).success).toBe(false);
    });
  });
});
