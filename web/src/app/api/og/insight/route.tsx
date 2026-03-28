import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "PRISM Insight";
  const subtitle = searchParams.get("subtitle") ?? "";
  const stat = searchParams.get("stat") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0F1114 0%, #181B20 50%, #1F2228 100%)",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* PRISM wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <span style={{ fontSize: "28px", fontWeight: 700, color: "#EDEDEF", letterSpacing: "6px" }}>
            PRISM
          </span>
          <div style={{ display: "flex", gap: "3px" }}>
            {["#3B82F6", "#A855F7", "#F59E0B", "#22C55E", "#06B6D4", "#F97316"].map((c) => (
              <div key={c} style={{ width: "18px", height: "3px", borderRadius: "2px", backgroundColor: c }} />
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ fontSize: "48px", fontWeight: 700, color: "#EDEDEF", textAlign: "center", lineHeight: 1.2, maxWidth: "900px", marginBottom: "16px" }}>
          {title}
        </div>

        {/* Stat */}
        {stat && (
          <div style={{ fontSize: "72px", fontWeight: 700, color: "#D4956B", marginBottom: "12px" }}>
            {stat}
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <div style={{ fontSize: "24px", color: "#9CA3AF", textAlign: "center", maxWidth: "800px" }}>
            {subtitle}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
