import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { suggestPerspectivePrompts } from "@/lib/claude";
import { z } from "zod";

const schema = z.object({
  topicTitle: z.string().min(1).max(200),
  count: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const prompts = await suggestPerspectivePrompts(
      parsed.data.topicTitle,
      parsed.data.count ?? 3
    );
    return NextResponse.json({ prompts });
  } catch (err) {
    console.error("Claude API error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
