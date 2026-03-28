import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { generateTopicSummary } from "@/lib/claude";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(200),
  context: z.string().max(500).optional(),
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
    const summary = await generateTopicSummary(parsed.data.title, parsed.data.context);
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Claude API error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
