import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { sendEmailMock, resendConstructorMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
  resendConstructorMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation((apiKey: string) => {
    resendConstructorMock(apiKey);
    return {
      emails: {
        send: sendEmailMock,
      },
    };
  }),
}));

const ORIGINAL_ENV = process.env;

describe("sendDigestEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns a configuration error when Resend API key is missing", async () => {
    delete process.env.RESEND_API_KEY;

    const { sendDigestEmail } = await import("./email");
    const result = await sendDigestEmail("user@example.com", "Weekly digest");

    expect(result).toEqual({ success: false, error: "Resend not configured" });
    expect(resendConstructorMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("sends featured comparison content when provided", async () => {
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";
    sendEmailMock.mockResolvedValue({ id: "mail_123" });

    const { sendDigestEmail } = await import("./email");
    const result = await sendDigestEmail(
      "user@example.com",
      "Digest line one\nDigest line two",
      {
        topicTitle: "City Housing",
        topicSlug: "city-housing",
        perspectives: [
          { quote: "Rent is rising fast here.", communityName: "Downtown", color: "#111111" },
          { quote: "We need tenant protections.", communityName: "Southside", color: "#222222" },
        ],
      },
    );

    expect(result).toEqual({ success: true });
    expect(resendConstructorMock).toHaveBeenCalledWith("test-resend-key");
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    const payload = sendEmailMock.mock.calls[0][0] as {
      subject: string;
      html: string;
      to: string;
    };

    expect(payload.to).toBe("user@example.com");
    expect(payload.subject).toBe("This week on PRISM: City Housing");
    expect(payload.html).toContain('href="https://prism.example/compare/city-housing"');
    expect(payload.html).toContain("Downtown");
    expect(payload.html).toContain("Southside");
    expect(payload.html).toContain("&ldquo;Rent is rising fast here.&rdquo;");
    expect(payload.html).toContain("Digest line one<br>Digest line two");
  });

  it("uses the default digest subject and omits comparison CTA when absent", async () => {
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";
    sendEmailMock.mockResolvedValue({ id: "mail_456" });

    const { sendDigestEmail } = await import("./email");
    const result = await sendDigestEmail("user@example.com", "Weekly digest");

    expect(result).toEqual({ success: true });

    const payload = sendEmailMock.mock.calls[0][0] as { subject: string; html: string };
    expect(payload.subject).toBe("Your PRISM Weekly Digest");
    expect(payload.html).not.toContain("/compare/");
  });
});
