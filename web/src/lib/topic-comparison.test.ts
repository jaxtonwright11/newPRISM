import { describe, expect, it } from "vitest";
import {
  buildTopicComparisonDescription,
  getUniqueCommunityCount,
  hasTopicComparison,
} from "./topic-comparison";

describe("hasTopicComparison", () => {
  it("returns false when fewer than two perspectives exist", () => {
    expect(hasTopicComparison(0)).toBe(false);
    expect(hasTopicComparison(1)).toBe(false);
  });

  it("returns true when at least two perspectives exist", () => {
    expect(hasTopicComparison(2)).toBe(true);
    expect(hasTopicComparison(5)).toBe(true);
  });
});

describe("getUniqueCommunityCount", () => {
  it("counts unique community names across perspectives", () => {
    const count = getUniqueCommunityCount([
      { community: { name: "Northside" } },
      { community: { name: "Northside" } },
      { community: { name: "West Valley" } },
      { community: { name: "River District" } },
    ]);

    expect(count).toBe(3);
  });
});

describe("buildTopicComparisonDescription", () => {
  it("builds comparison copy from the first three communities when comparison is available", () => {
    const description = buildTopicComparisonDescription({
      topicTitle: "City transit funding",
      topicSummary: "Summary should not be used for comparisons",
      perspectives: [
        { community: { name: "Northside" } },
        { community: { name: "West Valley" } },
        { community: { name: "River District" } },
        { community: { name: "Coastal Hills" } },
      ],
    });

    expect(description).toBe(
      'See how Northside, West Valley, River District experience "City transit funding" — same topic, completely different worlds.'
    );
  });

  it("uses topic summary for non-comparison topics when available", () => {
    const description = buildTopicComparisonDescription({
      topicTitle: "Community gardens",
      topicSummary: "Residents are discussing access to shared green space.",
      perspectives: [{ community: { name: "Northside" } }],
    });

    expect(description).toBe(
      "Residents are discussing access to shared green space."
    );
  });

  it("falls back to default copy when non-comparison topic has no summary", () => {
    const description = buildTopicComparisonDescription({
      topicTitle: "Community gardens",
      topicSummary: null,
      perspectives: [],
    });

    expect(description).toBe("Perspectives on Community gardens");
  });
});
