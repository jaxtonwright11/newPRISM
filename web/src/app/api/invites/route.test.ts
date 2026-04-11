import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const applyRateLimitMock = vi.fn();
const parseJsonBodyMock = vi.fn();
const getSupabaseWithAuthMock = vi.fn();
const randomBytesMock = vi.fn();

vi.mock("@/lib/api", () => ({
  applyRateLimit: (...args: unknown[]) => applyRateLimitMock(...args),
  parseJsonBody: (...args: unknown[]) => parseJsonBodyMock(...args),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseWithAuth: (...args: unknown[]) => getSupabaseWithAuthMock(...args),
}));

vi.mock("crypto", () => ({
  randomBytes: (...args: unknown[]) => randomBytesMock(...args),
}));

import { POST } from "./route";

function createRequest(authorization?: string): Request {
  return new Request("https://example.com/api/invites", {
    method: "POST",
    headers: authorization ? { authorization } : undefined,
    body: JSON.stringify({}),
  });
}

describe("POST /api/invites", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    applyRateLimitMock.mockReturnValue(null);
    parseJsonBodyMock.mockResolvedValue({ success: true, data: {} });
    randomBytesMock.mockReturnValue(Buffer.from("001122334455", "hex"));
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("short-circuits when rate limit is exceeded", async () => {
    applyRateLimitMock.mockReturnValue(
      NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    );

    const response = await POST(createRequest("Bearer token-1"));

    expect(response.status).toBe(429);
    expect(parseJsonBodyMock).not.toHaveBeenCalled();
    expect(getSupabaseWithAuthMock).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header is missing", async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Missing authorization" });
    expect(getSupabaseWithAuthMock).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", async () => {
    const getUserMock = vi
      .fn()
      .mockResolvedValue({ data: { user: null }, error: new Error("invalid token") });

    getSupabaseWithAuthMock.mockReturnValue({
      auth: { getUser: getUserMock },
    });

    const response = await POST(createRequest("Bearer token-2"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid token" });
  });

  it("returns 500 when invite insert fails", async () => {
    const insertSingleMock = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error("db down") });
    const insertSelectMock = vi.fn(() => ({ single: insertSingleMock }));
    const insertMock = vi.fn(() => ({ select: insertSelectMock }));
    const fromMock = vi.fn(() => ({ insert: insertMock }));

    getSupabaseWithAuthMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
      },
      from: fromMock,
    });

    const response = await POST(createRequest("Bearer token-3"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to create invite" });
  });

  it("returns created invite URL using fallback site domain", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const insertSingleMock = vi.fn().mockResolvedValue({
      data: { id: "invite-123", code: "001122334455" },
      error: null,
    });
    const insertSelectMock = vi.fn(() => ({ single: insertSingleMock }));
    const insertMock = vi.fn(() => ({ select: insertSelectMock }));
    const fromMock = vi.fn(() => ({ insert: insertMock }));

    getSupabaseWithAuthMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-abc" } }, error: null }),
      },
      from: fromMock,
    });

    const response = await POST(createRequest("Bearer access-token"));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      invite: { id: "invite-123", code: "001122334455" },
      url: "https://web-liard-psi-12.vercel.app/invite/001122334455",
    });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        community_id: null,
        created_by: "user-abc",
        code: "001122334455",
      })
    );
  });
});
