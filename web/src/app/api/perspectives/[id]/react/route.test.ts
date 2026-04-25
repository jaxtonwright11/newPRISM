import { describe, expect, it } from "vitest";
import { allowedReactionTypes } from "./route";

describe("perspective reaction contract", () => {
  it("accepts only the canonical PRISM reaction types", () => {
    expect([...allowedReactionTypes]).toEqual([
      "i_see_this",
      "i_didnt_know_this",
      "i_agree",
    ]);
  });
});
