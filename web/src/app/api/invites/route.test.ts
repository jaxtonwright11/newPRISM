import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/api", () => ({
  applyRateLimit: vi.fn(),
  parseJsonBody: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseWithAuth: vi.fn(),
}));

import { applyRateLimit, parseJsonBody } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";
import { POST } from "./route";

type InviteRecord = {
  id: string;
  code: string;
  created_by: string;
  community_id: string | null;
  expires_at: string;
};

type InsertPayload = {
  community_id: string | null;
  created_by: string;
  code: string;
  expires_at: string;
};

type InsertResult = {
  data: InviteRecord | null;
  error: unknown;
};

type MockedSupabase = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  from: (table: string) => {
    insert: (payload: InsertPayload) => {
      select: () => {
        single: () => Promise<InsertResult>;
      };
    };
  };
};

function createRequest({
  authorization,
}: {
  authorization?: string;
} = {}): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (authorization) {
    headers.set("authorization", authorization);
  }

  return new Request("https://example.com/api/invites", {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
}

function createSupabaseMock(options?: {
  userId?: string | null;
  authError?: unknown;
  insertResult?: InsertResult;
  onInsert?: (payload: InsertPayload) => void;
}): MockedSupabase {
  const userId = options?.userId === undefined ? "user-1" : options.userId;
  const authError = options?.authError ?? null;
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: userId ? { id: userId } : null,
        },
        error: authError,
      }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockImplementation((payload: InsertPayload) => {
        options?.onInsert?.(payload);
        const insertResult = options?.insertResult ?? {
          data: {
            id: "invite-1",
            code: payload.code,
            created_by: payload.created_by,
            community_id: payload.community_id,
            expires_at: payload.expires_at,
          },
          error: null,
        };

        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(insertResult),
          }),
        };
      }),
    }),
  };
}

describe("POST /api/invites", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(applyRateLimit).mockReturnValue(null);
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: {},
    });
  });

  it("short-circuits when rate limited", async () => {
    vi.mocked(applyRateLimit).mockReturnValue(
      NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    );

    const response = await POST(createRequest());

    expect(response.status).toBe(429);
    expect(vi.mocked(parseJsonBody)).not.toHaveBeenCalled();
    expect(vi.mocked(getSupabaseWithAuth)).not.toHaveBeenCalled();
  });

  it("returns parseJsonBody validation response on invalid payload", async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: false,
      response: NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      ),
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
    });
    expect(vi.mocked(getSupabaseWithAuth)).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header is missing", async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Missing authorization",
    });
    expect(vi.mocked(getSupabaseWithAuth)).not.toHaveBeenCalled();
  });

  it("returns 503 when authenticated Supabase client is unavailable", async () => {
    vi.mocked(getSupabaseWithAuth).mockReturnValue(null);

    const response = await POST(
      createRequest({ authorization: "Bearer token-1" })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Service unavailable",
    });
  });

  it("returns 401 when token authentication fails", async () => {
    vi.mocked(getSupabaseWithAuth).mockReturnValue(
      createSupabaseMock({
        userId: null,
        authError: new Error("invalid token"),
      }) as unknown as ReturnType<typeof getSupabaseWithAuth>
    );

    const response = await POST(
      createRequest({ authorization: "Bearer bad-token" })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid token",
    });
  });

  it("returns 500 when invite creation insert fails", async () => {
    vi.mocked(getSupabaseWithAuth).mockReturnValue(
      createSupabaseMock({
        insertResult: {
          data: null,
          error: { message: "db insert failed" },
        },
      }) as unknown as ReturnType<typeof getSupabaseWithAuth>
    );

    const response = await POST(
      createRequest({ authorization: "Bearer good-token" })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to create invite",
    });
  });

  it("creates invite with computed expiry and returns invite URL", async () => {
    const fixedNow = 1_700_000_000_000;
    const expectedExpiresAt = new Date(
      fixedNow + 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const communityId = "196f8f26-3f96-4dd1-ae34-e5c64e2c7b34";
    let capturedInsert: InsertPayload | null = null;

    vi.spyOn(Date, "now").mockReturnValue(fixedNow);
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: { community_id: communityId },
    });
    vi.mocked(getSupabaseWithAuth).mockReturnValue(
      createSupabaseMock({
        userId: "user-7",
        onInsert: (payload) => {
          capturedInsert = payload;
        },
      }) as unknown as ReturnType<typeof getSupabaseWithAuth>
    );

    const siteUrlPrevious = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.test";

    const response = await POST(
      createRequest({ authorization: "Bearer valid-token" })
    );

    if (siteUrlPrevious === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = siteUrlPrevious;
    }

    expect(response.status).toBe(201);
    const payload = await response.json();

    expect(payload).toMatchObject({
      invite: {
        created_by: "user-7",
        community_id: communityId,
        expires_at: expectedExpiresAt,
      },
    });
    expect(typeof payload.invite.id).toBe("string");
    expect(typeof payload.invite.code).toBe("string");
    expect(payload.invite.code).toMatch(/^[a-f0-9]{12}$/);
    expect(payload.url).toBe(`https://prism.test/invite/${payload.invite.code}`);

    expect(capturedInsert).toEqual({
      community_id: communityId,
      created_by: "user-7",
      code: payload.invite.code,
      expires_at: expectedExpiresAt,
    });
  });
});
