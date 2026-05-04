import { afterEach, describe, expect, it, vi } from "vitest";

type EmailPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

async function loadEmailModule(sendMock: ReturnType<typeof vi.fn>) {
  vi.resetModules();
  process.env.RESEND_API_KEY = "test-resend-key";
  process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";

  vi.doMock("resend", () => ({
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
    })),
  }));

  return import("./email");
}

describe("sendDigestEmail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("escapes digest and comparison content before rendering the email html", async () => {
    const sendMock = vi.fn().mockResolvedValue({});
    const { sendDigestEmail } = await loadEmailModule(sendMock);

    const result = await sendDigestEmail(
      "reader@example.com",
      "Week recap\n<script>alert('digest')</script> & learnings",
      {
        topicTitle: 'Housing <costs> "now"',
        topicSlug: "housing costs/2026",
        perspectives: [
          {
            communityName: "Rural & Coastal <Families>",
            quote: 'We need "stable" rents <soon> & repairs.',
            color: "#123abc",
          },
        ],
      }
    );

    expect(result).toEqual({ success: true });
    const payload = sendMock.mock.calls[0]?.[0] as EmailPayload;

    expect(payload.subject).toBe('This week on PRISM: Housing <costs> "now"');
    expect(payload.html).toContain("Week recap<br>&lt;script&gt;alert(&#39;digest&#39;)&lt;/script&gt; &amp; learnings");
    expect(payload.html).toContain("Housing &lt;costs&gt; &quot;now&quot;");
    expect(payload.html).toContain("Rural &amp; Coastal &lt;Families&gt;");
    expect(payload.html).toContain("We need &quot;stable&quot; rents &lt;soon&gt; &amp; repairs.");
    expect(payload.html).toContain('href="https://prism.example/compare/housing%20costs%2F2026"');
    expect(payload.html).not.toContain("<script>alert");
  });

  it("removes subject header breaks and falls back from unsafe comparison colors", async () => {
    const sendMock = vi.fn().mockResolvedValue({});
    const { sendDigestEmail } = await loadEmailModule(sendMock);

    await sendDigestEmail("reader@example.com", "Digest", {
      topicTitle: "Food prices\r\nBcc: attacker@example.com",
      topicSlug: "food-prices",
      perspectives: [
        {
          communityName: "Local growers",
          quote: "Costs changed fast.",
          color: "red; background:url(https://example.com/tracker)",
        },
      ],
    });

    const payload = sendMock.mock.calls[0]?.[0] as EmailPayload;

    expect(payload.subject).toBe("This week on PRISM: Food prices Bcc: attacker@example.com");
    expect(payload.html).toContain("border-left: 3px solid #D4956B;");
    expect(payload.html).not.toContain("background:url");
  });
});
