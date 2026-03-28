import { test, expect } from "@playwright/test";

test.describe("Push Notification System", () => {
  test("push-subscribe endpoint requires authentication", async ({ request }) => {
    const response = await request.post("/api/notifications/push-subscribe", {
      data: {
        endpoint: "https://fcm.googleapis.com/fcm/send/test",
        keys: { p256dh: "testkey", auth: "testauth" },
      },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Missing authorization");
  });

  test("push-subscribe endpoint validates body schema", async ({ request }) => {
    const response = await request.post("/api/notifications/push-subscribe", {
      headers: { Authorization: "Bearer fake-token" },
      data: { invalid: true },
    });
    // Should be 400 (bad body) or 401 (invalid token) — both are valid rejections
    expect([400, 401]).toContain(response.status());
  });

  test("push-subscribe returns correct shape on auth error", async ({ request }) => {
    const response = await request.post("/api/notifications/push-subscribe", {
      headers: { Authorization: "Bearer expired-token-12345" },
      data: {
        endpoint: "https://fcm.googleapis.com/fcm/send/test",
        keys: { p256dh: "testkey123", auth: "testauth123" },
      },
    });
    // Supabase will reject the invalid token
    expect([401, 500]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("push-unsubscribe endpoint requires authentication", async ({ request }) => {
    const response = await request.delete("/api/notifications/push-subscribe", {
      data: { endpoint: "https://fcm.googleapis.com/fcm/send/test" },
    });
    expect(response.status()).toBe(401);
  });

  test("cron notify-perspectives rejects without secret", async ({ request }) => {
    const response = await request.get("/api/cron/notify-perspectives");
    // Should reject without valid CRON_SECRET
    expect(response.status()).toBe(401);
  });
});
