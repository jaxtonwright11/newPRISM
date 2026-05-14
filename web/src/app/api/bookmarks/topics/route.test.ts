import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getSupabaseWithAuthMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  getSupabaseWithAuth: getSupabaseWithAuthMock,
}));

import { DELETE, POST } from "./route";

const topicId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";

function createRequest(method: string, body?: unknown, token = "token") {
  return new NextRequest("https://example.com/api/bookmarks/topics", {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-forwarded-for": `${method}-ip`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function createAuthenticatedSupabase(from: ReturnType<typeof vi.fn>) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      }),
    },
    from,
  };
}

describe("/api/bookmarks/topics", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("saves a topic bookmark for the authenticated user", async () => {
    const existingQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
    };
    existingQuery.select.mockReturnValue(existingQuery);
    existingQuery.eq.mockReturnValue(existingQuery);
    existingQuery.limit.mockResolvedValue({ data: [], error: null });

    const insertQuery = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    insertQuery.insert.mockReturnValue(insertQuery);
    insertQuery.select.mockReturnValue(insertQuery);
    insertQuery.single.mockResolvedValue({
      data: { id: "bookmark-id", topic_id: topicId },
      error: null,
    });

    const from = vi.fn().mockReturnValueOnce(existingQuery).mockReturnValueOnce(insertQuery);
    getSupabaseWithAuthMock.mockReturnValue(createAuthenticatedSupabase(from));

    const response = await POST(createRequest("POST", { topic_id: topicId }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { id: "bookmark-id", topic_id: topicId },
    });
    expect(insertQuery.insert).toHaveBeenCalledWith({
      user_id: userId,
      topic_id: topicId,
    });
  });

  it("does not insert a duplicate when the topic is already bookmarked", async () => {
    const existingQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
    };
    existingQuery.select.mockReturnValue(existingQuery);
    existingQuery.eq.mockReturnValue(existingQuery);
    existingQuery.limit.mockResolvedValue({
      data: [{ id: "existing-bookmark-id", topic_id: topicId }],
      error: null,
    });

    const from = vi.fn().mockReturnValue(existingQuery);
    getSupabaseWithAuthMock.mockReturnValue(createAuthenticatedSupabase(from));

    const response = await POST(createRequest("POST", { topic_id: topicId }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { id: "existing-bookmark-id", topic_id: topicId },
    });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("removes topic bookmarks for only the authenticated user", async () => {
    const deleteQuery = {
      delete: vi.fn(),
      eq: vi.fn(),
    };
    deleteQuery.delete.mockReturnValue(deleteQuery);
    deleteQuery.eq.mockReturnValueOnce(deleteQuery).mockResolvedValueOnce({ error: null });

    const from = vi.fn().mockReturnValue(deleteQuery);
    getSupabaseWithAuthMock.mockReturnValue(createAuthenticatedSupabase(from));

    const response = await DELETE(createRequest("DELETE", { topic_id: topicId }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(deleteQuery.eq).toHaveBeenNthCalledWith(1, "user_id", userId);
    expect(deleteQuery.eq).toHaveBeenNthCalledWith(2, "topic_id", topicId);
  });

  it("rejects invalid topic ids before opening a Supabase client", async () => {
    const response = await POST(createRequest("POST", { topic_id: "not-a-uuid" }));

    expect(response.status).toBe(400);
    expect(getSupabaseWithAuthMock).not.toHaveBeenCalled();
  });
});
