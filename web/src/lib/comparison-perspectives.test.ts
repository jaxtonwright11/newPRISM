import { describe, expect, it } from "vitest";
import { unwrapComparisonPerspectiveResponse } from "./comparison-perspectives";

const perspective = {
  id: "77f47d97-8f6b-48fb-8f6f-968f86bb4b6e",
  quote: "This changed how our neighborhood understands the issue.",
  topic: { title: "Housing costs" },
  community: {
    name: "South Austin renters",
    region: "Austin, TX",
    community_type: "civic",
    color_hex: "#7c3aed",
  },
};

describe("unwrapComparisonPerspectiveResponse", () => {
  it("unwraps the current perspective API response shape", () => {
    expect(unwrapComparisonPerspectiveResponse({ data: perspective })).toEqual(
      perspective
    );
  });

  it("keeps legacy perspective and flat payload shapes working", () => {
    expect(
      unwrapComparisonPerspectiveResponse({ perspective })
    ).toMatchObject({
      id: perspective.id,
      community: perspective.community,
    });
    expect(unwrapComparisonPerspectiveResponse(perspective)).toMatchObject({
      id: perspective.id,
      community: perspective.community,
    });
  });

  it("rejects error envelopes instead of sending them to the renderer", () => {
    expect(
      unwrapComparisonPerspectiveResponse({ error: "Perspective not found" })
    ).toBeNull();
  });
});
