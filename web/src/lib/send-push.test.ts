import { afterEach, describe, expect, it } from "vitest";
import { buildWebPushPayload } from "./send-push";

describe("buildWebPushPayload", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("copies the click URL into notification data for service worker navigation", () => {
    const payload = buildWebPushPayload({
      title: "New perspective",
      body: "A community shared a perspective",
      url: "/compare/climate-response",
      icon: "/icons/icon-192.svg",
    });

    expect(payload.url).toBe("/compare/climate-response");
    expect(payload.data.url).toBe("/compare/climate-response");
  });

  it("preserves existing data while normalizing top-level URL precedence", () => {
    const payload = buildWebPushPayload({
      title: "Community milestone",
      body: "Something changed",
      url: "/community/abc",
      data: { url: "/feed", community_id: "abc" },
    });

    expect(payload.data).toEqual({
      url: "/community/abc",
      community_id: "abc",
    });
  });

  it("accepts same-origin absolute URLs as paths", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";

    const payload = buildWebPushPayload({
      title: "Prompt live",
      body: "Communities are posting",
      url: "https://prism.example/compare/daily-prompt?from=push#top",
    });

    expect(payload.data.url).toBe("/compare/daily-prompt?from=push#top");
  });

  it("falls back to feed for unsafe or external URLs", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";

    const unsafeUrls = [
      "https://evil.example/phish",
      "//evil.example/phish",
      "javascript:alert(1)",
      "",
    ];

    for (const url of unsafeUrls) {
      const payload = buildWebPushPayload({
        title: "Unsafe",
        body: "Unsafe URL",
        url,
      });

      expect(payload.data.url).toBe("/feed");
      expect(payload.url).toBe("/feed");
    }
  });
});
