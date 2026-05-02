import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminPromoteToLevel3, checkAutoPromotion } from "./verification";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type MockFn = ReturnType<typeof vi.fn>;

interface AutoPromotionOptions {
  user:
    | {
        verification_level: number;
        created_at: string;
      }
    | null;
  perspectiveCount?: number | null;
  updateError?: { message: string } | null;
}

interface AutoPromotionMocks {
  from: MockFn;
  perspectivesEq: MockFn;
  usersUpdateEq: MockFn;
  notificationsInsert: MockFn;
}

interface AdminPromotionOptions {
  userLevel: number | null;
  updateError?: { message: string } | null;
}

interface AdminPromotionMocks {
  from: MockFn;
  usersUpdateEq: MockFn;
  contributorsUpdate: MockFn;
  contributorsEqUser: MockFn;
  contributorsEqStatus: MockFn;
  notificationsInsert: MockFn;
}

function createAutoPromotionSupabase(
  options: AutoPromotionOptions,
): { supabase: SupabaseClient; mocks: AutoPromotionMocks } {
  const userSingle = vi.fn().mockResolvedValue({ data: options.user });
  const usersSelectEq = vi.fn().mockReturnValue({ single: userSingle });
  const usersSelect = vi.fn().mockReturnValue({ eq: usersSelectEq });

  const perspectivesEq = vi
    .fn()
    .mockResolvedValue({ count: options.perspectiveCount ?? null });
  const perspectivesSelect = vi.fn().mockReturnValue({ eq: perspectivesEq });

  const usersUpdateEq = vi
    .fn()
    .mockResolvedValue({ error: options.updateError ?? null });
  const usersUpdate = vi.fn().mockReturnValue({ eq: usersUpdateEq });

  const notificationsInsert = vi.fn().mockResolvedValue({ error: null });

  let usersCallCount = 0;
  const from = vi.fn((table: string): unknown => {
    if (table === "users") {
      usersCallCount += 1;
      return usersCallCount === 1 ? { select: usersSelect } : { update: usersUpdate };
    }
    if (table === "perspectives") {
      return { select: perspectivesSelect };
    }
    if (table === "notifications") {
      return { insert: notificationsInsert };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return {
    supabase: { from } as unknown as SupabaseClient,
    mocks: {
      from,
      perspectivesEq,
      usersUpdateEq,
      notificationsInsert,
    },
  };
}

function createAdminPromotionSupabase(
  options: AdminPromotionOptions,
): { supabase: SupabaseClient; mocks: AdminPromotionMocks } {
  const userRecord =
    options.userLevel === null
      ? null
      : {
          verification_level: options.userLevel,
        };

  const userSingle = vi.fn().mockResolvedValue({ data: userRecord });
  const usersSelectEq = vi.fn().mockReturnValue({ single: userSingle });
  const usersSelect = vi.fn().mockReturnValue({ eq: usersSelectEq });

  const usersUpdateEq = vi
    .fn()
    .mockResolvedValue({ error: options.updateError ?? null });
  const usersUpdate = vi.fn().mockReturnValue({ eq: usersUpdateEq });

  const contributorsEqStatus = vi.fn().mockResolvedValue({ error: null });
  const contributorsEqUser = vi.fn().mockReturnValue({ eq: contributorsEqStatus });
  const contributorsUpdate = vi.fn().mockReturnValue({ eq: contributorsEqUser });

  const notificationsInsert = vi.fn().mockResolvedValue({ error: null });

  let usersCallCount = 0;
  const from = vi.fn((table: string): unknown => {
    if (table === "users") {
      usersCallCount += 1;
      return usersCallCount === 1 ? { select: usersSelect } : { update: usersUpdate };
    }
    if (table === "contributors") {
      return { update: contributorsUpdate };
    }
    if (table === "notifications") {
      return { insert: notificationsInsert };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return {
    supabase: { from } as unknown as SupabaseClient,
    mocks: {
      from,
      usersUpdateEq,
      contributorsUpdate,
      contributorsEqUser,
      contributorsEqStatus,
      notificationsInsert,
    },
  };
}

describe("checkAutoPromotion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not promote when account age is under 30 days", async () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    const userId = "user-young";
    const { supabase, mocks } = createAutoPromotionSupabase({
      user: {
        verification_level: 1,
        created_at: new Date(now - THIRTY_DAYS_MS + 60_000).toISOString(),
      },
      perspectiveCount: 99,
    });

    const result = await checkAutoPromotion(supabase, userId);

    expect(result).toEqual({ promoted: false, newLevel: 1 });
    expect(mocks.perspectivesEq).not.toHaveBeenCalled();
    expect(mocks.usersUpdateEq).not.toHaveBeenCalled();
    expect(mocks.notificationsInsert).not.toHaveBeenCalled();
  });

  it("promotes eligible users and creates a promotion notification", async () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    const userId = "user-eligible";
    const { supabase, mocks } = createAutoPromotionSupabase({
      user: {
        verification_level: 1,
        created_at: new Date(now - THIRTY_DAYS_MS - 60_000).toISOString(),
      },
      perspectiveCount: 10,
    });

    const result = await checkAutoPromotion(supabase, userId);

    expect(result).toEqual({ promoted: true, newLevel: 2 });
    expect(mocks.perspectivesEq).toHaveBeenCalledWith("contributor_user_id", userId);
    expect(mocks.usersUpdateEq).toHaveBeenCalledWith("id", userId);
    expect(mocks.notificationsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        type: "verification_advance",
      }),
    );
  });
});

describe("adminPromoteToLevel3", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects promotion when user is below level 2", async () => {
    const userId = "user-level-1";
    const { supabase, mocks } = createAdminPromotionSupabase({
      userLevel: 1,
    });

    const result = await adminPromoteToLevel3(supabase, userId);

    expect(result).toEqual({
      success: false,
      error: "User must be Level 2 first",
    });
    expect(mocks.usersUpdateEq).not.toHaveBeenCalled();
    expect(mocks.contributorsUpdate).not.toHaveBeenCalled();
    expect(mocks.notificationsInsert).not.toHaveBeenCalled();
  });

  it("promotes level-2 users and updates contributor verification status", async () => {
    const userId = "user-level-2";
    const { supabase, mocks } = createAdminPromotionSupabase({
      userLevel: 2,
    });

    const result = await adminPromoteToLevel3(supabase, userId);

    expect(result).toEqual({ success: true });
    expect(mocks.usersUpdateEq).toHaveBeenCalledWith("id", userId);
    expect(mocks.contributorsUpdate).toHaveBeenCalledWith({
      verified: true,
      verification_status: "approved",
    });
    expect(mocks.contributorsEqUser).toHaveBeenCalledWith("user_id", userId);
    expect(mocks.contributorsEqStatus).toHaveBeenCalledWith(
      "verification_status",
      "pending",
    );
    expect(mocks.notificationsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        type: "verification_advance",
      }),
    );
  });
});
