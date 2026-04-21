import { describe, expect, it } from "vitest";
import { buildDigestEmailHtml } from "./email";

describe("buildDigestEmailHtml", () => {
  it("escapes digest and comparison fields to prevent HTML injection", () => {
    const html = buildDigestEmailHtml(
      `Digest line <img src=x onerror=alert(1)>\nSecond line`,
      "https://prism.example",
      {
        topicTitle: `Topic <script>alert("x")</script>`,
        topicSlug: `civic-voices"><img src=x onerror=alert(1)>`,
        perspectives: [
          {
            quote: `Quote </p><script>alert("x")</script><p>`,
            communityName: `Name <b>bold</b>`,
            color: "#112233",
          },
        ],
      }
    );

    expect(html).toContain("Digest line &lt;img src=x onerror=alert(1)&gt;<br>Second line");
    expect(html).toContain("Topic &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("Name &lt;b&gt;bold&lt;/b&gt;");
    expect(html).toContain("&ldquo;Quote &lt;/p&gt;&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&lt;p&gt;&rdquo;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("</script>");
  });

  it("URL-encodes comparison slugs in featured links", () => {
    const html = buildDigestEmailHtml("digest", "https://prism.example", {
      topicTitle: "Topic",
      topicSlug: 'slug with spaces/"quotes"',
      perspectives: [
        { quote: "quote", communityName: "Community", color: "#112233" },
      ],
    });

    expect(html).toContain('href="https://prism.example/compare/slug%20with%20spaces%2F%22quotes%22"');
  });
});
