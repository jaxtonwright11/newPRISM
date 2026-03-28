import { test, expect } from "@playwright/test";

test.describe("n8n Webhook Endpoints", () => {
  test("new-topic rejects missing webhook_secret", async ({ request }) => {
    const response = await request.post("/api/webhooks/n8n/new-topic", {
      data: { title: "Test Topic", description: "Test" },
    });
    expect(response.status()).toBe(400);
  });

  test("new-topic rejects wrong webhook_secret", async ({ request }) => {
    const response = await request.post("/api/webhooks/n8n/new-topic", {
      data: {
        title: "Test Topic",
        description: "Test",
        webhook_secret: "wrong-secret",
      },
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Invalid webhook secret");
  });

  test("digest rejects wrong webhook_secret", async ({ request }) => {
    const response = await request.post("/api/webhooks/n8n/digest", {
      data: { webhook_secret: "wrong-secret" },
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Invalid webhook secret");
  });

  test("community-alert rejects wrong webhook_secret", async ({ request }) => {
    const response = await request.post("/api/webhooks/n8n/community-alert", {
      data: {
        community_id: "00000000-0000-0000-0000-000000000000",
        milestone: "Test milestone",
        webhook_secret: "wrong-secret",
      },
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Invalid webhook secret");
  });

  test("community-alert validates body schema", async ({ request }) => {
    const response = await request.post("/api/webhooks/n8n/community-alert", {
      data: { invalid: true },
    });
    expect(response.status()).toBe(400);
  });

  test("new-topic validates body schema", async ({ request }) => {
    const response = await request.post("/api/webhooks/n8n/new-topic", {
      data: { webhook_secret: "test" },
    });
    expect(response.status()).toBe(400);
  });
});
