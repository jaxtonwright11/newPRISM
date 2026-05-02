import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSupabaseWithAuthMock } = vi.hoisted(() => ({
  getSupabaseWithAuthMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseWithAuth: getSupabaseWithAuthMock,
}));

type InsertPayload = {
  user_id: string;
  content: string;
  topic_id: string | null;
  community_id: string | null;
  post_type: "permanent" | "story";
  radius_miles: 10 | 20 | 30 | 40;
  latitude: number | null;
  longitude: number | null;
  expires_at?: string;
};

function createPostRequest(
  body: unknown,
  headers: HeadersInit = { authorization: "Bearer valid-token" }
): Request {
  return new Request("https://example.com/api/posts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function createSupabaseMock(profile: {
  home_community_id: string | null;
  home_community:
    | { latitude: number | null; longitude: number | null }
    | { latitude: number | null; longitude: number | null }[]
    | null;
}) {
  const insertMock = vi.fn((payload: InsertPayload) => ({
    select: () => ({
      single: async () => ({
        data: { id: "post-1", ...payload },
        error: null,
      }),
    }),
  }));

  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "user-1" } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: profile }),
            }),
          }),
        };
      }

      if (table === "posts") {
        return {
          insert: insertMock,
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return { supabase, insertMock };
}

describe("POST /api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("enriches story posts from the user's home community and sets a 24 hour expiry", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-05-02T10:00:00.000Z"));

    const { supabase, insertMock } = createSupabaseMock({
      home_community_id: "11111111-1111-4111-8111-111111111111",
      home_community: [{ latitude: 38.9072, longitude: -77.0369 }],
    });
    getSupabaseWithAuthMock.mockReturnValue(supabase);

    const { POST } = await import("./route");
    const response = await POST(
      createPostRequest({
        content: "  A grounded local observation  ",
        post_type: "story",
        radius_miles: 20,
      })
    );

    expect(response.status).toBe(201);
    expect(insertMock).toHaveBeenCalledWith({
      user_id: "user-1",
      content: "A grounded local observation",
      topic_id: null,
      community_id: "11111111-1111-4111-8111-111111111111",
      post_type: "story",
      radius_miles: 20,
      latitude: 38.9072,
      longitude: -77.0369,
      expires_at: "2026-05-03T10:00:00.000Z",
    });
  });

  it("rejects unsupported radius values before touching Supabase", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      createPostRequest({
        content: "Local update",
        radius_miles: 25,
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid request body",
      issues: expect.arrayContaining([
        expect.objectContaining({
          path: "radius_miles",
        }),
      ]),
    });
    expect(getSupabaseWithAuthMock).not.toHaveBeenCalled();
  });
});
