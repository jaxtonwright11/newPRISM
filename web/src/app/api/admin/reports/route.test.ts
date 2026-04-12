import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { applyRateLimitMock, getAdminUserMock, getSupabaseServerMock } = vi.hoisted(() => ({
  applyRateLimitMock: vi.fn(),
  getAdminUserMock: vi.fn(),
  getSupabaseServerMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  applyRateLimit: applyRateLimitMock,
}));

vi.mock("@/lib/admin", () => ({
  getAdminUser: getAdminUserMock,
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: getSupabaseServerMock,
}));

import { GET, PATCH } from "./route";

function createRequest(
  url: string,
  method: "GET" | "PATCH",
  body?: unknown
): NextRequest {
  return new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("/api/admin/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applyRateLimitMock.mockReturnValue(null);
  });

  it("GET returns 403 for non-admin callers", async () => {
    getAdminUserMock.mockResolvedValue(null);

    const response = await GET(
      createRequest("https://example.com/api/admin/reports", "GET")
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getSupabaseServerMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 for invalid status payload", async () => {
    getAdminUserMock.mockResolvedValue({ id: "admin-id" });

    const response = await PATCH(
      createRequest("https://example.com/api/admin/reports", "PATCH", {
        id: "2f18e867-26c0-43c7-bd8e-dbc784d1ef73",
        status: "pending",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid request",
    });
    expect(getSupabaseServerMock).not.toHaveBeenCalled();
  });

  it("PATCH updates report status for valid admin request", async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    const fromMock = vi.fn().mockReturnValue({ update: updateMock });

    getAdminUserMock.mockResolvedValue({ id: "admin-id" });
    getSupabaseServerMock.mockReturnValue({
      from: fromMock,
    });

    const response = await PATCH(
      createRequest("https://example.com/api/admin/reports", "PATCH", {
        id: "4bf1bf5e-bce9-4f4d-82b1-8f7506da0f1b",
        status: "resolved",
      })
    );

    expect(fromMock).toHaveBeenCalledWith("reports");
    expect(updateMock).toHaveBeenCalledWith({ status: "resolved" });
    expect(eqMock).toHaveBeenCalledWith(
      "id",
      "4bf1bf5e-bce9-4f4d-82b1-8f7506da0f1b"
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Report updated",
    });
  });
});
