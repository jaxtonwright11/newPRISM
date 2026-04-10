import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ADMIN_EMAILS = process.env.ADMIN_EMAILS;
const ORIGINAL_ADMIN_USER_IDS = process.env.ADMIN_USER_IDS;

function createRequest(token?: string): Request {
  const headers = token ? { authorization: `Bearer ${token}` } : undefined;
  return new Request("https://example.com/api/admin", { headers });
}

interface LoadAdminModuleOptions {
  adminEmails?: string;
  adminUserIds?: string;
  user?: { id: string; email?: string | null } | null;
  authError?: Error | null;
  returnSupabaseClient?: boolean;
}

async function loadAdminModule(options: LoadAdminModuleOptions = {}) {
  process.env.ADMIN_EMAILS = options.adminEmails ?? "";
  process.env.ADMIN_USER_IDS = options.adminUserIds ?? "";

  const getUser = vi.fn().mockResolvedValue({
    data: { user: options.user ?? null },
    error: options.authError ?? null,
  });

  const getSupabaseWithAuth = vi.fn(() =>
    options.returnSupabaseClient === false
      ? null
      : {
          auth: { getUser },
        }
  );

  vi.doMock("./supabase", () => ({
    getSupabaseWithAuth,
  }));

  const module = await import("./admin");

  return {
    getAdminUser: module.getAdminUser,
    getSupabaseWithAuth,
    getUser,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("./supabase");

  process.env.ADMIN_EMAILS = ORIGINAL_ADMIN_EMAILS;
  process.env.ADMIN_USER_IDS = ORIGINAL_ADMIN_USER_IDS;
});

describe("getAdminUser", () => {
  it("returns null when no admin allowlist is configured", async () => {
    const { getAdminUser, getSupabaseWithAuth } = await loadAdminModule({
      adminEmails: "",
      adminUserIds: "",
    });

    const user = await getAdminUser(createRequest("token"));

    expect(user).toBeNull();
    expect(getSupabaseWithAuth).not.toHaveBeenCalled();
  });

  it("returns null when authorization header is missing", async () => {
    const { getAdminUser, getSupabaseWithAuth } = await loadAdminModule({
      adminEmails: "admin@example.com",
    });

    const user = await getAdminUser(createRequest());

    expect(user).toBeNull();
    expect(getSupabaseWithAuth).not.toHaveBeenCalled();
  });

  it("authorizes admins via email allowlist with case-insensitive matching", async () => {
    const adminUser = {
      id: "user-1",
      email: "Admin@Example.com",
    };
    const { getAdminUser, getSupabaseWithAuth, getUser } = await loadAdminModule({
      adminEmails: " team@example.com, admin@example.com ",
      user: adminUser,
    });

    const user = await getAdminUser(createRequest("valid-token"));

    expect(getSupabaseWithAuth).toHaveBeenCalledWith("valid-token");
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(user).toEqual(adminUser);
  });

  it("authorizes admins via user ID allowlist", async () => {
    const adminUser = {
      id: "admin-user-id",
      email: "not-on-email-list@example.com",
    };
    const { getAdminUser } = await loadAdminModule({
      adminEmails: "someone-else@example.com",
      adminUserIds: "admin-user-id",
      user: adminUser,
    });

    const user = await getAdminUser(createRequest("token"));

    expect(user).toEqual(adminUser);
  });

  it("rejects non-admin users", async () => {
    const { getAdminUser } = await loadAdminModule({
      adminEmails: "admin@example.com",
      adminUserIds: "admin-id",
      user: {
        id: "random-user-id",
        email: "random-user@example.com",
      },
    });

    const user = await getAdminUser(createRequest("token"));

    expect(user).toBeNull();
  });

  it("rejects requests when auth lookup fails", async () => {
    const { getAdminUser } = await loadAdminModule({
      adminEmails: "admin@example.com",
      authError: new Error("auth failed"),
    });

    const user = await getAdminUser(createRequest("token"));

    expect(user).toBeNull();
  });
});
