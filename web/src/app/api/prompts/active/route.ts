import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ prompt: null });
  }

  const { data } = await supabase
    .from("perspective_prompts")
    .select("id, prompt_text, description, topic:topics(title, slug)")
    .eq("active", true)
    .lte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return NextResponse.json({ prompt: null });
  }

  const topic = Array.isArray(data.topic) ? data.topic[0] : data.topic;

  return NextResponse.json({
    prompt: {
      id: data.id,
      prompt_text: data.prompt_text,
      description: data.description,
      topic_name: topic?.title ?? null,
      topic_slug: topic?.slug ?? null,
    },
  });
}
