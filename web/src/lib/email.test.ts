import { describe, expect, it } from "vitest";
import { buildDigestEmailPayload } from "./email";

describe("buildDigestEmailPayload", () => {
  it("escapes digest and comparison content before embedding HTML", () => {
    const payload = buildDigestEmailPayload(
      "Weekly <b>digest</b>\nline 2",
      "https://prism.example.com/",
      {
        topicTitle: "Topic \n<script>alert(1)</script>",
        topicSlug: "topic\"><script>alert(1)</script>",
        perspectives: [
          {
            quote: "Quote </p><a href=\"https://evil.example\">click me</a>",
            communityName: "<strong>Bad Community</strong>",
            color: "#123456;background:url(javascript:alert(1))",
          },
        ],
      },
    );

    expect(payload.subject).toContain("This week on PRISM:");
    expect(payload.subject).not.toContain("\n");
    expect(payload.subject).not.toContain("\r");

    expect(payload.html).toContain("Weekly &lt;b&gt;digest&lt;/b&gt;<br>line 2");
    expect(payload.html).toContain("Topic \n&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(payload.html).toContain("Quote &lt;/p&gt;&lt;a href=&quot;https://evil.example&quot;&gt;click me&lt;/a&gt;");
    expect(payload.html).toContain("&lt;strong&gt;Bad Community&lt;/strong&gt;");
    expect(payload.html).toContain("border-left: 3px solid #D4956B");
    expect(payload.html).not.toContain("<script>alert(1)</script>");
    expect(payload.html).toContain("/compare/topic%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E");
  });

  it("preserves valid colors and emits default subject without comparison", () => {
    const payload = buildDigestEmailPayload("Hello", "https://prism.example.com", {
      topicTitle: "My topic",
      topicSlug: "my-topic",
      perspectives: [
        {
          quote: "Perspective",
          communityName: "Community A",
          color: "#12ab9f",
        },
      ],
    });

    expect(payload.subject).toBe("This week on PRISM: My topic");
    expect(payload.html).toContain("border-left: 3px solid #12ab9f");

    const noComparisonPayload = buildDigestEmailPayload("Digest", "https://prism.example.com");
    expect(noComparisonPayload.subject).toBe("Your PRISM Weekly Digest");
  });
});
