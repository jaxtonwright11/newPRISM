import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const { mockApplyRateLimit, mockGetSupabaseWithAuth } = vi.hoisted(() => ({
  mockApplyRateLimit: vi.fn(),
  mockGetSupabaseWithAuth: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    applyRateLimit: mockApplyRateLimit,
  };
});

vi.mock("@/lib/supabase", () => ({
  getSupabaseWithAuth: mockGetSupabaseWithAuth,
}));

import { POST } from "./route";

type InviteInsertPayload = {
  community_id: string | null;
  created_by: string;
  code: string;
  expires_at: string;
};

function createRequest(body: unknown, headers: HeadersInit = {}): Request {
  return new Request("https://example.com/api/invites", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function createSupabaseSuccessClient(userId: string) {
  let insertedPayload: InviteInsertPayload | null = null;

  const single = vi.fn(async () => ({
    data: insertedPayload ? { id: "invite-1", ...insertedPayload } : null,
    error: null,
  }));
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn((payload: InviteInsertPayload) => {
    insertedPayload = payload;
    return { select };
  });
  const from = vi.fn(() => ({ insert }));
  const getUser = vi.fn(async () => ({
    data: {
      user: { id: userId },
    },
    error: null,
  }));

  return {
    client: {
      auth: { getUser },
      from,
    },
    from,
    getInsertedPayload: () => insertedPayload,
  };
}

function createSupabaseInsertErrorClient(userId: string) {
  const single = vi.fn(async () => ({
    data: null,
    error: { message: "insert failed" },
  }));
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ insert }));
  const getUser = vi.fn(async () => ({
    data: {
      user: { id: userId },
    },
    error: null,
  }));

  return {
    auth: { getUser },
    from,
  };
}

describe("POST /api/invites", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApplyRateLimit.mockReturnValue(null);
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("returns a rate-limit response before executing invite logic", async () => {
    mockApplyRateLimit.mockReturnValue(
      NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    );

    const response = await POST(createRequest({}));

    expect(response.status).toBe(429);
    expect(mockGetSupabaseWithAuth).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header is missing", async () => {
    const response = await POST(createRequest({}));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Missing authorization",
    });
    expect(mockGetSupabaseWithAuth).not.toHaveBeenCalled();
  });

  it("returns 401 when the auth token is invalid", async () => {
    mockGetSupabaseWithAuth.mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: null },
          error: { message: "invalid token" },
        })),
      },
      from: vi.fn(),
    });

    const response = await POST(
      createRequest({}, { authorization: "Bearer invalid-token" })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid token",
    });
  });

  it("returns 503 when Supabase environment is unavailable", async () => {
    mockGetSupabaseWithAuth.mockReturnValue(null);

    const response = await POST(
      createRequest({}, { authorization: "Bearer valid-token" })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Service unavailable",
    });
  });

  it("returns 500 when invite persistence fails", async () => {
    const supabaseClient = createSupabaseInsertErrorClient("user-123");
    mockGetSupabaseWithAuth.mockReturnValue(supabaseClient);

    const response = await POST(
      createRequest({}, { authorization: "Bearer valid-token" })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to create invite",
    });
    expect(supabaseClient.from).toHaveBeenCalledWith("invite_links");
  });

  it("creates invite links with null community fallback and stable URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.test";

    const supabaseSuccess = createSupabaseSuccessClient("user-abc");
    mockGetSupabaseWithAuth.mockReturnValue(supabaseSuccess.client);
    const beforeRequestMs = Date.now();

    const response = await POST(
      createRequest({}, { authorization: "Bearer valid-token" })
    );
    const payload = await response.json();
    const insertedPayload = supabaseSuccess.getInsertedPayload();

    expect(response.status).toBe(201);
    expect(insertedPayload).not.toBeNull();
    expect(insertedPayload).toMatchObject({
      community_id: null,
      created_by: "user-abc",
    });
    expect(insertedPayload?.code).toMatch(/^[0-9a-f]{12}$/);
    expect(payload.url).toBe(`https://prism.test/invite/${insertedPayload?.code}`);

    const expiresAtMs = Date.parse(String(insertedPayload?.expires_at));
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(Number.isNaN(expiresAtMs)).toBe(false);
    expect(expiresAtMs).toBeGreaterThanOrEqual(beforeRequestMs + thirtyDaysMs);
    expect(expiresAtMs).toBeLessThanOrEqual(Date.now() + thirtyDaysMs + 5_000);
  });
});
