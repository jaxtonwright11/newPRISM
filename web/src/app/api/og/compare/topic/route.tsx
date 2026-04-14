import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "edge";

const COMMUNITY_COLORS: Record<string, string> = {
  civic: "#3B82F6",
  diaspora: "#A855F7",
  rural: "#F59E0B",
  policy: "#22C55E",
  academic: "#06B6D4",
  cultural: "#F97316",
};

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: "#0F1114", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
          <span style={{ color: "#EDEDEF", fontSize: 32 }}>PRISM</span>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const supabase = getSupabaseServer();
  let topicTitle = "";
  let perspectives: { quote: string; community_name: string; community_type: string }[] = [];

  if (supabase) {
    const { data: topic } = await supabase
      .from("topics")
      .select("id, title")
      .eq("slug", slug)
      .single();

    if (topic) {
      topicTitle = topic.title;

      const { data } = await supabase
        .from("perspectives")
        .select("quote, community:communities(name, community_type)")
        .eq("topic_id", topic.id)
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (data) {
        perspectives = data.map((p) => {
          const comm = Array.isArray(p.community) ? p.community[0] : p.community;
          return {
            quote: (p.quote as string).slice(0, 120),
            community_name: (comm as { name: string })?.name ?? "Community",
            community_type: (comm as { community_type: string })?.community_type ?? "civic",
          };
        });
      }
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#0F1114",
          padding: "48px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#EDEDEF", letterSpacing: 2 }}>PRISM</span>
          <span style={{ fontSize: 16, color: "#D4956B", marginLeft: 12 }}>Same topic &middot; Different worlds</span>
        </div>

        {/* Topic title */}
        <div style={{ display: "flex", marginBottom: "24px" }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#EDEDEF" }}>{topicTitle}</span>
        </div>

        {/* Perspectives grid */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", flex: 1 }}>
          {perspectives.map((p, i) => {
            const color = COMMUNITY_COLORS[p.community_type] ?? "#3B82F6";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: perspectives.length >= 3 ? "47%" : "48%",
                  background: "#181B20",
                  borderRadius: 12,
                  padding: "20px 24px",
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#9CA3AF" }}>{p.community_name}</span>
                </div>
                <p style={{ fontSize: 16, color: "#EDEDEF", lineHeight: 1.5 }}>
                  &ldquo;{p.quote}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
