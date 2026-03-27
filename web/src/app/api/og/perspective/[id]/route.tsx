import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  let quote = "A perspective from PRISM";
  let communityName = "PRISM Community";
  let communityRegion = "";
  let communityColor = "#D4956B";

  if (supabase) {
    const { data } = await supabase
      .from("perspectives")
      .select("quote, community:communities(name, region, color_hex)")
      .eq("id", id)
      .single();

    if (data) {
      quote = data.quote;
      const community = Array.isArray(data.community) ? data.community[0] : data.community;
      if (community) {
        communityName = community.name;
        communityRegion = community.region ?? "";
        communityColor = community.color_hex ?? "#D4956B";
      }
    }
  }

  // Truncate quote for display
  const displayQuote = quote.length > 200 ? quote.slice(0, 197) + "..." : quote;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "#0F1114",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top: community info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: communityColor,
              boxShadow: `0 0 16px ${communityColor}60`,
            }}
          />
          <span style={{ color: communityColor, fontSize: "20px", fontWeight: 600 }}>
            {communityName}
          </span>
          {communityRegion && (
            <span style={{ color: "#5C6370", fontSize: "18px" }}>
              · {communityRegion}
            </span>
          )}
        </div>

        {/* Middle: quote */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "20px 0" }}>
          <p style={{ color: "#EDEDEF", fontSize: "36px", lineHeight: 1.5, fontWeight: 400 }}>
            &ldquo;{displayQuote}&rdquo;
          </p>
        </div>

        {/* Bottom: PRISM branding */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#EDEDEF", fontSize: "24px", fontWeight: 700, letterSpacing: "4px" }}>
              PRISM
            </span>
            <div style={{ display: "flex", gap: "2px", marginLeft: "4px" }}>
              {["#EF4444", "#F97316", "#F59E0B", "#22C55E", "#3B82F6", "#A855F7"].map((c) => (
                <div key={c} style={{ width: "16px", height: "3px", background: c, borderRadius: "2px" }} />
              ))}
            </div>
          </div>
          <span style={{ color: "#5C6370", fontSize: "16px" }}>
            See every community&apos;s perspective
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
