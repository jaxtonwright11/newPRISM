import { afterEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "./route";
import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { randomBytes } from "crypto";

vi.mock("@/lib/api", () => ({
  applyRateLimit: vi.fn(),
  parseJsonBody: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseWithAuth: vi.fn(),
}));

vi.mock("crypto", () => ({
  randomBytes: vi.fn(),
}));

const mockedApplyRateLimit = vi.mocked(applyRateLimit);
const mockedParseJsonBody = vi.mocked(parseJsonBody);
const mockedGetSupabaseWithAuth = vi.mocked(getSupabaseWithAuth);
const mockedRandomBytes = vi.mocked(randomBytes);

function createRequest(body: unknown, authHeader?: string): Request {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (authHeader) {
    headers.set("authorization", authHeader);
  }

  return new Request("https://example.com/api/invites", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function createParsedBody(communityId?: string) {
  return {
    success: true as const,
    data: {
      community_id: communityId,
    },
  };
}

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe("POST /api/invites", () => {
  it("returns rate limit response when applyRateLimit blocks", async () => {
    const blocked = NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    mockedApplyRateLimit.mockReturnValue(blocked);

    const response = await POST(createRequest({}));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ error: "Rate limit exceeded" });
    expect(mockedParseJsonBody).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header is missing", async () => {
    mockedApplyRateLimit.mockReturnValue(null);
    mockedParseJsonBody.mockResolvedValue(createParsedBody());

    const response = await POST(createRequest({}));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Missing authorization" });
    expect(mockedGetSupabaseWithAuth).not.toHaveBeenCalled();
  });

  it("returns 503 when Supabase client is unavailable", async () => {
    mockedApplyRateLimit.mockReturnValue(null);
    mockedParseJsonBody.mockResolvedValue(createParsedBody());
    mockedGetSupabaseWithAuth.mockReturnValue(null);

    const response = await POST(createRequest({}, "Bearer token-123"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Service unavailable" });
  });

  it("returns 500 when invite insert fails", async () => {
    mockedApplyRateLimit.mockReturnValue(null);
    mockedParseJsonBody.mockResolvedValue(
      createParsedBody("dfd26f59-0ebf-4340-8855-a3764148694f")
    );
    mockedRandomBytes.mockReturnValue(Buffer.from("abc123def456", "utf8"));

    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "insert failed" },
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    mockedGetSupabaseWithAuth.mockReturnValue({
      auth: { getUser },
      from,
    } as never);

    const response = await POST(
      createRequest(
        { community_id: "dfd26f59-0ebf-4340-8855-a3764148694f" },
        "Bearer token-123"
      )
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to create invite" });
    expect(from).toHaveBeenCalledWith("invite_links");
    expect(insert).toHaveBeenCalledWith({
      code: "616263313233",
      community_id: "dfd26f59-0ebf-4340-8855-a3764148694f",
      created_by: "user-1",
      expires_at: expect.any(String),
    });
  });

  it("creates invite and returns link using configured site url", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";

    mockedApplyRateLimit.mockReturnValue(null);
    mockedParseJsonBody.mockResolvedValue(createParsedBody());
    mockedRandomBytes.mockReturnValue(Buffer.from("zzzzzzzzzzzz", "utf8"));

    const inviteRecord = {
      id: "invite-1",
      code: "7a7a7a7a7a7a",
      community_id: null,
      created_by: "user-2",
    };

    const single = vi.fn().mockResolvedValue({
      data: inviteRecord,
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-2" } },
      error: null,
    });

    mockedGetSupabaseWithAuth.mockReturnValue({
      auth: { getUser },
      from,
    } as never);

    const response = await POST(createRequest({}, "Bearer token-456"));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith({
      code: "7a7a7a7a7a7a",
      community_id: null,
      created_by: "user-2",
      expires_at: expect.any(String),
    });
    expect(payload).toEqual({
      invite: inviteRecord,
      url: "https://prism.example/invite/7a7a7a7a7a7a",
    });
  });
});
