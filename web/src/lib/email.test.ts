import { afterEach, describe, expect, it, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: sendMock,
    },
  })),
}));

async function loadEmailModule() {
  vi.resetModules();
  process.env.RESEND_API_KEY = "test-resend-key";
  process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example/";
  return import("./email");
}

describe("sendDigestEmail", () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("escapes untrusted comparison and digest content before rendering email HTML", async () => {
    const { sendDigestEmail } = await loadEmailModule();

    const result = await sendDigestEmail(
      "reader@example.com",
      "Weekly recap <img src=x onerror=alert(1)>",
      {
        topicTitle: "Transit <script>alert(1)</script>",
        topicSlug: "transit/<script>",
        perspectives: [
          {
            communityName: "North & South",
            quote: "\"Close the road\" <svg onload=alert(1)>",
            color: "red; background:url(javascript:alert(1))",
          },
        ],
      }
    );

    expect(result).toEqual({ success: true });
    expect(sendMock).toHaveBeenCalledOnce();

    const payload = sendMock.mock.calls[0][0] as { html: string; subject: string };
    expect(payload.html).toContain("Transit &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(payload.html).toContain("North &amp; South");
    expect(payload.html).toContain("&quot;Close the road&quot; &lt;svg onload=alert(1)&gt;");
    expect(payload.html).toContain("Weekly recap &lt;img src=x onerror=alert(1)&gt;");
    expect(payload.html).toContain("border-left: 3px solid #D4956B;");
    expect(payload.html).toContain(
      "https://prism.example/compare/transit%2F%3Cscript%3E"
    );
    expect(payload.html).not.toContain("<script>alert(1)</script>");
    expect(payload.html).not.toContain("<img src=x onerror=alert(1)>");
    expect(payload.html).not.toContain("javascript:alert(1)");
  });

  it("strips header-breaking newlines from comparison email subjects", async () => {
    const { sendDigestEmail } = await loadEmailModule();

    await sendDigestEmail("reader@example.com", "Digest", {
      topicTitle: "Topic\r\nBcc: attacker@example.com",
      topicSlug: "topic",
      perspectives: [],
    });

    const payload = sendMock.mock.calls[0][0] as { subject: string };
    expect(payload.subject).toBe("This week on PRISM: Topic Bcc: attacker@example.com");
  });
});
