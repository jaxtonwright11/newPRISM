import { describe, expect, it } from "vitest";
import { unwrapPerspectiveResponse } from "./compare-responses";

interface TestPerspective {
  id: string;
  quote: string;
}

describe("unwrapPerspectiveResponse", () => {
  it("unwraps the current perspective API data envelope", () => {
    const perspective = { id: "p1", quote: "A community quote" };

    expect(unwrapPerspectiveResponse<TestPerspective>({ data: perspective })).toEqual(perspective);
  });

  it("keeps compatibility with the legacy perspective envelope", () => {
    const perspective = { id: "p2", quote: "Another quote" };

    expect(unwrapPerspectiveResponse<TestPerspective>({ perspective })).toEqual(perspective);
  });

  it("rejects error envelopes and invalid payloads", () => {
    expect(unwrapPerspectiveResponse<TestPerspective>({ error: "Not found" })).toBeNull();
    expect(unwrapPerspectiveResponse<TestPerspective>(null)).toBeNull();
  });
});
