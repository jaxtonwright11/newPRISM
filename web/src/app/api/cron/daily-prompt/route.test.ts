import { describe, expect, it } from "vitest";
import { buildDailyPromptPushTarget } from "./route";

describe("buildDailyPromptPushTarget", () => {
  it("deep-links active prompts with topic slugs to the comparison view", () => {
    expect(
      buildDailyPromptPushTarget({
        id: "prompt-1",
        topic: { title: "Local flooding", slug: "local-flooding" },
      })
    ).toEqual({
      topicName: "Local flooding",
      url: "/compare/local-flooding",
    });
  });

  it("handles Supabase relation arrays without losing the topic target", () => {
    expect(
      buildDailyPromptPushTarget({
        id: "prompt-1",
        topic: [{ title: "Transit funding", slug: "transit-funding" }],
      })
    ).toEqual({
      topicName: "Transit funding",
      url: "/compare/transit-funding",
    });
  });

  it("falls back to the feed when the prompt has no usable topic slug", () => {
    expect(
      buildDailyPromptPushTarget({
        id: "prompt-1",
        topic: { title: null, slug: null },
      })
    ).toEqual({
      topicName: "today's topic",
      url: "/feed",
    });
  });
});
