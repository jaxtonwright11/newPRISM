import { describe, expect, it } from "vitest";
import { serializePushPayload } from "./send-push";

type SerializedPushPayload = {
  title: string;
  body: string;
  url: string;
  data: {
    url: string;
  };
};

describe("serializePushPayload", () => {
  it("copies the top-level URL into notification data for click handling", () => {
    const payload = JSON.parse(
      serializePushPayload({
        title: "New perspective",
        body: "Communities are posting now",
        url: "/compare/local-water-access",
      })
    ) as SerializedPushPayload;

    expect(payload.url).toBe("/compare/local-water-access");
    expect(payload.data.url).toBe("/compare/local-water-access");
  });

  it("falls back to the feed for missing or external URLs", () => {
    const missingUrl = JSON.parse(
      serializePushPayload({
        title: "PRISM",
        body: "Open PRISM",
      })
    ) as SerializedPushPayload;
    const externalUrl = JSON.parse(
      serializePushPayload({
        title: "PRISM",
        body: "Open PRISM",
        url: "https://example.com/phishing",
      })
    ) as SerializedPushPayload;

    expect(missingUrl.data.url).toBe("/feed");
    expect(externalUrl.url).toBe("/feed");
    expect(externalUrl.data.url).toBe("/feed");
  });
});
