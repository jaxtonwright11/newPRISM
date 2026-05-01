import { beforeEach, describe, expect, it, vi } from "vitest";

type EmailPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn<(payload: EmailPayload) => Promise<{ id: string }>>(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: sendMock,
    };

    constructor(_apiKey: string) {}
  },
}));

describe("sendDigestEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    sendMock.mockResolvedValue({ id: "email-1" });
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.test";
  });

  it("escapes dynamic digest and comparison content before rendering HTML", async () => {
    const { sendDigestEmail } = await import("./email");

    await expect(
      sendDigestEmail(
        "user@example.com",
        "Digest <img src=x onerror=alert(1)>\nSecond & line",
        {
          topicTitle: 'Topic <script>alert("x")</script>\r\nInjected',
          topicSlug: 'climate"><img src=x onerror=alert(1)>',
          perspectives: [
            {
              communityName: 'Community <b onclick="steal()">Name</b>',
              quote: 'Quote <svg onload=alert(1)> & "more"',
              color: 'red; background:url("javascript:alert(1)")',
            },
          ],
        },
      ),
    ).resolves.toEqual({ success: true });

    const payload = sendMock.mock.calls[0][0];

    expect(payload.subject).toBe(
      'This week on PRISM: Topic <script>alert("x")</script> Injected',
    );
    expect(payload.html).toContain(
      "Topic &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;\r\nInjected",
    );
    expect(payload.html).toContain(
      "Community &lt;b onclick=&quot;steal()&quot;&gt;Name&lt;/b&gt;",
    );
    expect(payload.html).toContain(
      "Quote &lt;svg onload=alert(1)&gt; &amp; &quot;more&quot;",
    );
    expect(payload.html).toContain(
      "Digest &lt;img src=x onerror=alert(1)&gt;<br>Second &amp; line",
    );
    expect(payload.html).toContain('border-left: 3px solid #D4956B;');
    expect(payload.html).toContain(
      "https://prism.test/compare/climate%22%3E%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E",
    );
    expect(payload.html).not.toContain("<script>");
    expect(payload.html).not.toContain("<img src=x");
    expect(payload.html).not.toContain("javascript:alert");
  });
});
