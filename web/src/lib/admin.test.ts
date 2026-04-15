import { afterEach, describe, expect, it, vi } from "vitest";

type AdminUser = {
  id: string;
  email: string | null;
};

type GetUserResponse = {
  data: { user: AdminUser | null };
  error: { message: string } | null;
};

type AdminModuleSetup = {
  adminEmails?: string;
  adminUserIds?: string;
  getUserResponse?: GetUserResponse;
  supabaseAvailable?: boolean;
};

const originalAdminEmails = process.env.ADMIN_EMAILS;
const originalAdminUserIds = process.env.ADMIN_USER_IDS;

function createRequest(authHeader?: string): Request {
  const headers = authHeader ? { authorization: authHeader } : undefined;
  return new Request("https://example.com/api/admin/topics", { headers });
}

function restoreAdminEnv() {
  if (originalAdminEmails === undefined) {
    delete process.env.ADMIN_EMAILS;
  } else {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  }

  if (originalAdminUserIds === undefined) {
    delete process.env.ADMIN_USER_IDS;
  } else {
    process.env.ADMIN_USER_IDS = originalAdminUserIds;
  }
}

async function loadGetAdminUser(setup: AdminModuleSetup = {}) {
  process.env.ADMIN_EMAILS = setup.adminEmails ?? "";
  process.env.ADMIN_USER_IDS = setup.adminUserIds ?? "";

  const getUserResponse: GetUserResponse = setup.getUserResponse ?? {
    data: {
      user: { id: "user-1", email: "admin@example.com" },
    },
    error: null,
  };

  const getUser = vi.fn().mockResolvedValue(getUserResponse);
  const getSupabaseWithAuth = vi.fn().mockReturnValue(
    setup.supabaseAvailable === false ? null : { auth: { getUser } }
  );

  vi.resetModules();
  vi.doMock("./supabase", () => ({
    getSupabaseWithAuth,
  }));

  const { getAdminUser } = await import("./admin");
  return { getAdminUser, getSupabaseWithAuth, getUser };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.doUnmock("./supabase");
  vi.resetModules();
  restoreAdminEnv();
});

describe("getAdminUser", () => {
  it("returns null when no admin emails or IDs are configured", async () => {
    const { getAdminUser, getSupabaseWithAuth } = await loadGetAdminUser({
      adminEmails: "",
      adminUserIds: "",
    });

    const result = await getAdminUser(createRequest("Bearer user-token"));

    expect(result).toBeNull();
    expect(getSupabaseWithAuth).not.toHaveBeenCalled();
  });

  it("returns null when authorization header is missing", async () => {
    const { getAdminUser, getSupabaseWithAuth } = await loadGetAdminUser({
      adminEmails: "admin@example.com",
    });

    const result = await getAdminUser(createRequest());

    expect(result).toBeNull();
    expect(getSupabaseWithAuth).not.toHaveBeenCalled();
  });

  it("authenticates by admin email using bearer token", async () => {
    const { getAdminUser, getSupabaseWithAuth } = await loadGetAdminUser({
      adminEmails: "  admin@example.com , another@example.com ",
      getUserResponse: {
        data: {
          user: { id: "user-2", email: "ADMIN@EXAMPLE.COM" },
        },
        error: null,
      },
    });

    const result = await getAdminUser(createRequest("Bearer token-123"));

    expect(getSupabaseWithAuth).toHaveBeenCalledWith("token-123");
    expect(result).toEqual({
      id: "user-2",
      email: "ADMIN@EXAMPLE.COM",
    });
  });

  it("authenticates by admin user ID when email does not match", async () => {
    const { getAdminUser } = await loadGetAdminUser({
      adminEmails: "admin@example.com",
      adminUserIds: "  user-42, user-99 ",
      getUserResponse: {
        data: {
          user: { id: "user-42", email: "someone@example.com" },
        },
        error: null,
      },
    });

    const result = await getAdminUser(createRequest("Bearer token-xyz"));

    expect(result).toEqual({
      id: "user-42",
      email: "someone@example.com",
    });
  });

  it("returns null for non-admin users", async () => {
    const { getAdminUser, getUser } = await loadGetAdminUser({
      adminEmails: "admin@example.com",
      adminUserIds: "user-42",
      getUserResponse: {
        data: {
          user: { id: "user-10", email: "not-admin@example.com" },
        },
        error: null,
      },
    });

    const result = await getAdminUser(createRequest("Bearer token-456"));

    expect(result).toBeNull();
    expect(getUser).toHaveBeenCalledTimes(1);
  });
});
