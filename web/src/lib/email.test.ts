import { describe, expect, it } from "vitest";
import {
  buildDigestEmailHtml,
  buildDigestEmailSubject,
  escapeHtml,
  sanitizeEmailSubject,
} from "./email";

describe("escapeHtml", () => {
  it("escapes markup-sensitive characters", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;",
    );
  });
});

describe("sanitizeEmailSubject", () => {
  it("removes line breaks from subject text", () => {
    expect(sanitizeEmailSubject("Weekly\r\nBcc: attacker@example.com")).toBe(
      "Weekly Bcc: attacker@example.com",
    );
  });
});

describe("buildDigestEmailSubject", () => {
  it("sanitizes comparison titles used in subjects", () => {
    expect(
      buildDigestEmailSubject({
        topicTitle: "Topic\r\nBcc: attacker@example.com",
        topicSlug: "topic",
        perspectives: [],
      }),
    ).toBe("This week on PRISM: Topic Bcc: attacker@example.com");
  });
});

describe("buildDigestEmailHtml", () => {
  it("escapes digest and comparison content before embedding in HTML", () => {
    const html = buildDigestEmailHtml(
      `Digest <script>alert("x")</script>\nNext line`,
      "https://prism.example/",
      {
        topicTitle: `Title <img src=x onerror="alert(1)">`,
        topicSlug: `topic/with?<bad>`,
        perspectives: [
          {
            communityName: `Community <svg onload=alert(1)>`,
            quote: `Quote </p><script>alert("x")</script>`,
            color: `#fff;background:url(javascript:alert(1))`,
          },
        ],
      },
    );

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("javascript:alert");
    expect(html).not.toContain("</p><script>");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("&lt;svg onload=alert(1)&gt;");
    expect(html).toContain("&lt;/p&gt;&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("border-left: 3px solid #D4956B;");
    expect(html).toContain("/compare/topic%2Fwith%3F%3Cbad%3E");
  });
});
