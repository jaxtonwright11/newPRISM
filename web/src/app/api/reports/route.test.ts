import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { applyRateLimitMock, getSupabaseWithAuthMock } = vi.hoisted(() => ({
  applyRateLimitMock: vi.fn(),
  getSupabaseWithAuthMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  applyRateLimit: applyRateLimitMock,
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseWithAuth: getSupabaseWithAuthMock,
}));

import { POST } from "./route";

function createRequest(body: unknown, authorization?: string): NextRequest {
  const headers = new Headers();
  if (authorization) {
    headers.set("authorization", authorization);
  }

  return new Request("https://example.com/api/reports", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("POST /api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applyRateLimitMock.mockReturnValue(null);
  });

  it("returns 401 when bearer token is missing", async () => {
    const response = await POST(createRequest({}));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getSupabaseWithAuthMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid payload and skips insert", async () => {
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: "a331137a-d3b0-4700-95c4-ec7d53a08c4f" } },
      error: null,
    });
    const fromMock = vi.fn();

    getSupabaseWithAuthMock.mockReturnValue({
      auth: { getUser: getUserMock },
      from: fromMock,
    });

    const response = await POST(
      createRequest(
        {
          target_type: "perspective",
          target_id: "not-a-uuid",
          reason: "spam",
        },
        "Bearer user-token"
      )
    );

    expect(response.status).toBe(400);
    expect(fromMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid request",
    });
  });

  it("inserts a pending report for valid request payload", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: "5a881e1f-5f77-496b-9ec1-2e8fdbf6f684" } },
      error: null,
    });

    getSupabaseWithAuthMock.mockReturnValue({
      auth: { getUser: getUserMock },
      from: fromMock,
    });

    const response = await POST(
      createRequest(
        {
          target_type: "post",
          target_id: "ceea6cee-8f01-4f3b-9911-96e26e7e4048",
          reason: "misinformation",
          details: "Contains fabricated claims.",
        },
        "Bearer user-token"
      )
    );

    expect(response.status).toBe(201);
    expect(getSupabaseWithAuthMock).toHaveBeenCalledWith("user-token");
    expect(fromMock).toHaveBeenCalledWith("reports");
    expect(insertMock).toHaveBeenCalledWith({
      reporter_id: "5a881e1f-5f77-496b-9ec1-2e8fdbf6f684",
      target_type: "post",
      target_id: "ceea6cee-8f01-4f3b-9911-96e26e7e4048",
      reason: "misinformation",
      details: "Contains fabricated claims.",
      status: "pending",
    });
    await expect(response.json()).resolves.toEqual({
      message: "Report submitted",
    });
  });
});
